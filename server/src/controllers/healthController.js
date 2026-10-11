import { getDBStatus } from '../config/db.js';
import { getRedisStatus } from '../config/redis.js';

export const getHealth = (req, res) => {
  const dbStatus = getDBStatus();
  const redisStatus = getRedisStatus();
  const isHealthy = dbStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
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
