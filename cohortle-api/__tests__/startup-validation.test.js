/**
 * Integration test for startup validation
 * 
 * Verifies that the server fails fast with clear error messages
 * when environment configuration is invalid.
 * 
 * Requirements: 2.4, 2.5
 */

const { validateAndFailFast } = require('../utils/validateEnvironment');

describe('Startup Validation', () => {
  let originalEnv;
  let consoleErrorSpy;
  let consoleLogSpy;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Spy on console methods
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    
    // Restore console methods
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it('should fail fast when required environment variables are missing', () => {
    // Clear all environment variables
    process.env = {};

    expect(() => {
      validateAndFailFast();
    }).toThrow('Invalid environment configuration. Server cannot start.');

    // Verify error messages were logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Environment Validation Failed')
    );
  });

  it('should fail fast when NODE_ENV is incorrect in production', () => {
    process.env.NODE_ENV = 'development';
    process.env.DB_HOSTNAME = 'production-db.example.com'; // Not localhost
    process.env.DB_PORT = '3306';
    process.env.DB_USER = 'user';
    process.env.DB_PASSWORD = 'password';
    process.env.DB_DATABASE = 'cohortle';
    process.env.JWT_SECRET = 'secret';
    process.env.PORT = '3000';

    expect(() => {
      validateAndFailFast();
    }).toThrow('Invalid environment configuration. Server cannot start.');

    // Verify specific error about NODE_ENV was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('NODE_ENV')
    );
  });

  it('should fail fast when DB_DATABASE is "cohortle.com"', () => {
    process.env.NODE_ENV = 'production';
    process.env.DB_HOSTNAME = '127.0.0.1';
    process.env.DB_PORT = '3306';
    process.env.DB_USER = 'user';
    process.env.DB_PASSWORD = 'password';
    process.env.DB_DATABASE = 'cohortle.com'; // Invalid
    process.env.JWT_SECRET = 'secret';
    process.env.PORT = '3000';

    expect(() => {
      validateAndFailFast();
    }).toThrow('Invalid environment configuration. Server cannot start.');

    // Verify specific error about DB_DATABASE was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('DB_DATABASE')
    );
  });

  it('should succeed and log configuration when environment is valid', () => {
    process.env.NODE_ENV = 'production';
    process.env.DB_HOSTNAME = '127.0.0.1';
    process.env.DB_PORT = '3306';
    process.env.DB_USER = 'user';
    process.env.DB_PASSWORD = 'password';
    process.env.DB_DATABASE = 'cohortle';
    process.env.JWT_SECRET = 'secret';
    process.env.PORT = '3000';

    expect(() => {
      validateAndFailFast();
    }).not.toThrow();

    // Verify success message was logged
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Environment validation passed')
    );

    // Verify configuration was logged
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Environment Configuration')
    );
  });

  it('should mask sensitive values in logs', () => {
    process.env.NODE_ENV = 'production';
    process.env.DB_HOSTNAME = '127.0.0.1';
    process.env.DB_PORT = '3306';
    process.env.DB_USER = 'user';
    process.env.DB_PASSWORD = 'my-secret-password';
    process.env.DB_DATABASE = 'cohortle';
    process.env.JWT_SECRET = 'my-secret-jwt';
    process.env.PORT = '3000';

    validateAndFailFast();

    // Verify sensitive values are not logged in plain text
    const allLogCalls = consoleLogSpy.mock.calls.flat().join(' ');
    expect(allLogCalls).not.toContain('my-secret-password');
    expect(allLogCalls).not.toContain('my-secret-jwt');

    // Verify masked indicator is present
    expect(allLogCalls).toContain('***SET***');
  });

  it('should display warnings without failing', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    process.env.NODE_ENV = 'production';
    process.env.DB_HOSTNAME = '127.0.0.1';
    process.env.DB_PORT = '3306';
    process.env.DB_USER = 'user';
    process.env.DB_PASSWORD = 'password';
    process.env.DB_DATABASE = 'cohortle';
    process.env.JWT_SECRET = 'your-secret-key-change-in-production'; // Default value
    process.env.PORT = '3000';

    expect(() => {
      validateAndFailFast();
    }).not.toThrow();

    // Verify warning was logged
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Environment Warnings')
    );

    consoleWarnSpy.mockRestore();
  });
});
