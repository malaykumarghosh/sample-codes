const express = require('express');
const router = express.Router();
const AccountContactsController = require('../controllers/AccountContactsController');

// List contacts (GET /api/v6/account-contacts)
router.get('/', AccountContactsController.index);

// Get single contact (GET /api/v6/account-contacts/:id)
router.get('/:id(\\d+)', AccountContactsController.show);

// Create contact (POST /api/v6/account-contacts)
router.post('/', AccountContactsController.create);

// Update contact (PUT /api/v6/account-contacts/:id)
router.put('/:id(\\d+)', AccountContactsController.update);

// Soft-delete contact (DELETE /api/v6/account-contacts/:id)
router.delete('/:id(\\d+)', AccountContactsController.remove);

module.exports = router;