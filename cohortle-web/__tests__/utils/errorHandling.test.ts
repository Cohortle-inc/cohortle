import {
  parseApiError,
  getErrorMessage,
  isValidationError,
  isNetworkError,
  isServerError,
  logError,
} from '@/lib/utils/errorHandling';

describe('errorHandling', () => {
  describe('parseApiError', () => {
    it('should handle network errors', () => {
      const error = new TypeError('Failed to fetch');
      const result = parseApiError(error);
      
      expect(result.statusCode).toBe(0);
      expect(result.message).toContain('Network error');
    });

    it('should handle 400 validation errors with details', () => {
      const error = {
        response: {
          status: 400,
          data: {
            message: 'Validation failed',
            errors: {
              name: 'Name is required',
              email: 'Invalid email',
            },
          },
        },
      };
      
      const result = parseApiError(error);
      
      expect(result.statusCode).toBe(400);
      expect(result.message).toBe('Validation failed');
      expect(result.details).toEqual({
        name: 'Name is required',
        email: 'Invalid email',
      });
    });

    it('should handle 400 validation errors with single field', () => {
      const error = {
        response: {
          status: 400,
          data: {
            field: 'email',
            message: 'Email already exists',
          },
        },
      };
      
      const result = parseApiError(error);
      
      expect(result.statusCode).toBe(400);
      expect(result.field).toBe('email');
      expect(result.message).toBe('Email already exists');
    });

    it('should handle 401 unauthorized errors', () => {
      const error = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      };
      
      const result = parseApiError(error);
      
      expect(result.statusCode).toBe(401);
      expect(result.message).toContain('session has expired');
    });

    it('should handle 403 forbidden errors', () => {
      const error = {
        response: {
          status: 403,
          data: { message: 'Forbidden' },
        },
      };
      
      const result = parseApiError(error);
      
      expect(result.statusCode).toBe(403);
      expect(result.message).toContain('permission');
    });

    it('should handle 404 not found errors', () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'Not found' },
        },
      };
      
      const result = parseApiError(error);
      
      expect(result.statusCode).toBe(404);
      expect(result.message).toContain('not found');
    });

    it('should handle 409 conflict errors', () => {
      const error = {
        response: {
          status: 409,
          data: { message: 'Enrollment code already exists' },
        },
      };
      
      const result = parseApiError(error);
      
      expect(result.statusCode).toBe(409);
      expect(result.message).toBe('Enrollment code already exists');
    });

    it('should handle 500 server errors', () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      };
      
      const result = parseApiError(error);
      
      expect(result.statusCode).toBe(500);
      expect(result.message).toContain('Server error');
    });

    it('should handle Error objects', () => {
      const error = new Error('Something went wrong');
      const result = parseApiError(error);
      
      expect(result.message).toBe('Something went wrong');
    });

    it('should handle string errors', () => {
      const error = 'Error message';
      const result = parseApiError(error);
      
      expect(result.message).toBe('Error message');
    });

    it('should handle unknown errors', () => {
      const error = { unknown: 'error' };
      const result = parseApiError(error);
      
      expect(result.message).toContain('unexpected error');
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from error', () => {
      const error = new Error('Test error');
      const message = getErrorMessage(error);
      
      expect(message).toBe('Test error');
    });

    it('should handle API errors', () => {
      const error = {
        response: {
          status: 400,
          data: { message: 'Validation failed' },
        },
      };
      
      const message = getErrorMessage(error);
      
      expect(message).toContain('Validation failed');
    });
  });

  describe('isValidationError', () => {
    it('should return true for 400 errors', () => {
      const error = {
        response: {
          status: 400,
          data: { message: 'Validation failed' },
        },
      };
      
      expect(isValidationError(error)).toBe(true);
    });

    it('should return false for non-400 errors', () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Server error' },
        },
      };
      
      expect(isValidationError(error)).toBe(false);
    });
  });

  describe('isNetworkError', () => {
    it('should return true for network errors', () => {
      const error = new TypeError('Failed to fetch');
      
      expect(isNetworkError(error)).toBe(true);
    });

    it('should return false for API errors', () => {
      const error = {
        response: {
          status: 400,
          data: { message: 'Bad request' },
        },
      };
      
      expect(isNetworkError(error)).toBe(false);
    });
  });

  describe('isServerError', () => {
    it('should return true for 500+ errors', () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Server error' },
        },
      };
      
      expect(isServerError(error)).toBe(true);
    });

    it('should return false for client errors', () => {
      const error = {
        response: {
          status: 400,
          data: { message: 'Bad request' },
        },
      };
      
      expect(isServerError(error)).toBe(false);
    });
  });

  describe('logError', () => {
    it('should log error to console', () => {
      const consoleSpy = jest.spyOn(console, 'group').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleGroupEndSpy = jest.spyOn(console, 'groupEnd').mockImplementation();
      
      const error = new Error('Test error');
      logError('Test context', error, { test: 'data' });
      
      expect(consoleSpy).toHaveBeenCalledWith('❌ Error: Test context');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', error);
      expect(consoleLogSpy).toHaveBeenCalledWith('Data:', { test: 'data' });
      expect(consoleGroupEndSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
      consoleGroupEndSpy.mockRestore();
    });
  });
});
