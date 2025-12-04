const express = require('express');
const { getSatelliteTelemetry } = require('../controllers/telemetryController');

const router = express.Router();

router.get('/:id', getSatelliteTelemetry);

module.exports = router;


