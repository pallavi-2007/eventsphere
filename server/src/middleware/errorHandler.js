import { config } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log in dev mode
  if (config.nodeEnv === 'development') {
    console.error('[Error Handler]', err);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id: ${err.value}`;
    return res.status(404).json({ success: false, error: message });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value entered for ${field}. Please use another value.`;
    return res.status(400).json({ success: false, error: message });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join(', ');
    return res.status(400).json({ success: false, error: message });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, error: 'Invalid authentication token.' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, error: 'Authentication token expired.' });
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};
