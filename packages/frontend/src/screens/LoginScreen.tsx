/**
 * LoginScreen - User authentication screen
 *
 * Migrated to Chakra UI v3 with:
 * - Card component for form container
 * - FormControl, FormLabel, Input for form fields
 * - Button with loading state
 * - Alert for API errors
 * - Link for registration navigation
 * - Tooltip on sign-in button
 * - VStack and Center for layout
 * - Google OAuth sign-in button
 *
 * @see Requirements: 2.1, 2.7, 2.8, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 7.1, 7.2, 7.4
 */

import React, { useState, useCallback } from 'react';
import {
  Alert,
  Box,
  Center,
  Heading,
  Link,
  Text,
  VStack,
  Separator,
  HStack,
} from '@chakra-ui/react';
import { useColorModeValue } from '@/hooks/useColorMode';

import { useAppDispatch, useAppSelector } from '@/store';
import { login, loginWithGoogle, clearAuthError } from '@/store/slices';
import { selectAuthLoading, selectAuthError } from '@/store/selectors';
import {
  AppCard,
  AppCardBody,
  AppButton,
  AppInput,
  AppTooltip,
} from '@/components/chakra';
import type { FirebaseAuthErrorType } from '@kanban/shared';

interface LoginScreenProps {
  onNavigateToRegister: () => void;
}

/**
 * Google icon SVG component for the sign-in button
 */
function GoogleIcon(): React.JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9.003 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.26c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332A8.997 8.997 0 0 0 9.003 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.712A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.96A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.96 4.042l3.004-2.33z"
        fill="#FBBC05"
      />
      <path
        d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.002 0A8.997 8.997 0 0 0 .96 4.958l3.005 2.332c.708-2.127 2.692-3.71 5.036-3.71z"
        fill="#EA4335"
      />
    </svg>
  );
}

/**
 * Get user-friendly error message for Firebase auth errors
 * 
 * Validates: Requirements 7.1, 7.2, 7.4
 */
function getGoogleAuthErrorMessage(errorType: FirebaseAuthErrorType): string | null {
  switch (errorType) {
    case 'popup-blocked':
      return 'Please allow popups for this site to sign in with Google. Check your browser settings and try again.';
    case 'account-disabled':
      return 'This Google account has been disabled and cannot be used.';
    case 'network-error':
      return 'Unable to connect. Please check your internet connection and try again.';
    case 'cancelled':
      // Handle user cancellation silently - no error message
      return null;
    case 'unknown':
    default:
      return 'Google sign-in failed. Please try again.';
  }
}

/**
 * LoginScreen - User authentication screen
 *
 * Requirements:
 * - 3.1: Use Chakra UI Card component for the login form container
 * - 3.2: Use Chakra UI FormControl, FormLabel, and Input components
 * - 3.3: Use Chakra UI Button component with loading state
 * - 3.4: Display FormErrorMessage for validation errors
 * - 3.5: Display Alert component for API errors
 * - 3.6: Include Link component for navigation to registration
 * - 3.7: Use VStack and Center components for layout
 * - 3.8: Tooltip on sign-in button hover
 */
export function LoginScreen({ onNavigateToRegister }: LoginScreenProps): React.JSX.Element {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  // Track Google sign-in loading state separately for better UX
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  // Track Google-specific error for displaying popup blocked instructions
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Color mode values for light/dark support
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const dividerColor = useColorModeValue('gray.200', 'gray.600');

  /**
   * Validate form inputs
   */
  const validateForm = useCallback((): boolean => {
    const errors: { email?: string; password?: string } = {};

    // Email validation
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [email, password]);

  /**
   * Handle login submission
   */
  const handleLogin = useCallback(async () => {
    // Clear previous errors
    dispatch(clearAuthError());
    setValidationErrors({});
    setGoogleError(null);

    if (!validateForm()) {
      return;
    }

    try {
      await dispatch(login({ email: email.trim().toLowerCase(), password })).unwrap();
      // Navigation will be handled by the auth state change in RootNavigator
    } catch {
      // Error is handled by the slice and displayed via selectAuthError
    }
  }, [dispatch, email, password, validateForm]);

  /**
   * Handle Google sign-in
   * 
   * Validates: Requirements 2.1, 2.7, 2.8, 7.1, 7.2, 7.4
   */
  const handleGoogleSignIn = useCallback(async () => {
    // Clear previous errors
    dispatch(clearAuthError());
    setValidationErrors({});
    setGoogleError(null);
    setIsGoogleLoading(true);

    try {
      const result = await dispatch(loginWithGoogle()).unwrap();
      // Navigation will be handled by the auth state change in RootNavigator
    } catch (error) {
      // Handle Google-specific errors with appropriate messages
      const typedError = error as { message: string; errorType: FirebaseAuthErrorType };
      const errorMessage = getGoogleAuthErrorMessage(typedError.errorType);
      
      // Only set error if it's not a user cancellation (handled silently)
      if (errorMessage !== null) {
        setGoogleError(errorMessage);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  }, [dispatch]);

  /**
   * Handle input change and clear related errors
   */
  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value;
      setEmail(text);
      if (validationErrors.email) {
        setValidationErrors((prev) => ({ ...prev, email: undefined }));
      }
      if (error || googleError) {
        dispatch(clearAuthError());
        setGoogleError(null);
      }
    },
    [dispatch, error, googleError, validationErrors.email]
  );

  const handlePasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value;
      setPassword(text);
      if (validationErrors.password) {
        setValidationErrors((prev) => ({ ...prev, password: undefined }));
      }
      if (error || googleError) {
        dispatch(clearAuthError());
        setGoogleError(null);
      }
    },
    [dispatch, error, googleError, validationErrors.password]
  );

  /**
   * Handle form submission on Enter key
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !isLoading && !isGoogleLoading) {
        handleLogin();
      }
    },
    [handleLogin, isLoading, isGoogleLoading]
  );

  // Determine which error to display (prioritize Google error for better UX)
  const displayError = googleError || error;

  return (
    <Box
      minH="100vh"
      bg={bgColor}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      {/* Requirement 3.7: Use Center for centering */}
      <Center w="full" maxW="md">
        {/* Requirement 3.7: Use VStack for vertical layout */}
        <VStack gap={8} w="full">
          {/* Header */}
          <VStack gap={2} textAlign="center">
            <Text fontSize="6xl" aria-hidden="true">
              📋
            </Text>
            <Heading as="h1" size="2xl" color="fg">
              Personal Kanban
            </Heading>
            <Text color="fg.muted" fontSize="lg">
              Sign in to continue
            </Text>
          </VStack>

          {/* Requirement 3.1: Use Chakra UI Card component */}
          <AppCard
            w="full"
            bg={cardBg}
            variant="elevated"
            p={0}
          >
            <AppCardBody p={6}>
              <VStack gap={5} as="form" onKeyDown={handleKeyDown}>
                {/* Requirement 3.5: Display Alert for API errors */}
                {/* Requirement 7.1, 7.2: Display appropriate error messages for Google OAuth */}
                {displayError && (
                  <Alert.Root status="error" borderRadius="md">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Title>{displayError}</Alert.Title>
                    </Alert.Content>
                  </Alert.Root>
                )}

                {/* Requirement 2.1: "Sign in with Google" button */}
                <AppButton
                  intent="secondary"
                  w="full"
                  size="lg"
                  onClick={handleGoogleSignIn}
                  loading={isGoogleLoading}
                  loadingText="Signing in with Google..."
                  disabled={isLoading || isGoogleLoading}
                  data-testid="google-signin-button"
                  aria-label="Sign in with Google"
                >
                  <HStack gap={2}>
                    <GoogleIcon />
                    <Text>Sign in with Google</Text>
                  </HStack>
                </AppButton>

                {/* Divider between Google and email/password login */}
                <HStack w="full" gap={4}>
                  <Separator flex={1} borderColor={dividerColor} />
                  <Text color="fg.muted" fontSize="sm" whiteSpace="nowrap">
                    or continue with email
                  </Text>
                  <Separator flex={1} borderColor={dividerColor} />
                </HStack>

                {/* Requirement 3.2: Use FormControl, FormLabel, Input */}
                {/* Requirement 3.4: Display FormErrorMessage for validation errors */}
                <AppInput
                  id="email"
                  name="email"
                  label="Email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={handleEmailChange}
                  error={validationErrors.email}
                  disabled={isLoading || isGoogleLoading}
                  autoComplete="email"
                  data-testid="email-input"
                />

                <AppInput
                  id="password"
                  name="password"
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={handlePasswordChange}
                  error={validationErrors.password}
                  disabled={isLoading || isGoogleLoading}
                  autoComplete="current-password"
                  data-testid="password-input"
                />

                {/* Requirement 3.3: Button with loading state */}
                {/* Requirement 3.8: Tooltip on sign-in button hover */}
                <AppTooltip label="Sign in to your account" placement="top">
                  <AppButton
                    intent="primary"
                    w="full"
                    size="lg"
                    onClick={handleLogin}
                    loading={isLoading}
                    loadingText="Signing in..."
                    disabled={isLoading || isGoogleLoading}
                    data-testid="login-button"
                    aria-label="Sign in"
                  >
                    Sign In
                  </AppButton>
                </AppTooltip>

                {/* Requirement 3.6: Link for registration navigation */}
                <Box textAlign="center" pt={2}>
                  <Text as="span" color="fg.muted" fontSize="sm">
                    Don't have an account?{' '}
                  </Text>
                  <Link
                    color="brand.500"
                    fontWeight="semibold"
                    fontSize="sm"
                    onClick={onNavigateToRegister}
                    cursor="pointer"
                    _hover={{ textDecoration: 'underline' }}
                    data-testid="register-link"
                    aria-label="Create an account"
                  >
                    Create one
                  </Link>
                </Box>
              </VStack>
            </AppCardBody>
          </AppCard>
        </VStack>
      </Center>
    </Box>
  );
}

export default LoginScreen;
