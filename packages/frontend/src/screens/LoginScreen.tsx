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
import { login, clearAuthError } from '@/store/slices';
import { selectAuthLoading, selectAuthError } from '@/store/selectors';

interface LoginScreenProps {
  onNavigateToRegister: () => void;
}

/**
 * LoginScreen - User authentication screen
 *
 * Requirements:
 * - 18.1: Implement user authentication with JWT tokens
 * - 18.3: Implement login functionality with email and password
 * - 18.4: Display appropriate error messages for invalid credentials
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
            <Text style={styles.title}>Personal Kanban</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* API Error */}
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

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
                placeholder="Enter your password"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                editable={!isLoading}
                testID="password-input"
              />
              {validationErrors.password && (
                <Text style={styles.errorText}>{validationErrors.password}</Text>
              )}
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              testID="login-button"
              accessibilityRole="button"
              accessibilityLabel="Sign in"
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={onNavigateToRegister}
                disabled={isLoading}
                testID="register-link"
                accessibilityRole="link"
                accessibilityLabel="Create an account"
              >
                <Text style={styles.registerLink}>Create one</Text>
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
    marginBottom: 40,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
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
    marginBottom: 20,
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
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    color: '#6b7280',
    fontSize: 14,
  },
  registerLink: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;
