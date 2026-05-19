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
 *
 * @see Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
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
} from '@chakra-ui/react';
import { useColorModeValue } from '@/hooks/useColorMode';

import { useAppDispatch, useAppSelector } from '@/store';
import { login, clearAuthError } from '@/store/slices';
import { selectAuthLoading, selectAuthError } from '@/store/selectors';
import {
  AppCard,
  AppCardBody,
  AppButton,
  AppInput,
  AppTooltip,
} from '@/components/chakra';

interface LoginScreenProps {
  onNavigateToRegister: () => void;
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

  // Color mode values for light/dark support
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

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
   * Handle input change and clear related errors
   */
  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value;
      setEmail(text);
      if (validationErrors.email) {
        setValidationErrors((prev) => ({ ...prev, email: undefined }));
      }
      if (error) {
        dispatch(clearAuthError());
      }
    },
    [dispatch, error, validationErrors.email]
  );

  const handlePasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value;
      setPassword(text);
      if (validationErrors.password) {
        setValidationErrors((prev) => ({ ...prev, password: undefined }));
      }
      if (error) {
        dispatch(clearAuthError());
      }
    },
    [dispatch, error, validationErrors.password]
  );

  /**
   * Handle form submission on Enter key
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !isLoading) {
        handleLogin();
      }
    },
    [handleLogin, isLoading]
  );

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
                {error && (
                  <Alert.Root status="error" borderRadius="md">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Title>{error}</Alert.Title>
                    </Alert.Content>
                  </Alert.Root>
                )}

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
                  disabled={isLoading}
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
                  disabled={isLoading}
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
                    disabled={isLoading}
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
