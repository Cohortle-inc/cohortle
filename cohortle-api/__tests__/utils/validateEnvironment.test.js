/**
 * Unit tests for environment validation utility
 * 
 * Requirements: 2.1, 2.2, 2.5, 2.6
 */

const { validateEnvironment } = require('../../utils/validateEnvironment');

describe('Environment Validation', () => {
  let originalEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Required Variables', () => {
    it('should pass when all required variables are set', () => {
      process.env.NODE_ENV = 'production';
      process.env.DB_HOSTNAME = 'db.example.com';
      process.env.DB_PORT = '3306';
      process.env.DB_USER = 'user';
      process.env.DB_PASSWORD = 'password';
      process.env.DB_DATABASE = 'cohortle';
      process.env.JWT_SECRET = 'secret';
      process.env.PORT = '3000';

      const result = validateEnvironment();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when required variables are missing', () => {
      process.env = {}; // Clear all env vars

      const result = validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.variable === 'NODE_ENV')).toBe(true);
      expect(result.errors.some(e => e.variable === 'DB_DATABASE/DB_NAME')).toBe(true);
    });
  });

  describe('NODE_ENV Validation', () => {
    it('should require NODE_ENV to be "production" in production environment', () => {
      process.env.NODE_ENV = 'development';
      process.env.DB_HOSTNAME = 'production-db.example.com'; // Not localhost
      process.env.DB_PORT = '3306';
      process.env.DB_USER = 'user';
      process.env.DB_PASSWORD = 'password';
      process.env.DB_DATABASE = 'cohortle';
      process.env.JWT_SECRET = 'secret';
      process.env.PORT = '3000';

      const result = validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => 
        e.variable === 'NODE_ENV' && 
        e.expected === 'production'
      )).toBe(true);
    });

    it('should allow non-production NODE_ENV for localhost', () => {
      process.env.NODE_ENV = 'development';
      process.env.DB_HOSTNAME = '127.0.0.1';
      process.env.DB_PORT = '3306';
      process.env.DB_USER = 'user';
      process.env.DB_PASSWORD = 'password';
      process.env.DB_DATABASE = 'cohortle';
      process.env.JWT_SECRET = 'secret';
      process.env.PORT = '3000';

      const result = validateEnvironment();

      expect(result.valid).toBe(true);
    });
  });

  describe('DB_DATABASE Validation', () => {
    it('should reject "cohortle.com" as database name', () => {
      process.env.NODE_ENV = 'production';
      process.env.DB_HOSTNAME = '127.0.0.1';
      process.env.DB_PORT = '3306';
      process.env.DB_USER = 'user';
      process.env.DB_PASSWORD = 'password';
      process.env.DB_DATABASE = 'cohortle.com'; // Invalid
      process.env.JWT_SECRET = 'secret';
      process.env.PORT = '3000';

      const result = validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => 
        e.variable === 'DB_DATABASE/DB_NAME' && 
        e.actual === 'cohortle.com'
      )).toBe(true);
    });

    it('should accept valid database names', () => {
      process.env.NODE_ENV = 'production';
      process.env.DB_HOSTNAME = '127.0.0.1';
      process.env.DB_PORT = '3306';
      process.env.DB_USER = 'user';
      process.env.DB_PASSWORD = 'password';
      process.env.DB_DATABASE = 'cohortle';
      process.env.JWT_SECRET = 'secret';
      process.env.PORT = '3000';

      const result = validateEnvironment();

      expect(result.valid).toBe(true);
    });

    it('should accept DB_HOST and DB_NAME aliases used by deployments', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.DB_HOSTNAME;
      delete process.env.DB_DATABASE;
      process.env.DB_HOST = 'db.example.com';
      process.env.DB_PORT = '3306';
      process.env.DB_USER = 'user';
      process.env.DB_PASSWORD = 'password';
      process.env.DB_NAME = 'cohortle';
      process.env.JWT_SECRET = 'secret';
      process.env.PORT = '3000';

      const result = validateEnvironment();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('PORT Validation', () => {
    it('should reject invalid port numbers', () => {
      process.env.NODE_ENV = 'production';
      process.env.DB_HOSTNAME = '127.0.0.1';
      process.env.DB_PORT = '3306';
      process.env.DB_USER = 'user';
      process.env.DB_PASSWORD = 'password';
      process.env.DB_DATABASE = 'cohortle';
      process.env.JWT_SECRET = 'secret';
      process.env.PORT = 'invalid';

      const result = validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.variable === 'PORT')).toBe(true);
    });

    it('should accept valid port numbers', () => {
      process.env.NODE_ENV = 'production';
      process.env.DB_HOSTNAME = '127.0.0.1';
      process.env.DB_PORT = '3306';
      process.env.DB_USER = 'user';
      process.env.DB_PASSWORD = 'password';
      process.env.DB_DATABASE = 'cohortle';
      process.env.JWT_SECRET = 'secret';
      process.env.PORT = '8080';

      const result = validateEnvironment();

      expect(result.valid).toBe(true);
    });
  });

  describe('Warnings', () => {
    it('should warn about default JWT_SECRET', () => {
      process.env.NODE_ENV = 'production';
      process.env.DB_HOSTNAME = '127.0.0.1';
      process.env.DB_PORT = '3306';
      process.env.DB_USER = 'user';
      process.env.DB_PASSWORD = 'password';
      process.env.DB_DATABASE = 'cohortle';
      process.env.JWT_SECRET = 'your-secret-key-change-in-production';
      process.env.PORT = '3000';

      const result = validateEnvironment();

      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('JWT_SECRET'))).toBe(true);
    });
  });
});
