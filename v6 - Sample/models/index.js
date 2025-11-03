const Account = require('./Accounts');
const AccountContact = require('./AccountContacts');

// One-to-many
Account.hasMany(AccountContact, { foreignKey: 'account_id', as: 'contacts' });
AccountContact.belongsTo(Account, { foreignKey: 'account_id', as: 'account' });

module.exports = {
    Account,
    AccountContact
};