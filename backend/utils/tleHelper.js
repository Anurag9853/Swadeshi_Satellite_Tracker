const tle = require('tle.js');
const SunCalc = require('suncalc');

const STEP_SECONDS = 30;
const LOOKAHEAD_HOURS = 6;

const buildTleString = (satellite) => {
  if (!satellite.tle_line1 || !satellite.tle_line2) {
    throw new Error(`Satellite ${satellite.name} is missing TLE data`);
  }
  return `${satellite.tle_line1.trim()}\n${satellite.tle_line2.trim()}`;
};

const getSolarPhase = (lat, lon, timestamp) => {
  const sunPos = SunCalc.getPosition(timestamp, lat, lon);
  const altitudeDeg = (sunPos.altitude * 180) / Math.PI;
  return altitudeDeg > -6 ? 'Daylight' : 'Night';
};

const computeNextPass = (satellite, lat, lon) => {
  const tleString = buildTleString(satellite);
  const now = new Date();
  const totalSteps = Math.floor(
    (LOOKAHEAD_HOURS * 3600) / STEP_SECONDS
  );

  let passStart = null;
  let passEnd = null;
  let maxElevation = -90;

  for (let i = 0; i <= totalSteps; i += 1) {
    const ts = new Date(now.getTime() + i * STEP_SECONDS * 1000);
    const info = tle.getSatelliteInfo(tleString, ts, lat, lon, 0);

    if (info.elevation > 0) {
      if (!passStart) {
        passStart = ts;
      }
      passEnd = ts;
      if (info.elevation > maxElevation) {
        maxElevation = info.elevation;
      }
    } else if (passStart) {
      break;
    }
  }

  if (!passStart || !passEnd) {
    return null;
  }

  return {
    startTime: passStart,
    endTime: passEnd,
    durationSeconds: (passEnd - passStart) / 1000,
    maxElevation,
    dayNight: getSolarPhase(lat, lon, passStart),
  };
};

const getCurrentPosition = (satellite) => {
  try {
    const tleString = buildTleString(satellite);
    const now = new Date();
    
    // Get lat/lng from getLatLngObj
    const coords = tle.getLatLngObj(tleString, now);

    if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
      throw new Error('Invalid TLE data: unable to compute position');
    }

    // Handle NaN or Infinity values
    if (!isFinite(coords.lat) || !isFinite(coords.lng)) {
      throw new Error('TLE produced invalid coordinates (NaN or Infinity)');
    }

    // Get altitude using getSatelliteInfo with observer at center of Earth (0,0,0)
    // This gives us the height above Earth's surface in km directly
    let altitudeKm = 0;
    try {
      const centerInfo = tle.getSatelliteInfo(tleString, now, 0, 0, 0);
      if (centerInfo && typeof centerInfo.height === 'number' && isFinite(centerInfo.height) && centerInfo.height > 0) {
        altitudeKm = centerInfo.height;
      } else if (centerInfo && typeof centerInfo.range === 'number' && isFinite(centerInfo.range)) {
        // Fallback: range from center minus Earth radius (~6371 km)
        altitudeKm = Math.max(0, centerInfo.range - 6371);
      }
    } catch (altError) {
      // If altitude calculation fails, altitude remains 0
      console.warn(`Could not calculate altitude for ${satellite.name}:`, altError.message);
    }

    // Altitude sanity check
    if (isNaN(altitudeKm) || altitudeKm < 100 || altitudeKm > 2000) {
      const errorMsg = `Invalid altitude from TLE — TLE likely stale or corrupt. Altitude: ${altitudeKm} km`;
      console.warn(`[${satellite.name}] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    return {
      latitude: coords.lat,
      longitude: coords.lng,
      altitudeKm: Math.round(altitudeKm * 100) / 100, // Round to 2 decimal places
      timestamp: now.toISOString(),
    };
  } catch (error) {
    throw new Error(`Failed to get position for ${satellite.name}: ${error.message}`);
  }
};

const getOrbitTrack = (satellite) => {
  try {
    // Skip orbit track for Lagrange point satellites (they don't orbit Earth)
    if (satellite.name.includes('Aditya') || satellite.name.includes('L1')) {
      return [];
    }

    const tleString = buildTleString(satellite);
    const now = new Date();
    const track = [];
    
    // Generate orbit track by sampling positions over one orbit period (~100 minutes)
    // Sample every 60 seconds for one complete orbit
    const stepSeconds = 60;
    const orbitPeriodMinutes = 100; // Approximate orbit period for LEO satellites
    const maxPoints = Math.floor((orbitPeriodMinutes * 60) / stepSeconds);
    
    let prevLon = null;
    
    for (let i = 0; i < maxPoints; i++) {
      const timestamp = new Date(now.getTime() + i * stepSeconds * 1000);
      try {
        const coords = tle.getLatLngObj(tleString, timestamp);
        if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number' && 
            isFinite(coords.lat) && isFinite(coords.lng)) {
          
          let longitude = coords.lng;
          
          // Normalize longitude across anti-meridian
          if (prevLon !== null) {
            const lonDiff = longitude - prevLon;
            if (Math.abs(lonDiff) > 180) {
              // Crossed anti-meridian, adjust by ±360
              if (lonDiff > 180) {
                longitude -= 360;
              } else if (lonDiff < -180) {
                longitude += 360;
              }
            }
          }
          
          track.push({
            latitude: coords.lat,
            longitude: longitude,
          });
          
          prevLon = longitude;
        }
      } catch (pointError) {
        // Skip invalid points
        continue;
      }
    }

    return track;
  } catch (error) {
    console.error(`Failed to get orbit track for ${satellite.name}:`, error.message);
    return [];
  }
};

module.exports = {
  computeNextPass,
  getCurrentPosition,
  getOrbitTrack,
};

