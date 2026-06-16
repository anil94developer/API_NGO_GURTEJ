const mongoose = require('mongoose');

let memoryServer = null;
let activeUri = null;

const connectDB = async () => {
  const atlasUri = process.env.MONGODB_URI;
  const useMemory = process.env.USE_MEMORY_DB === 'true';

  if (!useMemory && atlasUri) {
    try {
      await mongoose.connect(atlasUri);
      activeUri = atlasUri;
      console.log('MongoDB connected (Atlas)');
      return activeUri;
    } catch (error) {
      if (process.env.NODE_ENV === 'production') {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
      }
      console.warn(
        `Atlas connection failed (${error.message}). Falling back to in-memory MongoDB for development.`
      );
    }
  }

  const { MongoMemoryServer } = require('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create();
  activeUri = memoryServer.getUri('hopeconnectDB');
  await mongoose.connect(activeUri);
  console.log('MongoDB connected (in-memory dev database)');
  return activeUri;
};

const getMongoUri = () => activeUri;

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
};

module.exports = { connectDB, getMongoUri, disconnectDB };
