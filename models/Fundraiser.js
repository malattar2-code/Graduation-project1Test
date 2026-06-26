// models/Fundraiser.js - UPDATED with payment system changes
// Changes:
// 1. Added fundraiser_owner_type ENUM ('requester', 'charity')
// 2. Added 'expired' to fundraiser_status ENUM
// 3. Added allow_early_withdrawal BOOLEAN (auto-true for urgent campaigns)
// 4. REMOVED stripeAccountId field (moved to user level or removed entirely)

const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbSQL");
const User = require("./User");

const Fundraiser = sequelize.define("Fundraiser", {
  fundraiser_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // ── NEW: public ULID for external-facing URLs/APIs ───────────────────────────
  public_id: {
      type: DataTypes.STRING(26),
      allowNull: false,
      unique: true,
      defaultValue: () => {
          const { ulid } = require('ulid');
          return ulid();
      },
      comment: 'Public-facing ULID for URLs, APIs, and external references'
  },
  fundraiser_title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: { notEmpty: true, len: [1, 255] }
  },
  fundraiser_categories: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    validate: {
      isValidCategories(value) {
        if (!Array.isArray(value) || value.length === 0)
          throw new Error("At least one category is required");
        if (value.length > 4)
          throw new Error("Maximum 4 categories allowed");
      }
    }
  },
  fundraiser_hashtags: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    allowNull: true,
    defaultValue: [],
    validate: {
      isValidHashtags(value) {
        if (!Array.isArray(value)) throw new Error("Hashtags must be an array");
        if (value.length > 10) throw new Error("Maximum 10 hashtags allowed");
      }
    }
  },
  // ── NEW: campaign type ───────────────────────────────────────────────────────
  fundraiser_type: {
    type: DataTypes.ENUM('Fundraiser', 'Donation'),
    allowNull: false,
    defaultValue: 'Fundraiser'
  },
  // target_amount is nullable for Donation campaigns
  fundraiser_target_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    validate: { min: 0 }
  },
  fundraiser_collected_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    validate: { min: 0 }
  },
  // ── UPDATED status ENUM: includes 'expired' ─────────────────────────────────
  fundraiser_status: {
    type: DataTypes.ENUM(
      'incompleted',
      'create_form',
      'Waiting_requesters',
      'completed',
      'transferred',
      'waiting_verification',
      'expired'          // <-- ADDED: campaign has passed expiry date
    ),
    defaultValue: 'waiting_verification',
    allowNull: false
  },
  // ── NEW: fundraiser owner type ──────────────────────────────────────────────
  fundraiser_owner_type: {
    type: DataTypes.ENUM('requester', 'charity'),
    allowNull: false,
    defaultValue: 'requester',
    comment: 'Specifies the account type that created this campaign'
  },
  // ── NEW: allow early withdrawal ─────────────────────────────────────────────
  allow_early_withdrawal: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Enables early withdrawal at 40% of target for urgent campaigns'
  },
  early_withdrawal_used: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether the one-time early withdrawal has already been used'
  },
  fundraiser_main_image: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  fundraiser_sub_image_one:   { type: DataTypes.STRING(500), allowNull: true },
  fundraiser_sub_image_two:   { type: DataTypes.STRING(500), allowNull: true },
  fundraiser_sub_image_three: { type: DataTypes.STRING(500), allowNull: true },
  fundraiser_description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: { notEmpty: true, len: [10, 5000] }
  },
  fundraiser_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "users", key: "id" }
  },
  // REMOVED: stripeAccountId - no longer needed at fundraiser level
  firebase_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  created_at:  { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at:  { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  synced_at:   { type: DataTypes.DATE, allowNull: true },
  is_blocked:  { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
  block_reason: { type: DataTypes.TEXT, allowNull: true },
  blocked_at:  { type: DataTypes.DATE, allowNull: true },
  is_urgent: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    // ── Campaign expiry date ──
  fundraiser_expiry_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  // ── Campaign video (optional) ──
  fundraiser_video: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  // ── Donation item fields ──
  donated_item_type: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  donated_item_quantity: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  donated_item_condition: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  // ── Fund allocation percentages ──
  fund_allocation_percentage: {
    type: DataTypes.JSONB,
    allowNull: true
  },
}, {
  tableName:  "fundraisers",
  underscored: true,
  timestamps: true,
  createdAt:  "created_at",
  updatedAt:  "updated_at",
  hooks: {
    beforeCreate: async (fundraiser) => {
        // Auto-enable early withdrawal for urgent campaigns
        if (fundraiser.is_urgent === true) {
            fundraiser.allow_early_withdrawal = true;
        }
    },
    beforeSave:   async (f) => { 
      f.updated_at = new Date(); 
      // Auto-enable early withdrawal when urgent + 40% reached
      await f.checkAndEnableEarlyWithdrawal();
      f.calculateStatus(); 
    },
    beforeUpdate: async (f) => { 
      f.updated_at = new Date(); 
      // Auto-enable early withdrawal when urgent + 40% reached
      await f.checkAndEnableEarlyWithdrawal();
      f.calculateStatus(); 
    },
  }
});

// ── Status calculation ────────────────────────────────────────────────────────
// Rules:
//   Fundraiser type:
//     incompleted  -> create_form (target reached) -> Waiting_requesters -> completed -> transferred
//   Donation type:
//     create_form (initial) -> Waiting_requesters -> completed -> transferred
//   Expired:
//     Any campaign with past expiry date gets 'expired' status
//
// The hook only auto-promotes incompleted->create_form when target is hit.
// All other transitions are set explicitly by business logic / admin actions.
Fundraiser.prototype.calculateStatus = function () {
  const collected = parseFloat(this.fundraiser_collected_amount) || 0;
  const target    = parseFloat(this.fundraiser_target_amount)    || 0;

  // Check if campaign has expired (only if expiry date is set)
  if (this.fundraiser_expiry_date && this.fundraiser_status !== 'transferred') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(this.fundraiser_expiry_date);
    expiryDate.setHours(0, 0, 0, 0);
    
    if (today > expiryDate && this.fundraiser_status !== 'expired') {
      this.fundraiser_status = 'expired';
      return;
    }
  }

  if (this.fundraiser_type === 'Donation') {
    // Donation campaigns start at create_form; never go back to incompleted
    if (!this.fundraiser_status || this.fundraiser_status === 'incompleted') {
      this.fundraiser_status = 'create_form';
    }
    return;
  }

  // Fundraiser type: only auto-promote when target is reached
  if (
    this.fundraiser_status === 'incompleted' &&
    target > 0 &&
    collected >= target
  ) {
    this.fundraiser_status = 'create_form';
  }
};

Fundraiser.calculateStatus = function (type, collectedAmount, targetAmount, expiryDate = null) {
  const collected = parseFloat(collectedAmount) || 0;
  const target    = parseFloat(targetAmount)    || 0;
  
  // Check expiry first
  if (expiryDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDate);
    exp.setHours(0, 0, 0, 0);
    if (today > exp) return 'expired';
  }
  
  if (type === 'Donation') return 'create_form';
  return (target > 0 && collected >= target) ? 'create_form' : 'incompleted';
};

// ── Auto-enable early withdrawal when urgent campaign reaches 40% ───────────
Fundraiser.prototype.checkAndEnableEarlyWithdrawal = async function () {
  // Only check if not already enabled and campaign is urgent
  if (this.allow_early_withdrawal === true) return;
  if (this.is_urgent !== true) return;

  const collected = parseFloat(this.fundraiser_collected_amount) || 0;
  const target = parseFloat(this.fundraiser_target_amount) || 0;

  if (target > 0) {
    const pct = (collected / target) * 100;
    if (pct >= 40) {
      this.allow_early_withdrawal = true;
    }
  }
};

// ── Check if campaign is eligible for early withdrawal ──────────────────────
Fundraiser.prototype.canWithdrawEarly = function () {
  if (!this.allow_early_withdrawal) return false;
  const collected = parseFloat(this.fundraiser_collected_amount) || 0;
  const target    = parseFloat(this.fundraiser_target_amount)    || 0;
  if (target <= 0) return false;
  const pct = (collected / target) * 100;
  return pct >= 40;
};

// ── Check if campaign is eligible for final withdrawal ──────────────────────
Fundraiser.prototype.canWithdrawFinal = function () {
  const eligibleStatuses = ['completed', 'expired'];
  return eligibleStatuses.includes(this.fundraiser_status);
};

// ── Check if any withdrawal is allowed ──────────────────────────────────────
Fundraiser.prototype.isWithdrawalAllowed = function () {
  return this.canWithdrawEarly() || this.canWithdrawFinal();
};

module.exports = Fundraiser;
