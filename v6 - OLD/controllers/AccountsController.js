const Sequelize = require('sequelize');
const Op = Sequelize.Op;

/// Import from that index in controllers and routes (do NOT require individual model files elsewhere) 
const { Account, AccountContact } = require('../models');

/// console.log('Account.associations =', Object.keys(Account.associations)); // should include 'contacts'
/// console.log('AccountContact.associations =', Object.keys(AccountContact.associations)); // should include 'account'

/**
 * GET /accounts/:id/contacts
 * Get account contacts
 */
exports.showWithContacts = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const account = await Account.findByPk(id, {
            include: [{ model: AccountContact, as: 'contacts' }]
        });
        if (!account) return res.status(404).json({ error: 'Account not found' });
        return res.json({ data: account });
    } catch (err) {
        return res.status(500).json({ error: 'Failed', details: err.message });
    }
};

/**
 * POST /accounts
 * Create new account
 */
exports.create = async (req, res) => {
    try {
        const { name, description, address, is_active } = req.body;
        if (!name) return res.status(400).json({ error: 'name is required' });

        const account = await Account.create({
            name,
            description: description || null,
            address: address || null,
            is_active: is_active === 'Y' ? 'Y' : 'N',
            created: new Date()
        });

        return res.status(201).json({ data: account });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to create account', details: err.message });
    }
};

/**
 * GET /api/v6/accounts/search?q=...
 * Return account name, description, address and 'P' type contact email
 * - query param q : match accounts where name starts with this value
 * - optional query param limit to restrict results
 */
exports.searchByNamePrefix = async (req, res) => {
    try {
        const q = req.query.qs || '';
        const limit = Math.max(parseInt(req.query.limit || '100', 10), 1);

        const accounts = await Account.findAll({
            where: {
                name: { [Op.like]: `${q}%` }
            },
            attributes: ['id', 'name', 'description', 'address'],
            include: [{
                model: AccountContact,
                as: 'contacts',
                attributes: ['email'],
                where: { contact_type: 'P' },
                required: false
            }],
            order: [['name', 'ASC']],
            limit,
            benchmark: true, // returns timing to logging fn
            logging: (sql, timing) => console.log('[SEQUELIZE]', sql, timing ? `${timing}ms` : '')
        });

        const data = accounts.map(a => {
            const contactEmail = (a.contacts && a.contacts.length) ? a.contacts[0].email : null;
            return {
                id: a.id,
                name: a.name,
                description: a.description,
                address: a.address,
                contact_email: contactEmail
            };
        });

        return res.json({ data });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to search accounts', details: err.message });
    }
};