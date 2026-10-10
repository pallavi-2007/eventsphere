import { getDBStatus } from '../config/db.js';
import { getRedisStatus } from '../config/redis.js';

export const getHealth = (req, res) => {
  const dbStatus = getDBStatus();
  const redisStatus = getRedisStatus();

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    services: {
      api: 'up',
      database: dbStatus,
      redis: redisStatus
    },
    version: '1.0.0-phase1'
  });
};
