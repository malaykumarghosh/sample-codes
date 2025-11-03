const express = require('express');
const router = express.Router();
const AccountsController = require('../controllers/AccountsController');


// Search accounts with account name (GET /api/v6/accounts/search-acc?q=...)
router.get('/search-acc', AccountsController.searchWithAccount);


module.exports = router;