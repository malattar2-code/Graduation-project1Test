// routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const { printReportPDF } = require('../../controller/dashbored/reportPrintController');

// الراوت المسؤول عن توليد PDF
router.get('/print-report', printReportPDF);

module.exports = router;
