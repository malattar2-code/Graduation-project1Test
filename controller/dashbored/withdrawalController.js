/**
 * Withdrawal Controller
 * =====================
 * Handles donation withdrawal requests and transfer execution.
 * Flow:
 *  1. createWithdrawalRequest - User creates a withdrawal request
 *  2. getWithdrawalEligibility - Check if user can withdraw and how much
 *  3. approveWithdrawal       - Admin approves the request
 *  4. rejectWithdrawal        - Admin rejects the request
 *  5. executeTransfer         - Admin executes the actual transfer
 *  6. completeTransfer        - Mark transfer as completed (after provider confirms)
 */

const { Op } = require('sequelize');
const WithdrawRequest = require('../../models/WithdrawRequest');
const TransferLog = require('../../models/TransferLog');
const User = require('../../models/User');
const Fundraiser = require('../../models/Fundraiser');
const LedgerTransaction = require('../../models/LedgerTransaction');
const FundraiserBalance = require('../../models/FundraiserBalance');
const NotificationController = require('../../controller/dashbored/NotificationController');
// ── Constants ───────────────────────────────────────────────────────────────
const WITHDRAWAL_FEE_PERCENT = 3; // 3% platform fee on withdrawals
const EARLY_WITHDRAWAL_PERCENT = 40; // 40% of target for early withdrawal


// ── Helper: Resolve public_id to Fundraiser instance ──────────────────────
// Public-facing routes receive public_id (ULID string). This helper finds
// the fundraiser by public_id and returns the instance, or null if not found.
async function findFundraiserByPublicId(publicId) {
  return Fundraiser.findOne({ where: { public_id: String(publicId) } });
}


// ═════════════════════════════════════════════════════════════════════════════
// 1. GET WITHDRAWAL ELIGIBILITY
// ═════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/withdrawals/eligibility/:fundraiserId
 * Checks if the current user can withdraw from a campaign and returns limits.
 */

exports.getWithdrawalEligibility = async (req, res) => {
  try {
    const { fundraiserId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const fundraiser = await findFundraiserByPublicId(fundraiserId);
    if (!fundraiser) {
      return res.status(404).json({ success: false, message: 'Fundraiser not found' });
    }

    // Verify ownership
    if (fundraiser.fundraiser_user_id !== userId) {
      return res.status(403).json({ success: false, message: 'You do not own this campaign' });
    }
        // Use integer PK for all internal DB operations
    const fundraiserIdInt = fundraiser.fundraiser_id;  // ← ✅ FIX: extract integer PK
    // Get or create balance
    const balance = await FundraiserBalance.getOrCreate(fundraiserIdInt);

    // Check early withdrawal eligibility
    const earlyEligibility = await balance.checkEarlyWithdrawalEligibility(fundraiser);

    // Check final withdrawal eligibility
    const finalEligibility = await balance.checkFinalWithdrawalEligibility(fundraiser);

    // Check if there's already a pending withdrawal request
    const pendingRequest = await WithdrawRequest.findOne({
      where: {
        fundraiser_id: fundraiserIdInt,
        user_id: userId,
        status: { [Op.in]: ['pending', 'approved', 'processing'] }
      }
    });

    // Check if early withdrawal was already used (any non-rejected/non-failed request counts as used)
    const earlyWithdrawalUsed = await WithdrawRequest.findOne({
      where: {
        fundraiser_id: fundraiserIdInt,
        status: { [Op.in]: ['pending', 'approved', 'processing', 'completed'] }
      }
    });

    // Determine available withdrawal type
    let withdrawalType = null;
    let maxAmount = 0;
    let reason = '';

    if (finalEligibility.allowed) {
      // Final withdrawal takes priority (all remaining funds)
      withdrawalType = 'final';
      maxAmount = finalEligibility.maxAmount;
      reason = finalEligibility.reason;
    } else if (earlyEligibility.allowed && !earlyWithdrawalUsed) {
      // Early withdrawal (one-time, 40% of target max)
      withdrawalType = 'early';
      maxAmount = earlyEligibility.maxAmount;
      reason = earlyEligibility.reason;
    } else if (earlyEligibility.allowed && earlyWithdrawalUsed) {
      reason = 'Early withdrawal has already been used. Wait for campaign completion or expiry for final withdrawal.';
    } else {
      reason = earlyEligibility.reason || finalEligibility.reason;
    }

    // Check for pending request blocking
    let canRequest = true;
    if (pendingRequest) {
      canRequest = false;
      reason = `You have a ${pendingRequest.status} withdrawal request. Please wait for it to be processed.`;
    }

    res.json({
      success: true,
      eligible: !!withdrawalType && canRequest,
      withdrawal_type: withdrawalType, // 'early' or 'final'
      max_amount: maxAmount,
      available_balance: parseFloat(balance.available_balance).toFixed(2),
      pending_balance: parseFloat(balance.pending_withdrawal_balance).toFixed(2),
      total_withdrawn: parseFloat(balance.total_withdrawn).toFixed(2),
      total_balance: parseFloat(balance.total_balance).toFixed(2),
      has_pending_request: !!pendingRequest,
      early_withdrawal_used: !!earlyWithdrawalUsed,
      campaign_status: fundraiser.fundraiser_status,
      is_urgent: fundraiser.is_urgent,
      allow_early_withdrawal: fundraiser.allow_early_withdrawal,
      reason,
      fee_percent: WITHDRAWAL_FEE_PERCENT
    });

  } catch (error) {
    console.error('Error checking withdrawal eligibility:', error);
    res.status(500).json({ success: false, message: 'Failed to check eligibility' });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// 2. CREATE WITHDRAWAL REQUEST
// ═════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/withdrawals/request
 * Creates a new withdrawal request.
 * Body: { fundraiserId, amount, withdrawalMethod, withdrawalDetails, notes? }
 */
exports.createWithdrawalRequest = async (req, res) => {
  try {
    const { fundraiserId, amount, withdrawalMethod, withdrawalType: reqWithdrawalType, withdrawalDetails, notes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // ── Validation ──────────────────────────────────────────────────────────
    if (!fundraiserId || !amount || !withdrawalMethod || !withdrawalDetails) {
      return res.status(400).json({
        success: false,
        message: 'Fundraiser ID, amount, withdrawal method, and details are required'
      });
    }

    // Validate withdrawal method
    const validMethods = ['stripe', 'bank_transfer', 'paypal', 'palpay'];
    if (!validMethods.includes(withdrawalMethod)) {
      return res.status(400).json({
        success: false,
        message: `Invalid withdrawal method. Must be one of: ${validMethods.join(', ')}`
      });
    }

    // Validate withdrawal details
    const detailsValidation = WithdrawRequest.validateWithdrawalDetails(withdrawalMethod, withdrawalDetails);
    if (!detailsValidation.valid) {
      return res.status(400).json({ success: false, message: detailsValidation.error });
    }

    // ── Check fundraiser ownership and status ───────────────────────────────
    const fundraiser = await findFundraiserByPublicId(fundraiserId);
    if (!fundraiser) {
      return res.status(404).json({ success: false, message: 'Fundraiser not found' });
    }

    if (fundraiser.fundraiser_user_id !== userId) {
      return res.status(403).json({ success: false, message: 'You do not own this campaign' });
    }
    // Use integer PK for all internal DB operations
    const fundraiserIdInt = fundraiser.fundraiser_id;  // ← ✅ ADD THIS LINE
    // ── Parse and validate amount ───────────────────────────────────────────
    const requestedAmount = parseFloat(amount);
    if (isNaN(requestedAmount) || requestedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid withdrawal amount' });
    }

    // ── Check eligibility ───────────────────────────────────────────────────
    const balance = await FundraiserBalance.getOrCreate(fundraiserIdInt);

    // Check if campaign allows withdrawal
    const finalEligible = await balance.checkFinalWithdrawalEligibility(fundraiser);
    const earlyEligible = await balance.checkEarlyWithdrawalEligibility(fundraiser);

    // Check if early withdrawal already used (any non-rejected request blocks new ones)
    const earlyWithdrawalUsed = await WithdrawRequest.findOne({
      where: {
        fundraiser_id: fundraiserIdInt,
        status: { [Op.in]: ['pending', 'approved', 'processing', 'completed'] }
      }
    });
    // Check if ANY withdrawal request exists (pending, approved, processing, or completed)
    // Early withdrawal is one-time only; final withdrawal also blocks new requests if pending
    const anyExistingRequest = await WithdrawRequest.findOne({
      where: {
        fundraiser_id: fundraiserIdInt,
        status: { [Op.in]: ['pending', 'approved', 'processing', 'completed'] }
      }
    });
    let maxAllowed = 0;
    let determinedWithdrawalType = reqWithdrawalType || null;

    if (finalEligible.allowed) {
      determinedWithdrawalType = 'final';
      maxAllowed = finalEligible.maxAmount;
    } else if (earlyEligible.allowed && !anyExistingRequest) {
      determinedWithdrawalType = 'early';
      maxAllowed = earlyEligible.maxAmount;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal is not available for this campaign at this time',
        reason: earlyEligible.reason || finalEligible.reason
      });
    }

    if (requestedAmount > maxAllowed) {
      return res.status(400).json({
        success: false,
        message: `Maximum withdrawal amount is $${maxAllowed.toFixed(2)}. You requested $${requestedAmount.toFixed(2)}.`,
        max_allowed: maxAllowed,
        requested: requestedAmount
      });
    }
    // ── Check for existing pending request ──────────────────────────────────
    const existingPending = await WithdrawRequest.findOne({
      where: {
        fundraiser_id: fundraiserIdInt,
        user_id: userId,
        status: { [Op.in]: ['pending', 'approved', 'processing'] }
      }
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: `You already have a withdrawal request in '${existingPending.status}' status.`,
        existing_request: { id: existingPending.id, status: existingPending.status }
      });
    }

    // ── Reserve funds ───────────────────────────────────────────────────────
    const reserveResult = await balance.reserveForWithdrawal(requestedAmount);
    if (!reserveResult.success) {
      return res.status(400).json({ success: false, message: reserveResult.error });
    }

    // ── Calculate fee ───────────────────────────────────────────────────────
    const fee = TransferLog.calculateFee(requestedAmount, WITHDRAWAL_FEE_PERCENT);
    const netAmount = parseFloat((requestedAmount - fee).toFixed(2));

    // ── Create withdrawal request ───────────────────────────────────────────
    const withdrawRequest = await WithdrawRequest.create({
      fundraiser_id: fundraiserIdInt,
      user_id: userId,
      amount: requestedAmount,
      withdrawal_method: withdrawalMethod,
      withdrawal_type: determinedWithdrawalType,
      withdrawal_details: withdrawalDetails,
      notes: notes || null,
      status: 'pending'
    });

    // ── Mark early withdrawal as used on the fundraiser ─────────────────────
      if (determinedWithdrawalType === 'early') {
      await Fundraiser.update(
        { early_withdrawal_used: true },
        { where: { fundraiser_id: fundraiserIdInt } }
      );
    }

    // ── Record in ledger ────────────────────────────────────────────────────
    await LedgerTransaction.createWithdrawalEntry({
      fundraiser_id: fundraiserIdInt,
      user_id: userId,
      amount: requestedAmount,
      reference_id: withdrawRequest.id,
            description: `Withdrawal request of $${requestedAmount} (${determinedWithdrawalType}) for fundraiser #${fundraiserIdInt} (fee: $${fee})`
    });
    // ── Notify user of withdrawal request ───────────────────────────────────
    try {
      await NotificationController.createSystemNotification({
        userId: userId,
        title: 'Withdrawal Request Submitted',
        message: `Your withdrawal request of $${requestedAmount} for "${fundraiser.fundraiser_title}" has been submitted successfully.\nStatus: Pending\nMethod: ${withdrawalMethod}\nFee (3%): $${fee}\nNet amount: $${netAmount}\n\nYour request will be reviewed by Najdah Platform Admins shortly.`,
        type: 'withdrawal_requested',
        fundraiserId: fundraiserIdInt
      });
    } catch (notifError) {
      console.error('Error sending withdrawal request notification:', notifError);
    }
    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully. Awaiting admin approval.',
      withdrawal_request: {
        id: withdrawRequest.id,
        amount: requestedAmount,
        fee: fee,
        net_amount: netAmount,
        withdrawal_method: withdrawalMethod,
        status: 'pending',
        withdrawal_type: determinedWithdrawalType,
        created_at: withdrawRequest.created_at
      }
    });

  } catch (error) {
    console.error('Error creating withdrawal request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create withdrawal request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// 3. GET MY WITHDRAWAL REQUESTS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/withdrawals/my-requests
 * Returns all withdrawal requests for the authenticated user.
 */
exports.getMyWithdrawalRequests = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { page = 1, limit = 10, status } = req.query;
    const where = { user_id: userId };
    if (status) where.status = status;

    const { count, rows: requests } = await WithdrawRequest.findAndCountAll({
      where,
      include: [
        {
          model: Fundraiser,
          as: 'fundraiser',
          attributes: ['fundraiser_id', 'fundraiser_title', 'fundraiser_main_image']
        },
        {
          model: TransferLog,
          as: 'transfer_log',
          required: false
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      requests,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error getting withdrawal requests:', error);
    res.status(500).json({ success: false, message: 'Failed to get withdrawal requests' });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// 4. GET FUNDRAISER WITHDRAWAL REQUESTS (for campaign owner)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/withdrawals/fundraiser/:fundraiserId
 * Returns all withdrawal requests for a specific fundraiser.
 */
exports.getFundraiserWithdrawals = async (req, res) => {
  try {
    const { fundraiserId } = req.params;
    const userId = req.user?.id;

    const fundraiser = await findFundraiserByPublicId(fundraiserId);
    if (!fundraiser) {
      return res.status(404).json({ success: false, message: 'Fundraiser not found' });
    }

    const isOwner = fundraiser.fundraiser_user_id === userId;
    const isAdmin = req.user?.user_type === 'admin' || req.user?.isAdmin;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    // Use integer PK for DB queries
    const fundraiserIdInt = fundraiser.fundraiser_id;  // ← ✅ ADD THIS LINE
    const requests = await WithdrawRequest.findAll({
      where: { fundraiser_id: fundraiserIdInt },
      include: [{
        model: TransferLog,
        as: 'transfer_log',
        required: false
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, requests });

  } catch (error) {
    console.error('Error getting fundraiser withdrawals:', error);
    res.status(500).json({ success: false, message: 'Failed to get withdrawals' });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// 5. ADMIN: GET ALL PENDING WITHDRAWAL REQUESTS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/withdrawals/admin/pending
 * Admin only: Returns all pending withdrawal requests.
 */
exports.getPendingWithdrawals = async (req, res) => {
  try {
    const isAdmin = req.user?.user_type === 'admin' || req.user?.isAdmin;
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { page = 1, limit = 20, status = 'pending' } = req.query;

    const where = {};
    if (status !== 'all') {
      where.status = status === 'pending' ? { [Op.in]: ['pending', 'approved', 'processing'] } : status;
    }

    const { count, rows: requests } = await WithdrawRequest.findAndCountAll({
      where,
      include: [
        {
          model: Fundraiser,
          as: 'fundraiser',
          attributes: ['fundraiser_id', 'fundraiser_title', 'fundraiser_main_image']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'full_name', 'email', 'user_image']
        },
        {
          model: TransferLog,
          as: 'transfer_log',
          required: false
        }
      ],
      order: [['created_at', 'ASC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      requests,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error getting pending withdrawals:', error);
    res.status(500).json({ success: false, message: 'Failed to get pending withdrawals' });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// 6. ADMIN: APPROVE WITHDRAWAL REQUEST
// ═════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/withdrawals/admin/:requestId/approve
 * Admin approves a withdrawal request. Does NOT execute the transfer yet.
 */
exports.approveWithdrawal = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminNotes } = req.body;
    const adminUserId = req.user?.id;

    const isAdmin = req.user?.user_type === 'admin' || req.user?.isAdmin;
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const withdrawRequest = await WithdrawRequest.findByPk(requestId);
    if (!withdrawRequest) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
    }

    if (withdrawRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve request with status '${withdrawRequest.status}'`
      });
    }

    await withdrawRequest.approve(adminUserId, adminNotes);
    res.json({
      success: true,
      message: 'Withdrawal request approved. Ready for transfer execution.',
      request: withdrawRequest.toJSON()
    });

  } catch (error) {
    console.error('Error approving withdrawal:', error);
    res.status(500).json({ success: false, message: 'Failed to approve withdrawal' });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// 7. ADMIN: REJECT WITHDRAWAL REQUEST
// ═════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/withdrawals/admin/:requestId/reject
 * Admin rejects a withdrawal request. Releases reserved funds.
 */
exports.rejectWithdrawal = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminNotes } = req.body;
    const adminUserId = req.user?.id;

    const isAdmin = req.user?.user_type === 'admin' || req.user?.isAdmin;
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const withdrawRequest = await WithdrawRequest.findByPk(requestId);
    if (!withdrawRequest) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
    }

    if (!['pending', 'approved'].includes(withdrawRequest.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reject request with status '${withdrawRequest.status}'`
      });
    }

    // ── Release reserved funds ──────────────────────────────────────────────
    const balance = await FundraiserBalance.getOrCreate(withdrawRequest.fundraiser_id);
    await balance.releaseReservation(withdrawRequest.amount);

    // ── Reject the request ──────────────────────────────────────────────────
    await withdrawRequest.reject(adminUserId, adminNotes);

    // ── Record rejection in ledger ──────────────────────────────────────────
    await LedgerTransaction.create({
      fundraiser_id: withdrawRequest.fundraiser_id,
      user_id: withdrawRequest.user_id,
      type: 'adjustment',
      amount: withdrawRequest.amount,
      currency: 'USD',
      reference_type: 'withdraw_request',
      reference_id: withdrawRequest.id,
      description: `Withdrawal request #${requestId} rejected. $${withdrawRequest.amount} returned to available balance.`
    });

    res.json({
      success: true,
      message: 'Withdrawal request rejected. Funds returned to campaign balance.',
      request: withdrawRequest.toJSON()
    });

  } catch (error) {
    console.error('Error rejecting withdrawal:', error);
    res.status(500).json({ success: false, message: 'Failed to reject withdrawal' });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// 8. ADMIN: EXECUTE TRANSFER
// ═════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/withdrawals/admin/:requestId/execute-transfer
 * Admin executes the actual money transfer after approval.
 * Creates a TransferLog record.
 * Body: { providerTransferId? }
 */
exports.executeTransfer = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { providerTransferId } = req.body;

    const isAdmin = req.user?.user_type === 'admin' || req.user?.isAdmin;
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const withdrawRequest = await WithdrawRequest.findByPk(requestId, {
      include: [{
        model: Fundraiser,
        as: 'fundraiser'
      }]
    });

    if (!withdrawRequest) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
    }

    if (withdrawRequest.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: `Transfer can only be executed for approved requests. Current status: '${withdrawRequest.status}'`
      });
    }

    // Check if transfer already exists
    const existingTransfer = await TransferLog.findOne({
      where: { withdraw_request_id: requestId }
    });
    if (existingTransfer) {
      return res.status(400).json({
        success: false,
        message: 'Transfer already exists for this request',
        transfer: existingTransfer.toJSON()
      });
    }

    // ── Calculate fee and net ───────────────────────────────────────────────
    const fee = TransferLog.calculateFee(withdrawRequest.amount, WITHDRAWAL_FEE_PERCENT);
    const netAmount = parseFloat((withdrawRequest.amount - fee).toFixed(2));

    // ── Create transfer log ─────────────────────────────────────────────────
    const transferLog = await TransferLog.create({
      withdraw_request_id: requestId,
      fundraiser_id: withdrawRequest.fundraiser_id,
      user_id: withdrawRequest.user_id,
      amount: withdrawRequest.amount,
      fee: fee,
      net_amount: netAmount,
      transfer_provider: mapWithdrawalMethodToTransferProvider(withdrawRequest.withdrawal_method),
      provider_transfer_id: providerTransferId || null,
      withdrawal_type: withdrawRequest.withdrawal_type,
      status: 'processing'
    });

    // ── Update withdrawal request status ────────────────────────────────────
    await withdrawRequest.markAsProcessing();

    // ── Record fee in ledger ────────────────────────────────────────────────
    await LedgerTransaction.createFeeEntry({
      fundraiser_id: withdrawRequest.fundraiser_id,
      user_id: withdrawRequest.user_id,
      amount: fee,
      reference_id: transferLog.id,
      reference_type: 'transfer_log',
      description: `Withdrawal fee of $${fee} (3%) for transfer #${transferLog.id}`
    });

    res.json({
      success: true,
      message: 'Transfer initiated successfully',
      transfer: transferLog.getSummary(),
      withdrawal_request: {
        id: withdrawRequest.id,
        status: 'processing'
      }
    });

  } catch (error) {
    console.error('Error executing transfer:', error);
    res.status(500).json({ success: false, message: 'Failed to execute transfer' });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// 9. ADMIN: COMPLETE TRANSFER
// ═════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/withdrawals/admin/transfer/:transferId/complete
 * Marks a transfer as completed after the provider confirms it.
 * Body: { providerTransferId? }
 */
exports.completeTransfer = async (req, res) => {
  try {
    const { transferId } = req.params;
    const { providerTransferId } = req.body;

    const isAdmin = req.user?.user_type === 'admin' || req.user?.isAdmin;
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const transferLog = await TransferLog.findByPk(transferId, {
      include: [{
        model: WithdrawRequest,
        as: 'withdraw_request'
      }]
    });

    if (!transferLog) {
      return res.status(404).json({ success: false, message: 'Transfer log not found' });
    }

    if (transferLog.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Transfer already completed' });
    }

    if (transferLog.status === 'failed') {
      return res.status(400).json({ success: false, message: 'Cannot complete a failed transfer' });
    }

    // ── Mark transfer as completed ──────────────────────────────────────────
    await transferLog.markAsCompleted(providerTransferId);

    // ── Complete the withdrawal request ─────────────────────────────────────
    if (transferLog.withdraw_request) {
      await transferLog.withdraw_request.markAsCompleted();
    }

    // ── Update fundraiser balance ───────────────────────────────────────────
    const balance = await FundraiserBalance.getOrCreate(transferLog.fundraiser_id);
    await balance.completeWithdrawal(transferLog.amount, transferLog.fee);
    // ── Notify user of completed transfer ───────────────────────────────────
    try {
      const transferLog = await TransferLog.findByPk(transferId, {
        include: [{ model: WithdrawRequest, as: 'withdraw_request' }]
      });
      if (transferLog && transferLog.withdraw_request) {
        await NotificationController.createSystemNotification({
          userId: transferLog.user_id,
          title: 'Transfer Completed!',
          message: `Your withdrawal of $${transferLog.amount} for campaign #${transferLog.fundraiser_id} has been successfully transferred.\nNet amount received: $${transferLog.net_amount}\nFee: $${transferLog.fee}\nProvider: ${transferLog.transfer_provider}\nTransfer ID: #${transferLog.id}\n\nThank you for using Najdah Platform.`,
          type: 'withdrawal_transferred',
          fundraiserId: transferLog.fundraiser_id
        });
      }
    } catch (notifError) {
      console.error('Error sending transfer completion notification:', notifError);
    }
    res.json({
      success: true,
      message: 'Transfer completed successfully',
      transfer: transferLog.getSummary()
    });

  } catch (error) {
    console.error('Error completing transfer:', error);
    res.status(500).json({ success: false, message: 'Failed to complete transfer' });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// 10. ADMIN: FAIL TRANSFER
// ═════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/withdrawals/admin/transfer/:transferId/fail
 * Marks a transfer as failed. Returns reserved funds to available balance.
 */
exports.failTransfer = async (req, res) => {
  try {
    const { transferId } = req.params;
    const { reason } = req.body;

    const isAdmin = req.user?.user_type === 'admin' || req.user?.isAdmin;
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const transferLog = await TransferLog.findByPk(transferId, {
      include: [{
        model: WithdrawRequest,
        as: 'withdraw_request'
      }]
    });

    if (!transferLog) {
      return res.status(404).json({ success: false, message: 'Transfer log not found' });
    }

    if (transferLog.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot fail a completed transfer' });
    }

    // ── Mark transfer as failed ─────────────────────────────────────────────
    await transferLog.markAsFailed();

    // ── Return funds to available balance ───────────────────────────────────
    const balance = await FundraiserBalance.getOrCreate(transferLog.fundraiser_id);
    await balance.releaseReservation(transferLog.amount);

    // ── Update withdrawal request back to approved (can retry) ──────────────
    if (transferLog.withdraw_request) {
      transferLog.withdraw_request.status = 'approved';
      if (reason) {
        transferLog.withdraw_request.admin_notes =
          (transferLog.withdraw_request.admin_notes || '') + `\nTransfer failed: ${reason}`;
      }
      await transferLog.withdraw_request.save();
    }

    res.json({
      success: true,
      message: 'Transfer marked as failed. Funds returned to available balance.',
      transfer: transferLog.getSummary()
    });

  } catch (error) {
    console.error('Error failing transfer:', error);
    res.status(500).json({ success: false, message: 'Failed to update transfer' });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// 11. GET BALANCE SUMMARY
// ═════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/withdrawals/balance/:fundraiserId
 * Returns the current balance summary for a fundraiser.
 */
exports.getBalance = async (req, res) => {
  try {
    const { fundraiserId } = req.params;
    const userId = req.user?.id;

    const fundraiser = await findFundraiserByPublicId(fundraiserId);
    if (!fundraiser) {
      return res.status(404).json({ success: false, message: 'Fundraiser not found' });
    }

    const isOwner = fundraiser.fundraiser_user_id === userId;
    const isAdmin = req.user?.user_type === 'admin' || req.user?.isAdmin;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Use integer PK for all internal DB operations
    const fundraiserIdInt = fundraiser.fundraiser_id;  // ← ✅ FIX: extract integer PK

    // Get or create balance
    const balance = await FundraiserBalance.getOrCreate(fundraiserIdInt);  // ← ✅ uses integer

    const ledgerSummary = await LedgerTransaction.getFundraiserSummary(fundraiserIdInt);

    res.json({
      success: true,
      balance: balance.getSummary(),
      ledger_summary: ledgerSummary
    });

  } catch (error) {
    console.error('Error getting balance:', error);
    res.status(500).json({ success: false, message: 'Failed to get balance' });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Maps withdrawal method to transfer provider name.
 * They are mostly the same but 'bank_transfer' -> 'bank'.
 */
function mapWithdrawalMethodToTransferProvider(method) {
  const mapping = {
    'stripe': 'stripe',
    'bank_transfer': 'bank',
    'paypal': 'paypal',
    'palpay': 'palpay'
  };
  return mapping[method] || method;
}

// Export helpers for testing
exports._mapWithdrawalMethodToTransferProvider = mapWithdrawalMethodToTransferProvider;
