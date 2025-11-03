const express = require('express');
const router = express.Router();

router.use('/accounts', require('./accounts'));
router.use('/account-contacts', require('./accountContacts'));

module.exports = router;