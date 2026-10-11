import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { getHealth } from './controllers/healthController.js';
import { errorHandler } from './middleware/errorHandler.js';
import { isDBReady } from './config/db.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Top-level /health endpoint (always accessible to report status accurately)
app.get('/health', getHealth);

// Database readiness middleware for API routes: return 503 if DB is not ready
app.use('/api', (req, res, next) => {
  if (!isDBReady()) {
    return res.status(503).json({
      success: false,
      isWakingUp: true,
      error: 'Server is waking up, please retry.'
    });
  }
  next();
});

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
