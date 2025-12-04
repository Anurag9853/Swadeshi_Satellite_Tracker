const express = require('express');
const {
  getSatellites,
  getSatelliteDetails,
} = require('../controllers/satelliteController');

const router = express.Router();

router.get('/', getSatellites);
router.get('/:id', getSatelliteDetails);

module.exports = router;

