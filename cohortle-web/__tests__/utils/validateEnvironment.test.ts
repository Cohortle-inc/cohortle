/**
 * Tests for Environment Validation Utility
 * 
 * Requirements: 2.3, 2.5
 */

import { validateEnvironment, validateRuntimeEnvironment } from '@/lib/utils/validateEnvironment';

describe('validateEnvironment', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('should pass validation when NEXT_PUBLIC_API_URL is set', () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.cohortle.com';
    
    const result = validateEnvironment();
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail validation when NEXT_PUBLIC_API_URL is missing', () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    
    const result = validateEnvironment();
    
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].variable).toBe('NEXT_PUBLIC_API_URL');
    expect(result.errors[0].severity).toBe('critical');
  });

  it('should fail validation when NEXT_PUBLIC_API_URL is empty', () => {
    process.env.NEXT_PUBLIC_API_URL = '';
    
    const result = validateEnvironment();
    
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].variable).toBe('NEXT_PUBLIC_API_URL');
  });

  it('should fail validation when NEXT_PUBLIC_API_URL is not a valid URL', () => {
    process.env.NEXT_PUBLIC_API_URL = 'not-a-valid-url';
    
    const result = validateEnvironment();
    
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].variable).toBe('NEXT_PUBLIC_API_URL');
    expect(result.errors[0].expected).toContain('valid URL');
  });

  it('should warn when NEXT_PUBLIC_API_URL has trailing slash', () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.cohortle.com/';
    
    const result = validateEnvironment();
    
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('trailing slash');
  });

  it('should warn when using localhost in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001';
    
    const result = validateEnvironment();
    
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('localhost');
  });

  it('should accept valid production URL', () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_API_URL = 'https://api.cohortle.com';
    
    const result = validateEnvironment();
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept valid localhost URL in development', () => {
    process.env.NODE_ENV = 'development';
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001';
    
    const result = validateEnvironment();
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('validateRuntimeEnvironment', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should pass validation when NEXT_PUBLIC_API_URL is available at runtime', () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.cohortle.com';
    
    const result = validateRuntimeEnvironment();
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail validation when NEXT_PUBLIC_API_URL is missing at runtime', () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    
    const result = validateRuntimeEnvironment();
    
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].variable).toBe('NEXT_PUBLIC_API_URL');
  });
});
