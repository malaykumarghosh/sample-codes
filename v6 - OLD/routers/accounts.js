const express = require('express');
const router = express.Router();
const AccountsController = require('../controllers/AccountsController');

// Get account with contacts (GET /api/v6/accounts/:id/contacts)
router.get('/:id(\\d+)/contacts', AccountsController.showWithContacts);

// Create account (POST /api/v6/accounts)
router.post('/', AccountsController.create);

// Search accounts by name prefix using query param q (GET /api/v6/accounts/search?q=...)
router.get('/search', AccountsController.searchByNamePrefix);

module.exports = router;