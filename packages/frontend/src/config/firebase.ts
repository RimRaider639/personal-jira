import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

/**
 * Initialize Firebase with configuration from environment variables.
 * Returns the Firebase app and auth instances, or null if configuration is incomplete.
 *
 * @returns Firebase app and auth instances, or null if initialization fails
 */
export function initializeFirebase(): { app: FirebaseApp; auth: Auth } | null {
  // Return existing instances if already initialized
  if (app && auth) {
    return { app, auth };
  }

  const config: FirebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
  };

  // Validate required config - apiKey and projectId are essential
  if (!config.apiKey || !config.projectId) {
    console.error('Firebase configuration is incomplete. Required: EXPO_PUBLIC_FIREBASE_API_KEY and EXPO_PUBLIC_FIREBASE_PROJECT_ID');
    return null;
  }

  try {
    app = initializeApp(config);
    auth = getAuth(app);
    return { app, auth };
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    return null;
  }
}

/**
 * Get the Firebase Auth instance.
 * Returns null if Firebase has not been initialized.
 *
 * @returns Firebase Auth instance or null
 */
export function getFirebaseAuth(): Auth | null {
  return auth;
}

/**
 * Get the Firebase App instance.
 * Returns null if Firebase has not been initialized.
 *
 * @returns Firebase App instance or null
 */
export function getFirebaseApp(): FirebaseApp | null {
  return app;
}

/**
 * Check if Firebase has been initialized.
 *
 * @returns true if Firebase is initialized, false otherwise
 */
export function isFirebaseInitialized(): boolean {
  return app !== null && auth !== null;
}
