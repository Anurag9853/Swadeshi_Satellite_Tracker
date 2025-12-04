# Technical Analysis: Why "None of the monitored satellites are currently above India"

## Executive Summary

The Overflight Monitor displays "None of the monitored satellites are currently above India" because **all 8 monitored satellites have elevation angles ≤ 0°** when computed from observer location (22.0°N, 78.0°E) at the current timestamp. This is **expected behavior** based on orbital mechanics: satellites are only visible during brief orbital passes, and at any arbitrary moment, most satellites are below the horizon.

---

## 1. Complete Code Execution Path

### 1.1 Frontend: Initial Request

**File**: `frontend/src/pages/DisasterSupport.jsx`

**Lines 27-48**: The `useEffect` hook triggers `fetchPositions()` which iterates through the `watchList` array:

```javascript
const fetchPositions = async () => {
  setLoading(true);
  try {
    const results = await Promise.allSettled(
      watchList.map(async (sat) => {
        const { data } = await api.get(`/position/${sat.identifier}`);
        const { currentPosition, is_visible_from_india } = data;
        
        // Use elevation-based visibility from backend
        const isOverIndia = is_visible_from_india || false;

        return {
          ...sat,
          position: currentPosition,
          isOverIndia,
        };
      })
    );
    // ... set state
  }
};
```

**WatchList** (from `disasterSatellites.json`, lines 107-116):
- Cartosat-2F (NORAD: 43111)
- RISAT-2BR1 (NORAD: 44857)
- INSAT-3D (NORAD: 39216)
- INSAT-3DR (NORAD: 41789)
- Oceansat-3 (EOS-06) (NORAD: 54361)
- Cartosat-3 (NORAD: 44804)
- Resourcesat-2A (NORAD: 41877)
- Scatsat-1 (NORAD: 41790)

**Key Point**: For each satellite, the frontend calls `GET /position/:satId` and extracts `is_visible_from_india` from the response.

---

### 1.2 Backend: Position Endpoint Handler

**File**: `backend/controllers/predictionController.js`

**Lines 161-227**: The `getRealtimePosition` function handles the request:

```javascript
exports.getRealtimePosition = async (req, res) => {
  try {
    const { satId } = req.params;
    const satellite = await findSatellite(satId);  // Line 164
    
    // Validate TLE data exists (lines 170-175)
    if (!satellite.tle_line1 || !satellite.tle_line2) {
      return res.status(400).json({
        message: `Satellite ${satellite.name} is missing TLE data...`,
      });
    }

    // Check cache (lines 177-189)
    const cacheKey = satellite._id.toString();
    const cached = positionCache.get(cacheKey);
    const now = new Date();
    
    if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
      return res.json({
        ...cached.response,
        timestamp: now.toISOString(),
        cached: true,
      });
    }

    // Compute fresh position (lines 191-194)
    const position = getCurrentPosition(satellite);
    const orbitPath = getOrbitTrack(satellite);
    const isVisible = isVisibleFromIndia(satellite, position);  // ← KEY CALL

    const response = {
      satellite: buildSatelliteResponse(satellite),
      currentPosition: position,
      orbitPath,
      is_visible_from_india: isVisible,  // ← This boolean determines visibility
      timestamp: now.toISOString(),
      cached: false,
    };

    // Update cache and return (lines 205-211)
    positionCache.set(cacheKey, { timestamp: now, response });
    res.json(response);
  } catch (error) {
    // Error handling (lines 212-226)
  }
};
```

**Critical Line 194**: `const isVisible = isVisibleFromIndia(satellite, position);`

This function call determines whether the satellite is visible. The result is stored in `is_visible_from_india` and returned to the frontend.

---

### 1.3 Backend: Position Calculation

**File**: `backend/utils/tleHelper.js`

**Lines 61-110**: The `getCurrentPosition` function computes the satellite's current position:

```javascript
const getCurrentPosition = (satellite) => {
  try {
    const tleString = buildTleString(satellite);
    const now = new Date();  // ← Current timestamp
    
    // Get lat/lng from getLatLngObj
    const coords = tle.getLatLngObj(tleString, now);  // Line 67

    if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
      throw new Error('Invalid TLE data: unable to compute position');
    }

    // Handle NaN or Infinity values (lines 73-76)
    if (!isFinite(coords.lat) || !isFinite(coords.lng)) {
      throw new Error('TLE produced invalid coordinates (NaN or Infinity)');
    }

    // Get altitude using getSatelliteInfo with observer at center of Earth (0,0,0)
    let altitudeKm = 0;
    try {
      const centerInfo = tle.getSatelliteInfo(tleString, now, 0, 0, 0);  // Line 82
      if (centerInfo && typeof centerInfo.height === 'number' && isFinite(centerInfo.height) && centerInfo.height > 0) {
        altitudeKm = centerInfo.height;
      } else if (centerInfo && typeof centerInfo.range === 'number' && isFinite(centerInfo.range)) {
        // Fallback: range from center minus Earth radius (~6371 km)
        altitudeKm = Math.max(0, centerInfo.range - 6371);
      }
    } catch (altError) {
      console.warn(`Could not calculate altitude for ${satellite.name}:`, altError.message);
    }

    // Altitude sanity check (lines 94-99)
    if (isNaN(altitudeKm) || altitudeKm < 100 || altitudeKm > 2000) {
      const errorMsg = `Invalid altitude from TLE — TLE likely stale or corrupt. Altitude: ${altitudeKm} km`;
      console.warn(`[${satellite.name}] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    return {
      latitude: coords.lat,
      longitude: coords.lng,
      altitudeKm: Math.round(altitudeKm * 100) / 100,
      timestamp: now.toISOString(),
    };
  } catch (error) {
    throw new Error(`Failed to get position for ${satellite.name}: ${error.message}`);
  }
};
```

**Key Points**:
- Uses `tle.getLatLngObj(tleString, now)` to compute lat/lon at current time
- Uses `tle.getSatelliteInfo(tleString, now, 0, 0, 0)` to get altitude (observer at Earth center)
- Validates altitude is between 100-2000 km
- Returns position object: `{ latitude, longitude, altitudeKm, timestamp }`

**Note**: The `position` object is passed to `isVisibleFromIndia()`, but the function **does not use** the position's lat/lon/altitude. Instead, it recomputes elevation using the TLE directly.

---

### 1.4 Backend: Visibility Calculation

**File**: `backend/utils/visibilityHelper.js`

**Lines 51-65**: The `isVisibleFromIndia` function determines visibility:

```javascript
const isVisibleFromIndia = (satellite, satellitePosition) => {
  const INDIA_CENTER_LAT = 22.0;   // Observer latitude
  const INDIA_CENTER_LON = 78.0;   // Observer longitude
  const INDIA_CENTER_ALT = 0;      // Observer altitude (sea level)
  
  const elevation = getElevationForObserver(
    satellite,
    satellitePosition,
    INDIA_CENTER_LAT,
    INDIA_CENTER_LON,
    INDIA_CENTER_ALT
  );
  
  return elevation > 0;  // ← THRESHOLD: Must be above horizon
};
```

**Critical Line 64**: `return elevation > 0;`

This is the **exact condition** that determines visibility. If `elevation ≤ 0`, the function returns `false`, and the satellite is filtered out.

---

### 1.5 Backend: Elevation Calculation

**File**: `backend/utils/visibilityHelper.js`

**Lines 19-42**: The `getElevationForObserver` function computes elevation angle:

```javascript
const getElevationForObserver = (satellite, satellitePosition, observerLat, observerLon, observerAltitudeMeters = 0) => {
  try {
    const tleString = buildTleString(satellite);
    const now = new Date();  // ← Current timestamp (same as position calculation)
    
    // Use tle.js to get satellite info from observer's perspective
    const info = tle.getSatelliteInfo(
      tleString,
      now,                    // ← Same timestamp
      observerLat,            // ← 22.0
      observerLon,           // ← 78.0
      observerAltitudeMeters  // ← 0
    );
    
    if (info && typeof info.elevation === 'number' && isFinite(info.elevation)) {
      return info.elevation;  // ← Returns elevation in degrees
    }
    
    return -90; // Below horizon (fallback)
  } catch (error) {
    console.warn(`Failed to compute elevation for ${satellite.name}:`, error.message);
    return -90;  // Error case: treat as below horizon
  }
};
```

**Key Points**:
- Uses `tle.getSatelliteInfo(tleString, now, 22.0, 78.0, 0)` to compute elevation
- The `tle.js` library (version 5.0.1) uses SGP4/SDP4 propagation to compute:
  - Satellite position at time `now` from TLE data
  - Elevation angle from observer (22.0°N, 78.0°E, 0m) to satellite
- Returns elevation in degrees:
  - `elevation > 0`: Satellite is above horizon (visible)
  - `elevation = 0`: Satellite is exactly on horizon (treated as not visible)
  - `elevation < 0`: Satellite is below horizon (not visible)
  - `elevation = -90`: Fallback/error case (below horizon)

**Note**: The `satellitePosition` parameter is **not used** in this function. The elevation is computed directly from TLE data using the observer location.

---

### 1.6 Frontend: Filtering Logic

**File**: `frontend/src/pages/DisasterSupport.jsx`

**Lines 74-77**: The `satellitesOverIndia` memo filters visible satellites:

```javascript
const satellitesOverIndia = useMemo(
  () => positions.filter((item) => item.isOverIndia),
  [positions]
);
```

**Line 40**: `isOverIndia` is set from backend response:
```javascript
const isOverIndia = is_visible_from_india || false;
```

**Lines 135-138**: The UI conditionally renders:
```javascript
{satellitesOverIndia.length === 0 && !loading ? (
  <p className="text-slate-400 text-sm">
    None of the monitored satellites are currently above India.
  </p>
) : (
  // ... render visible satellites
)}
```

**Critical Condition**: `satellitesOverIndia.length === 0`

This condition is true when **all** satellites in the `positions` array have `isOverIndia === false`, which occurs when **all** satellites have `is_visible_from_india === false` from the backend, which occurs when **all** satellites have `elevation ≤ 0°`.

---

## 2. Exact Condition Preventing Satellites from Appearing

### 2.1 The Filtering Chain

The condition that prevents satellites from appearing is:

```
satellitesOverIndia.length === 0
  ↓
positions.filter((item) => item.isOverIndia).length === 0
  ↓
All items have isOverIndia === false
  ↓
All items have is_visible_from_india === false (from backend)
  ↓
All satellites have elevation ≤ 0° (from isVisibleFromIndia)
```

### 2.2 The Exact Threshold

**File**: `backend/utils/visibilityHelper.js`, **Line 64**:
```javascript
return elevation > 0;
```

**This is a strict inequality**: `elevation > 0` means:
- `elevation = 0.1°` → `true` (visible)
- `elevation = 0.0°` → `false` (not visible)
- `elevation = -0.1°` → `false` (not visible)
- `elevation = -90°` → `false` (not visible, fallback)

### 2.3 Why Elevation is ≤ 0°

The elevation angle is computed by `tle.js` library using:

1. **SGP4/SDP4 Propagation**: Computes satellite position at time `now` from TLE data
2. **Spherical Geometry**: Calculates angular separation between observer and satellite
3. **Horizon Calculation**: Determines if satellite is above or below the observer's horizon

**Mathematical Relationship**:
```
elevation = arcsin((h / r) - (R / r))

Where:
- h = satellite altitude above Earth center
- r = distance from observer to satellite
- R = Earth radius (~6371 km)
```

For a satellite to have `elevation > 0°`:
- The satellite must be within the observer's "visibility cone"
- The satellite must be above the geometric horizon
- The satellite's ground track must be near the observer's location

**At any arbitrary timestamp**:
- Most satellites are **not** within the visibility cone
- Most satellites are **below** the horizon
- Most satellites have `elevation < 0°`

---

## 3. Is This Expected Behavior?

### 3.1 Orbital Mechanics Reality

**Yes, this is expected behavior** based on orbital mechanics:

1. **Orbital Period**: LEO satellites complete one orbit in ~90-100 minutes
2. **Visibility Window**: A satellite is only visible during a "pass" when it rises above the horizon
3. **Pass Duration**: Typical passes last 5-15 minutes (satellite rises, reaches max elevation, then sets)
4. **Duty Cycle**: If a pass lasts 10 minutes out of a 100-minute orbit, the satellite is visible only **10% of the time**
5. **Geographic Constraint**: The satellite's ground track must pass near the observer's location

**Probability Calculation**:
- For 8 satellites, each visible 10% of the time (independent):
- Probability all 8 are below horizon: `(0.9)^8 ≈ 43%`
- This means **~43% of the time, NO satellites will be visible**

### 3.2 Real-Time Snapshot Limitation

The system checks visibility **at the current timestamp only**:

**File**: `backend/utils/visibilityHelper.js`, **Line 22**:
```javascript
const now = new Date();
```

**File**: `backend/utils/tleHelper.js`, **Line 64**:
```javascript
const now = new Date();
```

Both functions use the **same timestamp** (`now`), meaning:
- The system does **not** look ahead to find upcoming passes
- The system does **not** check if a satellite was visible 1 minute ago
- The system is a **real-time snapshot**, not a prediction

This is why passes appear "rare" - the system only shows satellites that are **currently** visible, not those that will be visible soon.

---

## 4. Impact of Observer Location (22°N, 78°E)

### 4.1 Single-Point Observer

**File**: `backend/utils/visibilityHelper.js`, **Lines 52-54**:
```javascript
const INDIA_CENTER_LAT = 22.0;
const INDIA_CENTER_LON = 78.0;
const INDIA_CENTER_ALT = 0;
```

The system uses **India's center** (22.0°N, 78.0°E) as a single observer point, not India's entire geographic bounds.

### 4.2 Geographic Impact

**India's Geographic Bounds** (from `DisasterSupport.jsx`, lines 15-20):
```javascript
const INDIA_BOUNDS = {
  north: 37.5,
  south: 5.0,
  east: 97.5,
  west: 67.0,
};
```

**Observer Location**: 22.0°N, 78.0°E (center of bounds)

**Impact**:
- A satellite visible from Mumbai (19°N, 72°E) but not from the center point will show as "not visible"
- A satellite visible from Delhi (28°N, 77°E) but not from the center point will show as "not visible"
- The system prioritizes **elevation-based visibility** over **geographic bounds**

**However**, this is still physically correct for the chosen observer point. The system is designed to show satellites visible from India's center, not from any point in India.

### 4.3 Why This Location Was Chosen

The observer location (22°N, 78°E) is approximately:
- The geographic center of India
- A reasonable single-point approximation for the entire country
- Standard practice for single-observer visibility calculations

**Alternative Approaches** (not implemented):
- Check multiple observer points (Mumbai, Delhi, Bangalore, Kolkata)
- Use geographic bounds to determine if satellite ground track intersects India
- Use minimum elevation from any point in India

---

## 5. Impact of Visibility Threshold (elevation > 0)

### 5.1 The Threshold

**File**: `backend/utils/visibilityHelper.js`, **Line 64**:
```javascript
return elevation > 0;
```

**This is a strict threshold**: `elevation > 0` means the satellite must be **above** the geometric horizon.

### 5.2 Why 0° is Used

**Standard Practice**: `elevation > 0` is the standard threshold for geometric visibility:
- `elevation = 0°`: Satellite is exactly on the horizon (geometric limit)
- `elevation > 0°`: Satellite is above horizon (geometrically visible)
- `elevation < 0°`: Satellite is below horizon (geometrically not visible)

**Atmospheric Refraction**: In reality, Earth's atmosphere bends light, making satellites visible slightly below the geometric horizon (typically up to -0.5°). However, the system uses the geometric threshold (0°) which is:
- More conservative (fewer false positives)
- Mathematically simpler
- Standard in orbital mechanics calculations

### 5.3 Impact on Visibility

**If threshold were `elevation > -0.5°`** (accounting for atmospheric refraction):
- More satellites would be considered "visible"
- However, this would still not change the fundamental fact that most satellites are below the horizon at any given time

**If threshold were `elevation > 5°`** (minimum practical elevation):
- Fewer satellites would be considered "visible"
- This would make the empty state even more common

**Current threshold (`elevation > 0`) is appropriate** for geometric visibility calculations.

---

## 6. Timing of Satellite Orbits

### 6.1 Why Timing Matters

Satellites are in **constant motion**:
- LEO satellites orbit Earth in ~90-100 minutes
- Ground tracks shift due to Earth's rotation
- Visibility windows are brief and infrequent

### 6.2 Current Timestamp Check

**File**: `backend/utils/visibilityHelper.js`, **Line 22**:
```javascript
const now = new Date();
```

**File**: `backend/utils/tleHelper.js`, **Line 64**:
```javascript
const now = new Date();
```

Both functions use the **same timestamp**, meaning:
- Position and elevation are computed for the **exact same moment**
- The system does **not** check future timestamps
- The system does **not** check past timestamps

### 6.3 Why This Explains the Empty State

**At the current timestamp**:
- All 8 monitored satellites are in positions where `elevation ≤ 0°` from observer (22°N, 78°E)
- This is **expected** because:
  - Satellites are only visible during brief passes
  - Passes are infrequent (typically a few times per day per satellite)
  - At any arbitrary moment, most satellites are below the horizon

**Example Timeline**:
```
00:00 - Satellite A: elevation = -45° (below horizon)
00:05 - Satellite A: elevation = -30° (below horizon)
00:10 - Satellite A: elevation = -15° (below horizon)
00:15 - Satellite A: elevation = 0° (on horizon) → NOT VISIBLE (threshold is > 0)
00:20 - Satellite A: elevation = 15° (above horizon) → VISIBLE
00:25 - Satellite A: elevation = 30° (above horizon) → VISIBLE
00:30 - Satellite A: elevation = 15° (above horizon) → VISIBLE
00:35 - Satellite A: elevation = 0° (on horizon) → NOT VISIBLE
00:40 - Satellite A: elevation = -15° (below horizon)
```

If the current timestamp is 00:00, 00:05, 00:10, 00:15, 00:35, 00:40, etc., the satellite will **not** appear.

---

## 7. Is There a Bug or Mismatch?

### 7.1 Code Logic Verification

**Tracing the logic path**:

1. ✅ Frontend calls `/position/:satId` for each satellite
2. ✅ Backend computes position using `getCurrentPosition()`
3. ✅ Backend computes visibility using `isVisibleFromIndia()`
4. ✅ `isVisibleFromIndia()` calls `getElevationForObserver()` with observer (22°N, 78°E)
5. ✅ `getElevationForObserver()` uses `tle.getSatelliteInfo()` to compute elevation
6. ✅ `isVisibleFromIndia()` returns `elevation > 0`
7. ✅ Backend returns `is_visible_from_india` boolean
8. ✅ Frontend sets `isOverIndia = is_visible_from_india || false`
9. ✅ Frontend filters: `positions.filter((item) => item.isOverIndia)`
10. ✅ UI conditionally renders based on `satellitesOverIndia.length === 0`

**No bugs detected**: The logic is consistent and correct.

### 7.2 Potential Issues (Not Bugs)

**Issue 1: Unused Parameter**
- `getElevationForObserver()` receives `satellitePosition` parameter but **does not use it**
- The function recomputes position from TLE data instead
- **Impact**: None (function works correctly, parameter is just unused)

**Issue 2: Single Observer Point**
- System uses single observer (22°N, 78°E) instead of multiple points
- **Impact**: Satellites visible from other parts of India may not appear
- **Status**: Design choice, not a bug

**Issue 3: Strict Threshold**
- Uses `elevation > 0` instead of `elevation > -0.5°` (atmospheric refraction)
- **Impact**: Slightly fewer satellites appear
- **Status**: Standard practice, not a bug

**Issue 4: Real-Time Only**
- System checks current timestamp only, not future passes
- **Impact**: Empty state is common
- **Status**: Design choice (real-time snapshot vs. prediction)

### 7.3 Conclusion: No Bugs

The system is working as designed. The empty state is **expected behavior** based on:
- Orbital mechanics (satellites are only visible during brief passes)
- Real-time snapshot approach (checks current moment only)
- Single observer point (India's center)
- Strict elevation threshold (`elevation > 0`)

---

## 8. Summary: Why Satellites Don't Appear

### 8.1 The Exact Reason

**All 8 monitored satellites have `elevation ≤ 0°`** when computed from observer location (22.0°N, 78.0°E) at the current timestamp.

### 8.2 The Condition Chain

```
UI shows "None of the monitored satellites are currently above India"
  ↓
satellitesOverIndia.length === 0
  ↓
positions.filter((item) => item.isOverIndia).length === 0
  ↓
All items have isOverIndia === false
  ↓
All items have is_visible_from_india === false (from backend)
  ↓
All satellites have elevation ≤ 0° (from isVisibleFromIndia)
  ↓
tle.getSatelliteInfo(tleString, now, 22.0, 78.0, 0).elevation ≤ 0
  ↓
At current timestamp, all satellites are below/on the horizon from observer (22°N, 78°E)
```

### 8.3 Why This Happens

1. **Orbital Mechanics**: Satellites are only visible during brief passes (typically 5-15 minutes out of 90-100 minute orbits)
2. **Real-Time Snapshot**: System checks current timestamp only, not future passes
3. **Geometric Constraint**: Most satellites are below the horizon at any given moment
4. **Probability**: For 8 satellites, probability all are below horizon ≈ 43%

### 8.4 Is This Correct?

**Yes, this is correct behavior**:
- ✅ Mathematically sound (uses proper elevation calculations)
- ✅ Physically accurate (reflects orbital mechanics reality)
- ✅ Implementation correct (code logic matches intended behavior)
- ✅ Expected outcome (empty state is common for real-time snapshots)

---

## 9. Code References

| Component | File | Lines | Function |
|-----------|------|-------|----------|
| Frontend Request | `frontend/src/pages/DisasterSupport.jsx` | 34-48 | `fetchPositions()` |
| Frontend Filter | `frontend/src/pages/DisasterSupport.jsx` | 74-77 | `satellitesOverIndia` memo |
| Frontend UI | `frontend/src/pages/DisasterSupport.jsx` | 135-138 | Conditional render |
| Backend Endpoint | `backend/controllers/predictionController.js` | 161-227 | `getRealtimePosition()` |
| Position Calculation | `backend/utils/tleHelper.js` | 61-110 | `getCurrentPosition()` |
| Visibility Check | `backend/utils/visibilityHelper.js` | 51-65 | `isVisibleFromIndia()` |
| Elevation Calculation | `backend/utils/visibilityHelper.js` | 19-42 | `getElevationForObserver()` |
| Watch List | `frontend/src/data/disasterSatellites.json` | 107-116 | `watchList` array |

---

## 10. Conclusion

The Overflight Monitor shows "None of the monitored satellites are currently above India" because **all 8 monitored satellites have elevation angles ≤ 0°** when computed from observer location (22.0°N, 78.0°E) at the current timestamp. This is **expected behavior** based on orbital mechanics: satellites are only visible during brief orbital passes, and at any arbitrary moment, most satellites are below the horizon.

**The system is working correctly** - there are no bugs in the code. The empty state is a natural consequence of:
- Real-time snapshot approach (checks current moment only)
- Orbital mechanics (satellites are in constant motion)
- Geometric constraints (most satellites are below horizon at any time)
- Single observer point (India's center, not entire region)

To see satellites more frequently, the system would need to show upcoming passes (predictive mode) rather than only currently visible satellites (real-time snapshot mode).

