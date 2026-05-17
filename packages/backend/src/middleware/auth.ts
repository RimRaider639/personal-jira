import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../services/auth.service';
import { createError } from './errorHandler';

/**
 * Multer file interface for uploaded files
 */
export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer: Buffer;
  stream?: NodeJS.ReadableStream;
}

/**
 * Extended Express Request interface with authenticated user
 * Note: The 'file' property is added by multer middleware
 */
export interface AuthenticatedRequest extends Omit<Request, 'file'> {
  user?: {
    userId: string;
  };
  file?: MulterFile;
}

/**
 * JWT verification middleware
 * Extracts and verifies the JWT token from the Authorization header
 * Adds the user ID to the request object for use in route handlers
 */
export function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw createError('No authorization header provided', 401);
    }

    // Check for Bearer token format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw createError('Invalid authorization header format. Use: Bearer <token>', 401);
    }

    const token = parts[1];
    if (!token) {
      throw createError('Token is missing', 401);
    }

    // Verify the token
    let payload: JwtPayload;
    try {
      payload = verifyToken(token);
    } catch (error) {
      // Handle specific JWT errors
      if (error instanceof Error) {
        if (error.name === 'TokenExpiredError') {
          throw createError('Token has expired', 401);
        }
        if (error.name === 'JsonWebTokenError') {
          throw createError('Invalid token', 401);
        }
      }
      throw createError('Token verification failed', 401);
    }

    // Add user info to request
    req.user = {
      userId: payload.userId,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication middleware
 * Similar to authenticate but doesn't fail if no token is provided
 * Useful for routes that work differently for authenticated vs anonymous users
 */
export function optionalAuthenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // No token provided, continue without user
      return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      // Invalid format, continue without user
      return next();
    }

    const token = parts[1];
    if (!token) {
      return next();
    }

    try {
      const payload = verifyToken(token);
      req.user = {
        userId: payload.userId,
      };
    } catch {
      // Token invalid, continue without user
    }

    next();
  } catch (error) {
    next(error);
  }
}

export default authenticate;
