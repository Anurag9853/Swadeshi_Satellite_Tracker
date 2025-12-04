const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('tle.js', () => ({
  getSatelliteInfo: jest.fn(() => ({
    elevation: 45,
  })),
  getLatLngObj: jest.fn(() => ({
    lat: 12.34,
    lng: 56.78,
    height: 550,
  })),
  getGroundTrack: jest.fn(() =>
    Array.from({ length: 20 }, (_, idx) => ({
      lat: idx,
      lng: idx * 2,
    }))
  ),
}));

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGO_URI = uri;
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  );
});

afterAll(async () => {
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

