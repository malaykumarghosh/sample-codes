const Account = require('./Accounts');
const AccountContact = require('./AccountContacts');
const Invoice = require('./Invoices');
const InvoiceItem = require('./InvoiceItems');

// One-to-many
Account.hasMany(AccountContact, { foreignKey: 'account_id', as: 'contacts' });
AccountContact.belongsTo(Account, { foreignKey: 'account_id', as: 'account' });

// One-to-many: Invoice -> InvoiceItem
Invoice.hasMany(InvoiceItem, { foreignKey: 'invoice_id', as: 'items' });
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoice_id', as: 'invoice' });

module.exports = {
    Account,
    AccountContact,
    Invoice,
    InvoiceItem
};