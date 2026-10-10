import mongoose from 'mongoose';
import { config } from './env.js';

let isConnected = false;

export const isConfiguredUri = (uri) => {
  if (!uri) return false;
  if (uri.includes('<username>') || uri.includes('<password>') || uri.includes('<cluster-url>')) {
    return false;
  }
  return true;
};

export const connectDB = async () => {
  if (isConnected) {
    return;
  }

  if (!isConfiguredUri(config.mongoUri)) {
    console.warn('[Database] MONGODB_URI is not configured in server/.env (contains placeholders or is empty). Database connection is pending user configuration.');
    return;
  }

  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error(`[Database Error] MongoDB connection failed: ${err.message}`);
  }
};

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('[Database] MongoDB disconnected');
});

export const getDBStatus = () => {
  if (!isConfiguredUri(config.mongoUri)) {
    return 'not configured';
  }
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] || 'unknown';
};
