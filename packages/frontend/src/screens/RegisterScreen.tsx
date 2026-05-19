/**
 * RegisterScreen - User registration screen with Chakra UI
 *
 * Migrated from React Native StyleSheet to Chakra UI v3 components.
 * Features:
 * - Card container for the registration form
 * - FormControl with validation for all fields
 * - Password visibility toggle using InputGroup with InputRightElement
 * - Password match validation with FormErrorMessage
 * - Loading spinner during registration
 * - Toast notifications for success/failure
 * - Alert component for API error display
 * - Link component for navigation to login
 *
 * @see Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Center,
  VStack,
  Text,
  Link,
  Alert,
  Input,
  Field,
  IconButton,
  Group,
} from '@chakra-ui/react';
import { FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';

import { useAppDispatch, useAppSelector } from '@/store';
import { register, clearAuthError } from '@/store/slices';
import { selectAuthLoading, selectAuthError } from '@/store/selectors';
import { useAppToast } from '@/hooks/useToast';
import { AppCard, AppCardBody, AppButton } from '@/components/chakra';
import { useColorModeValue } from '@/hooks/useColorMode';

interface RegisterScreenProps {
  onNavigateToLogin: () => void;
}

/**
 * RegisterScreen - User registration screen
 *
 * Requirements:
 * - 4.1: Use Chakra UI Card component for the registration form container
 * - 4.2: Use Chakra UI FormControl with validation for all fields
 * - 4.3: Use Chakra UI InputGroup with InputRightElement for password visibility toggle
 * - 4.4: Display FormErrorMessage when passwords do not match
 * - 4.5: Use Chakra UI Button with loading spinner during registration
 * - 4.6: Display success toast "Account created successfully" on successful registration
 * - 4.7: Display error toast with error message on failure
 */
export function RegisterScreen({ onNavigateToLogin }: RegisterScreenProps): React.JSX.Element {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);
  const toast = useAppToast();

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    displayName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const subtitleColor = useColorModeValue('gray.600', 'gray.400');
  const linkColor = useColorModeValue('brand.600', 'brand.400');

  /**
   * Validate form inputs
   */
  const validateForm = useCallback((): boolean => {
    const errors: {
      displayName?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    // Display name validation
    if (!displayName.trim()) {
      errors.displayName = 'Display name is required';
    } else if (displayName.trim().length < 2) {
      errors.displayName = 'Display name must be at least 2 characters';
    } else if (displayName.trim().length > 100) {
      errors.displayName = 'Display name must be less than 100 characters';
    }

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
    } else if (!/[A-Z]/.test(password)) {
      errors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[a-z]/.test(password)) {
      errors.password = 'Password must contain at least one lowercase letter';
    } else if (!/[0-9]/.test(password)) {
      errors.password = 'Password must contain at least one number';
    }

    // Confirm password validation (Requirement 4.4)
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [displayName, email, password, confirmPassword]);

  /**
   * Handle registration submission
   */
  const handleRegister = useCallback(async () => {
    // Clear previous errors
    dispatch(clearAuthError());
    setValidationErrors({});

    if (!validateForm()) {
      return;
    }

    try {
      await dispatch(
        register({
          displayName: displayName.trim(),
          email: email.trim().toLowerCase(),
          password,
        })
      ).unwrap();
      
      // Requirement 4.6: Display success toast on successful registration
      toast.showSuccess('Account created successfully', 'Welcome to Personal Kanban!');
      // Navigation will be handled by the auth state change in RootNavigator
    } catch (err) {
      // Requirement 4.7: Display error toast on failure
      const errorMessage = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      toast.showError('Registration failed', errorMessage);
    }
  }, [dispatch, displayName, email, password, validateForm, toast]);

  /**
   * Handle input change and clear related errors
   */
  const handleDisplayNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value;
      setDisplayName(text);
      if (validationErrors.displayName) {
        setValidationErrors((prev) => ({ ...prev, displayName: undefined }));
      }
      if (error) {
        dispatch(clearAuthError());
      }
    },
    [dispatch, error, validationErrors.displayName]
  );

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

  const handleConfirmPasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value;
      setConfirmPassword(text);
      if (validationErrors.confirmPassword) {
        setValidationErrors((prev) => ({ ...prev, confirmPassword: undefined }));
      }
    },
    [validationErrors.confirmPassword]
  );

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword((prev) => !prev);
  }, []);

  return (
    <Box minH="100vh" bg={bgColor} py={8} px={4}>
      <Center minH="calc(100vh - 64px)">
        <VStack gap={8} w="full" maxW="md">
          {/* Header */}
          <VStack gap={2} textAlign="center">
            <Text fontSize="5xl" role="img" aria-label="Clipboard">
              📋
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color={textColor}>
              Create Account
            </Text>
            <Text fontSize="md" color={subtitleColor}>
              Start organizing your tasks today
            </Text>
          </VStack>

          {/* Form Card - Requirement 4.1 */}
          <AppCard variant="elevated" w="full" bg={cardBg}>
            <AppCardBody p={6}>
              <VStack gap={4}>
                {/* API Error Alert */}
                {error && (
                  <Alert.Root status="error" borderRadius="md">
                    <Alert.Indicator>
                      <FiAlertCircle />
                    </Alert.Indicator>
                    <Alert.Content>
                      <Alert.Title>{error}</Alert.Title>
                    </Alert.Content>
                  </Alert.Root>
                )}

                {/* Display Name Input - Requirement 4.2 */}
                <Field.Root
                  invalid={!!validationErrors.displayName}
                  required
                  disabled={isLoading}
                >
                  <Field.Label>
                    Display Name
                    <Box as="span" color="red.500" ml="1">*</Box>
                  </Field.Label>
                  <Input
                    placeholder="Enter your name"
                    value={displayName}
                    onChange={handleDisplayNameChange}
                    autoComplete="name"
                    data-testid="display-name-input"
                    aria-describedby={validationErrors.displayName ? 'display-name-error' : undefined}
                  />
                  {validationErrors.displayName && (
                    <Field.ErrorText id="display-name-error" display="flex" alignItems="center" gap="1">
                      <FiAlertCircle aria-hidden="true" />
                      {validationErrors.displayName}
                    </Field.ErrorText>
                  )}
                </Field.Root>

                {/* Email Input - Requirement 4.2 */}
                <Field.Root
                  invalid={!!validationErrors.email}
                  required
                  disabled={isLoading}
                >
                  <Field.Label>
                    Email
                    <Box as="span" color="red.500" ml="1">*</Box>
                  </Field.Label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={handleEmailChange}
                    autoComplete="email"
                    data-testid="email-input"
                    aria-describedby={validationErrors.email ? 'email-error' : undefined}
                  />
                  {validationErrors.email && (
                    <Field.ErrorText id="email-error" display="flex" alignItems="center" gap="1">
                      <FiAlertCircle aria-hidden="true" />
                      {validationErrors.email}
                    </Field.ErrorText>
                  )}
                </Field.Root>

                {/* Password Input with visibility toggle - Requirements 4.2, 4.3 */}
                <Field.Root
                  invalid={!!validationErrors.password}
                  required
                  disabled={isLoading}
                >
                  <Field.Label>
                    Password
                    <Box as="span" color="red.500" ml="1">*</Box>
                  </Field.Label>
                  <Group attached w="full">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      value={password}
                      onChange={handlePasswordChange}
                      autoComplete="new-password"
                      data-testid="password-input"
                      aria-describedby={validationErrors.password ? 'password-error' : 'password-hint'}
                      flex="1"
                    />
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={togglePasswordVisibility}
                      variant="ghost"
                      size="md"
                      disabled={isLoading}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </IconButton>
                  </Group>
                  {validationErrors.password && (
                    <Field.ErrorText id="password-error" display="flex" alignItems="center" gap="1">
                      <FiAlertCircle aria-hidden="true" />
                      {validationErrors.password}
                    </Field.ErrorText>
                  )}
                  {!validationErrors.password && (
                    <Field.HelperText id="password-hint">
                      Must be 8+ characters with uppercase, lowercase, and number
                    </Field.HelperText>
                  )}
                </Field.Root>

                {/* Confirm Password Input with visibility toggle - Requirements 4.2, 4.3, 4.4 */}
                <Field.Root
                  invalid={!!validationErrors.confirmPassword}
                  required
                  disabled={isLoading}
                >
                  <Field.Label>
                    Confirm Password
                    <Box as="span" color="red.500" ml="1">*</Box>
                  </Field.Label>
                  <Group attached w="full">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={handleConfirmPasswordChange}
                      autoComplete="new-password"
                      data-testid="confirm-password-input"
                      aria-describedby={validationErrors.confirmPassword ? 'confirm-password-error' : undefined}
                      flex="1"
                    />
                    <IconButton
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      onClick={toggleConfirmPasswordVisibility}
                      variant="ghost"
                      size="md"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    </IconButton>
                  </Group>
                  {validationErrors.confirmPassword && (
                    <Field.ErrorText id="confirm-password-error" display="flex" alignItems="center" gap="1">
                      <FiAlertCircle aria-hidden="true" />
                      {validationErrors.confirmPassword}
                    </Field.ErrorText>
                  )}
                </Field.Root>

                {/* Register Button - Requirement 4.5 */}
                <AppButton
                  intent="primary"
                  w="full"
                  size="lg"
                  onClick={handleRegister}
                  loading={isLoading}
                  loadingText="Creating account..."
                  data-testid="register-button"
                  aria-label="Create account"
                  mt={2}
                >
                  Create Account
                </AppButton>

                {/* Login Link */}
                <Text fontSize="sm" color={subtitleColor} textAlign="center">
                  Already have an account?{' '}
                  <Link
                    color={linkColor}
                    fontWeight="semibold"
                    onClick={isLoading ? undefined : onNavigateToLogin}
                    cursor={isLoading ? 'not-allowed' : 'pointer'}
                    opacity={isLoading ? 0.5 : 1}
                    data-testid="login-link"
                    aria-label="Sign in"
                  >
                    Sign in
                  </Link>
                </Text>
              </VStack>
            </AppCardBody>
          </AppCard>
        </VStack>
      </Center>
    </Box>
  );
}

export default RegisterScreen;
