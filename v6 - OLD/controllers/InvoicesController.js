const { Invoice, InvoiceItem } = require('../models');
const sequelize = require('../../../database/connection');

exports.create = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const {
            org_id = 0,
            account_id,
            type,
            ref_no,
            inv_date,
            inv_title,
            to_name,
            to_address,
            tax_rate,
            items = []
        } = req.body;

        if (!account_id) {
            await t.rollback();
            return res.status(400).json({ error: 'account_id is required' });
        }

        const invoiceData = {
            org_id,
            account_id,
            type: type || null,
            ref_no: ref_no || null,
            inv_date: inv_date || null,
            inv_title: inv_title || null,
            to_name: to_name || null,
            to_address: to_address || null,
            tax_rate: tax_rate !== undefined ? tax_rate : null,
            created: new Date()
        };

        const invoice = await Invoice.create(invoiceData, { transaction: t });

        const itemsData = (Array.isArray(items) ? items : []).map(i => ({
            invoice_id: invoice.id,
            item_desc: i.item_desc || null,
            qty: i.qty !== undefined ? i.qty : null,
            rate: i.rate !== undefined ? i.rate : null,
            created: new Date()
        }));

        if (itemsData.length) {
            await InvoiceItem.bulkCreate(itemsData, { transaction: t });
        }

        await t.commit();

        // return invoice with its items
        const saved = await Invoice.findByPk(invoice.id, {
            include: [{ model: InvoiceItem, as: 'items' }]
        });

        return res.status(201).json({ data: saved });
    } catch (err) {
        await t.rollback();
        return res.status(500).json({ error: 'Failed to save invoice', details: err.message });
    }
};