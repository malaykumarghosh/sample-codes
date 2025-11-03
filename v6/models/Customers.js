const Sequelize = require('sequelize');
const sequelize = require('../../../database/connection');

module.exports = sequelize.define('Customer', {
    id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    org_id: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    name: {
        type: Sequelize.STRING(255),
        allowNull: true
    },
    phone_number: {
        type: Sequelize.STRING(255),
        allowNull: true
    },
    status: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    email: {
        type: Sequelize.STRING(255),
        allowNull: true
    },
    address1: {
        type: Sequelize.STRING(255),
        allowNull: true
    },
    address2: {
        type: Sequelize.STRING(255),
        allowNull: true
    },
    address3: {
        type: Sequelize.STRING(255),
        allowNull: true
    },
    category: {
        type: Sequelize.STRING(255),
        allowNull: true
    },
    is_subscribed: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: true
    },
    has_whatsapp: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: true
    },
    created_by: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    createdAt: {
        type: Sequelize.DATE,
        allowNull: true
    },
    updatedAt: {
        type: Sequelize.DATE,
        allowNull: true
    },
    last_requested_action_name: {
        type: Sequelize.STRING(255),
        allowNull: true
    },
    deactive_request_at: {
        type: Sequelize.DATE,
        allowNull: true
    },
    non_wa_account_checked_at: {
        type: Sequelize.DATE,
        allowNull: true
    },
    last_chat_initiated_at: {
        type: Sequelize.DATE,
        allowNull: true
    },
    tags: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    encryptedKey: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    thread_id: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    next_action: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    next_action_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
    },
    source: {
        type: Sequelize.ENUM('web', 'email', 'whatsapp'),
        allowNull: true
    },
    last_parking_message_sent_at: {
        type: Sequelize.DATE,
        allowNull: true
    },
    account_id: {
        type: Sequelize.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'customers',
    timestamps: false,
    indexes: [
        { name: 'phone_number_idx', fields: ['phone_number'] }
    ]
});