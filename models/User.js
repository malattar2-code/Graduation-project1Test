// models/User.js - UPDATED with payment system changes
// Changes:
// 1. Added last_login_at field (nullable - user might register but never log in)
// 2. Added terms_accepted_at field (nullable - user might not accept terms)
// 3. REMOVED stripe_account_id field

const { DataTypes } = require('sequelize');
const sequelize      = require('../config/dbSQL');
const bcrypt         = require('bcryptjs');

const User = sequelize.define('User', {

  // ── Primary key ─────────────────────────────────────────────────────────────
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true
  },

  // ── Core identity ────────────────────────────────────────────────────────────
  full_name: {
    type:      DataTypes.STRING,
    allowNull: false,
    validate:  { notEmpty: { msg: 'الاسم لا يمكن أن يكون فارغاً' } }
  },

  email: {
    type:      DataTypes.STRING,
    allowNull: false,
    unique:    true,
    validate: {
      isEmail:  { msg: 'يرجى إدخال بريد إلكتروني صحيح' },
      notNull:  { msg: 'البريد الإلكتروني مطلوب' }
    },
    set(value) {
      // Always store email in lowercase
      this.setDataValue('email', value ? value.toLowerCase().trim() : value);
    }
  },

  // ── Password (stored hashed; excluded from default scope) ────────────────────
  password: {
    type:      DataTypes.STRING,
    allowNull: false
  },

  // ── Verification ─────────────────────────────────────────────────────────────
  is_verified: {
    type:         DataTypes.BOOLEAN,
    defaultValue: false
  },

  verification_code: {
    type:         DataTypes.STRING(6),
    allowNull:    true,
    defaultValue: null,
    comment:      'One-time 6-digit email verification code'
  },

  verification_code_expires_at: {
    type:         DataTypes.DATE,
    allowNull:    true,
    defaultValue: null
  },

  // ── Password reset ───────────────────────────────────────────────────────────
  password_reset_code: {
    type:      DataTypes.STRING(6),
    allowNull: true,
    comment:   'One-time 6-digit password-reset code'
  },

  password_reset_expires_at: {
    type:      DataTypes.DATE,
    allowNull: true
  },

  // ── Geography ────────────────────────────────────────────────────────────────
  location: {
    type:      DataTypes.GEOGRAPHY('POINT', 4326),
    allowNull: true
  },

  country: {
    type:      DataTypes.STRING(100),
    allowNull: true,
    comment:   'Country name'
  },

  region: {
    type:      DataTypes.STRING(150),
    allowNull: true,
    comment:   'Region / state / governorate'
  },

  city: {
    type:      DataTypes.STRING(100),
    allowNull: true,
    comment:   'City'
  },

  country_code: {
    type:      DataTypes.STRING(10),
    allowNull: true,
    comment:   'ISO country code'
  },

  // ── User type ────────────────────────────────────────────────────────────────
  user_type: {
    type:         DataTypes.ENUM('Donor', 'requester', 'Charity'),
    allowNull:    false,
    defaultValue: 'requester'
  },

  // ── Demographics ─────────────────────────────────────────────────────────────
  gender: {
    type:      DataTypes.ENUM('male', 'female'),
    allowNull: true
  },

  birth_date: {
    type:      DataTypes.DATEONLY,
    allowNull: true
  },

  // ── Phone ────────────────────────────────────────────────────────────────────
  phone_number: {
    type:      DataTypes.STRING(25),
    allowNull: true,
    unique: {
      msg: 'هذا الرقم مسجل مسبقاً بحساب آخر'
    },
    validate: {
      isPhoneNumber(value) {
        if (value && !/^\+?[0-9]{7,20}$/.test(value)) {
          throw new Error('يرجى إدخال رقم هاتف صحيح (مثال: +970590000000)');
        }
      }
    }
  },
  phone_national: {
    type: DataTypes.STRING(30),
    allowNull: true,
    comment: 'National format (e.g., 090-1234-5678)'
  },
  phone_international: {
    type: DataTypes.STRING(30),
    allowNull: true,
    comment: 'International format (e.g., +81 90 1234 5678)'
  },
  phone_country_iso: {
    type: DataTypes.STRING(2),
    allowNull: true,
    comment: 'ISO 3166-1 alpha-2 (e.g., jp)'
  },

  // ── Avatar ───────────────────────────────────────────────────────────────────
  user_image: {
    type:      DataTypes.STRING,
    allowNull: true
  },

  // ── Charity-specific ─────────────────────────────────────────────────────────
  charity_name: {
    type:      DataTypes.STRING,
    allowNull: true,
    comment:   'Name of the charity organisation'
  },

  charity_description: {
    type:      DataTypes.TEXT,
    allowNull: true,
    comment:   'Short description / achievements'
  },

  charity_establishment_date: {
    type:      DataTypes.DATEONLY,
    allowNull: true,
    comment:   'Date the charity was founded'
  },

  charity_type: {
    type:      DataTypes.STRING,
    allowNull: true,
    comment:   'Charity category (e.g., education, health)'
  },
  charity_website: {
    type:      DataTypes.STRING,
    allowNull: true,
    comment:   'Official charity website URL'
  },

  charity_facebook: {
    type:      DataTypes.STRING,
    allowNull: true,
    comment:   'Facebook page URL'
  },

  charity_instagram: {
    type:      DataTypes.STRING,
    allowNull: true,
    comment:   'Instagram profile URL'
  },

  charity_linkedin: {
    type:      DataTypes.STRING,
    allowNull: true,
    comment:   'LinkedIn page URL'
  },

  charity_x: {
    type:      DataTypes.STRING,
    allowNull: true,
    comment:   'X (Twitter) profile URL'
  },

  // REMOVED: stripe_account_id - no longer stored on user

  // ── NEW: Last login timestamp ────────────────────────────────────────────────
  last_login_at: {
    type:      DataTypes.DATE,
    allowNull: true,
    comment:   'Last time the user logged in (nullable: user may register but never log in)'
  },

  // ── NEW: Terms acceptance timestamp ──────────────────────────────────────────
  terms_accepted_at: {
    type:      DataTypes.DATE,
    allowNull: true,
    comment:   'When the user accepted terms and conditions (nullable)'
  },

  // ── Banning ──────────────────────────────────────────────────────────────────
  is_banned: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: false
  },

  ban_reason: {
    type:      DataTypes.TEXT,
    allowNull: true,
    comment:   'Reason for account suspension'
  }

}, {
  tableName:  'users',
  timestamps: true,
  underscored: true,

  // ── Indexes ──────────────────────────────────────────────────────────────────
  indexes: [
    { fields: ['email'],        unique: true, name: 'idx_user_email_unique'  },
    { fields: ['phone_number'], unique: true, name: 'idx_user_phone_unique'  },
    { fields: ['user_type'],                  name: 'idx_user_type'          },
    { fields: ['is_verified'],                name: 'idx_user_verified'      },
    { fields: ['is_banned'],                  name: 'idx_user_banned'        },
    { fields: ['created_at'],                 name: 'idx_user_created_at'    },
    { fields: ['last_login_at'],              name: 'idx_user_last_login'    }   // <-- NEW index
  ],

  // ── Scopes ───────────────────────────────────────────────────────────────────
  defaultScope: {
    attributes: {
      exclude: ['password', 'verification_code', 'verification_code_expires_at',
                'password_reset_code', 'password_reset_expires_at']
    }
  },
  scopes: {
    withPassword: {
      attributes: {
        include: ['password', 'verification_code', 'verification_code_expires_at',
                  'password_reset_code', 'password_reset_expires_at']
      }
    }
  },

  // ── Hooks ────────────────────────────────────────────────────────────────────
  hooks: {
    beforeUpdate: async (user) => {
      if (user.changed('password') && user.password && !user.password.startsWith('$2')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// ── Instance method: compare password ────────────────────────────────────────
User.prototype.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

// ── Instance method: is OTP valid? ───────────────────────────────────────────
User.prototype.isVerificationCodeValid = function (code) {
  if (!this.verification_code || !this.verification_code_expires_at) return false;
  if (new Date() > new Date(this.verification_code_expires_at)) return false;
  return this.verification_code === code;
};

// ── Instance method: is reset code valid? ────────────────────────────────────
User.prototype.isResetCodeValid = function (code) {
  if (!this.password_reset_code || !this.password_reset_expires_at) return false;
  if (new Date() > new Date(this.password_reset_expires_at)) return false;
  return this.password_reset_code === code;
};

// ── Instance method: record login ────────────────────────────────────────────
User.prototype.recordLogin = async function () {
  this.last_login_at = new Date();
  await this.save({ fields: ['last_login_at', 'updated_at'] });
};

// ── Instance method: accept terms ────────────────────────────────────────────
User.prototype.acceptTerms = async function () {
  this.terms_accepted_at = new Date();
  await this.save({ fields: ['terms_accepted_at', 'updated_at'] });
};

module.exports = User;
