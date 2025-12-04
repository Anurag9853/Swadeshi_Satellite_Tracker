const mongoose = require('mongoose');

const satelliteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    norad_id: { type: Number, required: true, unique: true },
    mission: String,
    purpose: String,
    launch_year: Number,
    image_url: String,
    tle_line1: { type: String, required: true },
    tle_line2: { type: String, required: true },
    tle_updated_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Satellite', satelliteSchema);

