import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  checkFirebaseSession,
  setFirebaseInitialized,
  setFirebaseError,
  resetAuth,
} from '@/store/slices/authSlice';
import { initializeFirebase, isFirebaseInitialized } from '@/config/firebase';
import { subscribeToAuthState } from '@/services/firebaseAuth';
import { useTheme } from '@/theme/ThemeContext';

/**
 * Auth check timeout in milliseconds (10 seconds)
 * Validates: Requirements 6.5
 */
const AUTH_CHECK_TIMEOUT_MS = 10000;

interface AuthInitializerProps {
  children: React.ReactNode;
}

/**
 * AuthInitializer component handles Firebase initialization and session checking on app startup.
 * 
 * Responsibilities:
 * - Initialize Firebase on app startup
 * - Check for existing Firebase session
 * - Dispatch checkFirebaseSession if session exists
 * - Display loading indicator during auth check
 * - Implement 10-second timeout for auth state determination
 * - Redirect to login if auth check fails or times out
 * 
 * Validates: Requirements 6.1, 6.2, 6.4, 6.5
 */
export function AuthInitializer({ children }: AuthInitializerProps): React.JSX.Element {
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  
  // Track initialization state
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  
  // Get auth state from Redux
  const isCheckingAuth = useAppSelector((state) => state.auth.isCheckingAuth);
  const firebaseInitialized = useAppSelector((state) => state.auth.firebaseInitialized);
  
  // Refs for cleanup
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const hasCheckedSession = useRef(false);

  /**
   * Handle auth check timeout
   * Validates: Requirements 6.5
   */
  const handleTimeout = useCallback(() => {
    console.warn('Auth check timed out after 10 seconds');
    setIsInitializing(false);
    // Reset auth state to redirect to login
    dispatch(resetAuth());
  }, [dispatch]);

  /**
   * Initialize Firebase and check for existing session
   * Validates: Requirements 6.1, 6.2
   */
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Start timeout timer
        // Validates: Requirements 6.5
        timeoutRef.current = setTimeout(() => {
          if (isMounted) {
            handleTimeout();
          }
        }, AUTH_CHECK_TIMEOUT_MS);

        // Initialize Firebase
        // Validates: Requirements 6.1
        const firebaseResult = initializeFirebase();
        
        if (!firebaseResult) {
          // Firebase initialization failed - continue without Firebase auth
          console.warn('Firebase initialization failed - continuing without Firebase auth');
          dispatch(setFirebaseError('Firebase configuration is incomplete'));
          dispatch(setFirebaseInitialized(false));
          
          // Clear timeout and finish initialization
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          
          if (isMounted) {
            setIsInitializing(false);
          }
          return;
        }

        // Firebase initialized successfully
        dispatch(setFirebaseInitialized(true));
        dispatch(setFirebaseError(null));

        // Subscribe to auth state changes
        // Validates: Requirements 6.3
        unsubscribeRef.current = subscribeToAuthState(async (firebaseUser) => {
          // Only check session once on initial load
          if (hasCheckedSession.current) {
            return;
          }
          hasCheckedSession.current = true;

          if (firebaseUser) {
            // User is signed in with Firebase - check session with backend
            // Validates: Requirements 6.2
            try {
              await dispatch(checkFirebaseSession()).unwrap();
            } catch (error) {
              console.warn('Firebase session check failed:', error);
              // Session check failed - user will be redirected to login
            }
          }

          // Clear timeout and finish initialization
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }

          if (isMounted) {
            setIsInitializing(false);
          }
        });

        // If no auth state change fires within a short time, 
        // it means there's no Firebase user - finish initialization
        setTimeout(() => {
          if (!hasCheckedSession.current && isMounted) {
            hasCheckedSession.current = true;
            
            // Clear timeout
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            
            setIsInitializing(false);
          }
        }, 2000); // Give Firebase 2 seconds to report auth state

      } catch (error) {
        console.error('Auth initialization error:', error);
        
        if (isMounted) {
          setInitError(error instanceof Error ? error.message : 'Authentication initialization failed');
          setIsInitializing(false);
        }

        // Clear timeout on error
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    };

    initializeAuth();

    // Cleanup
    return () => {
      isMounted = false;
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [dispatch, handleTimeout]);

  // Show loading indicator during initialization
  // Validates: Requirements 6.4
  if (isInitializing || isCheckingAuth) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Checking authentication...
        </Text>
      </View>
    );
  }

  // Show error if initialization failed (but still render children to allow login)
  if (initError) {
    console.warn('Auth initialization error:', initError);
    // Don't block the app - just log the error and continue
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});
