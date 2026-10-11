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

export const connectDB = async (retries = 3, delayMs = 1500) => {
  if (isConnected || mongoose.connection.readyState === 1) {
    isConnected = true;
    return true;
  }

  if (!isConfiguredUri(config.mongoUri)) {
    console.warn('[Database] MONGODB_URI is not configured in server/.env (contains placeholders or is empty). Database connection is pending user configuration.');
    return false;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[Database] Connecting to MongoDB (attempt ${attempt}/${retries})...`);
      const conn = await mongoose.connect(config.mongoUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000
      });
      isConnected = true;
      console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
      return true;
    } catch (err) {
      isConnected = false;
      console.error(`[Database Error] Connection attempt ${attempt} failed: ${err.message}`);
      if (attempt < retries) {
        console.log(`[Database] Retrying connection in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  console.error('[Database Error] All initial MongoDB connection attempts failed.');
  return false;
};

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('[Database] MongoDB disconnected');
});

mongoose.connection.on('connected', () => {
  isConnected = true;
});

export const getDBStatus = () => {
  if (!isConfiguredUri(config.mongoUri)) {
    return 'not configured';
  }
  const state = mongoose.connection.readyState;
  if (state === 1) return 'connected';
  if (state === 2) return 'connecting';
  if (state === 3) return 'disconnecting';
  return 'disconnected';
};

export const isDBReady = () => {
  return mongoose.connection.readyState === 1;
};
