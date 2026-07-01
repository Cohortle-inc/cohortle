/**
 * Error Handling Utilities
 * Centralized error handling for API requests and form submissions
 */

export interface ApiError {
  message: string;
  statusCode?: number;
  field?: string;
  details?: Record<string, string>;
}

/**
 * Parse error from API response
 * Handles different error formats from backend
 */
export function parseApiError(error: unknown): ApiError {
  // Network error (no response)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      message: 'Network error. Please check your connection and try again.',
      statusCode: 0,
    };
  }

  // Error with response
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as any).response;
    
    // 400 - Validation errors
    if (response?.status === 400) {
      const data = response.data;
      
      // Backend returns validation errors in different formats
      if (data?.errors && typeof data.errors === 'object') {
        // Multiple field errors: { errors: { field1: 'error1', field2: 'error2' } }
        return {
          message: data.message || 'Validation failed. Please check your input.',
          statusCode: 400,
          details: data.errors,
        };
      }
      
      if (data?.field && data?.message) {
        // Single field error: { field: 'email', message: 'Invalid email' }
        return {
          message: data.message,
          statusCode: 400,
          field: data.field,
        };
      }
      
      return {
        message: data?.message || 'Invalid input. Please check your data.',
        statusCode: 400,
      };
    }
    
    // 401 - Unauthorized
    if (response?.status === 401) {
      return {
        message: 'Your session has expired. Please log in again.',
        statusCode: 401,
      };
    }
    
    // 403 - Forbidden
    if (response?.status === 403) {
      return {
        message: 'You do not have permission to perform this action.',
        statusCode: 403,
      };
    }
    
    // 404 - Not found
    if (response?.status === 404) {
      return {
        message: 'The requested resource was not found.',
        statusCode: 404,
      };
    }
    
    // 409 - Conflict (e.g., duplicate enrollment code)
    if (response?.status === 409) {
      return {
        message: response.data?.message || 'This resource already exists.',
        statusCode: 409,
      };
    }
    
    // 500 - Server error
    if (response?.status >= 500) {
      return {
        message: 'Server error. Please try again later.',
        statusCode: response.status,
      };
    }
    
    // Other HTTP errors
    return {
      message: response.data?.message || 'An error occurred. Please try again.',
      statusCode: response.status,
    };
  }

  // Error object with message
  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  // String error
  if (typeof error === 'string') {
    return {
      message: error,
    };
  }

  // Unknown error
  return {
    message: 'An unexpected error occurred. Please try again.',
  };
}

/**
 * Log error to console with context
 * Helps with debugging in development
 */
export function logError(context: string, error: unknown, data?: any): void {
  console.group(`❌ Error: ${context}`);
  console.error('Error:', error);
  if (data) {
    console.log('Data:', data);
  }
  if (error && typeof error === 'object') {
    if ('response' in error) {
      console.log('Response:', (error as any).response);
    }
    if ('stack' in error) {
      console.log('Stack:', (error as any).stack);
    }
  }
  console.groupEnd();
}

/**
 * Get user-friendly error message for display
 */
export function getErrorMessage(error: unknown): string {
  const apiError = parseApiError(error);
  return apiError.message;
}

/**
 * Check if error is a validation error (400)
 */
export function isValidationError(error: unknown): boolean {
  const apiError = parseApiError(error);
  return apiError.statusCode === 400;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  const apiError = parseApiError(error);
  return apiError.statusCode === 0;
}

/**
 * Check if error is a server error (500+)
 */
export function isServerError(error: unknown): boolean {
  const apiError = parseApiError(error);
  return (apiError.statusCode || 0) >= 500;
}
