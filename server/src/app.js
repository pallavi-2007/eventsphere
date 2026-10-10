import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { getHealth } from './controllers/healthController.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Top-level /health endpoint (as specified: /health endpoint)
app.get('/health', getHealth);

// API routes
app.use('/api', routes);

// 404 Handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.originalUrl}`
  });
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
