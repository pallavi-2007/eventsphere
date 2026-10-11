import app from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';

const startServer = async () => {
  // Connect to database first before listening
  console.log('[Server] Connecting to database before accepting requests...');
  await connectDB(3, 1500);

  // Start server listening after DB connection is attempted
  const server = app.listen(config.port, () => {
    console.log(`===============================================`);
    console.log(`  EventSphere API Server running on port ${config.port}`);
    console.log(`  Environment: ${config.nodeEnv}`);
    console.log(`  Health Check: http://localhost:${config.port}/health`);
    console.log(`===============================================`);
  });

  const handleShutdown = () => {
    console.log('\n[Server] Shutting down gracefully...');
    server.close(() => {
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);
};

startServer();
