import * as admin from 'firebase-admin';
import { config } from './index';

let firebaseApp: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK with service account credentials.
 * Returns the Firebase app instance or null if initialization fails.
 */
export function initializeFirebaseAdmin(): admin.app.App | null {
  if (firebaseApp) {
    return firebaseApp;
  }

  const serviceAccountKey = config.firebase.serviceAccountKey;
  const projectId = config.firebase.projectId;

  if (!serviceAccountKey || !projectId) {
    console.error(
      'Firebase Admin SDK configuration is incomplete. ' +
        'Please set FIREBASE_SERVICE_ACCOUNT_KEY and FIREBASE_PROJECT_ID environment variables.'
    );
    return null;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountKey);

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId,
    });

    console.info('Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    return null;
  }
}

/**
 * Get the Firebase Admin app instance.
 * Returns null if Firebase has not been initialized.
 */
export function getFirebaseAdmin(): admin.app.App | null {
  return firebaseApp;
}

/**
 * Verify a Firebase ID token and return the decoded token.
 * Validates audience and issuer to ensure the token is intended for this application.
 *
 * @param idToken - The Firebase ID token to verify
 * @returns The decoded token containing uid, email, and other claims
 * @throws Error if token is invalid, expired, revoked, or has mismatched audience/issuer
 */
export async function verifyFirebaseToken(
  idToken: string
): Promise<admin.auth.DecodedIdToken> {
  if (!firebaseApp) {
    throw new Error('Firebase Admin SDK not initialized');
  }

  // Verify the token with checkRevoked=true to reject revoked tokens
  const decodedToken = await admin.auth(firebaseApp).verifyIdToken(idToken, true);

  const projectId = config.firebase.projectId;

  // Validate audience matches our project ID
  if (decodedToken.aud !== projectId) {
    throw new Error('Token audience mismatch');
  }

  // Validate issuer matches expected Firebase Auth issuer URL
  const expectedIssuer = `https://securetoken.google.com/${projectId}`;
  if (decodedToken.iss !== expectedIssuer) {
    throw new Error('Token issuer mismatch');
  }

  return decodedToken;
}

/**
 * Check if Firebase Admin SDK is initialized and ready.
 */
export function isFirebaseInitialized(): boolean {
  return firebaseApp !== null;
}

export default {
  initializeFirebaseAdmin,
  getFirebaseAdmin,
  verifyFirebaseToken,
  isFirebaseInitialized,
};
