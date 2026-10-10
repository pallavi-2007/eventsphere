import Redis from 'ioredis';
import { config } from './env.js';

let redisClient = null;
let isRedisConnected = false;

if (config.redisUrl) {
  try {
    redisClient = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 3) {
          return null; // stop retrying after 3 attempts
        }
        return Math.min(times * 500, 2000);
      },
      lazyConnect: true
    });

    redisClient.connect().then(() => {
      isRedisConnected = true;
      console.log('[Cache] Redis connected successfully');
    }).catch((err) => {
      isRedisConnected = false;
      console.warn(`[Cache Warning] Redis not reachable at ${config.redisUrl} (${err.message}).`);
    });

    redisClient.on('connect', () => {
      isRedisConnected = true;
    });

    redisClient.on('error', () => {
      isRedisConnected = false;
    });
  } catch (error) {
    console.warn(`[Cache Warning] Could not initialize Redis client: ${error.message}`);
  }
} else {
  console.log('[Cache] REDIS_URL is not set. Redis is optional; continuing in no-cache mode.');
}

export const getRedisStatus = () => {
  if (!config.redisUrl) {
    return 'not configured';
  }
  return isRedisConnected ? 'connected' : 'disconnected';
};

export { redisClient };
