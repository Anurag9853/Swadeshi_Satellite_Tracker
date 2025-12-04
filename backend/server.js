const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const { ensureSeedData } = require('./utils/seedHelper');
const { scheduleTleRefresh } = require('./utils/tleRefresh');
const app = require('./app');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await ensureSeedData();
    if (process.env.NODE_ENV !== 'test') {
      scheduleTleRefresh();
    }

    const server = app.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`);
    });
    return server;
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { startServer };

