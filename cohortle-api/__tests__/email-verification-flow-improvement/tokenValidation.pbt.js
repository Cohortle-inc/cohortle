/**
 * Property-Based Test: Token Validation Comprehensive Checks
 * Feature: email-verification-flow-improvement
 * Property 10: Token Validation Comprehensive Checks
 * 
 * **Validates: Requirements 4.5, 4.6, 7.4**
 * 
 * For any verification token, the validation process should check token existence,
 * expiration status, user association, and usage status, rejecting tokens that fail
 * any check with specific error messages.
 */

const fc = require('fast-check');
const VerificationTokenService = require('../../services/VerificationTokenService');
const {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestData,
  createTestUser,
} = require('../helpers/testSetup');
const BackendSDK = require('../../core/BackendSDK');

describe('Feature: email-verification-flow-improvement, Property 10: Token Validation Comprehensive Checks', () => {
  let testUserIds = [];

  beforeAll(async () => {
    // Set NODE_ENV to test to use test database configuration
    process.env.NODE_ENV = 'test';
    
    await setupTestDatabase();
  });

  afterAll(async () => {
    // Clean up all test users
    for (const userId of testUserIds) {
      await cleanupTestData('verification_tokens', { user_id: userId });
      await cleanupTestData('users', { id: userId });
    }
    
    await teardownTestDatabase();
  });

  it('should reject tokens with invalid format with specific error message', async () => {
    // Generate various invalid token formats
    const invalidTokenArb = fc.oneof(
      fc.string({ minLength: 0, maxLength: 63 }), // Too short
      fc.string({ minLength: 65, maxLength: 100 }), // Too long
      fc.hexaString({ minLength: 64, maxLength: 64 }).map(s => s.toUpperCase()), // Uppercase (invalid)
      fc.string({ minLength: 64, maxLength: 64 }), // Non-hex characters
      fc.constant(''), // Empty string
      fc.constant(null), // Null
      fc.constant(undefined), // Undefined
      fc.integer(), // Wrong type
      fc.constant('g'.repeat(64)), // Invalid hex character
      fc.constant('0123456789abcdef'.repeat(3) + '0123456789ab'), // Valid hex but wrong length
    );

    await fc.assert(
      fc.asyncProperty(
        invalidTokenArb,
        async (invalidToken) => {
          const validation = await VerificationTokenService.validateToken(invalidToken);

          // Property: Invalid format should be rejected
          expect(validation.valid).toBe(false);
          expect(validation.error).toBe('Invalid token format');
          expect(validation.userId).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject non-existent tokens with specific error message', async () => {
    // Generate valid-format tokens that don't exist in database
    const nonExistentTokenArb = fc.hexaString({ minLength: 64, maxLength: 64 });

    await fc.assert(
      fc.asyncProperty(
        nonExistentTokenArb,
        async (token) => {
          // Ensure token doesn't exist in database
          const sdk = new BackendSDK();
          sdk.setTable('verification_tokens');
          const existing = await sdk.get({ token });
          
          // Skip if token happens to exist (very unlikely)
          fc.pre(existing.length === 0);

          const validation = await VerificationTokenService.validateToken(token);

          // Property: Non-existent token should be rejected with specific error
          expect(validation.valid).toBe(false);
          expect(validation.error).toBe('Token not found');
          expect(validation.userId).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject expired tokens with specific error message', async () => {
    // Test with multiple users and expired tokens
    const numUsersArb = fc.integer({ min: 3, max: 10 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          const sdk = new BackendSDK();
          sdk.setTable('verification_tokens');

          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            // Generate a token
            const token = await VerificationTokenService.generateToken(userId);

            // Manually expire the token by setting expires_at to the past
            const pastDate = new Date();
            pastDate.setHours(pastDate.getHours() - 25); // 25 hours ago (past 24hr expiry)

            await sdk.update(
              { expires_at: pastDate },
              { token }
            );

            // Validate the expired token
            const validation = await VerificationTokenService.validateToken(token);

            // Property: Expired token should be rejected with specific error
            expect(validation.valid).toBe(false);
            expect(validation.error).toBe('Token expired');
            expect(validation.userId).toBeUndefined();
          }

          // Clean up
          for (let i = 0; i < numUsers; i++) {
            await cleanupTestData('verification_tokens', { user_id: testUserIds[testUserIds.length - numUsers + i] });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject already-used tokens with specific error message', async () => {
    // Test with multiple users and used tokens
    const numUsersArb = fc.integer({ min: 3, max: 10 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            // Generate a token
            const token = await VerificationTokenService.generateToken(userId);

            // Mark token as used
            await VerificationTokenService.invalidateToken(token);

            // Validate the used token
            const validation = await VerificationTokenService.validateToken(token);

            // Property: Used token should be rejected with specific error
            expect(validation.valid).toBe(false);
            expect(validation.error).toBe('Token already used');
            expect(validation.userId).toBeUndefined();
          }

          // Clean up
          for (let i = 0; i < numUsers; i++) {
            await cleanupTestData('verification_tokens', { user_id: testUserIds[testUserIds.length - numUsers + i] });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept valid tokens and return user ID', async () => {
    // Test that valid tokens pass all checks
    const numUsersArb = fc.integer({ min: 5, max: 15 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            // Generate a valid token
            const token = await VerificationTokenService.generateToken(userId);

            // Validate the token
            const validation = await VerificationTokenService.validateToken(token);

            // Property: Valid token should pass all checks
            expect(validation.valid).toBe(true);
            expect(validation.userId).toBe(userId);
            expect(validation.error).toBeUndefined();
          }

          // Clean up
          for (let i = 0; i < numUsers; i++) {
            await cleanupTestData('verification_tokens', { user_id: testUserIds[testUserIds.length - numUsers + i] });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate tokens consistently across multiple validation attempts', async () => {
    // Test that validation is idempotent - same token returns same result
    const numUsersArb = fc.integer({ min: 3, max: 8 });
    const numValidationAttemptsArb = fc.integer({ min: 3, max: 7 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        numValidationAttemptsArb,
        async (numUsers, numValidationAttempts) => {
          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            // Generate a valid token
            const token = await VerificationTokenService.generateToken(userId);

            const validationResults = [];

            // Validate multiple times
            for (let j = 0; j < numValidationAttempts; j++) {
              const validation = await VerificationTokenService.validateToken(token);
              validationResults.push(validation);
            }

            // Property: All validation results should be identical
            for (let j = 1; j < validationResults.length; j++) {
              expect(validationResults[j].valid).toBe(validationResults[0].valid);
              expect(validationResults[j].userId).toBe(validationResults[0].userId);
              expect(validationResults[j].error).toBe(validationResults[0].error);
            }

            // Property: All should be valid since token is fresh
            validationResults.forEach(result => {
              expect(result.valid).toBe(true);
              expect(result.userId).toBe(userId);
              expect(result.error).toBeUndefined();
            });
          }

          // Clean up
          for (let i = 0; i < numUsers; i++) {
            await cleanupTestData('verification_tokens', { user_id: testUserIds[testUserIds.length - numUsers + i] });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should check all validation criteria in correct order', async () => {
    // Test that validation checks are performed in the right order:
    // 1. Format check
    // 2. Existence check
    // 3. Usage check
    // 4. Expiration check
    // 5. User association check

    const numUsersArb = fc.integer({ min: 3, max: 8 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          const sdk = new BackendSDK();
          sdk.setTable('verification_tokens');

          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            // Test 1: Invalid format should fail before database lookup
            const invalidFormat = 'invalid';
            const formatValidation = await VerificationTokenService.validateToken(invalidFormat);
            expect(formatValidation.valid).toBe(false);
            expect(formatValidation.error).toBe('Invalid token format');

            // Test 2: Valid format but non-existent should fail at existence check
            const nonExistent = 'a'.repeat(64);
            const existenceValidation = await VerificationTokenService.validateToken(nonExistent);
            expect(existenceValidation.valid).toBe(false);
            expect(existenceValidation.error).toBe('Token not found');

            // Test 3: Create a token and mark it as used - should fail at usage check
            const usedToken = await VerificationTokenService.generateToken(userId);
            await VerificationTokenService.invalidateToken(usedToken);
            const usageValidation = await VerificationTokenService.validateToken(usedToken);
            expect(usageValidation.valid).toBe(false);
            expect(usageValidation.error).toBe('Token already used');

            // Test 4: Create a token and expire it - should fail at expiration check
            const expiredToken = await VerificationTokenService.generateToken(userId);
            const pastDate = new Date();
            pastDate.setHours(pastDate.getHours() - 25);
            await sdk.update({ expires_at: pastDate }, { token: expiredToken });
            const expirationValidation = await VerificationTokenService.validateToken(expiredToken);
            expect(expirationValidation.valid).toBe(false);
            expect(expirationValidation.error).toBe('Token expired');

            // Test 5: Valid token should pass all checks
            const validToken = await VerificationTokenService.generateToken(userId);
            const validValidation = await VerificationTokenService.validateToken(validToken);
            expect(validValidation.valid).toBe(true);
            expect(validValidation.userId).toBe(userId);
          }

          // Clean up
          for (let i = 0; i < numUsers; i++) {
            await cleanupTestData('verification_tokens', { user_id: testUserIds[testUserIds.length - numUsers + i] });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return specific error messages for each failure type', async () => {
    // Test that each validation failure returns a distinct, specific error message
    const numUsersArb = fc.integer({ min: 2, max: 5 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          const sdk = new BackendSDK();
          sdk.setTable('verification_tokens');

          const errorMessages = new Set();

          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            // Collect error messages from different failure scenarios
            
            // Invalid format
            const formatResult = await VerificationTokenService.validateToken('invalid');
            if (!formatResult.valid) {
              errorMessages.add(formatResult.error);
            }

            // Token not found
            const notFoundResult = await VerificationTokenService.validateToken('a'.repeat(64));
            if (!notFoundResult.valid) {
              errorMessages.add(notFoundResult.error);
            }

            // Token already used
            const usedToken = await VerificationTokenService.generateToken(userId);
            await VerificationTokenService.invalidateToken(usedToken);
            const usedResult = await VerificationTokenService.validateToken(usedToken);
            if (!usedResult.valid) {
              errorMessages.add(usedResult.error);
            }

            // Token expired
            const expiredToken = await VerificationTokenService.generateToken(userId);
            const pastDate = new Date();
            pastDate.setHours(pastDate.getHours() - 25);
            await sdk.update({ expires_at: pastDate }, { token: expiredToken });
            const expiredResult = await VerificationTokenService.validateToken(expiredToken);
            if (!expiredResult.valid) {
              errorMessages.add(expiredResult.error);
            }
          }

          // Property: Each failure type should have a distinct error message
          expect(errorMessages.size).toBeGreaterThanOrEqual(4);
          expect(errorMessages.has('Invalid token format')).toBe(true);
          expect(errorMessages.has('Token not found')).toBe(true);
          expect(errorMessages.has('Token already used')).toBe(true);
          expect(errorMessages.has('Token expired')).toBe(true);

          // Clean up
          for (let i = 0; i < numUsers; i++) {
            await cleanupTestData('verification_tokens', { user_id: testUserIds[testUserIds.length - numUsers + i] });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate tokens independently across different users', async () => {
    // Test that validation for one user's token doesn't affect another user's token
    const numUsersArb = fc.integer({ min: 5, max: 15 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          const userTokenPairs = [];

          // Create users and generate tokens
          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            const token = await VerificationTokenService.generateToken(userId);
            userTokenPairs.push({ userId, token });
          }

          // Validate all tokens
          for (const { userId, token } of userTokenPairs) {
            const validation = await VerificationTokenService.validateToken(token);

            // Property: Each token should be valid and associated with correct user
            expect(validation.valid).toBe(true);
            expect(validation.userId).toBe(userId);
            expect(validation.error).toBeUndefined();
          }

          // Invalidate every other token
          for (let i = 0; i < userTokenPairs.length; i += 2) {
            await VerificationTokenService.invalidateToken(userTokenPairs[i].token);
          }

          // Validate all tokens again
          for (let i = 0; i < userTokenPairs.length; i++) {
            const validation = await VerificationTokenService.validateToken(userTokenPairs[i].token);

            if (i % 2 === 0) {
              // Property: Invalidated tokens should be invalid
              expect(validation.valid).toBe(false);
              expect(validation.error).toBe('Token already used');
            } else {
              // Property: Other tokens should remain valid
              expect(validation.valid).toBe(true);
              expect(validation.userId).toBe(userTokenPairs[i].userId);
            }
          }

          // Clean up
          for (let i = 0; i < numUsers; i++) {
            await cleanupTestData('verification_tokens', { user_id: testUserIds[testUserIds.length - numUsers + i] });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge cases in token validation', async () => {
    // Test various edge cases
    const edgeCaseTokenArb = fc.oneof(
      fc.constant('0'.repeat(64)), // All zeros
      fc.constant('f'.repeat(64)), // All f's
      fc.constant('0123456789abcdef'.repeat(4)), // Repeating pattern
      fc.hexaString({ minLength: 64, maxLength: 64 }), // Random valid format
    );

    await fc.assert(
      fc.asyncProperty(
        edgeCaseTokenArb,
        async (token) => {
          const validation = await VerificationTokenService.validateToken(token);

          // Property: Edge case tokens should be validated correctly
          // They should fail with "Token not found" since they don't exist
          expect(validation.valid).toBe(false);
          expect(validation.error).toBe('Token not found');
          expect(validation.userId).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate that token expiration is checked against current time', async () => {
    // Test that expiration check uses current time, not creation time
    const numUsersArb = fc.integer({ min: 3, max: 8 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          const sdk = new BackendSDK();
          sdk.setTable('verification_tokens');

          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            // Generate a token
            const token = await VerificationTokenService.generateToken(userId);

            // Token should be valid immediately
            const immediateValidation = await VerificationTokenService.validateToken(token);
            expect(immediateValidation.valid).toBe(true);

            // Set expiration to 1 second in the future
            const nearFuture = new Date();
            nearFuture.setSeconds(nearFuture.getSeconds() + 1);
            await sdk.update({ expires_at: nearFuture }, { token });

            // Token should still be valid
            const beforeExpiryValidation = await VerificationTokenService.validateToken(token);
            expect(beforeExpiryValidation.valid).toBe(true);

            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 1100));

            // Token should now be expired
            const afterExpiryValidation = await VerificationTokenService.validateToken(token);
            expect(afterExpiryValidation.valid).toBe(false);
            expect(afterExpiryValidation.error).toBe('Token expired');
          }

          // Clean up
          for (let i = 0; i < numUsers; i++) {
            await cleanupTestData('verification_tokens', { user_id: testUserIds[testUserIds.length - numUsers + i] });
          }
        }
      ),
      { numRuns: 50 } // Fewer runs due to setTimeout
    );
  });
});
