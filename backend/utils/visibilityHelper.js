const tle = require('tle.js');
const observers = require('./observers');
const indiaPolygon = require('../data/indiaPolygon.json');

const buildTleString = (satellite) => {
  if (!satellite.tle_line1 || !satellite.tle_line2) {
    throw new Error(`Satellite ${satellite.name} is missing TLE data`);
  }
  return `${satellite.tle_line1.trim()}\n${satellite.tle_line2.trim()}`;
};

/**
 * Get elevation angle for an observer at a specific location
 * @param {Object} satellite - Satellite object with TLE data
 * @param {Object} satellitePosition - Current satellite position {latitude, longitude, altitudeKm}
 * @param {number} observerLat - Observer latitude
 * @param {number} observerLon - Observer longitude
 * @param {number} observerAltitudeMeters - Observer altitude in meters (default: 0)
 * @returns {number} Elevation angle in degrees
 */
const getElevationForObserver = (satellite, satellitePosition, observerLat, observerLon, observerAltitudeMeters = 0) => {
  try {
    const tleString = buildTleString(satellite);
    const now = new Date();
    
    // Use tle.js to get satellite info from observer's perspective
    const info = tle.getSatelliteInfo(
      tleString,
      now,
      observerLat,
      observerLon,
      observerAltitudeMeters
    );
    
    if (info && typeof info.elevation === 'number' && isFinite(info.elevation)) {
      return info.elevation;
    }
    
    return -90; // Below horizon
  } catch (error) {
    console.warn(`Failed to compute elevation for ${satellite.name}:`, error.message);
    return -90;
  }
};

/**
 * Check if satellite is visible from any city observer
 * @param {Object} satellite - Satellite object with TLE data
 * @param {Object} satellitePosition - Current satellite position
 * @returns {Object} { visible: boolean, observer?: {name, lat, lon}, elevation?: number }
 */
const isVisibleFromAnyCity = (satellite, satellitePosition) => {
  for (const observer of observers) {
    const elevation = getElevationForObserver(
      satellite,
      satellitePosition,
      observer.lat,
      observer.lon,
      0
    );

    if (elevation > 0) {
      return {
        visible: true,
        observer: {
          name: observer.name,
          lat: observer.lat,
          lon: observer.lon,
        },
        elevation: elevation,
      };
    }
  }

  return { visible: false };
};

/**
 * Ray-casting algorithm to check if a point is inside a polygon
 * @param {Array<number>} point - [longitude, latitude]
 * @param {Object} polygon - GeoJSON Polygon object
 * @returns {boolean} True if point is inside polygon
 */
const pointInPolygon = (point, polygon) => {
  if (!polygon || !polygon.coordinates || polygon.coordinates.length === 0) {
    return false;
  }

  const [lon, lat] = point;
  const rings = polygon.coordinates; // Array of rings (first is outer, rest are holes)

  // Check if point is in any ring (for simple polygon, just check first ring)
  const ring = rings[0];
  if (!ring || ring.length < 3) {
    return false;
  }

  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];

    const intersect =
      yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
};

/**
 * Check if a point (lat, lon) is inside India polygon
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {boolean} True if point is inside India polygon
 */
const isPointInIndia = (lat, lon) => {
  if (typeof lat !== 'number' || typeof lon !== 'number' || !isFinite(lat) || !isFinite(lon)) {
    return false;
  }

  // GeoJSON uses [lon, lat] format
  const point = [lon, lat];
  return pointInPolygon(point, indiaPolygon);
};

/**
 * Get next visible pass for a satellite
 * @param {Object} satellite - Satellite object with TLE data
 * @param {number} lookaheadMinutes - How many minutes ahead to search (default: 60)
 * @param {number} stepSeconds - Step size in seconds for scanning (default: 30)
 * @returns {Object|null} Pass info or null if no pass found
 */
const getNextPass = (satellite, lookaheadMinutes = 60, stepSeconds = 30) => {
  try {
    const tleString = buildTleString(satellite);
    const now = new Date();
    const lookaheadMs = lookaheadMinutes * 60 * 1000;
    const stepMs = stepSeconds * 1000;
    const maxSteps = Math.floor(lookaheadMs / stepMs);

    let passStart = null;
    let passEnd = null;
    let maxElevation = -90;
    let bestObserver = null;
    let currentElevation = -90;

    // Check all observers to find the best pass
    for (let step = 0; step <= maxSteps; step++) {
      const timestamp = new Date(now.getTime() + step * stepMs);

      // Check each observer
      let stepMaxElevation = -90;
      let stepBestObserver = null;

      for (const observer of observers) {
        try {
          const info = tle.getSatelliteInfo(
            tleString,
            timestamp,
            observer.lat,
            observer.lon,
            0
          );

          if (info && typeof info.elevation === 'number' && isFinite(info.elevation)) {
            if (info.elevation > stepMaxElevation) {
              stepMaxElevation = info.elevation;
              stepBestObserver = {
                name: observer.name,
                lat: observer.lat,
                lon: observer.lon,
              };
            }
          }
        } catch (err) {
          // Skip this observer for this timestamp
          continue;
        }
      }

      // Also check India center
      try {
        const centerInfo = tle.getSatelliteInfo(tleString, timestamp, 22.0, 78.0, 0);
        if (centerInfo && typeof centerInfo.elevation === 'number' && isFinite(centerInfo.elevation)) {
          if (centerInfo.elevation > stepMaxElevation) {
            stepMaxElevation = centerInfo.elevation;
            stepBestObserver = {
              name: 'India Center',
              lat: 22.0,
              lon: 78.0,
            };
          }
        }
      } catch (err) {
        // Skip center check for this timestamp
      }

      if (stepMaxElevation > 0) {
        // Satellite is above horizon
        if (!passStart) {
          passStart = timestamp;
        }
        passEnd = timestamp;
        if (stepMaxElevation > maxElevation) {
          maxElevation = stepMaxElevation;
          bestObserver = stepBestObserver;
        }
      } else if (passStart) {
        // Pass ended
        break;
      }
    }

    if (!passStart || !passEnd || maxElevation <= 0) {
      return null;
    }

    const durationSeconds = Math.round((passEnd - passStart) / 1000);

    return {
      startTime: passStart.toISOString(),
      endTime: passEnd.toISOString(),
      maxElevationDeg: Math.round(maxElevation * 100) / 100,
      durationSeconds: durationSeconds,
      bestObserver: bestObserver,
    };
  } catch (error) {
    console.warn(`Failed to compute next pass for ${satellite.name}:`, error.message);
    return null;
  }
};

/**
 * Check if satellite is visible from India
 * Uses hybrid model: elevation-based OR city observers OR polygon containment
 * @param {Object} satellite - Satellite object with TLE data
 * @param {Object} satellitePosition - Current satellite position
 * @returns {Object} { visible: boolean, details: {...} }
 */
const isVisibleFromIndia = (satellite, satellitePosition) => {
  const INDIA_CENTER_LAT = 22.0;
  const INDIA_CENTER_LON = 78.0;
  const INDIA_CENTER_ALT = 0;

  // 1. Elevation-based visibility from India center
  const centerElevation = getElevationForObserver(
    satellite,
    satellitePosition,
    INDIA_CENTER_LAT,
    INDIA_CENTER_LON,
    INDIA_CENTER_ALT
  );

  const elevationVisible = centerElevation > 0;

  // 2. Any city observer visibility
  const anyCity = isVisibleFromAnyCity(satellite, satellitePosition);
  const cityVisible = anyCity.visible; // boolean

  // 3. Polygon containment
  const inIndiaPolygon = isPointInIndia(
    satellitePosition.latitude,
    satellitePosition.longitude
  );

  // Final hybrid boolean
  const visible = elevationVisible || cityVisible || inIndiaPolygon;

  return {
    visible,
    details: {
      elevationVisible,
      centerElevation,
      cityVisible,
      city: anyCity.observer || null,
      inIndiaPolygon,
    },
  };
};

module.exports = {
  getElevationForObserver,
  isVisibleFromAnyCity,
  pointInPolygon,
  isPointInIndia,
  getNextPass,
  isVisibleFromIndia,
};

