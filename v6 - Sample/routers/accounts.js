const express = require('express');
const router = express.Router();
const AccountsController = require('../controllers/AccountsController');

// List accounts (GET /api/v6/accounts)
router.get('/', AccountsController.index);

// Get single account (GET /api/v6/accounts/:id)
router.get('/:id(\\d+)', AccountsController.show);

// Get account with contacts (GET /api/v6/accounts/:id/contacts)
router.get('/:id(\\d+)/contacts', AccountsController.showWithContacts);

// Create account (POST /api/v6/accounts)
router.post('/', AccountsController.create);

// Update account (PUT /api/v6/accounts/:id)
router.put('/:id(\\d+)', AccountsController.update);

// Soft-delete account (DELETE /api/v6/accounts/:id)
router.delete('/:id(\\d+)', AccountsController.remove);

// Search accounts by name prefix using query param q (GET /api/v6/accounts/search?q=...)
router.get('/search', AccountsController.searchByNamePrefix);

module.exports = router;