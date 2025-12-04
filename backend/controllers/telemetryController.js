const Satellite = require('../models/Satellite');
const tle = require('tle.js');
const SunCalc = require('suncalc');
const { getCurrentPosition } = require('../utils/tleHelper');

const findSatellite = async (identifier) => {
  if (!identifier) {
    return null;
  }

  if (typeof identifier === 'string' && identifier.match(/^[0-9a-fA-F]{24}$/)) {
    const byObjectId = await Satellite.findById(identifier);
    if (byObjectId) {
      return byObjectId;
    }
  }

  return Satellite.findOne({
    $or: [{ norad_id: Number(identifier) }, { name: identifier }],
  });
};

const buildTleString = (satellite) => {
  if (!satellite.tle_line1 || !satellite.tle_line2) {
    throw new Error(`Satellite ${satellite.name} is missing TLE data`);
  }
  return `${satellite.tle_line1.trim()}\n${satellite.tle_line2.trim()}`;
};

// Determine if satellite is in sunlight using SunCalc
const deriveSunlightPhase = (satellite, position) => {
  try {
    const sunPos = SunCalc.getPosition(new Date(), position.latitude, position.longitude);
    const sunAltitude = (sunPos.altitude * 180) / Math.PI;
    
    // Satellite is in sunlight if sun is above horizon from satellite's perspective
    // For simplicity, we check if sun altitude is positive (daytime on Earth below)
    // In reality, we'd need to check if satellite is above Earth's shadow
    // This is a simplified check
    return sunAltitude > -6 ? 'sunlight' : 'eclipse';
  } catch (error) {
    // Fallback: use position-based heuristic
    const bucket = Math.floor(Date.now() / (5 * 60 * 1000));
    const longitudeInfluence = Math.round(Math.abs(position?.longitude ?? 0));
    const inSunlight = (bucket + longitudeInfluence) % 2 === 0;
    return inSunlight ? 'sunlight' : 'eclipse';
  }
};

// Calculate solar panel efficiency based on sun angle
const calculateSolarPanelEfficiency = (satellite, position, sunlightPhase) => {
  if (sunlightPhase === 'eclipse') {
    return 0; // No sun, no power generation
  }
  
  try {
    const sunPos = SunCalc.getPosition(new Date(), position.latitude, position.longitude);
    const sunAltitude = (sunPos.altitude * 180) / Math.PI;
    
    // Map sun angle (0° to 90°) to efficiency (30% to 100%)
    // Sun at horizon (0°) = 30% efficiency
    // Sun at zenith (90°) = 100% efficiency
    const normalizedAngle = Math.max(0, Math.min(90, sunAltitude + 6)); // Adjust for -6° threshold
    const efficiency = 30 + (normalizedAngle / 90) * 70; // 30% to 100%
    
    return Math.round(efficiency);
  } catch (error) {
    // Fallback
    return 70;
  }
};

// Calculate communication status based on distance to India observer
const calculateCommStatus = (satellite, position) => {
  try {
    const tleString = buildTleString(satellite);
    const INDIA_LAT = 22.0;
    const INDIA_LON = 78.0;
    const INDIA_ALT = 0;
    
    const info = tle.getSatelliteInfo(
      tleString,
      new Date(),
      INDIA_LAT,
      INDIA_LON,
      INDIA_ALT
    );
    
    if (!info || typeof info.range !== 'number' || !isFinite(info.range)) {
      return 'Lost';
    }
    
    const rangeKm = info.range;
    
    if (rangeKm < 2000) {
      return 'OK';
    } else if (rangeKm < 5000) {
      return 'Weak';
    } else {
      return 'Lost';
    }
  } catch (error) {
    return 'Lost';
  }
};

// Build physics-based telemetry
const buildTelemetry = (satellite, position, sunlightPhase, previousBattery = 85) => {
  const inSunlight = sunlightPhase === 'sunlight';
  
  // Battery: increases in sunlight, decreases in eclipse
  let battery = previousBattery;
  if (inSunlight) {
    // Battery increases 0.1% to 0.5% per cycle
    const chargeRate = 0.1 + Math.random() * 0.4;
    battery = Math.min(100, battery + chargeRate);
  } else {
    // Battery decreases 0.2% to 0.8% per cycle
    const dischargeRate = 0.2 + Math.random() * 0.6;
    battery = Math.max(0, battery - dischargeRate);
  }
  
  // Solar panel efficiency based on sun angle
  const solarPanelEfficiency = calculateSolarPanelEfficiency(satellite, position, sunlightPhase);
  
  // Temperature: sunlight = +10°C to +50°C, eclipse = -120°C to -40°C
  const temperature = inSunlight
    ? 10 + Math.random() * 40  // +10°C to +50°C
    : -120 + Math.random() * 80; // -120°C to -40°C
  
  // Communication status based on distance
  const commStatus = calculateCommStatus(satellite, position);
  
  return {
    battery: Math.round(battery),
    solarPanelEfficiency,
    temperature: Math.round(temperature * 10) / 10,
    commStatus,
    sunlightPhase,
    generatedAt: new Date().toISOString(),
  };
};

const mapSatellite = (sat) => ({
  id: sat._id,
  name: sat.name,
  norad_id: sat.norad_id,
  mission: sat.mission,
  purpose: sat.purpose,
});

exports.getSatelliteTelemetry = async (req, res) => {
  try {
    const { id } = req.params;
    const satellite = await findSatellite(id);

    if (!satellite) {
      return res.status(404).json({ message: 'Satellite not found' });
    }

    if (!satellite.tle_line1 || !satellite.tle_line2) {
      return res.status(400).json({
        message: `Satellite ${satellite.name} is missing TLE data.`,
      });
    }

    const position = getCurrentPosition(satellite);
    const sunlightPhase = deriveSunlightPhase(satellite, position);
    
    // Get previous battery level from satellite state (if stored) or use default
    // For now, we'll use a default starting battery
    const previousBattery = 85; // Could be stored in satellite document
    const telemetry = buildTelemetry(satellite, position, sunlightPhase, previousBattery);

    res.json({
      satellite: mapSatellite(satellite),
      position,
      telemetry,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to generate telemetry',
      error: error.message,
    });
  }
};


