const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Satellite = require('../models/Satellite');
const Feedback = require('../models/Feedback');
const satelliteSeed = require('../data/isroSatellites');

beforeEach(async () => {
  await Satellite.insertMany(satelliteSeed);
});

afterEach(async () => {
  await Feedback.deleteMany({});
});

describe('API smoke tests', () => {
  it('returns health status', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('lists seeded satellites', async () => {
    const response = await request(app).get('/api/satellites');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(satelliteSeed.length);
    expect(response.body[0]).toHaveProperty('name');
  });

  it('predicts next pass for a satellite', async () => {
    const satellite = await Satellite.findOne();
    const response = await request(app)
      .post('/api/predict')
      .send({ lat: 12.9716, lon: 77.5946, satelliteId: satellite._id.toString() });

    expect(response.status).toBe(200);
    expect(response.body.prediction).toHaveProperty('startTime');
    expect(response.body.prediction).toHaveProperty('maxElevation');
  });

  it('fetches realtime position data', async () => {
    const satellite = await Satellite.findOne();
    const response = await request(app).get(`/api/position/${satellite._id}`);
    expect(response.status).toBe(200);
    expect(response.body.currentPosition).toHaveProperty('latitude');
    expect(response.body.orbitPath.length).toBeGreaterThan(0);
  });

  it('accepts feedback submissions', async () => {
    const payload = {
      name: 'Test User',
      email: 'user@example.com',
      message: 'Amazing platform!',
      rating: 5,
    };
    const response = await request(app).post('/api/feedback').send(payload);
    expect(response.status).toBe(201);
    const stored = await Feedback.findOne({ email: 'user@example.com' });
    expect(stored).not.toBeNull();
  });
});

