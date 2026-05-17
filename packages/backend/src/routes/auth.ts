import { Router, Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { hashPassword, comparePassword, generateToken } from '../services/auth.service';
import { createError } from '../middleware/errorHandler';
import { RegisterRequest, LoginRequest, AuthResponse, User as UserType } from '@kanban/shared';

const router = Router();

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^\S+@\S+\.\S+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Requires at least 8 characters
 */
function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

/**
 * Transform Mongoose user document to API response format
 */
function transformUser(user: { _id: unknown; email: string; displayName: string; createdAt: Date; updatedAt: Date }): UserType {
  return {
    id: String(user._id),
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, displayName } = req.body as RegisterRequest;

    // Validate required fields
    if (!email || !password || !displayName) {
      throw createError('Email, password, and display name are required', 400);
    }

    // Validate email format
    if (!isValidEmail(email)) {
      throw createError('Invalid email format', 400);
    }

    // Validate password strength
    if (!isValidPassword(password)) {
      throw createError('Password must be at least 8 characters long', 400);
    }

    // Validate display name
    if (displayName.trim().length === 0) {
      throw createError('Display name cannot be empty', 400);
    }

    if (displayName.length > 100) {
      throw createError('Display name cannot exceed 100 characters', 400);
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw createError('A user with this email already exists', 409);
    }

    // Hash password with bcrypt (12 rounds)
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await User.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      displayName: displayName.trim(),
    });

    // Generate JWT token
    const token = generateToken(String(user._id));

    // Return user and token
    const response: AuthResponse = {
      user: transformUser(user),
      token,
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Authenticate a user and return a JWT token
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body as LoginRequest;

    // Validate required fields
    if (!email || !password) {
      throw createError('Email and password are required', 400);
    }

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      throw createError('Invalid email or password', 401);
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw createError('Invalid email or password', 401);
    }

    // Generate JWT token with user ID and 7d expiration
    const token = generateToken(String(user._id));

    // Return user and token
    const response: AuthResponse = {
      user: transformUser(user),
      token,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Clear session (stateless, just acknowledge)
 * In a stateless JWT system, logout is handled client-side by removing the token
 */
router.post('/logout', (_req: Request, res: Response): void => {
  // In a stateless JWT system, the server doesn't maintain sessions
  // The client is responsible for removing the token
  // This endpoint exists for API completeness and potential future token blacklisting
  res.status(200).json({
    message: 'Logged out successfully',
  });
});

export default router;
