// models/WithdrawRequest.js
// Represents a donation withdrawal request that has been created but not yet executed.
// After admin approval, a TransferLog record is created for the actual transfer.

const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbSQL');

const WithdrawRequest = sequelize.define('WithdrawRequest', {
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
    comment: 'The campaign whose funds are being withdrawn'
  },

  // ── User reference (the campaign owner requesting withdrawal) ─────────────
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    comment: 'The user (campaign owner) requesting the withdrawal'
  },

  // ── Amount ────────────────────────────────────────────────────────────────
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: { min: 0.01 },
    comment: 'The amount requested for withdrawal'
  },

  // ── Withdrawal method ─────────────────────────────────────────────────────
  withdrawal_method: {
    type: DataTypes.ENUM('stripe', 'bank_transfer', 'paypal', 'palpay'),
    allowNull: false,
    comment: 'How the user wants to receive the funds'
  },

  // ── Withdrawal type (early or final) ──────────────────────────────────────
  withdrawal_type: {
    type: DataTypes.ENUM('early', 'final'),
    allowNull: true,
    comment: 'Type of withdrawal: early (40% reached) or final (campaign completed/expired)'
  },
  // ── Withdrawal details (JSONB - varies by method) ─────────────────────────
  // bank_transfer: { account_holder_name, account_number, iban }
  // paypal: { paypal_email }
  // palpay: { mobile_number }
  // stripe: { stripe_account_id }
  withdrawal_details: {
    type: DataTypes.JSONB,
    allowNull: false,
    comment: 'Method-specific payment details (account numbers, emails, etc.)',
    validate: {
      isValidDetails(value) {
        if (!value || typeof value !== 'object') {
          throw new Error('Withdrawal details must be a valid object');
        }
      }
    }
  },

  // ── Optional notes from the user ──────────────────────────────────────────
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Optional notes from the user making the withdrawal request'
  },

  // ── Admin notes ───────────────────────────────────────────────────────────
  admin_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes from the admin reviewing the request'
  },

  // ── Status ────────────────────────────────────────────────────────────────
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'processing', 'completed'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Current state of the withdrawal request'
  },

  // ── Admin reviewer ────────────────────────────────────────────────────────
  reviewed_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    comment: 'Admin user who reviewed this request'
  },

  reviewed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the request was reviewed by an admin'
  },

  // ── Timestamps ────────────────────────────────────────────────────────────
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
  tableName: 'withdraw_requests',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',

  indexes: [
    { fields: ['fundraiser_id'], name: 'idx_withdraw_fundraiser' },
    { fields: ['user_id'], name: 'idx_withdraw_user' },
    { fields: ['status'], name: 'idx_withdraw_status' },
    { fields: ['withdrawal_method'], name: 'idx_withdraw_method' },
    { fields: ['created_at'], name: 'idx_withdraw_created' }
  ],

  hooks: {
    beforeUpdate: async (withdrawRequest) => {
      withdrawRequest.updated_at = new Date();

      // If status changed to approved/rejected, set reviewed_at
      if (withdrawRequest.changed('status') &&
          ['approved', 'rejected'].includes(withdrawRequest.status) &&
          !withdrawRequest.reviewed_at) {
        withdrawRequest.reviewed_at = new Date();
      }

      // Auto-set withdrawal_type based on status transition
      if (withdrawRequest.changed('status') && 
          withdrawRequest.status === 'approved' && 
          !withdrawRequest.withdrawal_type) {
        // Default to 'final' if not set, but ideally set during creation
        withdrawRequest.withdrawal_type = withdrawRequest.withdrawal_type || 'final';
      }
    }
  }
});

// ── Validation helpers for withdrawal_details ───────────────────────────────
WithdrawRequest.VALID_BANK_TRANSFER_FIELDS = ['account_holder_name', 'account_number', 'iban'];
WithdrawRequest.VALID_PAYPAL_FIELDS = ['paypal_email'];
WithdrawRequest.VALID_PALPAY_FIELDS = ['mobile_number'];
WithdrawRequest.VALID_STRIPE_FIELDS = ['stripe_account_id'];

// ── Class method: Validate withdrawal details by method ─────────────────────
WithdrawRequest.validateWithdrawalDetails = function (method, details) {
  if (!details || typeof details !== 'object') {
    return { valid: false, error: 'Withdrawal details are required' };
  }

  switch (method) {
    case 'bank_transfer':
      if (!details.account_holder_name || !details.account_holder_name.trim()) {
        return { valid: false, error: 'Account holder name is required' };
      }
      if (!details.account_number || !details.account_number.trim()) {
        return { valid: false, error: 'Account number is required' };
      }
      if (!details.iban || !details.iban.trim()) {
        return { valid: false, error: 'IBAN is required' };
      }
      return { valid: true };

    case 'paypal':
      if (!details.paypal_email || !details.paypal_email.trim()) {
        return { valid: false, error: 'PayPal email is required' };
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(details.paypal_email)) {
        return { valid: false, error: 'Valid PayPal email is required' };
      }
      return { valid: true };

    case 'palpay':
      if (!details.mobile_number || !details.mobile_number.trim()) {
        return { valid: false, error: 'Mobile number is required' };
      }
      return { valid: true };

    case 'stripe':
      if (!details.stripe_account_id || !details.stripe_account_id.trim()) {
        return { valid: false, error: 'Stripe account ID is required' };
      }
      if (!details.stripe_account_id.startsWith('acct_')) {
        return { valid: false, error: 'Invalid Stripe account ID format (should start with acct_)' };
      }
      return { valid: true };

    default:
      return { valid: false, error: 'Unknown withdrawal method' };
  }
};

// ── Instance method: Get sanitized details for display (masks sensitive data) ─
WithdrawRequest.prototype.getMaskedDetails = function () {
  const details = this.withdrawal_details;
  if (!details) return null;

  const masked = { ...details };

  switch (this.withdrawal_method) {
    case 'bank_transfer':
      if (masked.account_number) {
        masked.account_number = '****' + masked.account_number.slice(-4);
      }
      if (masked.iban) {
        masked.iban = masked.iban.substring(0, 8) + '****' + masked.iban.slice(-4);
      }
      break;
    case 'paypal':
      if (masked.paypal_email) {
        const email = masked.paypal_email;
        const atIndex = email.indexOf('@');
        masked.paypal_email = email.substring(0, 2) + '***@' + email.substring(atIndex + 1);
      }
      break;
    case 'palpay':
      if (masked.mobile_number) {
        masked.mobile_number = '****' + masked.mobile_number.slice(-4);
      }
      break;
    case 'stripe':
      if (masked.stripe_account_id) {
        masked.stripe_account_id = masked.stripe_account_id.substring(0, 8) + '...';
      }
      break;
  }

  return masked;
};

// ── Instance method: Approve request ────────────────────────────────────────
WithdrawRequest.prototype.approve = async function (adminUserId, adminNotes = null) {
  this.status = 'approved';
  this.reviewed_by = adminUserId;
  this.reviewed_at = new Date();
  if (adminNotes) this.admin_notes = adminNotes;
  await this.save();
};

// ── Instance method: Reject request ─────────────────────────────────────────
WithdrawRequest.prototype.reject = async function (adminUserId, adminNotes = null) {
  this.status = 'rejected';
  this.reviewed_by = adminUserId;
  this.reviewed_at = new Date();
  if (adminNotes) this.admin_notes = adminNotes;
  await this.save();
};

// ── Instance method: Mark as processing ─────────────────────────────────────
WithdrawRequest.prototype.markAsProcessing = async function () {
  this.status = 'processing';
  await this.save();
};

// ── Instance method: Mark as completed ──────────────────────────────────────
WithdrawRequest.prototype.markAsCompleted = async function () {
  this.status = 'completed';
  await this.save();
};

module.exports = WithdrawRequest;
