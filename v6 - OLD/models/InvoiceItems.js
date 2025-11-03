const Sequelize = require('sequelize');
const sequelize = require('../../../database/connection');

module.exports = sequelize.define('InvoiceItem', {
    id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    invoice_id: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    item_desc: {
        type: Sequelize.STRING(255),
        allowNull: true
    },
    qty: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    rate: {
        type: Sequelize.DECIMAL(8,2),
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
    tableName: 'invoice_items',
    timestamps: false
});