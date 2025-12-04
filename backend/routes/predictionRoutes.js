const express = require('express');
const {
  predictSatellitePass,
  getRealtimePosition,
} = require('../controllers/predictionController');

const router = express.Router();

router.post('/predict', predictSatellitePass);
router.get('/position/:satId', getRealtimePosition);

module.exports = router;

