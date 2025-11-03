const Sequelize = require('sequelize');
const sequelize = require('../../../database/connection');

module.exports = sequelize.define('AccountContact', {
    id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    account_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    contact_type: {
        type: Sequelize.ENUM('P', 'S'),
        allowNull: true,
        defaultValue: 'S'
    },
    name: {
        type: Sequelize.STRING(100),
        allowNull: false
    },
    email: {
        type: Sequelize.STRING(100),
        allowNull: true
    },
    phone: {
        type: Sequelize.STRING(20),
        allowNull: true
    },
    is_active: {
        type: Sequelize.ENUM('Y', 'N'),
        allowNull: false,
        defaultValue: 'N'
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
    tableName: 'account_contacts',
    timestamps: false
});