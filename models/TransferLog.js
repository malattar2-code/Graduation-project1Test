// models/TransferLog.js
// Represents the actual transfer transaction that was executed and approved by the administration.
// Created after a WithdrawRequest is approved and the actual money transfer is initiated.

const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbSQL');

const TransferLog = sequelize.define('TransferLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  // ── Withdraw request reference ────────────────────────────────────────────
  withdraw_request_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'withdraw_requests', key: 'id' },
    comment: 'The withdrawal request this transfer fulfills'
  },

  // ── Fundraiser reference ──────────────────────────────────────────────────
  fundraiser_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'fundraisers', key: 'fundraiser_id' },
    comment: 'The campaign whose funds are being transferred'
  },

  // ── User reference (recipient) ────────────────────────────────────────────
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    comment: 'The user receiving the funds'
  },

  // ── Amount details ────────────────────────────────────────────────────────
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    comment: 'Gross amount being transferred (from withdraw request)'
  },

  fee: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Platform fee (3%) deducted from the transfer'
  },

  net_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    comment: 'Amount after fee deduction (amount - fee)'
  },

  // ── Transfer provider ─────────────────────────────────────────────────────
  transfer_provider: {
    type: DataTypes.ENUM('bank', 'stripe', 'paypal', 'palpay'),
    allowNull: false,
    comment: 'Which provider was used for the actual transfer'
  },

  // ── Provider transfer ID ──────────────────────────────────────────────────
  provider_transfer_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Transaction ID from the provider (Stripe transfer ID, PayPal payout ID, bank reference, etc.) - for tracking inquiries'
  },

  // ── Withdrawal type (matches the withdraw request) ──────────────────────────
  withdrawal_type: {
    type: DataTypes.ENUM('early', 'final'),
    allowNull: true,
    comment: 'Type of withdrawal this transfer fulfills: early or final'
  },
  // ── Status ────────────────────────────────────────────────────────────────
  status: {
    type: DataTypes.ENUM('processing', 'completed', 'failed'),
    allowNull: false,
    defaultValue: 'processing',
    comment: 'Current state of the transfer'
  },

  // ── Timestamps ────────────────────────────────────────────────────────────
  transferred_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the transfer was successfully completed'
  },

  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }

}, {
  tableName: 'transfer_logs',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // Transfer logs are mostly immutable

  indexes: [
    { fields: ['withdraw_request_id'], name: 'idx_transfer_withdraw_req', unique: true },
    { fields: ['fundraiser_id'], name: 'idx_transfer_fundraiser' },
    { fields: ['user_id'], name: 'idx_transfer_user' },
    { fields: ['status'], name: 'idx_transfer_status' },
    { fields: ['transfer_provider'], name: 'idx_transfer_provider' },
    { fields: ['provider_transfer_id'], name: 'idx_transfer_provider_tx' }
  ],

  hooks: {
    // Auto-calculate net_amount from amount and fee
    beforeValidate: (transferLog) => {
      if (transferLog.amount && transferLog.fee !== undefined) {
        transferLog.net_amount = parseFloat(transferLog.amount) - parseFloat(transferLog.fee);
      }
    },
    beforeCreate: (transferLog) => {
      // Default fee is 3% if not specified
      if (!transferLog.fee && transferLog.amount) {
        transferLog.fee = parseFloat((parseFloat(transferLog.amount) * 0.03).toFixed(2));
        transferLog.net_amount = parseFloat(transferLog.amount) - transferLog.fee;
      }
      // ✅ Don't silently default — if withdrawal_type is missing, something upstream is broken
      if (!transferLog.withdrawal_type) {
        throw new Error('withdrawal_type is required on TransferLog and must come from the WithdrawRequest');
      }
    }
  }
});

// ── Class method: Calculate platform fee ────────────────────────────────────
TransferLog.calculateFee = function (amount, feePercent = 3) {
  const gross = parseFloat(amount);
  if (isNaN(gross) || gross <= 0) return 0;
  return parseFloat((gross * (feePercent / 100)).toFixed(2));
};

// ── Instance method: Mark as completed ──────────────────────────────────────
TransferLog.prototype.markAsCompleted = async function (providerTransferId = null) {
  this.status = 'completed';
  this.transferred_at = new Date();
  if (providerTransferId) {
    this.provider_transfer_id = providerTransferId;
  }
  await this.save();
};

// ── Instance method: Mark as failed ─────────────────────────────────────────
TransferLog.prototype.markAsFailed = async function () {
  this.status = 'failed';
  await this.save();
};

// ── Instance method: Get transfer summary ───────────────────────────────────
TransferLog.prototype.getSummary = function () {
  return {
    id: this.id,
    amount: this.amount,
    fee: this.fee,
    fee_percentage: '3%',
    net_amount: this.net_amount,
    provider: this.transfer_provider,
    status: this.status,
    provider_transfer_id: this.provider_transfer_id,
    transferred_at: this.transferred_at,
    created_at: this.created_at
  };
};

module.exports = TransferLog;
