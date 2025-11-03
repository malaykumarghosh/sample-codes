const Sequelize = require('sequelize');
const sequelize = require('../../../database/connection');

module.exports = sequelize.define('Invoice', {
    id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    org_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    account_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    type: {
        type: Sequelize.ENUM('QT', 'PI', 'INV'),
        allowNull: true,
        defaultValue: null
    },
    ref_no: {
        type: Sequelize.STRING(20),
        allowNull: true
    },
    inv_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
    },
    inv_title: {
        type: Sequelize.STRING(255),
        allowNull: true
    },
    to_name: {
        type: Sequelize.STRING(255),
        allowNull: true
    },
    to_address: {
        type: Sequelize.STRING(255),
        allowNull: true
    },
    tax_rate: {
        type: Sequelize.DECIMAL(2,2),
        allowNull: true
    },
    created: {
        type: Sequelize.DATE,
        allowNull: true
    },
    modified: {
        type: Sequelize.DATE,
        allowNull: true
    }
}, {
    tableName: 'invoices',
    timestamps: false
});