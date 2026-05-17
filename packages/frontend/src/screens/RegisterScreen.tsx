import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppDispatch, useAppSelector } from '@/store';
import { register, clearAuthError } from '@/store/slices';
import { selectAuthLoading, selectAuthError } from '@/store/selectors';

interface RegisterScreenProps {
  onNavigateToLogin: () => void;
}

/**
 * RegisterScreen - User registration screen
 *
 * Requirements:
 * - 18.2: Implement user registration with email, password, and display name
 */
export function RegisterScreen({ onNavigateToLogin }: RegisterScreenProps): React.JSX.Element {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    displayName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

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

    // Confirm password validation
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
      // Navigation will be handled by the auth state change in RootNavigator
    } catch {
      // Error is handled by the slice and displayed via selectAuthError
    }
  }, [dispatch, displayName, email, password, validateForm]);

  /**
   * Handle input change and clear related errors
   */
  const handleDisplayNameChange = useCallback(
    (text: string) => {
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
    (text: string) => {
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
    (text: string) => {
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
    (text: string) => {
      setConfirmPassword(text);
      if (validationErrors.confirmPassword) {
        setValidationErrors((prev) => ({ ...prev, confirmPassword: undefined }));
      }
    },
    [validationErrors.confirmPassword]
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>📋</Text>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start organizing your tasks today</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* API Error */}
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            {/* Display Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Display Name</Text>
              <TextInput
                style={[styles.input, validationErrors.displayName && styles.inputError]}
                placeholder="Enter your name"
                placeholderTextColor="#9ca3af"
                value={displayName}
                onChangeText={handleDisplayNameChange}
                autoCapitalize="words"
                autoCorrect={false}
                autoComplete="name"
                editable={!isLoading}
                testID="display-name-input"
              />
              {validationErrors.displayName && (
                <Text style={styles.errorText}>{validationErrors.displayName}</Text>
              )}
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, validationErrors.email && styles.inputError]}
                placeholder="Enter your email"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                editable={!isLoading}
                testID="email-input"
              />
              {validationErrors.email && (
                <Text style={styles.errorText}>{validationErrors.email}</Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={[styles.input, validationErrors.password && styles.inputError]}
                placeholder="Create a password"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                editable={!isLoading}
                testID="password-input"
              />
              {validationErrors.password && (
                <Text style={styles.errorText}>{validationErrors.password}</Text>
              )}
              <Text style={styles.hint}>
                Must be 8+ characters with uppercase, lowercase, and number
              </Text>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={[styles.input, validationErrors.confirmPassword && styles.inputError]}
                placeholder="Confirm your password"
                placeholderTextColor="#9ca3af"
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                editable={!isLoading}
                testID="confirm-password-input"
              />
              {validationErrors.confirmPassword && (
                <Text style={styles.errorText}>{validationErrors.confirmPassword}</Text>
              )}
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
              testID="register-button"
              accessibilityRole="button"
              accessibilityLabel="Create account"
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={onNavigateToLogin}
                disabled={isLoading}
                testID="login-link"
                accessibilityRole="link"
                accessibilityLabel="Sign in"
              >
                <Text style={styles.loginLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  form: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  hint: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    color: '#6b7280',
    fontSize: 14,
  },
  loginLink: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RegisterScreen;
