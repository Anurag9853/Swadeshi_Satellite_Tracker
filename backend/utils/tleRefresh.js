const fetch = require('node-fetch');
const Satellite = require('../models/Satellite');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Parse TLE data from text format
const parseTleData = (text) => {
  const tleMap = new Map();
  const lines = text.trim().split('\n').filter(Boolean);
  
  for (let i = 0; i < lines.length; i += 3) {
    if (i + 2 >= lines.length) break;
    
    const name = lines[i].trim();
    const line1 = lines[i + 1].trim();
    const line2 = lines[i + 2].trim();
    
    // Extract NORAD ID from line 1 (characters 3-7)
    if (line1.length >= 7) {
      const noradId = parseInt(line1.substring(2, 7).trim(), 10);
      if (!isNaN(noradId)) {
        tleMap.set(noradId, { tle_line1: line1, tle_line2: line2 });
      }
    }
  }
  
  return tleMap;
};

// Fetch TLE data from a URL with retry logic
const fetchTleDataWithRetry = async (url, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        timeout: 30000, // 30 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const text = await response.text();
      return parseTleData(text);
    } catch (error) {
      console.warn(`Attempt ${attempt}/${maxRetries} failed for ${url}: ${error.message}`);
      if (attempt < maxRetries) {
        await sleep(2000 * attempt); // Exponential backoff
      } else {
        throw error;
      }
    }
  }
  return new Map();
};

// Fetch TLE for a single satellite by NORAD ID
const fetchTleForSatellite = async (noradId) => {
  const url = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${noradId}&FORMAT=TLE`;
  try {
    const response = await fetch(url, { timeout: 10000 });
    if (!response.ok) {
      throw new Error(`TLE fetch failed with status ${response.status}`);
    }
    const text = await response.text();
    const lines = text.trim().split('\n').filter(Boolean);
    if (lines.length < 3) {
      throw new Error('Unexpected TLE format');
    }
    return {
      tle_line1: lines[1],
      tle_line2: lines[2],
    };
  } catch (error) {
    throw new Error(`Failed to fetch TLE for NORAD ${noradId}: ${error.message}`);
  }
};

// Refresh TLE data from CelesTrak
const refreshTleData = async () => {
  console.log(`[TLE Refresh] Starting refresh at ${new Date().toISOString()}`);
  
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  try {
    // Try to fetch from active.txt first (new format)
    let tleMap = new Map();
    
    try {
      // Try the new API format first
      const activeUrl = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle';
      console.log('[TLE Refresh] Fetching from active satellites...');
      const activeMap = await fetchTleDataWithRetry(activeUrl);
      activeMap.forEach((value, key) => tleMap.set(key, value));
      console.log(`[TLE Refresh] Fetched ${activeMap.size} TLEs from active list`);
    } catch (error) {
      console.warn(`[TLE Refresh] Failed to fetch active.txt: ${error.message}`);
    }
    
    // Also try india.txt if available
    try {
      // Note: The new API doesn't have a direct "india" group, so we'll use individual fetches as fallback
      // For now, we'll use individual fetches for Indian satellites
    } catch (error) {
      console.warn(`[TLE Refresh] Failed to fetch india.txt: ${error.message}`);
    }
    
    // Get all satellites from database
    const satellites = await Satellite.find({
      tle_line1: { $exists: true, $ne: null, $ne: '' },
      tle_line2: { $exists: true, $ne: null, $ne: '' }
    });
    
    console.log(`[TLE Refresh] Processing ${satellites.length} satellites...`);
    
    // Update satellites with fetched TLEs
    for (const sat of satellites) {
      try {
        let updatedTle = null;
        
        // Try to get from bulk fetch first
        if (tleMap.has(sat.norad_id)) {
          updatedTle = tleMap.get(sat.norad_id);
        } else {
          // Fallback to individual fetch
          updatedTle = await fetchTleForSatellite(sat.norad_id);
          await sleep(500); // Be polite to CelesTrak
        }
        
        if (updatedTle && updatedTle.tle_line1 && updatedTle.tle_line2) {
          sat.tle_line1 = updatedTle.tle_line1;
          sat.tle_line2 = updatedTle.tle_line2;
          sat.tle_updated_at = new Date();
          await sat.save();
          updatedCount++;
        } else {
          skippedCount++;
          console.warn(`[TLE Refresh] Skipped ${sat.name} (NORAD ${sat.norad_id}): No TLE data found`);
        }
      } catch (error) {
        errorCount++;
        console.warn(`[TLE Refresh] Failed to refresh ${sat.name} (NORAD ${sat.norad_id}): ${error.message}`);
      }
    }
    
    console.log(`[TLE Refresh] Completed: Updated ${updatedCount} TLE entries, Skipped ${skippedCount} missing NORAD entries, Errors: ${errorCount}`);
  } catch (error) {
    console.error(`[TLE Refresh] Fatal error: ${error.message}`);
    throw error;
  }
};

// Schedule TLE refresh using node-cron
const scheduleTleRefresh = () => {
  const cron = require('node-cron');
  
  // Run immediately on startup
  console.log('[TLE Refresh] Running initial TLE refresh...');
  refreshTleData().catch((error) => {
    console.error('[TLE Refresh] Initial TLE refresh failed:', error.message);
  });
  
  // Schedule daily refresh at 02:00 IST
  const cronExpression = '0 2 * * *'; // 02:00 in timezone
  
  const job = cron.schedule(cronExpression, () => {
    console.log('[TLE Refresh] Scheduled daily refresh triggered');
    refreshTleData().catch((error) => {
      console.error('[TLE Refresh] Scheduled TLE refresh failed:', error.message);
    });
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata'
  });
  
  console.log('[TLE Refresh] Scheduled daily refresh at 02:00 IST');
  
  return job;
};

module.exports = {
  scheduleTleRefresh,
  refreshTleData,
  fetchTleForSatellite,
};
