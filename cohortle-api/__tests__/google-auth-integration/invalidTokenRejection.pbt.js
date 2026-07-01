/**
 * Property-Based Test: Invalid Google tokens are always rejected
 * Feature: google-auth-integration
 * Property 1: Invalid Google tokens are always rejected
 *
 * **Validates: Requirements 2.3, 2.5**
 *
 * For any string that is not a valid Google ID token, GoogleAuthService.verifyIdToken()
 * should always throw an error.
 */

const fc = require('fast-check');

// Mock google-auth-library so no real network calls are made.
// The mock always throws, simulating an invalid/expired token.
jest.mock('google-auth-library', () => {
  return {
    OAuth2Client: jest.fn().mockImplementation(() => ({
      verifyIdToken: jest.fn().mockRejectedValue(new Error('Token used too late')),
    })),
  };
});

const GoogleAuthService = require('../../services/GoogleAuthService');

describe('Feature: google-auth-integration, Property 1: Invalid Google tokens are always rejected', () => {
  it('should reject arbitrary strings as invalid Google tokens', async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        async (arbitraryString) => {
          await expect(
            GoogleAuthService.verifyIdToken(arbitraryString)
          ).rejects.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject empty string as invalid token', async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
    await expect(GoogleAuthService.verifyIdToken('')).rejects.toThrow();
  });

  it('should throw configuration error when GOOGLE_CLIENT_ID is not set', async () => {
    const originalClientId = process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_ID;

    try {
      await expect(
        GoogleAuthService.verifyIdToken('some.token.here')
      ).rejects.toThrow(/not configured/i);
    } finally {
      if (originalClientId !== undefined) {
        process.env.GOOGLE_CLIENT_ID = originalClientId;
      }
    }
  });
});
