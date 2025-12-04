const fetch = require('node-fetch');
const Satellite = require('../models/Satellite');
const {
  computeNextPass,
  getCurrentPosition,
  getOrbitTrack,
} = require('../utils/tleHelper');
const { isVisibleFromIndia, getNextPass } = require('../utils/visibilityHelper');

// Position cache: 5-second cache
const positionCache = new Map();
const CACHE_TTL_MS = 5000; // 5 seconds

const buildSatelliteResponse = (satellite) => {
  const now = new Date();
  const tleUpdatedAt = satellite.tle_updated_at || satellite.createdAt || now;
  const tleAgeMs = now - tleUpdatedAt;
  const tleAgeHours = tleAgeMs / (1000 * 60 * 60);
  const isStale = tleAgeHours > 168; // 7 days
  
  return {
    id: satellite._id,
    name: satellite.name,
    norad_id: satellite.norad_id,
    mission: satellite.mission,
    purpose: satellite.purpose,
    launch_year: satellite.launch_year,
    image_url: satellite.image_url,
    tle_age_hours: Math.round(tleAgeHours * 100) / 100,
    tle_status: isStale ? 'stale' : 'fresh',
  };
};

const getVisibilityFromWeather = (data) => {
  const clouds = data?.clouds?.all ?? 50;
  const visibilityMeters = data?.visibility ?? 8000;
  const precipitation =
    (data?.rain?.['1h'] ?? 0) + (data?.snow?.['1h'] ?? 0);

  if (clouds < 30 && visibilityMeters > 8000 && precipitation === 0) {
    return 'Good';
  }

  if (clouds < 60 && visibilityMeters > 4000) {
    return 'Average';
  }

  return 'Poor';
};

const fetchWeather = async (lat, lon) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  
  if (!apiKey || apiKey === 'your_api_here' || apiKey.trim() === '') {
    console.warn('OpenWeather API key not configured or using placeholder');
    console.warn('API Key value:', apiKey ? `${apiKey.substring(0, 4)}...` : 'undefined');
    return {
      visibilityScore: 'Average',
      source: 'OpenWeather API key not configured',
      temperature: null,
      raw: null,
    };
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Weather API error (${response.status}):`, errorText);
      throw new Error(`Weather API responded with ${response.status}: ${errorText.substring(0, 100)}`);
    }
    const payload = await response.json();

    return {
      visibilityScore: getVisibilityFromWeather(payload),
      source: 'OpenWeather',
      temperature: payload.main?.temp ? Math.round(payload.main.temp) : null,
      raw: payload,
    };
  } catch (error) {
    console.error('Weather fetch failed:', error.message);
    return {
      visibilityScore: 'Average',
      source: `Weather service unavailable: ${error.message}`,
      temperature: null,
      raw: null,
    };
  }
};

const findSatellite = async (satelliteId) => {
  if (!satelliteId) return null;

  if (
    typeof satelliteId === 'string' &&
    satelliteId.match(/^[0-9a-fA-F]{24}$/)
  ) {
    const sat = await Satellite.findById(satelliteId);
    if (sat) return sat;
  }

  return Satellite.findOne({
    $or: [{ norad_id: Number(satelliteId) }, { name: satelliteId }],
  });
};

exports.predictSatellitePass = async (req, res) => {
  try {
    const { lat, lon, satelliteId } = req.body;
    if (
      typeof lat !== 'number' ||
      typeof lon !== 'number' ||
      Number.isNaN(lat) ||
      Number.isNaN(lon)
    ) {
      return res.status(400).json({ message: 'Invalid coordinates' });
    }

    const satellite = await findSatellite(satelliteId);

    if (!satellite) {
      return res.status(404).json({ message: 'Satellite not found' });
    }

    // Validate TLE data exists
    if (!satellite.tle_line1 || !satellite.tle_line2) {
      return res.status(400).json({ message: 'Satellite missing TLE' });
    }

    const pass = computeNextPass(satellite, lat, lon);

    if (!pass) {
      return res
        .status(404)
        .json({ message: 'No pass predicted in the next few hours' });
    }

    const weather = await fetchWeather(lat, lon);

    res.json({
      satellite: buildSatelliteResponse(satellite),
      location: { lat, lon },
      prediction: {
        startTime: pass.startTime,
        endTime: pass.endTime,
        durationSeconds: pass.durationSeconds,
        durationMinutes: +(pass.durationSeconds / 60).toFixed(2),
        maxElevation: +pass.maxElevation.toFixed(2),
        dayNight: pass.dayNight,
        visibilityScore: weather.visibilityScore,
      },
      weather,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ message: 'Prediction failed', error: error.message });
  }
};

exports.getRealtimePosition = async (req, res) => {
  try {
    const { satId } = req.params;
    const satellite = await findSatellite(satId);

    if (!satellite) {
      return res.status(404).json({ message: 'Satellite not found' });
    }

    // Validate TLE data exists
    if (!satellite.tle_line1 || !satellite.tle_line2) {
      return res.status(400).json({
        message: `Satellite ${satellite.name} is missing TLE data. Please wait for TLE refresh or check database.`,
      });
    }

    // Check cache
    const cacheKey = satellite._id.toString();
    const cached = positionCache.get(cacheKey);
    const now = new Date();
    
    if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
      // Return cached response
      return res.json({
        ...cached.response,
        timestamp: now.toISOString(),
        cached: true,
      });
    }

    // Compute fresh position
    const position = getCurrentPosition(satellite);
    const orbitPath = getOrbitTrack(satellite);
    const visResult = isVisibleFromIndia(satellite, position);
    // visResult => { visible: boolean, details: { ... } }
    const isVisible = visResult.visible;

    // Check for lookaheadMinutes query parameter
    const lookaheadMinutes = req.query.lookaheadMinutes
      ? parseInt(req.query.lookaheadMinutes, 10)
      : null;

    let nextPass = null;
    if (lookaheadMinutes !== null && !isNaN(lookaheadMinutes) && lookaheadMinutes > 0) {
      try {
        nextPass = getNextPass(satellite, lookaheadMinutes, 30);
      } catch (error) {
        console.warn(`Failed to compute next pass for ${satellite.name}:`, error.message);
        nextPass = null;
      }
    }

    const response = {
      satellite: buildSatelliteResponse(satellite),
      currentPosition: position,
      orbitPath,
      is_visible_from_india: isVisible,
      visibility_details: visResult.details,
      timestamp: now.toISOString(),
      cached: false,
    };

    // Only include next_pass if it was computed
    if (nextPass !== null) {
      response.next_pass = nextPass;
    }

    // Update cache
    positionCache.set(cacheKey, {
      timestamp: now,
      response,
    });

    res.json(response);
  } catch (error) {
    console.error('Error in getRealtimePosition:', error);
    
    // Check if it's an altitude sanity check error
    if (error.message && error.message.includes('Invalid altitude from TLE')) {
      return res.status(400).json({
        message: error.message,
      });
    }
    
    res.status(500).json({
      message: 'Failed to fetch satellite position',
      error: error.message,
    });
  }
};

