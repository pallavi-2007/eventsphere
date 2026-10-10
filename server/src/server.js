import app from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';

const startServer = async () => {
  // Start server listening
  const server = app.listen(config.port, () => {
    console.log(`===============================================`);
    console.log(`  EventSphere API Server running on port ${config.port}`);
    console.log(`  Environment: ${config.nodeEnv}`);
    console.log(`  Health Check: http://localhost:${config.port}/health`);
    console.log(`===============================================`);
  });

  // Connect to database
  connectDB();

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
