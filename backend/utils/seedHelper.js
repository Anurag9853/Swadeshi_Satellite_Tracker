const Satellite = require('../models/Satellite');
const satelliteData = require('../data/isroSatellites');

const ensureSeedData = async () => {
  // Get all NORAD IDs from the real satellite data
  const validNoradIds = new Set(satelliteData.map(sat => sat.norad_id));
  
  // Delete obsolete/dummy satellites that are not in the real dataset
  const deleteResult = await Satellite.deleteMany({
    norad_id: { $nin: Array.from(validNoradIds) }
  });
  
  if (deleteResult.deletedCount > 0) {
    console.log(`Deleted ${deleteResult.deletedCount} obsolete/dummy satellites`);
  }
  
  // Insert or update real satellites
  let inserted = 0;
  let updated = 0;
  
  for (const sat of satelliteData) {
    // Validate TLE data exists
    if (!sat.tle_line1 || !sat.tle_line2) {
      console.warn(`Warning: Satellite ${sat.name} (NORAD ${sat.norad_id}) is missing TLE data`);
      continue;
    }
    
    const existing = await Satellite.findOne({ norad_id: sat.norad_id });
    const result = await Satellite.findOneAndUpdate(
      { norad_id: sat.norad_id },
      {
        name: sat.name,
        norad_id: sat.norad_id,
        mission: sat.mission,
        purpose: sat.purpose,
        launch_year: sat.launch_year,
        image_url: sat.image_url,
        tle_line1: sat.tle_line1,
        tle_line2: sat.tle_line2,
        tle_updated_at: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    
    if (result) {
      if (existing) {
        updated += 1;
      } else {
        inserted += 1;
      }
    }
  }
  
  console.log(`Seeded ISRO satellites: ${inserted} inserted, ${updated} updated`);
};

module.exports = { ensureSeedData };

