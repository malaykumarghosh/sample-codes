const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const { Account, Organisation } = require('../models');



/**
 * GET /api/v6/accounts/search-acc?q=...
 * Returns account id, name and associated organisation name where account.name having q (starts with q)
 */
exports.searchWithAccount = async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        const limit = Math.max(parseInt(req.query.limit || '50', 10), 1);

        if (!q) return res.status(400).json({ error: 'q query param is required' });

        const accounts = await Account.findAll({
            where: { name: { [Op.like]: `%${q}%` } },
            attributes: ['id', 'name'],
            include: [{
                model: Organisation,
                as: 'organisation',
                attributes: ['name'],
                required: false
            }],
            order: [['name', 'ASC']],
            limit
        });

        const data = accounts.map(a => ({
            id: a.id,
            name: a.name,
            organisation_name: a.organisation ? a.organisation.name : null
        }));

        return res.json({ data });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to search accounts', details: err.message });
    }
};

