import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI || '',
  redisUrl: process.env.REDIS_URL || null,
  jwtSecret: process.env.JWT_SECRET || 'eventsphere_super_secret_jwt_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  qrSecret: process.env.QR_SECRET || 'eventsphere_qr_secret_fallback_2026',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173'
};
