import { Request, Response, NextFunction } from 'express';
import { AuthProvider } from '@kanban/shared';
import { verifyToken, JwtPayload } from '../services/auth.service';
import {
  logAuthSuccess,
  logAuthFailure,
  generateRequestId,
} from '../services/authLogger.service';
import { verifyFirebaseToken } from '../config/firebase';
import { User } from '../models/User';
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
    authProvider: AuthProvider;
  };
  file?: MulterFile;
}

/**
 * Detects if a token is a Firebase ID token based on its header structure.
 * Firebase tokens have a 'kid' (key ID) field in their header, while our
 * application JWTs do not.
 *
 * @param token - The JWT token string to check
 * @returns true if the token appears to be a Firebase token, false otherwise
 */
export function isFirebaseToken(token: string): boolean {
  // JWTs have 3 parts separated by dots
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  try {
    // Decode the header (first part) from base64url
    const headerBase64 = parts[0];
    if (!headerBase64) {
      return false;
    }
    // Handle base64url encoding (replace - with + and _ with /)
    const base64 = headerBase64.replace(/-/g, '+').replace(/_/g, '/');
    const headerJson = Buffer.from(base64, 'base64').toString('utf8');
    const header = JSON.parse(headerJson);

    // Firebase tokens have 'kid' (key ID) in header for key rotation
    // Our application JWTs don't include this field
    return 'kid' in header;
  } catch {
    // If we can't parse the header, assume it's not a Firebase token
    return false;
  }
}

/**
 * Dual-token authentication middleware
 * Supports both Firebase ID tokens (for Google OAuth users) and application JWTs
 * (for email/password users). Detects token type automatically and validates accordingly.
 *
 * For Firebase tokens:
 * - Verifies using Firebase Admin SDK
 * - Looks up user by firebaseUid
 * - Rejects revoked tokens (requirement 8.1)
 *
 * For application JWTs:
 * - Verifies using existing JWT verification
 * - Looks up user by userId from token payload
 *
 * Adds userId and authProvider to the request context for downstream handlers.
 * Logs authentication events for security monitoring (requirements 8.5, 8.6).
 */
export async function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const requestId = generateRequestId();

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      logAuthFailure(req, 'jwt_auth_failure', new Error('No authorization header'), {
        requestId,
      });
      throw createError('No authorization header provided', 401);
    }

    // Check for Bearer token format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      logAuthFailure(req, 'jwt_auth_failure', new Error('Invalid header format'), {
        requestId,
      });
      throw createError('Invalid authorization header format. Use: Bearer <token>', 401);
    }

    const token = parts[1];
    if (!token) {
      logAuthFailure(req, 'jwt_auth_failure', new Error('Token missing'), {
        requestId,
      });
      throw createError('Token is missing', 401);
    }

    let userId: string;
    let authProvider: AuthProvider;

    if (isFirebaseToken(token)) {
      // Firebase token verification path
      try {
        const decodedToken = await verifyFirebaseToken(token);

        // Find user by Firebase UID
        const user = await User.findOne({ firebaseUid: decodedToken.uid });
        if (!user) {
          logAuthFailure(req, 'firebase_auth_failure', new Error('User not found'), {
            firebaseUid: decodedToken.uid,
            requestId,
          });
          throw createError('User not found', 401);
        }

        userId = String(user._id);
        authProvider = user.authProvider;

        // Log successful Firebase token verification
        logAuthSuccess(req, 'firebase_auth_success', {
          userId,
          firebaseUid: decodedToken.uid,
          email: user.email,
          authProvider,
          requestId,
        });
      } catch (error) {
        // Log for security monitoring with sanitized details (requirement 8.5, 8.6)
        // Only log if not already logged above
        if (!(error instanceof Error && error.message === 'User not found')) {
          logAuthFailure(req, 'firebase_auth_failure', error, {
            requestId,
          });
        }

        // Check for specific Firebase errors
        if (error instanceof Error) {
          if (error.message === 'Firebase Admin SDK not initialized') {
            throw createError('Authentication service unavailable', 503);
          }
          if (
            error.message === 'Token audience mismatch' ||
            error.message === 'Token issuer mismatch'
          ) {
            throw createError('Invalid or expired token', 401);
          }
        }

        throw createError('Invalid or expired token', 401);
      }
    } else {
      // Existing JWT verification path
      let payload: JwtPayload;
      try {
        payload = verifyToken(token);
      } catch (error) {
        // Log failed JWT verification
        logAuthFailure(req, 'jwt_auth_failure', error, {
          requestId,
        });

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

      userId = payload.userId;

      // Get auth provider from user record
      const user = await User.findById(userId);
      authProvider = user?.authProvider || 'email';

      // Log successful JWT verification
      logAuthSuccess(req, 'jwt_auth_success', {
        userId,
        email: user?.email,
        authProvider,
        requestId,
      });
    }

    // Add user info to request with authProvider context
    req.user = {
      userId,
      authProvider,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional dual-token authentication middleware
 * Similar to authenticate but doesn't fail if no token is provided.
 * Supports both Firebase ID tokens and application JWTs.
 * Useful for routes that work differently for authenticated vs anonymous users.
 */
export async function optionalAuthenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
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
      if (isFirebaseToken(token)) {
        // Firebase token verification path
        const decodedToken = await verifyFirebaseToken(token);
        const user = await User.findOne({ firebaseUid: decodedToken.uid });
        if (user) {
          req.user = {
            userId: String(user._id),
            authProvider: user.authProvider,
          };
        }
      } else {
        // Existing JWT verification path
        const payload = verifyToken(token);
        const user = await User.findById(payload.userId);
        req.user = {
          userId: payload.userId,
          authProvider: user?.authProvider || 'email',
        };
      }
    } catch {
      // Token invalid, continue without user
    }

    next();
  } catch (error) {
    next(error);
  }
}

export default authenticate;
