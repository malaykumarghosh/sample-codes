const express = require('express');
const router = express.Router();

router.use('/accounts', require('./accounts'));

router.use('/pdf', require('./pdf'));

module.exports = router;