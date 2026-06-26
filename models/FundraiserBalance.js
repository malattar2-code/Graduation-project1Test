// models/FundraiserBalance.js
// Facilitates campaign donation calculations and withdrawal processes.
// Serves as a reference and enhances security for the payment system.

const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbSQL');

const FundraiserBalance = sequelize.define('FundraiserBalance', {

  // ── Fundraiser reference (primary key - one balance per campaign) ─────────
  fundraiser_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: { model: 'fundraisers', key: 'fundraiser_id' },
    comment: 'The campaign this balance record belongs to (one-to-one)'
  },

  // ── total_balance: Total donations received ───────────────────────────────
  total_balance: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Total donations received by this campaign (cumulative)'
  },

  // ── available_balance: Currently withdrawable amount ──────────────────────
  // This is the key field for withdrawal logic:
  // - For early withdrawal (40% rule): up to 40% of target when enabled
  // - For final withdrawal: all remaining funds when completed/expired
  available_balance: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Amount currently available for withdrawal'
  },

  // ── pending_withdrawal_balance: Reserved for pending withdrawals ──────────
  // Funds reserved while a withdrawal request is pending admin approval.
  // These funds are NOT available for new withdrawals.
  pending_withdrawal_balance: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Funds reserved for pending withdrawal requests awaiting admin approval'
  },

  // ── total_withdrawn: Cumulative amount withdrawn ──────────────────────────
  // Sum of all successfully transferred withdrawals.
  total_withdrawn: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Total amount successfully withdrawn (transferred) from this campaign'
  },

  // ── total_donors: Number of unique donors ─────────────────────────────────
  total_donors: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of unique donors who have contributed'
  },

  // ── last_donation_at: Timestamp of most recent donation ───────────────────
  last_donation_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the most recent donation was received'
  },

  // ── total_fees: Cumulative processing fees ────────────────────────────────
  total_fees: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Total processing fees incurred by this campaign'
  },

  // ── Timestamp ─────────────────────────────────────────────────────────────
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }

}, {
  tableName: 'fundraiser_balances',
  underscored: true,
  timestamps: true,
  createdAt: false, // Created implicitly when first donation arrives
  updatedAt: 'updated_at',

  indexes: [
    { fields: ['available_balance'], name: 'idx_balance_available' },
    { fields: ['total_balance'], name: 'idx_balance_total' },
    { fields: ['updated_at'], name: 'idx_balance_updated' }
  ]
});

// ═════════════════════════════════════════════════════════════════════════════
// BALANCE UPDATE METHODS
// ═════════════════════════════════════════════════════════════════════════════

// ── Add a donation to the balance ───────────────────────────────────────────
FundraiserBalance.prototype.addDonation = async function (netAmount, isNewDonor = false) {
  const net = parseFloat(netAmount);
  this.total_balance = parseFloat((parseFloat(this.total_balance) + net).toFixed(2));
  this.available_balance = parseFloat((parseFloat(this.available_balance) + net).toFixed(2));
  this.last_donation_at = new Date();
  if (isNewDonor) {
    this.total_donors += 1;
  }
  this.updated_at = new Date();
  await this.save();
};

// ── Add processing fee ──────────────────────────────────────────────────────
FundraiserBalance.prototype.addFee = async function (feeAmount) {
  const fee = parseFloat(feeAmount);
  this.total_fees = parseFloat((parseFloat(this.total_fees) + fee).toFixed(2));
  this.updated_at = new Date();
  await this.save();
};

// ── Reserve funds for a withdrawal request ──────────────────────────────────
// Deducts from available_balance and adds to pending_withdrawal_balance.
// Returns { success, error } to indicate if reservation succeeded.
FundraiserBalance.prototype.reserveForWithdrawal = async function (amount) {
  const requestedAmount = parseFloat(amount);
  const currentAvailable = parseFloat(this.available_balance);

  if (requestedAmount <= 0) {
    return { success: false, error: 'Invalid withdrawal amount' };
  }

  if (requestedAmount > currentAvailable) {
    return {
      success: false,
      error: `Insufficient available balance. Requested: ${requestedAmount}, Available: ${currentAvailable}`
    };
  }

  this.available_balance = parseFloat((currentAvailable - requestedAmount).toFixed(2));
  this.pending_withdrawal_balance = parseFloat(
    (parseFloat(this.pending_withdrawal_balance) + requestedAmount).toFixed(2)
  );
  this.updated_at = new Date();
  await this.save();

  return { success: true };
};

// ── Release reserved funds (when withdrawal is rejected) ────────────────────
// Returns funds from pending back to available.
FundraiserBalance.prototype.releaseReservation = async function (amount) {
  const releaseAmount = parseFloat(amount);

  this.pending_withdrawal_balance = parseFloat(
    Math.max(0, parseFloat(this.pending_withdrawal_balance) - releaseAmount).toFixed(2)
  );
  this.available_balance = parseFloat(
    (parseFloat(this.available_balance) + releaseAmount).toFixed(2)
  );
  this.updated_at = new Date();
  await this.save();

  return { success: true };
};

// ── Complete a withdrawal (transfer successful) ─────────────────────────────
// Moves funds from pending to total_withdrawn. Deducts the fee.
FundraiserBalance.prototype.completeWithdrawal = async function (grossAmount, feeAmount) {
  const gross = parseFloat(grossAmount);
  const fee = parseFloat(feeAmount);

  this.pending_withdrawal_balance = parseFloat(
    Math.max(0, parseFloat(this.pending_withdrawal_balance) - gross).toFixed(2)
  );
  this.total_withdrawn = parseFloat((parseFloat(this.total_withdrawn) + gross).toFixed(2));
  this.total_fees = parseFloat((parseFloat(this.total_fees) + fee).toFixed(2));
  this.updated_at = new Date();
  await this.save();

  return { success: true };
};

// ── Handle a refund ─────────────────────────────────────────────────────────
// Deducts from both total and available balance.
FundraiserBalance.prototype.processRefund = async function (amount) {
  const refundAmount = parseFloat(amount);

  this.total_balance = parseFloat(
    Math.max(0, parseFloat(this.total_balance) - refundAmount).toFixed(2)
  );
  this.available_balance = parseFloat(
    Math.max(0, parseFloat(this.available_balance) - refundAmount).toFixed(2)
  );
  this.updated_at = new Date();
  await this.save();

  return { success: true };
};

// ═════════════════════════════════════════════════════════════════════════════
// WITHDRAWAL ELIGIBILITY METHODS
// ═════════════════════════════════════════════════════════════════════════════

// ── Check if early withdrawal is available ──────────────────────────────────
// Returns { allowed, maxAmount, reason }
FundraiserBalance.prototype.checkEarlyWithdrawalEligibility = async function (fundraiser) {
  if (!fundraiser.allow_early_withdrawal) {
    return { allowed: false, maxAmount: 0, reason: 'Early withdrawal not enabled for this campaign' };
  }

  const target = parseFloat(fundraiser.fundraiser_target_amount) || 0;
  const collected = parseFloat(fundraiser.fundraiser_collected_amount) || 0;

  if (target <= 0) {
    return { allowed: false, maxAmount: 0, reason: 'No target amount set' };
  }

  const pct = (collected / target) * 100;
  if (pct < 40) {
    return {
      allowed: false,
      maxAmount: 0,
      reason: `Early withdrawal requires at least 40% of target reached. Currently at ${pct.toFixed(1)}%`
    };
  }

  // Maximum withdrawal = 40% of target (one-time)
  const maxWithdrawal = parseFloat((target * 0.40).toFixed(2));
  const available = parseFloat(this.available_balance);
  const allowedAmount = Math.min(maxWithdrawal, available);

  if (allowedAmount <= 0) {
    return { allowed: false, maxAmount: 0, reason: 'No funds available for withdrawal' };
  }

  return {
    allowed: true,
    maxAmount: allowedAmount,
    reason: `Early withdrawal available: up to 40% of target ($${maxWithdrawal})`,
    currentProgress: pct.toFixed(1)
  };
};

// ── Check if final withdrawal is available ──────────────────────────────────
FundraiserBalance.prototype.checkFinalWithdrawalEligibility = async function (fundraiser) {
  const eligibleStatuses = ['completed', 'expired'];

  if (!eligibleStatuses.includes(fundraiser.fundraiser_status)) {
    return {
      allowed: false,
      maxAmount: 0,
      reason: `Campaign status is '${fundraiser.fundraiser_status}'. Final withdrawal only available for completed or expired campaigns.`
    };
  }

  const available = parseFloat(this.available_balance);
  if (available <= 0) {
    return { allowed: false, maxAmount: 0, reason: 'No funds remaining for withdrawal' };
  }

  return {
    allowed: true,
    maxAmount: available,
    reason: `Final withdrawal: all remaining funds ($${available})`,
    isFinal: true
  };
};

// ── Get full balance summary ────────────────────────────────────────────────
FundraiserBalance.prototype.getSummary = function () {
  return {
    fundraiser_id: this.fundraiser_id,
    total_balance: parseFloat(this.total_balance).toFixed(2),
    available_balance: parseFloat(this.available_balance).toFixed(2),
    pending_withdrawal_balance: parseFloat(this.pending_withdrawal_balance).toFixed(2),
    total_withdrawn: parseFloat(this.total_withdrawn).toFixed(2),
    total_donors: this.total_donors,
    total_fees: parseFloat(this.total_fees).toFixed(2),
    last_donation_at: this.last_donation_at,
    updated_at: this.updated_at,
    // Computed
    net_campaign_balance: (parseFloat(this.total_balance) - parseFloat(this.total_withdrawn)).toFixed(2)
  };
};

// ═════════════════════════════════════════════════════════════════════════════
// CLASS METHODS
// ═════════════════════════════════════════════════════════════════════════════

// ── Get or create balance for a fundraiser ──────────────────────────────────
FundraiserBalance.getOrCreate = async function (fundraiserId) {
  let balance = await FundraiserBalance.findByPk(fundraiserId);
  if (!balance) {
    balance = await FundraiserBalance.create({
      fundraiser_id: fundraiserId,
      total_balance: 0,
      available_balance: 0,
      pending_withdrawal_balance: 0,
      total_withdrawn: 0,
      total_donors: 0,
      total_fees: 0
    });
  }
  return balance;
};

// ── Recalculate balance from invoices (for data integrity checks) ───────────
FundraiserBalance.recalculateFromInvoices = async function (fundraiserId) {
  const { Invoice, sequelize: seq } = require('./Invoice');

  const result = await seq.query(
    `SELECT 
      COALESCE(SUM(net_amount), 0) as total_net_donations,
      COUNT(DISTINCT donor_id) as unique_donors
    FROM invoices
    WHERE fundraiser_id = :fundraiserId
    AND status = 'paid'`,
    {
      replacements: { fundraiserId },
      type: seq.QueryTypes.SELECT
    }
  );

  const totalNet = parseFloat(result[0].total_net_donations) || 0;
  const uniqueDonors = parseInt(result[0].unique_donors) || 0;

  const balance = await FundraiserBalance.getOrCreate(fundraiserId);

  // Only update total_balance and total_donors; leave available/pending as-is
  balance.total_balance = totalNet;
  balance.total_donors = uniqueDonors;
  balance.updated_at = new Date();
  await balance.save();

  return balance;
};

module.exports = FundraiserBalance;
