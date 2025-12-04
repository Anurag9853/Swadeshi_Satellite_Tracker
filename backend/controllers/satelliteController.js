const Satellite = require('../models/Satellite');

const mapSatellite = (sat) => {
  const now = new Date();
  const tleUpdatedAt = sat.tle_updated_at || sat.createdAt || now;
  const tleAgeMs = now - tleUpdatedAt;
  const tleAgeHours = tleAgeMs / (1000 * 60 * 60);
  const isStale = tleAgeHours > 168; // 7 days
  
  return {
    id: sat._id,
    name: sat.name,
    norad_id: sat.norad_id,
    mission: sat.mission,
    purpose: sat.purpose,
    launch_year: sat.launch_year,
    image_url: sat.image_url,
    tle_age_hours: Math.round(tleAgeHours * 100) / 100,
    tle_status: isStale ? 'stale' : 'fresh',
  };
};

exports.getSatellites = async (_req, res) => {
  try {
    // Only return satellites with valid TLE data
    const satellites = await Satellite.find({
      tle_line1: { $exists: true, $ne: null, $ne: '' },
      tle_line2: { $exists: true, $ne: null, $ne: '' }
    }).sort({ name: 1 });
    // Return array format for backward compatibility
    const result = satellites.map(mapSatellite);
    // Add timestamp to each satellite for frontend use
    result.forEach(sat => {
      sat.timestamp = new Date().toISOString();
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch satellites', error: error.message });
  }
};

exports.getSatelliteDetails = async (req, res) => {
  try {
    const { id } = req.params;
    let satellite = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      satellite = await Satellite.findById(id);
    }

    if (!satellite) {
      satellite = await Satellite.findOne({ norad_id: Number(id) });
    }

    if (!satellite) {
      return res.status(404).json({ message: 'Satellite not found' });
    }

    res.json({
      ...mapSatellite(satellite),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load satellite', error: error.message });
  }
};

