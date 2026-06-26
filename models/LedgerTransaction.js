// models/LedgerTransaction.js
// The platform's official ledger - stores every financial transaction entering or leaving the platform.
// This is the most important element of the entire payment system.

const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbSQL');

const LedgerTransaction = sequelize.define('LedgerTransaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  // ── Fundraiser reference ──────────────────────────────────────────────────
  fundraiser_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'fundraisers', key: 'fundraiser_id' },
    comment: 'The campaign associated with this ledger entry'
  },

  // ── User reference ────────────────────────────────────────────────────────
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    comment: 'The user associated with this transaction (donor or recipient)'
  },

  // ── Transaction type ──────────────────────────────────────────────────────
  type: {
    type: DataTypes.ENUM('donation', 'withdrawal', 'refund', 'fee', 'adjustment'),
    allowNull: false,
    comment: 'Type of financial transaction'
  },

  // ── Amount ────────────────────────────────────────────────────────────────
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    comment: 'Transaction amount (always positive, direction inferred from type)'
  },

  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'USD'
  },

  // ── Reference to source record ────────────────────────────────────────────
  reference_type: {
    type: DataTypes.ENUM('invoice', 'withdraw_request', 'transfer_log', 'admin_adjustment'),
    allowNull: false,
    comment: 'What kind of record this ledger entry references'
  },

  reference_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'The ID of the referenced record (invoice_id, withdraw_request_id, etc.)'
  },

  // ── Auto-generated description ────────────────────────────────────────────
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Automatically generated system description of the transaction'
  },

  // ── Timestamps ────────────────────────────────────────────────────────────
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }

}, {
  tableName: 'ledger_transactions',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // Ledger entries are immutable once created

  indexes: [
    { fields: ['fundraiser_id'], name: 'idx_ledger_fundraiser' },
    { fields: ['user_id'], name: 'idx_ledger_user' },
    { fields: ['type'], name: 'idx_ledger_type' },
    { fields: ['reference_type', 'reference_id'], name: 'idx_ledger_reference' },
    { fields: ['created_at'], name: 'idx_ledger_created' }
  ]
});

// ── Class method: Create a donation entry ───────────────────────────────────
LedgerTransaction.createDonationEntry = async function ({
  fundraiser_id,
  user_id,
  amount,
  currency = 'USD',
  reference_id, // invoice_id
  description = null
}) {
  const autoDescription = description || 
    `Donation of ${amount} ${currency} received for fundraiser #${fundraiser_id} (Invoice #${reference_id})`;

  return await LedgerTransaction.create({
    fundraiser_id,
    user_id,
    type: 'donation',
    amount,
    currency,
    reference_type: 'invoice',
    reference_id,
    description: autoDescription
  });
};

// ── Class method: Create a withdrawal entry ─────────────────────────────────
LedgerTransaction.createWithdrawalEntry = async function ({
  fundraiser_id,
  user_id,
  amount,
  currency = 'USD',
  reference_id, // withdraw_request_id
  description = null
}) {
  const autoDescription = description ||
    `Withdrawal of ${amount} ${currency} requested for fundraiser #${fundraiser_id} (Withdraw Request #${reference_id})`;

  return await LedgerTransaction.create({
    fundraiser_id,
    user_id,
    type: 'withdrawal',
    amount,
    currency,
    reference_type: 'withdraw_request',
    reference_id,
    description: autoDescription
  });
};

// ── Class method: Create a fee entry ────────────────────────────────────────
LedgerTransaction.createFeeEntry = async function ({
  fundraiser_id,
  user_id,
  amount,
  currency = 'USD',
  reference_id, // invoice_id or withdraw_request_id
  reference_type = 'invoice',
  description = null
}) {
  const autoDescription = description ||
    `Processing fee of ${amount} ${currency} for ${reference_type} #${reference_id}`;

  return await LedgerTransaction.create({
    fundraiser_id,
    user_id,
    type: 'fee',
    amount,
    currency,
    reference_type,
    reference_id,
    description: autoDescription
  });
};

// ── Class method: Create a refund entry ─────────────────────────────────────
LedgerTransaction.createRefundEntry = async function ({
  fundraiser_id,
  user_id,
  amount,
  currency = 'USD',
  reference_id, // invoice_id
  description = null
}) {
  const autoDescription = description ||
    `Refund of ${amount} ${currency} issued for fundraiser #${fundraiser_id} (Invoice #${reference_id})`;

  return await LedgerTransaction.create({
    fundraiser_id,
    user_id,
    type: 'refund',
    amount,
    currency,
    reference_type: 'invoice',
    reference_id,
    description: autoDescription
  });
};

// ── Class method: Get fundraiser summary ────────────────────────────────────
LedgerTransaction.getFundraiserSummary = async function (fundraiserId) {
  const result = await sequelize.query(
    `SELECT 
      type,
      SUM(amount) as total,
      COUNT(*) as count
    FROM ledger_transactions
    WHERE fundraiser_id = :fundraiserId
    GROUP BY type`,
    {
      replacements: { fundraiserId },
      type: sequelize.QueryTypes.SELECT
    }
  );

  const summary = {
    total_donations: 0,
    total_withdrawals: 0,
    total_refunds: 0,
    total_fees: 0,
    total_adjustments: 0,
    net_balance: 0
  };

  for (const row of result) {
    const val = parseFloat(row.total) || 0;
    switch (row.type) {
      case 'donation': summary.total_donations = val; break;
      case 'withdrawal': summary.total_withdrawals = val; break;
      case 'refund': summary.total_refunds = val; break;
      case 'fee': summary.total_fees = val; break;
      case 'adjustment': summary.total_adjustments = val; break;
    }
  }

  summary.net_balance = summary.total_donations - summary.total_withdrawals - summary.total_refunds - summary.total_fees + summary.total_adjustments;

  return summary;
};

module.exports = LedgerTransaction;
