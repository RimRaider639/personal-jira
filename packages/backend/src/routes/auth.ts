import { Router, Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { hashPassword, comparePassword, generateToken } from '../services/auth.service';
import {
  logAuthSuccess,
  logAuthFailure,
  generateRequestId,
} from '../services/authLogger.service';
import { createError } from '../middleware/errorHandler';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { verifyFirebaseToken, isFirebaseInitialized } from '../config/firebase';
import {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  User as UserType,
  AuthProvider,
  FirebaseAuthRequest,
  LinkGoogleResponse,
} from '@kanban/shared';

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
function transformUser(user: { _id: unknown; email: string; displayName: string; authProvider?: AuthProvider; createdAt: Date; updatedAt: Date }): UserType {
  return {
    id: String(user._id),
    email: user.email,
    displayName: user.displayName,
    authProvider: user.authProvider || 'email',
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const requestId = generateRequestId();

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

    // Log successful registration
    logAuthSuccess(req, 'register_success', {
      userId: String(user._id),
      email: user.email,
      authProvider: 'email',
      requestId,
    });

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
  const requestId = generateRequestId();
  const { email } = req.body as LoginRequest;

  try {
    const { password } = req.body as LoginRequest;

    // Validate required fields
    if (!email || !password) {
      throw createError('Email and password are required', 400);
    }

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      // Log failed login attempt
      logAuthFailure(req, 'login_failure', new Error('User not found'), {
        email,
        requestId,
      });
      throw createError('Invalid email or password', 401);
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      // Log failed login attempt
      logAuthFailure(req, 'login_failure', new Error('Invalid password'), {
        email,
        userId: String(user._id),
        requestId,
      });
      throw createError('Invalid email or password', 401);
    }

    // Generate JWT token with user ID and 7d expiration
    const token = generateToken(String(user._id));

    // Log successful login
    logAuthSuccess(req, 'login_success', {
      userId: String(user._id),
      email: user.email,
      authProvider: user.authProvider,
      requestId,
    });

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

/**
 * POST /api/auth/firebase
 * Authenticate with Firebase ID token (Google OAuth)
 * - Verifies Firebase ID token using Admin SDK
 * - Finds existing user by firebaseUid or email
 * - Creates new user if none exists with authProvider 'google'
 * - Links accounts if email matches existing user
 * - Generates application JWT for API authentication
 * - Returns user data and token
 */
router.post(
  '/firebase',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const requestId = generateRequestId();

    try {
      const { idToken } = req.body as FirebaseAuthRequest;

      // Validate required field
      if (!idToken) {
        throw createError('Firebase ID token is required', 400);
      }

      // Check if Firebase Admin SDK is initialized
      if (!isFirebaseInitialized()) {
        logAuthFailure(req, 'firebase_auth_failure', new Error('Firebase not initialized'), {
          requestId,
        });
        throw createError('Authentication service unavailable', 503);
      }

      // Verify the Firebase token
      let decodedToken;
      try {
        decodedToken = await verifyFirebaseToken(idToken);
      } catch (error) {
        // Log for security monitoring with sanitized details
        logAuthFailure(req, 'firebase_auth_failure', error, {
          requestId,
        });
        throw createError('Invalid Firebase token', 401);
      }

      const { uid, email, name } = decodedToken;

      // Email is required from Google account
      if (!email) {
        logAuthFailure(req, 'firebase_auth_failure', new Error('Email missing from token'), {
          firebaseUid: uid,
          requestId,
        });
        throw createError('Email is required from Google account', 400);
      }

      // Find existing user by firebaseUid or email
      let user = await User.findOne({
        $or: [{ firebaseUid: uid }, { email: email.toLowerCase() }],
      });

      if (user) {
        // Existing user found - check if we need to link accounts
        if (!user.firebaseUid) {
          // Link Google to existing email/password account
          user.firebaseUid = uid;
          user.authProvider = 'linked';
          // Update displayName if not set and Google provides one
          if (name && !user.displayName) {
            user.displayName = name;
          }
          await user.save();
        }
        // If user already has firebaseUid, they're already linked or a Google user
      } else {
        // Create new user with Google OAuth
        user = await User.create({
          email: email.toLowerCase(),
          firebaseUid: uid,
          displayName: name || email.split('@')[0],
          authProvider: 'google',
          passwordHash: '', // No password for Google-only users
        });
      }

      // Generate application JWT for API authentication
      const token = generateToken(String(user._id));

      // Log successful Firebase authentication
      logAuthSuccess(req, 'firebase_auth_success', {
        userId: String(user._id),
        firebaseUid: uid,
        email: user.email,
        authProvider: user.authProvider,
        requestId,
      });

      // Return user data and token
      const response: AuthResponse = {
        user: transformUser(user),
        token,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/link-google
 * Link Google account to existing email/password account
 * Requires existing authentication
 * Requirements: 3.2, 3.6, 5.5, 7.5
 */
router.post(
  '/link-google',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const requestId = generateRequestId();
    const userId = req.user?.userId;

    try {
      const { idToken } = req.body as FirebaseAuthRequest;

      // Validate Firebase ID token is provided
      if (!idToken) {
        throw createError('Firebase ID token is required', 400);
      }

      // Check if Firebase Admin SDK is initialized
      if (!isFirebaseInitialized()) {
        logAuthFailure(req, 'link_google_failure', new Error('Firebase not initialized'), {
          userId,
          requestId,
        });
        throw createError('Authentication service unavailable', 503);
      }

      // Verify the Firebase token
      let decodedToken;
      try {
        decodedToken = await verifyFirebaseToken(idToken);
      } catch (error) {
        // Log for security monitoring with sanitized details (requirement 8.5, 8.6)
        logAuthFailure(req, 'link_google_failure', error, {
          userId,
          requestId,
        });
        throw createError('Invalid Firebase token', 401);
      }

      const { uid: firebaseUid, email: googleEmail } = decodedToken;

      // Find the authenticated user
      const user = await User.findById(userId);
      if (!user) {
        logAuthFailure(req, 'link_google_failure', new Error('User not found'), {
          userId,
          firebaseUid,
          requestId,
        });
        throw createError('User not found', 404);
      }

      // Validate Google email matches account email (requirement 7.5)
      if (!googleEmail || googleEmail.toLowerCase() !== user.email.toLowerCase()) {
        logAuthFailure(req, 'link_google_failure', new Error('Email mismatch'), {
          userId,
          firebaseUid,
          email: googleEmail,
          requestId,
        });
        throw createError('Google account email does not match your account email', 400);
      }

      // Check if Firebase UID is already linked to another account
      const existingFirebaseUser = await User.findOne({ firebaseUid });
      if (existingFirebaseUser && String(existingFirebaseUser._id) !== userId) {
        logAuthFailure(req, 'link_google_failure', new Error('Firebase UID already linked'), {
          userId,
          firebaseUid,
          requestId,
        });
        throw createError('This Google account is already linked to another user', 409);
      }

      // Check if user already has a linked Google account
      if (user.firebaseUid && user.authProvider === 'linked') {
        logAuthFailure(req, 'link_google_failure', new Error('Account already linked'), {
          userId,
          firebaseUid,
          requestId,
        });
        throw createError('Your account is already linked to a Google account', 400);
      }

      // Link the accounts - update user with firebaseUid and authProvider 'linked'
      user.firebaseUid = firebaseUid;
      user.authProvider = 'linked';
      await user.save();

      // Log successful account linking
      logAuthSuccess(req, 'link_google_success', {
        userId,
        firebaseUid,
        email: user.email,
        authProvider: 'linked',
        requestId,
      });

      // Return success response
      const response: LinkGoogleResponse = {
        message: 'Google account linked successfully',
        user: transformUser(user),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/auth/me
 * Delete the authenticated user's account
 * Revokes all credentials and permissions before deletion
 * Requirements: 9.4, 9.5
 */
router.delete(
  '/me',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      // Find the user to be deleted
      const user = await User.findById(userId);
      if (!user) {
        throw createError('User not found', 404);
      }

      // Log credential revocation for audit trail before clearing
      const apiKeyCount = user.credentials?.apiKeys?.length || 0;
      const botTokenCount = user.credentials?.botTokens?.length || 0;
      const permissionCount = user.permissions?.length || 0;

      console.log(
        `[AUDIT] User deletion initiated - userId: ${userId}, email: ${user.email}, ` +
          `revoking ${apiKeyCount} API keys, ${botTokenCount} bot tokens, ${permissionCount} permissions`
      );

      // Clear all permissions (Requirement 9.5)
      if (user.permissions && user.permissions.length > 0) {
        console.log(`[AUDIT] Revoking ${user.permissions.length} permissions for user ${userId}`);
        user.permissions = [];
      }

      // Clear all API keys from credentials (Requirement 9.5)
      if (user.credentials?.apiKeys && user.credentials.apiKeys.length > 0) {
        console.log(`[AUDIT] Revoking ${user.credentials.apiKeys.length} API keys for user ${userId}`);
        user.credentials.apiKeys = [];
      }

      // Clear all bot tokens from credentials (Requirement 9.5)
      if (user.credentials?.botTokens && user.credentials.botTokens.length > 0) {
        console.log(`[AUDIT] Revoking ${user.credentials.botTokens.length} bot tokens for user ${userId}`);
        user.credentials.botTokens = [];
      }

      // Save the cleared credentials before deletion (ensures revocation is persisted)
      await user.save();

      // Delete the user
      await User.findByIdAndDelete(userId);

      // Log successful deletion
      console.log(`[AUDIT] User account deleted successfully - userId: ${userId}, email: ${user.email}`);

      res.status(200).json({
        message: 'Account deleted successfully',
        revokedCredentials: {
          apiKeys: apiKeyCount,
          botTokens: botTokenCount,
          permissions: permissionCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
