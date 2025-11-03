const Sequelize = require('sequelize');
const sequelize = require('../../../database/connection');

module.exports = sequelize.define('Account', {
    id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: Sequelize.STRING(255),
        allowNull: false
    },
    description: {
        type: Sequelize.STRING(255),
        allowNull: true
    },
    address: {
        type: Sequelize.TEXT,
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
    tableName: 'accounts',
    timestamps: false
});
