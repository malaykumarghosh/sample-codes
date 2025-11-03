const AccountContact = require('../models/AccountContacts');

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
