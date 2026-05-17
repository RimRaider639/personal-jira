import { store } from '@/store';

/**
 * API configuration
 */
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

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
 */
const handleResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  if (!response.ok) {
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
    return response.json();
  }

  return { data: {} as T };
};

/**
 * API client with common HTTP methods
 */
export const apiClient = {
  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(!options?.skipAuth ? getAuthHeader() : {}),
      ...options?.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });

    return handleResponse<T>(response);
  },

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(!options?.skipAuth ? getAuthHeader() : {}),
      ...options?.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    return handleResponse<T>(response);
  },

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(!options?.skipAuth ? getAuthHeader() : {}),
      ...options?.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    return handleResponse<T>(response);
  },

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(!options?.skipAuth ? getAuthHeader() : {}),
      ...options?.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });

    return handleResponse<T>(response);
  },

  /**
   * Upload file (multipart/form-data)
   */
  async upload<T>(
    endpoint: string,
    formData: FormData,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      // Don't set Content-Type for FormData - browser will set it with boundary
      ...(!options?.skipAuth ? getAuthHeader() : {}),
      ...options?.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return handleResponse<T>(response);
  },
};

export default apiClient;
