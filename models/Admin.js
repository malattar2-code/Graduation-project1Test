const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbSQL');
const bcrypt  = require('bcryptjs');

const Admin = sequelize.define('Admin', {

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
    validate:  { notEmpty: { msg: 'Name cannot be empty' } }
  },

  email: {
    type:      DataTypes.STRING,
    allowNull: false,
    unique:    true,
    validate:  { isEmail: { msg: 'Please enter a valid email' } },
    set(value) {
      this.setDataValue('email', value ? value.toLowerCase().trim() : value);
    }
  },

  // ── Password (hashed; excluded by default scope) ─────────────────────────────
  password: {
    type:      DataTypes.STRING,
    allowNull: false
  },

  // ── Avatar ──────────────────────────────────────────────────────────────────
  user_image: {
    type:      DataTypes.STRING,
    allowNull: true
  },

  // ── Type & Role ─────────────────────────────────────────────────────────────
  // user_type keeps compatibility with existing requireAdmin middleware
  user_type: {
    type:         DataTypes.STRING,
    allowNull:    false,
    defaultValue: 'admin'
  },

  role: {
    type:         DataTypes.STRING,
    allowNull:    false,
    defaultValue: 'admin',
    comment:      'e.g. admin, superadmin, moderator'
  },

  is_active: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: true
  },

  // ── Verification / Status ─────────────────────────────────────────────────────
  // is_verified & is_banned are checked by your existing requireAuth middleware
  is_verified: {
    type:         DataTypes.BOOLEAN,
    defaultValue: false
  },

  is_banned: {
    type:         DataTypes.BOOLEAN,
    defaultValue: false
  },

  // email_verified & disabled are kept for API response compatibility
  email_verified: {
    type:         DataTypes.BOOLEAN,
    defaultValue: false
  },

  disabled: {
    type:         DataTypes.BOOLEAN,
    defaultValue: false
  },

  // ── Phone ────────────────────────────────────────────────────────────────────
  phone_number: {
    type:      DataTypes.STRING(25),
    allowNull: true
  }

}, {
  tableName:   'admins',
  timestamps:  true,    // created_at, updated_at
  underscored: true,    // snake_case columns

  indexes: [
    { fields: ['email'], unique: true, name: 'idx_admin_email_unique' },
    { fields: ['role'],              name: 'idx_admin_role'           },
    { fields: ['is_active'],         name: 'idx_admin_active'         }
  ],

  defaultScope: {
    attributes: { exclude: ['password'] }
  },

  hooks: {
    beforeUpdate: async (admin) => {
      if (admin.changed('password') && admin.password && !admin.password.startsWith('$2')) {
        const salt = await bcrypt.genSalt(12);
        admin.password = await bcrypt.hash(admin.password, salt);
      }
    }
  }
});

// ── Instance method: compare password ────────────────────────────────────────
Admin.prototype.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

module.exports = Admin;