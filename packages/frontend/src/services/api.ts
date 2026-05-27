import { store } from '@/store';
import { resetAuth, setToken } from '@/store/slices';
import { refreshFirebaseToken } from '@/services/firebaseAuth';
import type { Store, UnknownAction } from '@reduxjs/toolkit';

/**
 * API configuration
 */
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * Store reference for API interceptors
 */
let storeRef: Store | null = null;

/**
 * Flag to prevent multiple simultaneous token refresh attempts
 */
let isRefreshing = false;

/**
 * Queue of requests waiting for token refresh
 */
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

/**
 * Setup API interceptors with store reference
 * This allows the API client to dispatch actions like logout on 401 errors
 */
export function setupApiInterceptors(reduxStore: Store): void {
  storeRef = reduxStore;
}

/**
 * Detect if a token is a Firebase token based on its structure.
 * Firebase tokens have a 'kid' (key ID) in the header, while our JWTs don't.
 * 
 * Validates: Requirements 4.2
 */
export function isFirebaseToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  try {
    const header = JSON.parse(atob(parts[0]));
    // Firebase tokens have 'kid' (key ID) in header, our JWTs don't
    return 'kid' in header;
  } catch {
    return false;
  }
}

/**
 * Process the refresh queue after token refresh completes
 */
function processRefreshQueue(error: Error | null, token: string | null): void {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    }
  });
  refreshQueue = [];
}

/**
 * Update the token in the Redux store after successful refresh.
 * This ensures subsequent requests use the new token.
 * 
 * Validates: Requirements 4.3
 */
function updateTokenInStore(newToken: string): void {
  if (storeRef) {
    storeRef.dispatch(setToken(newToken) as unknown as UnknownAction);
  }
}

/**
 * Attempt to refresh the Firebase token.
 * Returns the new token or null if refresh fails.
 * Updates the token in the Redux store on success.
 * 
 * Validates: Requirements 4.3
 */
async function attemptTokenRefresh(): Promise<string | null> {
  const currentToken = store.getState().auth.token;
  
  // Only attempt refresh for Firebase tokens
  if (!currentToken || !isFirebaseToken(currentToken)) {
    return null;
  }
  
  // If already refreshing, wait for the current refresh to complete
  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      refreshQueue.push({ resolve, reject });
    });
  }
  
  isRefreshing = true;
  
  try {
    const newToken = await refreshFirebaseToken();
    
    if (newToken) {
      // Update the token in the Redux store so subsequent requests use the new token
      updateTokenInStore(newToken);
      processRefreshQueue(null, newToken);
      return newToken;
    }
    
    processRefreshQueue(new Error('Token refresh returned null'), null);
    return null;
  } catch (error) {
    const refreshError = error instanceof Error ? error : new Error('Token refresh failed');
    processRefreshQueue(refreshError, null);
    return null;
  } finally {
    isRefreshing = false;
  }
}

/**
 * Redirect to login by clearing auth state.
 * Called when token refresh fails.
 * 
 * Validates: Requirements 4.4
 */
function redirectToLogin(): void {
  if (storeRef) {
    storeRef.dispatch(resetAuth() as unknown as UnknownAction);
  }
}

/**
 * API error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * API response type
 */
interface ApiResponse<T> {
  data: T;
  success?: boolean;
  message?: string;
}

/**
 * Request options
 */
interface RequestOptions {
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

/**
 * Get authorization header if user is authenticated
 */
const getAuthHeader = (): Record<string, string> => {
  const token = store.getState().auth.token;
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

/**
 * Handle API response
 * 
 * Validates: Requirements 4.3, 4.4
 */
const handleResponse = async <T>(
  response: Response,
  retryRequest?: () => Promise<Response>
): Promise<ApiResponse<T>> => {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  if (!response.ok) {
    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401 && retryRequest) {
      // Attempt to refresh the token for Firebase users
      const newToken = await attemptTokenRefresh();
      
      if (newToken) {
        // Retry the request with the new token
        const retryResponse = await retryRequest();
        // Recursively handle the retry response (without retry to prevent infinite loops)
        return handleResponse<T>(retryResponse);
      }
      
      // Token refresh failed - redirect to login
      redirectToLogin();
      throw new ApiError('Session expired. Please log in again.', response.status, 'UNAUTHORIZED');
    }

    // No retry available or refresh failed
    if (response.status === 401) {
      // Dispatch logout action to clear auth state and redirect to login
      if (storeRef) {
        storeRef.dispatch(resetAuth() as unknown as UnknownAction);
      }
      throw new ApiError('Session expired. Please log in again.', response.status, 'UNAUTHORIZED');
    }

    if (isJson) {
      const errorData = await response.json();
      throw new ApiError(
        errorData.error?.message || errorData.message || 'Request failed',
        response.status,
        errorData.error?.code,
        errorData.error?.details
      );
    }
    throw new ApiError(`Request failed with status ${response.status}`, response.status);
  }

  if (isJson) {
    const jsonData = await response.json();
    // Wrap the response in { data: ... } format for consistency
    return { data: jsonData as T, success: true };
  }

  return { data: {} as T, success: true };
};

/**
 * API client with common HTTP methods
 */
export const apiClient = {
  /**
   * GET request
   * 
   * Validates: Requirements 4.2 (Authorization header format)
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const makeRequest = (token?: string): Promise<Response> => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(!options?.skipAuth ? (token ? { Authorization: `Bearer ${token}` } : getAuthHeader()) : {}),
        ...options?.headers,
      };

      return fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers,
      });
    };

    const response = await makeRequest();

    // Create retry function that will use the refreshed token
    const retryRequest = async (): Promise<Response> => {
      const newToken = store.getState().auth.token;
      return makeRequest(newToken || undefined);
    };

    return handleResponse<T>(response, retryRequest);
  },

  /**
   * POST request
   * 
   * Validates: Requirements 4.2 (Authorization header format)
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const makeRequest = (token?: string): Promise<Response> => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(!options?.skipAuth ? (token ? { Authorization: `Bearer ${token}` } : getAuthHeader()) : {}),
        ...options?.headers,
      };

      return fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });
    };

    const response = await makeRequest();

    // Create retry function that will use the refreshed token
    const retryRequest = async (): Promise<Response> => {
      const newToken = store.getState().auth.token;
      return makeRequest(newToken || undefined);
    };

    return handleResponse<T>(response, retryRequest);
  },

  /**
   * PUT request
   * 
   * Validates: Requirements 4.2 (Authorization header format)
   */
  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const makeRequest = (token?: string): Promise<Response> => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(!options?.skipAuth ? (token ? { Authorization: `Bearer ${token}` } : getAuthHeader()) : {}),
        ...options?.headers,
      };

      return fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });
    };

    const response = await makeRequest();

    // Create retry function that will use the refreshed token
    const retryRequest = async (): Promise<Response> => {
      const newToken = store.getState().auth.token;
      return makeRequest(newToken || undefined);
    };

    return handleResponse<T>(response, retryRequest);
  },

  /**
   * DELETE request
   * 
   * Validates: Requirements 4.2 (Authorization header format)
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const makeRequest = (token?: string): Promise<Response> => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(!options?.skipAuth ? (token ? { Authorization: `Bearer ${token}` } : getAuthHeader()) : {}),
        ...options?.headers,
      };

      return fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers,
      });
    };

    const response = await makeRequest();

    // Create retry function that will use the refreshed token
    const retryRequest = async (): Promise<Response> => {
      const newToken = store.getState().auth.token;
      return makeRequest(newToken || undefined);
    };

    return handleResponse<T>(response, retryRequest);
  },

  /**
   * Upload file (multipart/form-data)
   * 
   * Validates: Requirements 4.2 (Authorization header format)
   */
  async upload<T>(
    endpoint: string,
    formData: FormData,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const makeRequest = (token?: string): Promise<Response> => {
      const headers: Record<string, string> = {
        // Don't set Content-Type for FormData - browser will set it with boundary
        ...(!options?.skipAuth ? (token ? { Authorization: `Bearer ${token}` } : getAuthHeader()) : {}),
        ...options?.headers,
      };

      return fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });
    };

    const response = await makeRequest();

    // Create retry function that will use the refreshed token
    const retryRequest = async (): Promise<Response> => {
      const newToken = store.getState().auth.token;
      return makeRequest(newToken || undefined);
    };

    return handleResponse<T>(response, retryRequest);
  },
};

export default apiClient;
