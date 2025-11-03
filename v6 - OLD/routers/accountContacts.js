const express = require('express');
const router = express.Router();
const AccountContactsController = require('../controllers/AccountContactsController');

// Create contact (POST /api/v6/account-contacts)
router.post('/', AccountContactsController.create);


module.exports = router;