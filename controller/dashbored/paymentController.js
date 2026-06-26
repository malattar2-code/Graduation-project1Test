/**
 * Payment Controller
 * ==================
 * Handles donation payments via Stripe (and extensible for PayPal, PalPay, bank transfer).
 * Flow:
 *  1. createPaymentIntent - Creates a Stripe PaymentIntent, creates a pending Invoice
 *  2. confirmPayment      - Called by frontend after Stripe confirms payment
 *  3. webhook            - Handles Stripe webhook events for payment confirmation
 *  4. recordPayment       - Internal: marks invoice paid, updates balance, records ledger
 */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sequelize = require('../../config/dbSQL');
const User = require('../../models/User');
const Fundraiser = require('../../models/Fundraiser');
const Invoice = require('../../models/Invoice');
const LedgerTransaction = require('../../models/LedgerTransaction');
const FundraiserBalance = require('../../models/FundraiserBalance');
const NotificationController = require('../../controller/dashbored/NotificationController');

// ── Constants ───────────────────────────────────────────────────────────────
const PLATFORM_FEE_PERCENT = 0; // No platform fee on donations (3% on withdrawals)
const STRIPE_FEE_PERCENT = 2.9;
const STRIPE_FEE_FIXED = 0.30;

// ═════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Calculate the Stripe processing fee for a given gross amount.
 */
function calculateProcessingFee(grossAmountCents) {
  const grossDollars = grossAmountCents / 100;
  const fee = (grossDollars * (STRIPE_FEE_PERCENT / 100)) + STRIPE_FEE_FIXED;
  return Math.round(fee * 100); // Return in cents
}

/**
 * Format amount for display.
 */
function formatAmount(cents) {
  return (cents / 100).toFixed(2);
}

/**
 * Check if donor is new to this fundraiser.
 */
async function isNewDonor(fundraiserId, donorId) {
  const existingDonation = await Invoice.findOne({
    where: {
      fundraiser_id: fundraiserId,
      donor_id: donorId,
      status: 'paid'
    }
  });
  return !existingDonation;
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. CREATE PAYMENT INTENT
// ═════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/payments/create-intent
 * Creates a Stripe PaymentIntent and a pending Invoice record.
 * Body: { fundraiserId, amount, currency, message? }
 * Returns: { clientSecret, invoiceId }
 */
exports.createPaymentIntent = async (req, res) => {
    try {
    const { fundraiserId, amount, currency = 'usd', message } = req.body;
    const donorId = req.user?.id;

    // ── Validation ──────────────────────────────────────────────────────────
    if (!donorId) {
      return res.status(401).json({ success: false, message: 'Authentication required to donate' });
    }

    if (!fundraiserId) {
      return res.status(400).json({ success: false, message: 'Valid fundraiser ID is required' });
    }

    // Parse amount (can be in dollars or cents)
    let amountCents;
    if (typeof amount === 'number') {
      amountCents = Math.round(amount * 100);
    } else {
      amountCents = Math.round(parseFloat(amount) * 100);
    }

    if (!amountCents || amountCents <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid donation amount'
      });
    }

    // ── Check fundraiser exists and is active ───────────────────────────────
    const fundraiser = await Fundraiser.findOne({ where: { public_id: String(fundraiserId) } });
    if (!fundraiser) {
      return res.status(404).json({ success: false, message: 'Fundraiser not found' });
    }
    // Use integer PK for internal DB operations
    const fundraiserIdInt = fundraiser.fundraiser_id;

    const blockedStatuses = ['waiting_verification', 'completed'];
    if (blockedStatuses.includes(fundraiser.fundraiser_status)) {
      return res.status(400).json({
        success: false,
        message: 'This campaign is not yet accepting donations'
      });
    }

    // ── Calculate remaining amount (use toFixed to avoid floating-point drift) ──
    const target = parseFloat(fundraiser.fundraiser_target_amount) || 0;
    const collected = parseFloat(fundraiser.fundraiser_collected_amount) || 0;
    // Round both to 2 decimal places before subtracting to prevent cent drift
    const remainingDollars = parseFloat((target - collected).toFixed(2));
    const remainingCents = Math.round(remainingDollars * 100);

    // ── Cap donation at remaining amount for Fundraiser type ────────────────
    if (fundraiser.fundraiser_type === 'Fundraiser' && target > 0) {
      if (remainingCents > 0 && remainingCents < 100) {
        // Remaining is less than $1 — donor must pay a gross that covers the fee
        // so the campaign receives exactly the remaining net amount.
        // Formula: requiredGross = (remainingNet + 0.30) / (1 - 0.029)
        const remainingNet = remainingCents / 100;
        const requiredGross = parseFloat(((remainingNet + 0.30) / (1 - 0.029)).toFixed(2));
        const requiredGrossCents = Math.round(requiredGross * 100);

        if (Math.abs(amountCents - requiredGrossCents) > 1) {
          return res.status(400).json({
            success: false,
            message: `Only $${remainingNet.toFixed(2)} remaining to reach the goal. Please donate exactly $${requiredGross.toFixed(2)} to cover processing fees and complete the campaign.`,
            remaining_amount: remainingNet,
            required_gross: requiredGross
          });
        }
      } else if (amountCents > remainingCents + 1) {
        return res.status(400).json({
          success: false,
          message: `Maximum donation allowed is $${remainingDollars.toFixed(2)} (remaining to reach the campaign goal)`,
          remaining_amount: remainingDollars
        });
      }
    }

    // ── Minimum donation check ────────────────────────────────────────────────
    // Skip minimum check if this is a sub-$1 remaining completion donation
    const isSubDollarCompletion = (
      fundraiser.fundraiser_type === 'Fundraiser' &&
      target > 0 &&
      remainingCents > 0 &&
      remainingCents < 100
    );

    if (amountCents < 100 && !isSubDollarCompletion) {
      return res.status(400).json({
        success: false,
        message: 'Minimum donation amount is $1.00'
      });
    }

    // ── Calculate amounts ───────────────────────────────────────────────────
    const grossAmountDollars = amountCents / 100;
    const processingFeeDollars = Invoice.calculateFee(grossAmountDollars, 'stripe');
    const netAmountDollars = parseFloat((grossAmountDollars - processingFeeDollars).toFixed(2));
    // ── Create Stripe PaymentIntent ─────────────────────────────────────────
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: {
        fundraiser_id: fundraiserId.toString(),
        donor_id: donorId.toString(),
        message: message || ''
      }
    });

    // ── Create pending Invoice ──────────────────────────────────────────────
    const invoice = await Invoice.create({
      donor_id: donorId,
      fundraiser_id: fundraiserIdInt,  // ← ✅ was parseInt(fundraiserId)
      gross_amount: grossAmountDollars,
      processing_fee: processingFeeDollars,
      net_amount: netAmountDollars,
      currency: currency.toUpperCase(),
      payment_provider: 'stripe',
      provider_transaction_id: paymentIntent.id,
      status: 'pending'
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      invoiceId: invoice.id,
      amount: grossAmountDollars,
      fee: processingFeeDollars,
      net: netAmountDollars
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// 2. CONFIRM PAYMENT (frontend callback)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/payments/confirm
 * Called by frontend after Stripe confirms the payment.
 * Verifies payment status and records the completed donation.
 * Body: { invoiceId, paymentIntentId }
 */
exports.confirmPayment = async (req, res) => {
  try {
    const { invoiceId, paymentIntentId } = req.body;

    if (!invoiceId || !paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Invoice ID and Payment Intent ID are required'
      });
    }

    // ── Verify the PaymentIntent with Stripe ────────────────────────────────
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: `Payment not successful. Status: ${paymentIntent.status}`
      });
    }

    // ── Find and update the invoice ─────────────────────────────────────────
    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.json({
        success: true,
        message: 'Payment already recorded',
        invoice: invoice.getSummary?.() || invoice.toJSON()
      });
    }

    // ── Record the payment ──────────────────────────────────────────────────
    const result = await recordPayment(invoice);

    if (result.success) {
      res.json({
        success: true,
        message: 'Payment confirmed and recorded successfully',
        invoice: result.invoice,
        fundraiser: result.fundraiser
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error
      });
    }

  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// 3. STRIPE WEBHOOK
// ═════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/payments/webhook
 * Handles Stripe webhook events. Must use express.raw() body parser.
 */
exports.webhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      await handlePaymentIntentSucceeded(paymentIntent);
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      await handlePaymentIntentFailed(paymentIntent);
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object;
      await handleChargeRefunded(charge);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
};

// ── Handle payment_intent.succeeded ─────────────────────────────────────────
async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    const invoice = await Invoice.findOne({
      where: { provider_transaction_id: paymentIntent.id }
    });

    if (!invoice) {
      console.error(`Invoice not found for PaymentIntent: ${paymentIntent.id}`);
      return;
    }

    if (invoice.status === 'paid') {
      console.log(`Invoice ${invoice.id} already marked as paid`);
      return;
    }

    await recordPayment(invoice);
    console.log(`Payment recorded for invoice ${invoice.id}`);

  } catch (error) {
    console.error('Error handling payment_intent.succeeded:', error);
  }
}

// ── Handle payment_intent.payment_failed ────────────────────────────────────
async function handlePaymentIntentFailed(paymentIntent) {
  try {
    const invoice = await Invoice.findOne({
      where: { provider_transaction_id: paymentIntent.id }
    });

    if (!invoice) {
      console.error(`Invoice not found for failed PaymentIntent: ${paymentIntent.id}`);
      return;
    }

    await invoice.markAsFailed();
    console.log(`Invoice ${invoice.id} marked as failed`);

  } catch (error) {
    console.error('Error handling payment_intent.payment_failed:', error);
  }
}

// ── Handle charge.refunded ──────────────────────────────────────────────────
async function handleChargeRefunded(charge) {
  try {
    const invoice = await Invoice.findOne({
      where: { provider_transaction_id: charge.payment_intent }
    });

    if (!invoice) return;

    // Mark invoice as refunded
    await invoice.markAsRefunded();

    // Process refund in ledger and balance
    const balance = await FundraiserBalance.getOrCreate(invoice.fundraiser_id);
    await balance.processRefund(invoice.net_amount);

    // Record refund in ledger
    await LedgerTransaction.createRefundEntry({
      fundraiser_id: invoice.fundraiser_id,
      user_id: invoice.donor_id,
      amount: invoice.net_amount,
      currency: invoice.currency,
      reference_id: invoice.id
    });

    console.log(`Refund processed for invoice ${invoice.id}`);

  } catch (error) {
    console.error('Error handling charge.refunded:', error);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. RECORD PAYMENT (internal)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Records a completed payment:
 *  1. Marks invoice as paid
 *  2. Updates or creates FundraiserBalance
 *  3. Creates LedgerTransaction entry
 *  4. Updates Fundraiser collected_amount
 *  5. Awards points if applicable
 */
async function recordPayment(invoice) {
  // Prevent double-recording race condition between webhook and frontend confirm
  if (invoice.status === 'paid') {
    console.log(`Invoice ${invoice.id} already paid, skipping recordPayment`);
    return { success: true, invoice: invoice.toJSON(), fundraiser: null };
  }

  const transaction = await sequelize.transaction();

  try {
    // Re-check inside transaction with lock to prevent race conditions
    const freshInvoice = await Invoice.findByPk(invoice.id, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    
    if (freshInvoice.status === 'paid') {
      await transaction.commit();
      return { success: true, invoice: freshInvoice.toJSON(), fundraiser: null };
    }
    // ── 1. Mark invoice as paid ─────────────────────────────────────────────
    freshInvoice.status = 'paid';
    freshInvoice.paid_at = new Date();
    await freshInvoice.save({ transaction });

    // ── 2. Get or create FundraiserBalance ──────────────────────────────────
    const balance = await FundraiserBalance.getOrCreate(invoice.fundraiser_id);

    // Check if this is a new donor
    const newDonor = await isNewDonor(invoice.fundraiser_id, invoice.donor_id);

    // Add donation to balance
    await balance.addDonation(invoice.net_amount, newDonor);
    await balance.addFee(invoice.processing_fee);

    // ── 3. Create LedgerTransaction entry ───────────────────────────────────
    await LedgerTransaction.createDonationEntry({
      fundraiser_id: invoice.fundraiser_id,
      user_id: invoice.donor_id,
      amount: invoice.net_amount,
      currency: invoice.currency,
      reference_id: invoice.id,
      description: `Donation of ${invoice.net_amount} ${invoice.currency} received (gross: ${invoice.gross_amount}, fee: ${invoice.processing_fee})`
    }, { transaction });

    // Record fee entry in ledger
    await LedgerTransaction.createFeeEntry({
      fundraiser_id: invoice.fundraiser_id,
      user_id: invoice.donor_id,
      amount: invoice.processing_fee,
      currency: invoice.currency,
      reference_id: invoice.id,
      reference_type: 'invoice',
      description: `Processing fee of ${invoice.processing_fee} ${invoice.currency} for donation invoice #${invoice.id}`
    }, { transaction });

    // ── 4. Update Fundraiser collected_amount ───────────────────────────────
    const fundraiser = await Fundraiser.findByPk(freshInvoice.fundraiser_id, { transaction });
    if (fundraiser) {
      const newCollected = parseFloat(fundraiser.fundraiser_collected_amount || 0) + parseFloat(invoice.net_amount);
      fundraiser.fundraiser_collected_amount = parseFloat(newCollected.toFixed(2));

      // Auto-promote status if target reached (for Fundraiser type)
      if (
        fundraiser.fundraiser_type === 'Fundraiser' &&
        fundraiser.fundraiser_status === 'incompleted' &&
        fundraiser.fundraiser_target_amount > 0 &&
        newCollected >= parseFloat(fundraiser.fundraiser_target_amount)
      ) {
        fundraiser.fundraiser_status = 'create_form';
      }

      await fundraiser.save({ transaction, hooks: true });
    }

    await transaction.commit();
    // ── Send notifications ──────────────────────────────────────────────────
    try {
      const donor = await User.findByPk(invoice.donor_id, { attributes: ['id', 'full_name'] });
      const campaignOwner = await User.findByPk(fundraiser.fundraiser_user_id, { attributes: ['id', 'full_name'] });

      // 1. Notify donor (thank you notification)
      await NotificationController.createSystemNotification({
        userId: invoice.donor_id,
        title: 'Thank You for Your Donation!',
        message: `You donated $${invoice.gross_amount} to "${fundraiser.fundraiser_title}".\nCampaign: ${fundraiser.fundraiser_title}\nNet to campaign: $${invoice.net_amount}\nDate: ${new Date().toLocaleDateString()}`,
        type: 'donation_received',
        fundraiserId: invoice.fundraiser_id
      });

      // 2. Notify campaign owner (new donation received)
      if (campaignOwner && campaignOwner.id !== invoice.donor_id) {
        await NotificationController.createSystemNotification({
          userId: fundraiser.fundraiser_user_id,
          title: 'New Donation Received!',
          message: `Your campaign "${fundraiser.fundraiser_title}" received a $${invoice.gross_amount} donation from ${donor?.full_name || 'a donor'}.\nNet amount: $${invoice.net_amount}\nCampaign progress: $${fundraiser.fundraiser_collected_amount} of $${fundraiser.fundraiser_target_amount}`,
          type: 'donation_received_owner',
          fundraiserId: invoice.fundraiser_id
        });
      }
    } catch (notifError) {
      console.error('Error sending donation notifications:', notifError);
      // Don't fail the payment if notification fails
    }
    return {
      success: true,
      invoice: freshInvoice.toJSON(),
      fundraiser: fundraiser ? {
        id: fundraiser.fundraiser_id,
        collectedAmount: fundraiser.fundraiser_collected_amount,
        status: fundraiser.fundraiser_status
      } : null
    };

  } catch (error) {
    await transaction.rollback();
    console.error('Error recording payment:', error);
    return { success: false, error: error.message };
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. GET PAYMENT STATUS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/payments/status/:invoiceId
 * Returns the current status of a payment/invoice.
 */
exports.getPaymentStatus = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const donorId = req.user?.id;

    const invoice = await Invoice.findOne({
      where: { id: invoiceId, donor_id: donorId }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.json({
      success: true,
      invoice: {
        id: invoice.id,
        status: invoice.status,
        gross_amount: invoice.gross_amount,
        net_amount: invoice.net_amount,
        payment_provider: invoice.payment_provider,
        paid_at: invoice.paid_at,
        created_at: invoice.created_at
      }
    });

  } catch (error) {
    console.error('Error getting payment status:', error);
    res.status(500).json({ success: false, message: 'Failed to get payment status' });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// 6. GET DONOR'S DONATION HISTORY
// ═════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/payments/my-donations
 * Returns all donations made by the authenticated user.
 */
exports.getMyDonations = async (req, res) => {
  try {
    const donorId = req.user?.id;
    if (!donorId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: invoices } = await Invoice.findAndCountAll({
      where: { donor_id: donorId },
      include: [{
        model: Fundraiser,
        as: 'fundraiser',
        attributes: ['fundraiser_id', 'fundraiser_title', 'fundraiser_main_image']
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      donations: invoices,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error getting donations:', error);
    res.status(500).json({ success: false, message: 'Failed to get donation history' });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// 7. GET FUNDRAISER DONATIONS (for campaign owner/admin)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/payments/fundraiser/:fundraiserId/donations
 * Returns all donations for a specific fundraiser.
 */
exports.getFundraiserDonations = async (req, res) => {
  try {
    const { fundraiserId } = req.params;
    const userId = req.user?.id;

    // Verify the user owns this fundraiser or is an admin
    const fundraiser = await Fundraiser.findOne({ where: { public_id: String(fundraiserId) } });
    if (!fundraiser) {
      return res.status(404).json({ success: false, message: 'Fundraiser not found' });
    }
    // Use integer PK for DB queries
    const fundraiserIdInt = fundraiser.fundraiser_id;  // ← ✅ ADD

    const isOwner = fundraiser.fundraiser_user_id === userId;
    const isAdmin = req.user?.user_type === 'admin' || req.user?.isAdmin;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { page = 1, limit = 20, status } = req.query;
    const where = { fundraiser_id: fundraiserIdInt };
    if (status) where.status = status;

    const { count, rows: invoices } = await Invoice.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'donor',
        attributes: ['id', 'full_name', 'user_image']
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    // Calculate totals
    const totalDonations = invoices.reduce((sum, inv) =>
      inv.status === 'paid' ? sum + parseFloat(inv.net_amount) : sum, 0);

    res.json({
      success: true,
      donations: invoices,
      summary: {
        total_donations: totalDonations.toFixed(2),
        total_count: count,
        paid_count: invoices.filter(i => i.status === 'paid').length
      },
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error getting fundraiser donations:', error);
    res.status(500).json({ success: false, message: 'Failed to get donations' });
  }
};

// Export internal methods for testing
exports._recordPayment = recordPayment;
exports._calculateProcessingFee = calculateProcessingFee;
