/**
 * Type definitions and type guards for error handling
 * Provides type-safe error handling throughout the application
 */

/**
 * Validation error from Laravel backend
 */
export interface ValidationError {
  errors: Record<string, string | string[]>;
  message?: string;
}

/**
 * API error response
 */
export interface ApiError extends Error {
  statusCode?: number;
  errors?: Record<string, string | string[]>;
  isValidationError?: boolean;
  isNetworkError?: boolean;
  isTimeout?: boolean;
}

/**
 * Network error (offline, no connection)
 */
export interface NetworkError extends Error {
  isNetworkError: true;
  code?: string;
}

/**
 * Timeout error
 */
export interface TimeoutError extends Error {
  isTimeout: true;
  code?: string;
}

/**
 * Type guard for validation errors
 * @param error - Error to check
 * @returns true if error is a validation error
 */
export function isValidationError(error: unknown): error is ValidationError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'errors' in error &&
    typeof (error as ValidationError).errors === 'object'
  );
}

/**
 * Type guard for API errors
 * @param error - Error to check
 * @returns true if error is an API error
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof Error && 'statusCode' in error;
}

/**
 * Type guard for network errors
 * @param error - Error to check
 * @returns true if error is a network error
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isNetworkError' in error &&
    (error as NetworkError).isNetworkError === true
  );
}

/**
 * Type guard for timeout errors
 * @param error - Error to check
 * @returns true if error is a timeout error
 */
export function isTimeoutError(error: unknown): error is TimeoutError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isTimeout' in error &&
    (error as TimeoutError).isTimeout === true
  );
}

/**
 * Extract error message from unknown error
 * @param error - Error to extract message from
 * @param fallback - Fallback message if extraction fails
 * @returns Error message string
 */
export function getErrorMessage(
  error: unknown,
  fallback = 'An error occurred'
): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (isValidationError(error) && error.message) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return fallback;
}

/**
 * Extract validation errors from error
 * @param error - Error to extract validation errors from
 * @returns Validation errors object or null
 */
export function getValidationErrors(
  error: unknown
): Record<string, string[]> | null {
  if (!isValidationError(error)) {
    return null;
  }

  const errors: Record<string, string[]> = {};

  Object.entries(error.errors).forEach(([field, messages]) => {
    errors[field] = Array.isArray(messages) ? messages : [messages];
  });

  return errors;
}

/**
 * Format validation errors for display
 * @param error - Error to format
 * @returns Formatted error messages array
 */
export function formatValidationErrors(error: unknown): string[] {
  const validationErrors = getValidationErrors(error);
  if (!validationErrors) {
    return [];
  }

  const messages: string[] = [];
  Object.entries(validationErrors).forEach(([field, fieldMessages]) => {
    fieldMessages.forEach((message) => {
      messages.push(`${field}: ${message}`);
    });
  });

  return messages;
}
