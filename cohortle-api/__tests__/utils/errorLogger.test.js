const {
  logApiError,
  logValidationError,
  logSuccess,
  logDatabaseOperation,
} = require('../../utils/errorLogger');

describe('errorLogger', () => {
  let consoleGroupSpy;
  let consoleLogSpy;
  let consoleErrorSpy;
  let consoleGroupEndSpy;

  beforeEach(() => {
    consoleGroupSpy = jest.spyOn(console, 'group').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleGroupEndSpy = jest.spyOn(console, 'groupEnd').mockImplementation();
  });

  afterEach(() => {
    consoleGroupSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleGroupEndSpy.mockRestore();
  });

  describe('logApiError', () => {
    it('should log error with context', () => {
      const error = new Error('Test error');
      const req = {
        method: 'POST',
        url: '/api/test',
        user_id: 123,
        user_role: 'convener',
        ip: '127.0.0.1',
        body: { name: 'Test' },
      };

      logApiError('Test context', error, req);

      expect(consoleGroupSpy).toHaveBeenCalledWith('❌ API Error: Test context');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', 'Test error');
      expect(consoleGroupEndSpy).toHaveBeenCalled();
    });

    it('should sanitize sensitive data from request body', () => {
      const error = new Error('Test error');
      const req = {
        method: 'POST',
        url: '/api/test',
        body: {
          name: 'Test',
          password: 'secret123',
          token: 'abc123',
        },
      };

      logApiError('Test context', error, req);

      // Check that password and token were removed
      const bodyLog = consoleLogSpy.mock.calls.find(
        call => call[0] === 'Request Body:'
      );
      expect(bodyLog).toBeDefined();
      expect(bodyLog[1]).not.toHaveProperty('password');
      expect(bodyLog[1]).not.toHaveProperty('token');
      expect(bodyLog[1]).toHaveProperty('name', 'Test');
    });

    it('should work without request object', () => {
      const error = new Error('Test error');

      logApiError('Test context', error);

      expect(consoleGroupSpy).toHaveBeenCalledWith('❌ API Error: Test context');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', 'Test error');
    });

    it('should log additional data if provided', () => {
      const error = new Error('Test error');
      const data = { extra: 'info' };

      logApiError('Test context', error, null, data);

      expect(consoleLogSpy).toHaveBeenCalledWith('Additional Data:', data);
    });
  });

  describe('logValidationError', () => {
    it('should log validation errors', () => {
      const errors = {
        name: 'Name is required',
        email: 'Invalid email',
      };
      const req = {
        method: 'POST',
        url: '/api/test',
        user_id: 123,
      };

      logValidationError('Test validation', errors, req);

      expect(consoleGroupSpy).toHaveBeenCalledWith('⚠️  Validation Error: Test validation');
      expect(consoleLogSpy).toHaveBeenCalledWith('Validation Errors:', errors);
      expect(consoleGroupEndSpy).toHaveBeenCalled();
    });
  });

  describe('logSuccess', () => {
    it('should log success in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const req = {
        method: 'POST',
        url: '/api/test',
        user_id: 123,
      };
      const data = { id: 1, name: 'Test' };

      logSuccess('Test operation', req, data);

      expect(consoleGroupSpy).toHaveBeenCalledWith('✅ Success: Test operation');
      expect(consoleLogSpy).toHaveBeenCalledWith('Result:', data);
      expect(consoleGroupEndSpy).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('should log minimal info in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const req = {
        user_id: 123,
      };

      logSuccess('Test operation', req);

      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Test operation - User: 123');
      expect(consoleGroupSpy).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('logDatabaseOperation', () => {
    it('should log database operation in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const data = { id: 1, name: 'Test' };

      logDatabaseOperation('INSERT', 'programmes', data);

      expect(consoleGroupSpy).toHaveBeenCalledWith('🗄️  Database: INSERT programmes');
      expect(consoleLogSpy).toHaveBeenCalledWith('Data:', data);
      expect(consoleGroupEndSpy).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('should log minimal info in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      logDatabaseOperation('INSERT', 'programmes');

      expect(consoleLogSpy).toHaveBeenCalledWith('🗄️  INSERT programmes');
      expect(consoleGroupSpy).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });
});
