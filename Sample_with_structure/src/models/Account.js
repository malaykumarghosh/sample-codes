const Sequelize = require('sequelize');
const sequelize = require('../../../database/connection');

module.exports = sequelize.define('Account', {
    id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: Sequelize.STRING(255),
        allowNull: false
    },
    industry: {
        type: Sequelize.STRING(100),
        allowNull: true
    },
    website: {
        type: Sequelize.STRING(255),
        allowNull: true
    },
    phone_number: {
        type: Sequelize.STRING(20),
        allowNull: true
    },
    email: {
        type: Sequelize.STRING(100),
        allowNull: true
    },
    address: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    city: {
        type: Sequelize.STRING(100),
        allowNull: true
    },
    state: {
        type: Sequelize.STRING(100),
        allowNull: true
    },
    country: {
        type: Sequelize.STRING(100),
        allowNull: true
    },
    postal_code: {
        type: Sequelize.STRING(20),
        allowNull: true
    },
    source: {
        type: Sequelize.STRING(100),
        allowNull: true
    },
    created_by: {
        type: Sequelize.BIGINT,
        allowNull: true
    },
    created_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    org_id: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    account_type: {
        type: Sequelize.STRING(100),
        allowNull: true
    },
    createdAt: {
        type: Sequelize.DATE,
        allowNull: true
    },
    updatedAt: {
        type: Sequelize.DATE,
        allowNull: true
    }
}, {
    tableName: 'accounts',
    timestamps: false
});