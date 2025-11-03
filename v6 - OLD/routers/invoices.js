const express = require('express');
const router = express.Router();
const InvoicesController = require('../controllers/InvoicesController');

// Create invoice with items
router.post('/', InvoicesController.create);

module.exports = router;