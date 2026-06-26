const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbSQL');

const Financial_requests = sequelize.define('Financial_requests', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },

        target_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },

        collected_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0
        },

        status: {
            type: DataTypes.ENUM('pending', 'completed', 'expired'),
            allowNull: false,
            defaultValue: 'pending'
        },

        mainImage: {
            type: DataTypes.STRING,
            allowNull: true
        },

        subImage1: {
            type: DataTypes.STRING,
            allowNull: true
        },
        subImage2: {
            type: DataTypes.STRING,
            allowNull: true
        },
        subImage3: {
            type: DataTypes.STRING,
            allowNull: true
        },

        category: {
            type: DataTypes.STRING(100),
            allowNull: true
        },

        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'user_id',
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },

        activation: {
            type: DataTypes.ENUM('active', 'unactive'),
            allowNull: false,
            defaultValue: 'active'
        }

    }, {
        tableName: 'Financial_requests', // 🔹 تعديل اسم الجدول هنا
        timestamps: true,
        underscored: true
    });

Financial_requests.associate = (models) => {
  Financial_requests.belongsTo(models.User, { 
    foreignKey: "userId", 
    as: "users", 
    onDelete: "CASCADE" 
  });
};


module.exports = Financial_requests;
