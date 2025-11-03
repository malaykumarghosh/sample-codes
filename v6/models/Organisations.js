const Sequelize = require('sequelize');
const sequelize = require('../../../database/connection');

module.exports = sequelize.define('Organisation', {
    id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    logo_url: {
        type: Sequelize.STRING(255),
        allowNull: true
    },
    name: {
        type: Sequelize.STRING(255),
        allowNull: true
    },
    phone_number_id: {
        type: Sequelize.STRING(255),
        allowNull: true
    },
    whatsapp_api_endpoint: {
        type: Sequelize.STRING(255),
        allowNull: true
    },
    whatsapp_business_phone_number: {
        type: Sequelize.STRING(255),
        allowNull: true
    },
    whatsapp_business_account_id: {
        type: Sequelize.STRING(255),
        allowNull: true
    },
    facebook_app_id: {
        type: Sequelize.STRING(255),
        allowNull: true
    },
    token: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    marketed_by_name: {
        type: Sequelize.STRING(255),
        allowNull: true
    },
    marketed_by_url: {
        type: Sequelize.STRING(255),
        allowNull: true
    },
    marketed_by_logo_url: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    secret_key: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    active: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: true
    },
    version_id: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    contract_start_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
    },
    contract_end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
    },
    delay_time: {
        type: Sequelize.DECIMAL(10,2),
        allowNull: true,
        defaultValue: 0.00
    },
    quality_rating: {
        type: Sequelize.STRING(100),
        allowNull: true
    },
    message_limit: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 250
    },
    created_by: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    is_mfa_required: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
    },
    py_token: {
        type: Sequelize.STRING(255),
        allowNull: true
    },
    subscription_type: {
        type: Sequelize.STRING(255),
        allowNull: true
    },
    unsubscribe_keys: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    user_count: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    mt_credit: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
    },
    createdAt: {
        type: Sequelize.DATE,
        allowNull: false
    },
    updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
    },
    onboard_type: {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: 'manual'
    },
    is_meta_payment_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: true
    },
    country_code: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    last_update_template_analytic: {
        type: Sequelize.DATE,
        allowNull: true
    }
}, {
    tableName: 'organisations',
    timestamps: false,
    indexes: [
        { unique: true, fields: ['name'] }
    ]
});