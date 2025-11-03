const AccountContact = require('../models/AccountContacts');

/**
 * GET /account-contacts
 * List contacts with pagination and optional is_active filter and account_id filter
 */
exports.index = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page || '1', 10), 1);
        const limit = Math.max(parseInt(req.query.limit || '20', 10), 1);
        const offset = (page - 1) * limit;

        const where = {};
        if (req.query.is_active) where.is_active = req.query.is_active; // 'Y' or 'N'
        if (req.query.account_id) where.account_id = parseInt(req.query.account_id, 10);

        const { count, rows } = await AccountContact.findAndCountAll({
            where,
            limit,
            offset,
            order: [['id', 'DESC']]
        });

        return res.json({ data: rows, meta: { total: count, page, limit } });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch contacts', details: err.message });
    }
};

/**
 * GET /account-contacts/:id
 */
exports.show = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const contact = await AccountContact.findByPk(id);
        if (!contact) return res.status(404).json({ error: 'Contact not found' });
        return res.json({ data: contact });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch contact', details: err.message });
    }
};

/**
 * POST /account-contacts
 */
exports.create = async (req, res) => {
    try {
        const { account_id, contact_type, name, email, phone, is_active } = req.body;
        if (!account_id) return res.status(400).json({ error: 'account_id is required' });
        if (!name) return res.status(400).json({ error: 'name is required' });

        const contact = await AccountContact.create({
            account_id,
            contact_type: contact_type === 'P' ? 'P' : 'S',
            name,
            email: email || null,
            phone: phone || null,
            is_active: is_active === 'Y' ? 'Y' : 'N',
            created: new Date()
        });

        return res.status(201).json({ data: contact });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to create contact', details: err.message });
    }
};

/**
 * PUT /account-contacts/:id
 */
exports.update = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const contact = await AccountContact.findByPk(id);
        if (!contact) return res.status(404).json({ error: 'Contact not found' });

        const { account_id, contact_type, name, email, phone, is_active } = req.body;

        await contact.update({
            account_id: account_id !== undefined ? account_id : contact.account_id,
            contact_type: contact_type !== undefined ? (contact_type === 'P' ? 'P' : 'S') : contact.contact_type,
            name: name !== undefined ? name : contact.name,
            email: email !== undefined ? email : contact.email,
            phone: phone !== undefined ? phone : contact.phone,
            is_active: is_active !== undefined ? (is_active === 'Y' ? 'Y' : 'N') : contact.is_active,
            modified: new Date()
        });

        return res.json({ data: contact });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to update contact', details: err.message });
    }
};

/**
 * DELETE /account-contacts/:id
 * Soft delete: set is_active = 'N'
 */
exports.remove = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const contact = await AccountContact.findByPk(id);
        if (!contact) return res.status(404).json({ error: 'Contact not found' });

        await contact.update({ is_active: 'N', modified: new Date() });
        return res.json({ message: 'Contact deactivated' });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to delete contact', details: err.message });
    }
};