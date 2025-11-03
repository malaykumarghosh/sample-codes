const express = require('express');
const router = express.Router();
const PdfController = require('../controllers/PdfController');

router.post('/generate', PdfController.generatePdf);

module.exports = router;