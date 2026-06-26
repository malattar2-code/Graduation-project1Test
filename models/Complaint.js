// models/Complaint.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbSQL');
// REMOVE THIS: const User = require("./User");

const Complaint = sequelize.define('Complaint', {
    complaint_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    complaint_content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 1000]
        }
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    user_email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    user_full_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'in_progress', 'resolved', 'closed'),
        defaultValue: 'pending'
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'complaints',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Complaint;