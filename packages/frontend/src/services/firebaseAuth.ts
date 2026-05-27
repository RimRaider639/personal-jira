import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  AuthError,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/config/firebase';

/**
 * Result returned from successful Firebase authentication
 */
export interface FirebaseAuthResult {
  user: FirebaseUser;
  idToken: string;
}

/**
 * Mapped Firebase authentication error types for consistent error handling
 */
export type FirebaseAuthError =
  | 'popup-blocked'
  | 'account-disabled'
  | 'network-error'
  | 'cancelled'
  | 'unknown';

/**
 * Sign in with Google using Firebase popup authentication.
 * Requests email and profile scopes from Google.
 *
 * @returns Promise resolving to FirebaseAuthResult with user and ID token
 * @throws Error if Firebase is not initialized or authentication fails
 *
 * Validates: Requirements 2.2, 2.3
 */
export async function signInWithGoogle(): Promise<FirebaseAuthResult> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Firebase not initialized');
  }

  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');

  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();

  return {
    user: result.user,
    idToken,
  };
}

/**
 * Sign out from Firebase authentication.
 * Clears the current Firebase session.
 *
 * Validates: Requirements 4.6
 */
export async function signOutFirebase(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth) {
    await signOut(auth);
  }
}

/**
 * Refresh the Firebase ID token for the current user.
 * Forces a token refresh to get a new valid token.
 *
 * @returns Promise resolving to the new ID token, or null if no user is signed in
 *
 * Validates: Requirements 4.3
 */
export async function refreshFirebaseToken(): Promise<string | null> {
  const auth = getFirebaseAuth();
  if (!auth?.currentUser) {
    return null;
  }
  return auth.currentUser.getIdToken(true);
}

/**
 * Subscribe to Firebase authentication state changes.
 * The callback is invoked whenever the auth state changes (sign in, sign out, token refresh).
 *
 * @param callback - Function called with the current Firebase user or null
 * @returns Unsubscribe function to stop listening to auth state changes
 *
 * Validates: Requirements 6.3
 */
export function subscribeToAuthState(
  callback: (user: FirebaseUser | null) => void
): () => void {
  const auth = getFirebaseAuth();
  if (!auth) {
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

/**
 * Map Firebase AuthError codes to simplified error types.
 * Provides consistent error handling across the application.
 *
 * @param error - Firebase AuthError to map
 * @returns Simplified FirebaseAuthError type
 *
 * Validates: Requirements 7.1, 7.2
 */
export function mapFirebaseError(error: AuthError): FirebaseAuthError {
  switch (error.code) {
    case 'auth/popup-blocked':
      return 'popup-blocked';
    case 'auth/user-disabled':
      return 'account-disabled';
    case 'auth/network-request-failed':
      return 'network-error';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'cancelled';
    default:
      return 'unknown';
  }
}

/**
 * Get a user-friendly error message for a Firebase auth error type.
 *
 * @param errorType - The mapped Firebase error type
 * @returns User-friendly error message
 */
export function getFirebaseErrorMessage(errorType: FirebaseAuthError): string {
  switch (errorType) {
    case 'popup-blocked':
      return 'Please allow popups for this site to sign in with Google.';
    case 'account-disabled':
      return 'This Google account has been disabled and cannot be used.';
    case 'network-error':
      return 'Unable to connect. Please check your internet connection.';
    case 'cancelled':
      return ''; // No message for user cancellation
    case 'unknown':
    default:
      return 'Google sign-in failed. Please try again.';
  }
}

/**
 * Check if an error is a Firebase AuthError.
 *
 * @param error - Error to check
 * @returns True if the error is a Firebase AuthError
 */
export function isFirebaseAuthError(error: unknown): error is AuthError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as AuthError).code === 'string' &&
    (error as AuthError).code.startsWith('auth/')
  );
}
