const Organisation = require('./Organisations');
const Account = require('./Accounts');
const Customer = require('./Customers');

// One-to-many: Organisation -> Account
Organisation.hasMany(Account, { foreignKey: 'org_id', as: 'accounts' });
Account.belongsTo(Organisation, { foreignKey: 'org_id', as: 'organisation' });

// One-to-many: Account -> Customer
Account.hasMany(Customer, { foreignKey: 'account_id', as: 'customers' });
Customer.belongsTo(Account, { foreignKey: 'account_id', as: 'account' });


module.exports = {
    Organisation,
    Account,
    Customer
};