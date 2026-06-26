// models/Invoice.js
// Represents a payment transaction made by a donor
// Stores donor info, campaign, amount, payment method, and status

const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbSQL');

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  // ── Donor reference ─────────────────────────────────────────────────────────
  donor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    comment: 'The user who made the donation'
  },

  // ── Fundraiser reference ──────────────────────────────────────────────────
  fundraiser_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'fundraisers', key: 'fundraiser_id' },
    comment: 'The campaign being donated to'
  },

  // ── Amount details ────────────────────────────────────────────────────────
  gross_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: { min: 0.01 },
    comment: 'Total donation amount before fees'
  },

  processing_fee: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Payment processor fee (e.g., Stripe fee)'
  },

  net_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    comment: 'Amount after fees (gross - processing_fee)'
  },

  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'USD',
    comment: 'ISO 4217 currency code'
  },

  // ── Payment provider ──────────────────────────────────────────────────────
  payment_provider: {
    type: DataTypes.ENUM('stripe', 'paypal', 'palpay', 'bank_transfer'),
    allowNull: false,
    comment: 'Which payment processor handled this transaction'
  },

  provider_transaction_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Transaction ID from the payment provider (Stripe payment intent ID, PayPal transaction ID, etc.)'
  },

  // ── Status ────────────────────────────────────────────────────────────────
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Current state of the payment'
  },

  // ── Points system ─────────────────────────────────────────────────────────
  points_processed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether loyalty/gamification points have been awarded for this donation'
  },

  points_processed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When points were processed'
  },

  // ── Timestamps ────────────────────────────────────────────────────────────
  paid_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the payment was successfully confirmed'
  },

  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },

  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }

}, {
  tableName: 'invoices',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',

  indexes: [
    { fields: ['donor_id'], name: 'idx_invoice_donor' },
    { fields: ['fundraiser_id'], name: 'idx_invoice_fundraiser' },
    { fields: ['status'], name: 'idx_invoice_status' },
    { fields: ['payment_provider'], name: 'idx_invoice_provider' },
    { fields: ['provider_transaction_id'], name: 'idx_invoice_provider_tx', unique: true },
    { fields: ['created_at'], name: 'idx_invoice_created' }
  ],

  hooks: {
    // Auto-calculate net_amount from gross_amount and processing_fee
    beforeValidate: (invoice) => {
      if (invoice.gross_amount && invoice.processing_fee !== undefined) {
        invoice.net_amount = parseFloat(invoice.gross_amount) - parseFloat(invoice.processing_fee);
      }
    },
    beforeUpdate: (invoice) => {
      invoice.updated_at = new Date();
      // If status changed to 'paid', set paid_at
      if (invoice.changed('status') && invoice.status === 'paid' && !invoice.paid_at) {
        invoice.paid_at = new Date();
      }
    }
  }
});

// ── Class method: Calculate processing fee for a given amount ───────────────
Invoice.calculateFee = function (grossAmount, provider = 'stripe') {
  const amount = parseFloat(grossAmount);
  if (isNaN(amount) || amount <= 0) return 0;

  // Fee structure:
  // Stripe: 2.9% + $0.30
  // PayPal: 2.9% + $0.30
  // PalPay: 3% flat
  // Bank transfer: $0 (no processing fee, but may have bank fees)
  switch (provider) {
    case 'stripe':
      return parseFloat((amount * 0.029 + 0.30).toFixed(2));
    case 'paypal':
      return parseFloat((amount * 0.029 + 0.30).toFixed(2));
    case 'palpay':
      return parseFloat((amount * 0.03).toFixed(2));
    case 'bank_transfer':
      return 0;
    default:
      return parseFloat((amount * 0.029 + 0.30).toFixed(2));
  }
};

// ── Instance method: Mark as paid ───────────────────────────────────────────
Invoice.prototype.markAsPaid = async function (providerTransactionId = null) {
  this.status = 'paid';
  this.paid_at = new Date();
  if (providerTransactionId) {
    this.provider_transaction_id = providerTransactionId;
  }
  await this.save();
};

// ── Instance method: Mark as failed ─────────────────────────────────────────
Invoice.prototype.markAsFailed = async function () {
  this.status = 'failed';
  await this.save();
};

// ── Instance method: Mark as refunded ───────────────────────────────────────
Invoice.prototype.markAsRefunded = async function () {
  this.status = 'refunded';
  await this.save();
};

// ── Instance method: Calculate net amount ───────────────────────────────────
Invoice.prototype.calculateNetAmount = function () {
  const gross = parseFloat(this.gross_amount) || 0;
  const fee = parseFloat(this.processing_fee) || 0;
  return parseFloat((gross - fee).toFixed(2));
};

module.exports = Invoice;
