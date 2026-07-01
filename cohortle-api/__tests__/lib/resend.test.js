const { Resend } = require('resend');

// Mock the resend module
jest.mock('resend');

describe('Resend Client Initialization', () => {
  let originalEnv;
  let consoleWarnSpy;

  beforeEach(() => {
    // Save original environment
    originalEnv = process.env.RESEND_API_KEY;
    // Spy on console.warn
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    // Clear module cache to get fresh instance
    jest.clearAllMocks();
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original environment
    if (originalEnv) {
      process.env.RESEND_API_KEY = originalEnv;
    } else {
      delete process.env.RESEND_API_KEY;
    }
    // Restore console.warn
    consoleWarnSpy.mockRestore();
  });

  test('should successfully initialize with valid API key', () => {
    // Set valid API key
    process.env.RESEND_API_KEY = 'test-api-key-123';

    // Mock Resend constructor to return a mock client
    const mockResendInstance = { emails: { send: jest.fn() } };
    Resend.mockImplementation(() => mockResendInstance);

    // Require the module (will execute initialization)
    const resendClient = require('../../lib/resend');

    // Should return the client instance
    expect(resendClient).toBeDefined();
    expect(resendClient).not.toBeNull();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  test('should return null and log warning when API key is missing', () => {
    // Remove API key
    delete process.env.RESEND_API_KEY;

    // Require the module
    const resendClient = require('../../lib/resend');

    // Should return null and log warning
    expect(resendClient).toBeNull();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'RESEND_API_KEY environment variable is not configured. Email functionality will not work.'
    );
  });

  test('should log descriptive warning message', () => {
    // Remove API key
    delete process.env.RESEND_API_KEY;

    // Require the module
    require('../../lib/resend');

    // Verify warning message is descriptive
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('RESEND_API_KEY')
    );
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('not configured')
    );
  });
});
