import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { config } from '../config/env.js';

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email
    },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiresIn
    }
  );
};

export const registerUser = async ({ name, email, password, role = 'user' }) => {
  // Check if user exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    const error = new Error('An account with this email address already exists.');
    error.statusCode = 400;
    throw error;
  }

  // Create user
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role
  });

  const token = generateToken(user);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    token
  };
};

export const loginUser = async (email, password) => {
  if (!email || !password) {
    const error = new Error('Please provide email and password.');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    token
  };
};

export const getUserById = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

export const updateUserName = async (userId, name) => {
  if (!name || typeof name !== 'string') {
    const error = new Error('Name is required.');
    error.statusCode = 400;
    throw error;
  }

  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 50) {
    const error = new Error('Name must be between 2 and 50 characters.');
    error.statusCode = 400;
    throw error;
  }

  // Update ONLY name
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: { name: trimmed } },
    { new: true, runValidators: true }
  ).select('-password');

  if (!updatedUser) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  return updatedUser;
};
