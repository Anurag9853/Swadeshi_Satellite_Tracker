# Real-Time ISRO Satellite Pass Predictor - Detailed Architecture Explanation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Frontend Architecture](#frontend-architecture)
5. [Data Flow](#data-flow)
6. [Key Technologies](#key-technologies)
7. [API Endpoints](#api-endpoints)
8. [Features Explained](#features-explained)

---

## 🎯 Project Overview

**Purpose**: A full-stack web application that predicts when ISRO satellites will pass over a user's location, displays real-time satellite positions on a map, and provides weather-based visibility scoring.

**Tech Stack**: MERN Stack (MongoDB, Express.js, React, Node.js) with additional libraries for satellite tracking and mapping.

---

## 🏗️ System Architecture

```
┌─────────────────┐         HTTP/REST API         ┌─────────────────┐
│                 │ ◄─────────────────────────────► │                 │
│   Frontend      │                                 │    Backend      │
│   (React)       │                                 │   (Express.js)  │
│   Port: 5173    │                                 │   Port: 5000    │
└─────────────────┘                                 └─────────────────┘
                                                           │
                                                           │
                                                           ▼
                                                    ┌─────────────────┐
                                                    │   MongoDB       │
                                                    │   (Database)    │
                                                    └─────────────────┘
                                                           │
                                                           │
                                                           ▼
                                                    ┌─────────────────┐
                                                    │ External APIs   │
                                                    │ - Celestrak TLE │
                                                    │ - OpenWeather   │
                                                    └─────────────────┘
```

**Communication Flow**:
1. User interacts with React frontend
2. Frontend makes HTTP requests to Express backend
3. Backend queries MongoDB or external APIs
4. Backend processes data (TLE calculations, weather)
5. Backend sends JSON response to frontend
6. Frontend updates UI with new data

---

## 🔧 Backend Architecture

### **Directory Structure**

```
backend/
├── server.js              # Entry point, starts server
├── app.js                 # Express app configuration
├── config/
│   └── db.js             # MongoDB connection
├── models/
│   ├── Satellite.js      # Satellite schema (name, norad_id, TLE data)
│   └── Feedback.js       # Feedback schema (name, email, message, rating)
├── routes/
│   ├── satelliteRoutes.js    # GET /api/satellites
│   ├── predictionRoutes.js   # POST /api/predict, GET /api/position/:satId
│   └── feedbackRoutes.js     # POST /api/feedback, GET /api/feedback
├── controllers/
│   ├── satelliteController.js   # Business logic for satellites
│   ├── predictionController.js   # Pass prediction & position logic
│   └── feedbackController.js    # Feedback CRUD operations
├── utils/
│   ├── tleHelper.js      # TLE parsing & calculations (tle.js wrapper)
│   ├── tleRefresh.js     # Background job to refresh TLE from Celestrak
│   └── seedHelper.js     # Populates MongoDB with initial satellite data
├── data/
│   └── isroSatellites.js # Seed data (6 ISRO satellites with TLE)
└── tests/
    └── api.test.js       # Automated API tests (Jest + Supertest)
```

### **Backend Components Explained**

#### 1. **server.js** (Entry Point)
- Loads environment variables from `.env`
- Connects to MongoDB
- Seeds initial satellite data if database is empty
- Starts background TLE refresh job (every 6 hours)
- Starts Express server on port 5000

#### 2. **app.js** (Express Configuration)
- Sets up CORS (Cross-Origin Resource Sharing) for frontend communication
- Configures JSON body parser
- Registers route handlers
- Adds health check endpoint (`/api/health`)

#### 3. **Models** (Mongoose Schemas)

**Satellite Model**:
```javascript
{
  name: String (required),
  norad_id: Number (unique, required),
  mission: String,
  purpose: String,
  launch_year: Number,
  image_url: String,
  tle_line1: String (required),  // Two-Line Element line 1
  tle_line2: String (required)  // Two-Line Element line 2
}
```

**Feedback Model**:
```javascript
{
  name: String (required),
  email: String (required),
  message: String (required),
  rating: Number (1-5),
  timestamp: Date (auto-generated)
}
```

#### 4. **Routes** (API Endpoints)

**satelliteRoutes.js**:
- `GET /api/satellites` → Returns all ISRO satellites from database
- `GET /api/satellites/:id` → Returns single satellite by ID or NORAD ID

**predictionRoutes.js**:
- `POST /api/predict` → Predicts next satellite pass
  - Input: `{ lat, lon, satelliteId }`
  - Output: Pass details (start/end time, duration, max elevation, visibility)
- `GET /api/position/:satId` → Gets real-time satellite position
  - Output: Current lat/lng, altitude, orbit path array

**feedbackRoutes.js**:
- `POST /api/feedback` → Saves user feedback
- `GET /api/feedback` → Retrieves all feedback entries

#### 5. **Controllers** (Business Logic)

**satelliteController.js**:
- `getAllSatellites()`: Fetches all satellites from MongoDB
- `getSatelliteById()`: Finds satellite by MongoDB `_id` or `norad_id`

**predictionController.js**:
- `predictSatellitePass()`:
  1. Validates user coordinates (lat, lon)
  2. Finds satellite in database
  3. Calls `computeNextPass()` from `tleHelper.js` to calculate pass
  4. Fetches weather data from OpenWeather API
  5. Calculates visibility score (Good/Average/Poor) based on clouds, visibility, precipitation
  6. Returns prediction with weather data

- `getRealtimePosition()`:
  1. Finds satellite in database
  2. Calls `getCurrentPosition()` to get current lat/lng/altitude
  3. Calls `getOrbitTrack()` to generate orbit path (90 points, 2-min intervals)
  4. Returns position + orbit path array

**feedbackController.js**:
- `submitFeedback()`: Validates and saves feedback to MongoDB
- `getAllFeedback()`: Retrieves all feedback entries

#### 6. **Utils** (Helper Functions)

**tleHelper.js** (Core Satellite Calculations):
- `buildTleString()`: Combines TLE line 1 and line 2 into format required by `tle.js`
- `computeNextPass()`: 
  - Uses `tle.js` library to calculate satellite position every 30 seconds
  - Finds when satellite elevation > 0° (visible above horizon)
  - Determines pass start, end, duration, max elevation
  - Uses `suncalc` to determine if pass is during day or night
- `getCurrentPosition()`:
  - Uses `tle.getLatLngObj()` to get current latitude/longitude
  - Uses `tle.getSatelliteInfo()` to get altitude (height above Earth)
  - Returns position object with timestamp
- `getOrbitTrack()`:
  - Samples satellite position every 2 minutes for 90 points (~3 hours)
  - Returns array of {latitude, longitude} points for map polyline

**tleRefresh.js** (Background Job):
- `fetchTleForSatellite()`: Fetches latest TLE from Celestrak API
- `refreshTleData()`: Updates all satellites in database with fresh TLE data
- `scheduleTleRefresh()`: Runs refresh job every 6 hours (configurable)

**seedHelper.js**:
- `ensureSeedData()`: Populates MongoDB with 6 ISRO satellites if they don't exist
- Uses `findOneAndUpdate()` with `upsert: true` to avoid duplicates

---

## 🎨 Frontend Architecture

### **Directory Structure**

```
frontend/
├── src/
│   ├── main.jsx           # React entry point, renders App
│   ├── App.jsx            # Main router, defines all routes
│   ├── index.css          # Tailwind CSS imports
│   ├── pages/
│   │   ├── Home.jsx              # Location detection + pass prediction
│   │   ├── SatelliteList.jsx     # Grid of all satellites
│   │   ├── SatelliteDetails.jsx  # Single satellite info + prediction
│   │   ├── MapView.jsx           # Real-time tracking map (Leaflet)
│   │   ├── About.jsx             # ISRO mission information
│   │   └── Feedback.jsx          # Feedback form
│   ├── components/
│   │   ├── NavBar.jsx            # Navigation menu
│   │   ├── SatelliteCard.jsx     # Reusable satellite card component
│   │   └── PassTable.jsx         # Displays prediction results
│   └── services/
│       └── api.js                # Axios instance for API calls
```

### **Frontend Components Explained**

#### 1. **main.jsx** (Entry Point)
- Renders React app into DOM
- Wraps app in `<StrictMode>` for development warnings
- Imports global CSS (Tailwind)

#### 2. **App.jsx** (Router Configuration)
- Uses React Router v6 for client-side routing
- Defines 6 routes:
  - `/` → Home page
  - `/satellites` → Satellite list
  - `/satellites/:id` → Satellite details
  - `/map` → Real-time map
  - `/about` → About page
  - `/feedback` → Feedback form
- Includes `<NavBar>` component on all pages
- 404 handler for unknown routes

#### 3. **Pages**

**Home.jsx**:
- **Features**:
  - Uses browser Geolocation API to get user's lat/lon
  - Fetches satellite list from backend
  - Dropdown to select satellite
  - "Predict Pass" button triggers API call
  - Displays results in `<PassTable>` component
- **State Management**:
  - `coords`: User's location
  - `satellites`: List of satellites
  - `selected`: Selected satellite ID
  - `prediction`: Prediction result from API
  - `loading`: Loading state for API call
  - `error`: Error messages

**SatelliteList.jsx**:
- Fetches all satellites on component mount (`useEffect`)
- Displays grid of `<SatelliteCard>` components
- Each card shows: image, name, NORAD ID, mission, launch year
- Clicking card navigates to details page

**SatelliteDetails.jsx**:
- Fetches single satellite by ID from URL params
- Shows full satellite information
- Has its own location detection and prediction form
- Displays prediction results

**MapView.jsx** (Most Complex):
- Uses `react-leaflet` for map rendering
- **Features**:
  - Fetches satellite list on mount
  - Dropdown to select satellite
  - Polls `/api/position/:satId` every 5 seconds (`setInterval`)
  - Displays satellite marker at current position
  - Draws orange polyline showing orbit path
  - Updates map center to follow satellite
- **State Management**:
  - `satellites`: List of satellites
  - `selected`: Selected satellite ID
  - `position`: Current satellite position {lat, lng, altitudeKm}
  - `orbitPath`: Array of {latitude, longitude} points
  - `error`: Error messages

**About.jsx**:
- Static content about ISRO missions
- Mission highlights: Cartosat, RISAT, GSAT, NavIC, EMISAT, Aditya-L1

**Feedback.jsx**:
- Form with fields: name, email, message, rating (1-5)
- Submits to `/api/feedback` endpoint
- Shows success/error messages

#### 4. **Components**

**NavBar.jsx**:
- Uses `NavLink` from React Router for active state styling
- 5 navigation links: Home, Satellites, Map, About, Feedback
- Active link highlighted with orange background

**SatelliteCard.jsx**:
- Reusable card component
- Props: `satellite` object
- Displays: image, name, NORAD ID, mission, purpose, launch year
- Link to details page

**PassTable.jsx**:
- Displays prediction results
- Props: `data` object containing prediction + weather
- Shows: start time, end time, duration, max elevation, day/night, visibility score
- Weather snapshot section (if available)

#### 5. **Services**

**api.js**:
- Creates Axios instance with base URL from environment variable
- Default: `http://localhost:5000/api`
- Sets 15-second timeout
- Response interceptor for error logging
- Exported as default, imported in all pages/components

---

## 🔄 Data Flow Examples

### **Example 1: Predicting Satellite Pass**

```
1. User clicks "Predict Pass" on Home page
   ↓
2. Home.jsx calls: api.post('/predict', { lat, lon, satelliteId })
   ↓
3. Backend receives request at predictionController.predictSatellitePass()
   ↓
4. Controller validates coordinates, finds satellite in MongoDB
   ↓
5. Controller calls tleHelper.computeNextPass(satellite, lat, lon)
   ↓
6. tleHelper uses tle.js library to:
   - Parse TLE data
   - Calculate satellite position every 30 seconds
   - Find when elevation > 0° (visible)
   - Determine max elevation, duration
   ↓
7. Controller fetches weather from OpenWeather API
   ↓
8. Controller calculates visibility score (Good/Average/Poor)
   ↓
9. Backend sends JSON response:
   {
     satellite: {...},
     location: {lat, lon},
     prediction: {startTime, endTime, duration, maxElevation, ...},
     weather: {visibilityScore, source, raw}
   }
   ↓
10. Frontend receives response, updates state
   ↓
11. PassTable component renders prediction data
```

### **Example 2: Real-Time Map Tracking**

```
1. MapView.jsx mounts, fetches satellite list
   ↓
2. User selects satellite from dropdown
   ↓
3. useEffect triggers, starts setInterval (5 seconds)
   ↓
4. Every 5 seconds: api.get(`/position/${selected}`)
   ↓
5. Backend predictionController.getRealtimePosition() called
   ↓
6. Controller finds satellite, calls:
   - tleHelper.getCurrentPosition() → {lat, lng, altitudeKm}
   - tleHelper.getOrbitTrack() → [{lat, lng}, ...] (90 points)
   ↓
7. Backend returns:
   {
     currentPosition: {latitude, longitude, altitudeKm, timestamp},
     orbitPath: [{latitude, longitude}, ...]
   }
   ↓
8. Frontend updates state: position, orbitPath
   ↓
9. Leaflet map re-renders:
   - Moves marker to new position
   - Updates polyline with new orbit path
   - Centers map on satellite
```

---

## 🛠️ Key Technologies

### **Backend**

1. **Node.js + Express.js**
   - Server runtime and web framework
   - Handles HTTP requests/responses
   - Middleware for CORS, JSON parsing

2. **MongoDB + Mongoose**
   - NoSQL database for satellite and feedback data
   - Mongoose provides schema validation and query methods
   - Stores: satellite metadata, TLE data, user feedback

3. **tle.js**
   - Parses Two-Line Element (TLE) data
   - Calculates satellite positions using SGP4/SDP4 models
   - Methods: `getLatLngObj()`, `getSatelliteInfo()`

4. **suncalc**
   - Calculates sun position for day/night determination
   - Used to classify passes as "Day" or "Night"

5. **node-fetch**
   - HTTP client for external API calls
   - Fetches TLE from Celestrak, weather from OpenWeather

### **Frontend**

1. **React + Vite**
   - React: Component-based UI library
   - Vite: Fast build tool and dev server
   - Hooks: `useState`, `useEffect`, `useMemo`

2. **React Router**
   - Client-side routing (no page reloads)
   - `BrowserRouter`, `Routes`, `Route`, `NavLink`

3. **Tailwind CSS**
   - Utility-first CSS framework
   - Responsive design classes (md:, lg:)
   - Dark theme (slate-900, slate-800 colors)

4. **Axios**
   - HTTP client for API calls
   - Promise-based, interceptors for error handling

5. **Leaflet + react-leaflet**
   - Leaflet: Open-source mapping library
   - react-leaflet: React wrapper
   - Components: `MapContainer`, `TileLayer`, `Marker`, `Polyline`, `Popup`

6. **React Icons**
   - Icon library (used in navigation, buttons)

---

## 📡 API Endpoints Summary

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/health` | Server health check | - | `{status, uptime, timestamp}` |
| GET | `/api/satellites` | List all satellites | - | `[{id, name, norad_id, ...}]` |
| GET | `/api/satellites/:id` | Get single satellite | - | `{id, name, norad_id, ...}` |
| POST | `/api/predict` | Predict next pass | `{lat, lon, satelliteId}` | `{satellite, location, prediction, weather}` |
| GET | `/api/position/:satId` | Real-time position | - | `{satellite, currentPosition, orbitPath}` |
| POST | `/api/feedback` | Submit feedback | `{name, email, message, rating}` | `{message, feedback}` |
| GET | `/api/feedback` | Get all feedback | - | `[{name, email, message, rating, timestamp}]` |

---

## ✨ Features Explained

### **1. Satellite Pass Prediction**
- **How it works**: Uses TLE data + SGP4 orbital model to calculate when satellite will be visible
- **Input**: User's latitude/longitude, satellite ID
- **Output**: Start time, end time, duration, max elevation angle, day/night classification
- **Algorithm**: Samples satellite position every 30 seconds, finds when elevation > 0°

### **2. Weather-Based Visibility Scoring**
- **How it works**: Fetches current weather from OpenWeather API
- **Factors**: Cloud cover (%), visibility (meters), precipitation
- **Scoring**:
  - **Good**: Clouds < 30%, visibility > 8km, no precipitation
  - **Average**: Clouds < 60%, visibility > 4km
  - **Poor**: Otherwise

### **3. Real-Time Satellite Tracking**
- **How it works**: Polls backend every 5 seconds for current position
- **Display**: Marker shows current position, polyline shows orbit path
- **Orbit Path**: 90 points sampled every 2 minutes (~3 hours of orbit)

### **4. Automatic TLE Refresh**
- **How it works**: Background job runs every 6 hours
- **Source**: Celestrak NORAD TLE database
- **Purpose**: Keeps orbital data current (TLEs decay over time)

### **5. Geolocation Detection**
- **How it works**: Browser Geolocation API
- **Usage**: Home page and Satellite Details page
- **Fallback**: Shows error if user denies permission

---

## 🎓 Key Concepts for Teacher Explanation

### **1. RESTful API Design**
- Standard HTTP methods (GET, POST)
- Resource-based URLs (`/api/satellites`, `/api/predict`)
- JSON request/response format
- Stateless communication

### **2. Separation of Concerns**
- **Backend**: Data processing, business logic, external API calls
- **Frontend**: User interface, user interaction, data presentation
- **Database**: Persistent data storage

### **3. Client-Side Routing**
- React Router enables single-page application (SPA)
- No page reloads, faster navigation
- URL changes without server requests

### **4. State Management**
- React `useState` for component-level state
- API calls update state, triggers re-render
- Real-time updates via polling (setInterval)

### **5. Asynchronous Programming**
- Promises and async/await for API calls
- Non-blocking operations (doesn't freeze UI)
- Error handling with try/catch

### **6. Component Reusability**
- `<SatelliteCard>`, `<PassTable>` used in multiple pages
- Props for data passing
- DRY (Don't Repeat Yourself) principle

### **7. Background Jobs**
- Scheduled tasks (TLE refresh)
- Runs independently of user requests
- Keeps data fresh automatically

---

## 🚀 Deployment Architecture

**Frontend** → Vercel (static hosting)
- Build: `npm run build` (creates `dist/` folder)
- Environment: `VITE_API_BASE_URL` points to backend

**Backend** → Render/Railway (Node.js hosting)
- Environment: `MONGO_URI`, `OPENWEATHER_API_KEY`, `CLIENT_URL`
- Auto-deploys from GitHub

**Database** → MongoDB Atlas (cloud MongoDB)
- Connection string in `MONGO_URI`
- Free tier sufficient for development

---

## 📊 Testing Strategy

**Backend Tests** (Jest + Supertest):
- API endpoint smoke tests
- Uses `mongodb-memory-server` (in-memory database)
- Tests: health check, satellite listing, prediction, position, feedback

**Frontend Tests** (Vitest + React Testing Library):
- Component unit tests
- Tests: PassTable rendering, error states

---

This architecture demonstrates:
- ✅ Full-stack development (frontend + backend)
- ✅ Database integration (MongoDB)
- ✅ External API integration (Celestrak, OpenWeather)
- ✅ Real-time data updates (polling)
- ✅ Responsive UI design (Tailwind CSS)
- ✅ Interactive maps (Leaflet)
- ✅ Background job processing
- ✅ Error handling and validation
- ✅ Testing (unit + integration)

