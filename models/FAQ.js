const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbSQL');

const FAQ = sequelize.define('faq', {
    faq_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    faq_question: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    faq_answer: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    faq_type: {
        type: DataTypes.STRING(100),
        defaultValue: 'general',
        allowNull: false
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
    tableName: 'faq',
    timestamps: false,
    underscored: true
});

module.exports = FAQ;