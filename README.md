## Real-Time ISRO Satellite Pass Predictor – Swadeshi Space Innovation

End-to-end MERN stack product that predicts upcoming ISRO satellite passes, ranks visibility using live weather, and streams real-time tracks over Leaflet. Built to highlight indigenous missions while providing actionable ground-station style insights.

### Features
- Browser geolocation & instant pass prediction with `tle.js`
- MongoDB catalog of ISRO satellites (metadata + TLE)
- Weather-aware visibility scoring via OpenWeather
- Real-time Leaflet map with orbit polyline & 5s updates
- Automatic TLE refresh cycle using the public Celestrak TLE feed
- Feedback collection pipeline and mission knowledge hub

### Tech Stack
- **Frontend**: Vite + React, Tailwind CSS, Axios, React Router, Leaflet
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, `tle.js`, `suncalc`
- **Database**: MongoDB Atlas (or any Mongo cluster)

---

## Project Structure

```
backend/
  server.js
  config/db.js
  controllers/
  routes/
  models/
  utils/
  data/
  env.example
frontend/
  src/
    pages/
    components/
    services/
  env.example
```

---

## Local Development

### 1. Backend
```bash
cd backend
cp env.example .env      # update values
npm install
npm run dev              # nodemon with hot reload

# automated API tests (uses mongodb-memory-server)
npm test
```

Environment variables (`backend/env.example`):
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
OPENWEATHER_API_KEY=your_openweather_api_key
CLIENT_URL=http://localhost:5173
```

### 2. Frontend
```bash
cd frontend
cp env.example .env
npm install
npm run dev              # Vite dev server on 5173

# component/unit tests
npm test
```

`frontend/env.example`:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

Access the UI via `http://localhost:5173`. Ensure the backend is already running on port `5000`.

---

## API Reference

| Endpoint | Description |
| --- | --- |
| `GET /api/health` | Server uptime probe |
| `GET /api/satellites` | List all ISRO satellites |
| `GET /api/satellites/:id` | Satellite metadata by Mongo `_id` or `norad_id` |
| `POST /api/predict` | Predict next pass for `{ lat, lon, satelliteId }` |
| `GET /api/position/:satId` | Live latitude/longitude + orbit track |
| `POST /api/feedback` | Submit feedback `{ name, email, message, rating }` |
| `GET /api/feedback` | Retrieve recent feedback entries |

### Sample Responses

**GET /api/satellites**
```
[
  {
    "id": "672ff09b7e9b8927c2d279d1",
    "name": "Cartosat-2F",
    "norad_id": 42972,
    "mission": "High-resolution Earth observation",
    "purpose": "Cartography, urban planning, disaster management",
    "launch_year": 2018,
    "image_url": "https://..."
  }
]
```

**POST /api/predict**
```
{
  "satellite": { "...": "..." },
  "location": { "lat": 12.972, "lon": 77.594 },
  "prediction": {
    "startTime": "2025-11-19T14:10:00.000Z",
    "endTime": "2025-11-19T14:17:30.000Z",
    "durationSeconds": 450,
    "durationMinutes": 7.5,
    "maxElevation": 68.42,
    "dayNight": "Night",
    "visibilityScore": "Good"
  },
  "weather": {
    "visibilityScore": "Good",
    "source": "OpenWeather",
    "raw": { "...": "OpenWeather payload ..." }
  }
}
```

**GET /api/position/:satId**
```
{
  "satellite": { "...": "..." },
  "currentPosition": {
    "latitude": -12.34,
    "longitude": 122.56,
    "altitudeKm": 560.2,
    "timestamp": "2025-11-19T14:00:05.345Z"
  },
  "orbitPath": [
    { "latitude": -11.9, "longitude": 120.8 },
    { "latitude": -10.2, "longitude": 118.7 }
  ]
}
```

---

## Deployment Guide

### Backend → Render or Railway
1. Push this repo to GitHub.
2. Create a new **Web Service** (Render) or **Service** (Railway) and point to `backend/`.
3. Set environment variables from `backend/env.example`.
4. Configure build & start commands:
   - Install: `npm install`
   - Start: `npm run start`
5. Ensure `PORT` matches the platform-provided port (`Render`/`Railway` automatically injects it).

### Frontend → Vercel
1. Import Git repo into Vercel.
2. Set root directory to `frontend/`.
3. Install command: `npm install`
4. Build command: `npm run build`
5. Output directory: `dist`
6. Add environment var `VITE_API_BASE_URL=https://<your-backend-domain>/api`.

### Database → MongoDB Atlas
1. Create Atlas cluster (free tier is fine).
2. Whitelist IPs or enable `0.0.0.0/0` for development.
3. Create database user & password.
4. Replace `MONGO_URI` in backend `.env` with the connection string.

After deploying backend and frontend, update the frontend environment variable so the public UI targets the hosted backend.

---

## Background TLE Refresh
- `scheduleTleRefresh()` (backend) hits the Celestrak GP TLE endpoint for each NORAD catalog ID every six hours by default (configurable via `TLE_REFRESH_INTERVAL_HOURS`).
- Fresh TLEs are persisted to MongoDB so pass predictions and orbit tracks always use near-real-time orbital elements.
- Requests are throttled with small delays to remain polite to the public API.

---

## Testing Checklist
- `npm run dev` (backend) and `npm run dev` (frontend) run without errors
- `/api/health` returns status ok
- Geolocation prompt appears on Home and Satellite details pages
- Pass predictions show start/end/duration and weather score
- Map updates every 5 seconds with orbit polyline
- Feedback form submits and persists in MongoDB
- `npm test` (backend) runs API smoke tests using an in-memory MongoDB
- `npm test` (frontend) runs component tests powered by Vitest

---

## Future Enhancements
- User accounts and pass notifications via email/SMS
- Offline caching for field deployments
- GSAT/LEO downlink scheduling assistant
- Multi-satellite overlay and ground-station footprint rendering

