import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { User, LoginRequest, RegisterRequest, AuthResponse, AuthProvider, FirebaseAuthErrorType, LinkGoogleResponse } from '@kanban/shared';
import { apiClient } from '@/services/api';
import {
  signInWithGoogle,
  signOutFirebase,
  refreshFirebaseToken,
  mapFirebaseError,
  getFirebaseErrorMessage,
  isFirebaseAuthError,
} from '@/services/firebaseAuth';

/**
 * Auth state interface
 * 
 * Validates: Requirements 4.1, 6.1, 6.2, 6.3
 */
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  /** Whether Firebase has been initialized */
  firebaseInitialized: boolean;
  /** Firebase initialization or auth error */
  firebaseError: string | null;
  /** The authentication provider used for the current session */
  authProvider: AuthProvider | null;
  /** Whether we're checking for an existing auth session on startup */
  isCheckingAuth: boolean;
  /** Whether account linking is in progress */
  isLinkingAccount: boolean;
  /** Success message for account linking */
  linkAccountSuccess: string | null;
  /** Error message for account linking */
  linkAccountError: string | null;
}

/**
 * Rejection value for Google login errors
 */
interface GoogleLoginError {
  message: string;
  errorType: FirebaseAuthErrorType;
}

/**
 * Initial auth state
 */
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  firebaseInitialized: false,
  firebaseError: null,
  authProvider: null,
  isCheckingAuth: false,
  isLinkingAccount: false,
  linkAccountSuccess: null,
  linkAccountError: null,
};

/**
 * Async thunk for user login
 */
export const login = createAsyncThunk<AuthResponse, LoginRequest, { rejectValue: string }>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      return rejectWithValue(message);
    }
  }
);

/**
 * Async thunk for user registration
 */
export const register = createAsyncThunk<AuthResponse, RegisterRequest, { rejectValue: string }>(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', userData);
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

/**
 * Async thunk for Google sign-in via Firebase
 * 
 * Validates: Requirements 4.1, 4.4
 */
export const loginWithGoogle = createAsyncThunk<
  AuthResponse,
  void,
  { rejectValue: GoogleLoginError }
>('auth/loginWithGoogle', async (_, { rejectWithValue }) => {
  try {
    // Sign in with Google via Firebase
    const { idToken } = await signInWithGoogle();
    
    // Send the Firebase token to our backend for verification and user creation/linking
    const response = await apiClient.post<AuthResponse>('/auth/firebase', { idToken }, { skipAuth: true });
    return response.data;
  } catch (error) {
    // Handle Firebase-specific errors
    if (isFirebaseAuthError(error)) {
      const errorType = mapFirebaseError(error);
      const message = getFirebaseErrorMessage(errorType);
      return rejectWithValue({ message, errorType });
    }
    
    // Handle other errors
    const message = error instanceof Error ? error.message : 'Google sign-in failed';
    return rejectWithValue({ message, errorType: 'unknown' });
  }
});

/**
 * Async thunk for checking existing Firebase session on app startup
 * 
 * Validates: Requirements 6.1, 6.2, 6.3
 */
export const checkFirebaseSession = createAsyncThunk<
  AuthResponse | null,
  void,
  { rejectValue: string }
>('auth/checkFirebaseSession', async (_, { rejectWithValue }) => {
  try {
    // Try to refresh the Firebase token (will return null if no user is signed in)
    const token = await refreshFirebaseToken();
    if (!token) {
      return null;
    }
    
    // Verify the token with our backend and get user data
    const response = await apiClient.post<AuthResponse>('/auth/firebase', { idToken: token }, { skipAuth: true });
    return response.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Session verification failed';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for linking Google account to existing email/password account
 * 
 * Validates: Requirements 3.2, 3.6, 7.5
 */
export const linkGoogleAccount = createAsyncThunk<
  LinkGoogleResponse,
  { skipEmailWarning?: boolean } | void,
  { rejectValue: GoogleLoginError; state: { auth: AuthState } }
>('auth/linkGoogleAccount', async (args, { rejectWithValue, getState }) => {
  try {
    const skipEmailWarning = args && typeof args === 'object' ? args.skipEmailWarning : false;
    const currentUserEmail = getState().auth.user?.email?.toLowerCase();
    
    // Sign in with Google via Firebase to get the ID token and user info
    const { idToken, user: firebaseUser } = await signInWithGoogle();
    const googleEmail = firebaseUser.email?.toLowerCase();
    
    // Check if Google email differs from account email (Requirement 7.5)
    if (!skipEmailWarning && currentUserEmail && googleEmail && currentUserEmail !== googleEmail) {
      return rejectWithValue({
        message: `Warning: Your Google account email (${firebaseUser.email}) differs from your account email. The linking will fail because emails must match.`,
        errorType: 'unknown',
      });
    }
    
    // Send the Firebase token to our backend to link the accounts
    const response = await apiClient.post<LinkGoogleResponse>('/auth/link-google', { idToken });
    return response.data;
  } catch (error) {
    // Handle Firebase-specific errors
    if (isFirebaseAuthError(error)) {
      const errorType = mapFirebaseError(error);
      const message = getFirebaseErrorMessage(errorType);
      return rejectWithValue({ message, errorType });
    }
    
    // Handle API errors
    const message = error instanceof Error ? error.message : 'Failed to link Google account';
    return rejectWithValue({ message, errorType: 'unknown' });
  }
});

/**
 * Async thunk for user logout
 * 
 * Validates: Requirements 4.6, 4.7
 */
export const logout = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Sign out from Firebase first
      await signOutFirebase();
      
      // Then notify the backend
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Even if logout fails on server, we still clear local state
      console.warn('Logout request failed:', error);
    }
  }
);

/**
 * Auth slice
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Clear any auth errors
     */
    clearError: (state) => {
      state.error = null;
      state.firebaseError = null;
    },
    /**
     * Set token directly (for restoring from storage)
     */
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    /**
     * Set user directly (for restoring from storage)
     */
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.authProvider = action.payload.authProvider;
    },
    /**
     * Reset auth state (for logout or session expiry)
     * 
     * Validates: Requirements 4.7
     */
    resetAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      state.authProvider = null;
      state.firebaseError = null;
      state.isCheckingAuth = false;
    },
    /**
     * Set Firebase initialization status
     */
    setFirebaseInitialized: (state, action: PayloadAction<boolean>) => {
      state.firebaseInitialized = action.payload;
    },
    /**
     * Set Firebase error
     */
    setFirebaseError: (state, action: PayloadAction<string | null>) => {
      state.firebaseError = action.payload;
    },
    /**
     * Clear link account status messages
     */
    clearLinkAccountStatus: (state) => {
      state.linkAccountSuccess = null;
      state.linkAccountError = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        state.authProvider = action.payload.user.authProvider;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Login failed';
      });

    // Register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        state.authProvider = action.payload.user.authProvider;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Registration failed';
      });

    // Login with Google
    builder
      .addCase(loginWithGoogle.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.firebaseError = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        state.firebaseError = null;
        state.authProvider = action.payload.user.authProvider;
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.isLoading = false;
        // Don't show error for user cancellation
        if (action.payload?.errorType === 'cancelled') {
          state.error = null;
          state.firebaseError = null;
        } else {
          state.error = action.payload?.message ?? 'Google sign-in failed';
          state.firebaseError = action.payload?.message ?? null;
        }
      });

    // Check Firebase Session
    builder
      .addCase(checkFirebaseSession.pending, (state) => {
        state.isCheckingAuth = true;
        state.error = null;
      })
      .addCase(checkFirebaseSession.fulfilled, (state, action) => {
        state.isCheckingAuth = false;
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
          state.authProvider = action.payload.user.authProvider;
        }
        state.error = null;
      })
      .addCase(checkFirebaseSession.rejected, (state, action) => {
        state.isCheckingAuth = false;
        // Don't set error for session check failures - just means no valid session
        state.error = null;
        console.warn('Firebase session check failed:', action.payload);
      });

    // Logout
    builder
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
        state.authProvider = null;
        state.firebaseError = null;
      })
      .addCase(logout.rejected, (state) => {
        // Still clear state even if server logout fails
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
        state.authProvider = null;
        state.firebaseError = null;
      });

    // Link Google Account
    builder
      .addCase(linkGoogleAccount.pending, (state) => {
        state.isLinkingAccount = true;
        state.linkAccountSuccess = null;
        state.linkAccountError = null;
      })
      .addCase(linkGoogleAccount.fulfilled, (state, action) => {
        state.isLinkingAccount = false;
        state.linkAccountSuccess = action.payload.message;
        state.linkAccountError = null;
        // Update user with new authProvider
        if (state.user) {
          state.user = action.payload.user;
          state.authProvider = action.payload.user.authProvider;
        }
      })
      .addCase(linkGoogleAccount.rejected, (state, action) => {
        state.isLinkingAccount = false;
        state.linkAccountSuccess = null;
        // Don't show error for user cancellation
        if (action.payload?.errorType === 'cancelled') {
          state.linkAccountError = null;
        } else {
          state.linkAccountError = action.payload?.message ?? 'Failed to link Google account';
        }
      });
  },
});

export const { clearError, setToken, setUser, resetAuth, setFirebaseInitialized, setFirebaseError, clearLinkAccountStatus } = authSlice.actions;
export default authSlice.reducer;
