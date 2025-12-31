import axios from 'axios';
import {toast} from 'sonner';

// Laravel API base URL
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true, // Important for Laravel Sanctum
  // Set default timeout to 10 seconds for normal requests
  timeout: 10000,
  // Timeout for file uploads (can be overridden per request)
  timeoutErrorMessage:
    'Request timeout. Please check your connection and try again.',
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ignore cancelled requests (from AbortController)
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      const timeoutMessage =
        'Request timed out. Your connection may be slow. Please try again.';
      // Don't show toast for timeout errors immediately - let React Query handle retries
      return Promise.reject({
        ...error,
        message: timeoutMessage,
        isTimeout: true,
      });
    }

    // Handle network errors (offline, no connection)
    if (!error.response && error.request) {
      const networkMessage = 'Network error. Please check your connection.';
      return Promise.reject({
        ...error,
        message: networkMessage,
        isNetworkError: true,
      });
    }

    // Extract error message from response
    let errorMessage = 'An error occurred. Please try again.';
    let validationErrors: Record<string, string[]> | undefined;

    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.error) {
      // Handle Laravel API error format
      errorMessage = error.response.data.error;
    } else if (error.response?.data?.errors) {
      // Handle Laravel validation errors
      const errors = error.response.data.errors;
      validationErrors = errors;

      // For 422 validation errors, show all errors
      if (error.response?.status === 422) {
        const errorMessages: string[] = [];
        Object.entries(errors).forEach(([field, messages]) => {
          const fieldMessages = Array.isArray(messages) ? messages : [messages];
          errorMessages.push(...fieldMessages.map((msg) => `${field}: ${msg}`));
        });
        errorMessage =
          errorMessages.length > 0
            ? errorMessages.join(', ')
            : 'Validation failed. Please check your input.';
      } else {
        // For other errors, just show the first one
        const firstError = Object.values(errors)[0];
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Handle unauthorized - redirect to login (before other error handling)
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      toast.error('Session expired. Please login again.');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    // Attach validation errors to error object for component-level handling
    const enhancedError = {
      ...error,
      message: errorMessage,
      validationErrors,
      isValidationError: error.response?.status === 422,
    };

    // Show toast notification for all errors except 401 (handled separately)
    // Also skip showing toast for network/timeout errors (React Query will handle retries)
    // For 422 errors, let the component handle displaying field-specific errors
    if (
      error.response?.status !== 401 &&
      !error.isTimeout &&
      !error.isNetworkError &&
      error.response?.status !== 422
    ) {
      toast.error(errorMessage, {
        duration: 4000,
      });
    } else if (error.response?.status === 422 && !validationErrors) {
      // Show generic validation error if no specific errors found
      toast.error(errorMessage, {
        duration: 4000,
      });
    }

    return Promise.reject(enhancedError);
  }
);
