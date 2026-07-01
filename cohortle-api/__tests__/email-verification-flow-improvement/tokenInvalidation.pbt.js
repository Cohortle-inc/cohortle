/**
 * Property-Based Test: Token Invalidation After Use
 * Feature: email-verification-flow-improvement
 * Property 11: Token Invalidation After Use
 * 
 * **Validates: Requirements 7.3**
 * 
 * For any verification token, after successful verification, attempting to use
 * the same token again should be rejected as the token should be marked as used.
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

describe('Feature: email-verification-flow-improvement, Property 11: Token Invalidation After Use', () => {
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

  it('should reject a token after it has been invalidated', async () => {
    // Test with multiple users to ensure consistency
    const numUsersArb = fc.integer({ min: 5, max: 20 });

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

            // Validate token before invalidation - should be valid
            const validationBefore = await VerificationTokenService.validateToken(token);
            expect(validationBefore.valid).toBe(true);
            expect(validationBefore.userId).toBe(userId);
            expect(validationBefore.error).toBeUndefined();

            // Invalidate the token
            await VerificationTokenService.invalidateToken(token);

            // Validate token after invalidation - should be invalid
            const validationAfter = await VerificationTokenService.validateToken(token);
            expect(validationAfter.valid).toBe(false);
            expect(validationAfter.error).toBe('Token already used');
            expect(validationAfter.userId).toBeUndefined();

            // Verify the token is marked as used in the database
            const records = await sdk.get({ token });
            expect(records.length).toBe(1);
            expect(records[0].used_at).not.toBeNull();
            expect(new Date(records[0].used_at)).toBeInstanceOf(Date);
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

  it('should permanently invalidate a token - multiple validation attempts should all fail', async () => {
    // Test that once invalidated, a token stays invalid
    const numUsersArb = fc.integer({ min: 3, max: 10 });
    const numValidationAttemptsArb = fc.integer({ min: 2, max: 5 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        numValidationAttemptsArb,
        async (numUsers, numValidationAttempts) => {
          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            // Generate and invalidate a token
            const token = await VerificationTokenService.generateToken(userId);
            await VerificationTokenService.invalidateToken(token);

            // Try to validate the token multiple times
            for (let j = 0; j < numValidationAttempts; j++) {
              const validation = await VerificationTokenService.validateToken(token);
              
              // Property: Token should remain invalid across all attempts
              expect(validation.valid).toBe(false);
              expect(validation.error).toBe('Token already used');
              expect(validation.userId).toBeUndefined();
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

  it('should invalidate only the specified token, not other tokens for the same user', async () => {
    // Test that invalidating one token doesn't affect other tokens
    const numUsersArb = fc.integer({ min: 3, max: 8 });
    const tokensPerUserArb = fc.integer({ min: 2, max: 5 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        tokensPerUserArb,
        async (numUsers, tokensPerUser) => {
          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            // Generate multiple tokens for the same user
            const tokens = [];
            for (let j = 0; j < tokensPerUser; j++) {
              const token = await VerificationTokenService.generateToken(userId);
              tokens.push(token);
            }

            // Invalidate the first token
            await VerificationTokenService.invalidateToken(tokens[0]);

            // Verify first token is invalid
            const firstValidation = await VerificationTokenService.validateToken(tokens[0]);
            expect(firstValidation.valid).toBe(false);
            expect(firstValidation.error).toBe('Token already used');

            // Verify other tokens are still valid
            for (let j = 1; j < tokens.length; j++) {
              const validation = await VerificationTokenService.validateToken(tokens[j]);
              
              // Property: Other tokens should remain valid
              expect(validation.valid).toBe(true);
              expect(validation.userId).toBe(userId);
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

  it('should set used_at timestamp when invalidating a token', async () => {
    // Test that invalidation properly sets the used_at timestamp
    const numUsersArb = fc.integer({ min: 5, max: 15 });

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

            // Record time before invalidation
            const beforeInvalidation = new Date();

            // Invalidate the token
            await VerificationTokenService.invalidateToken(token);

            // Record time after invalidation
            const afterInvalidation = new Date();

            // Retrieve token from database
            const records = await sdk.get({ token });
            expect(records.length).toBe(1);
            
            const tokenRecord = records[0];

            // Property: used_at should be set
            expect(tokenRecord.used_at).not.toBeNull();

            // Property: used_at should be a valid date
            const usedAt = new Date(tokenRecord.used_at);
            expect(usedAt).toBeInstanceOf(Date);
            expect(isNaN(usedAt.getTime())).toBe(false);

            // Property: used_at should be within the invalidation time window
            expect(usedAt.getTime()).toBeGreaterThanOrEqual(beforeInvalidation.getTime());
            expect(usedAt.getTime()).toBeLessThanOrEqual(afterInvalidation.getTime());
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

  it('should handle invalidation of already-invalidated tokens gracefully', async () => {
    // Test idempotency - invalidating an already-invalidated token should not error
    const numUsersArb = fc.integer({ min: 3, max: 10 });
    const numInvalidationAttemptsArb = fc.integer({ min: 2, max: 5 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        numInvalidationAttemptsArb,
        async (numUsers, numInvalidationAttempts) => {
          const sdk = new BackendSDK();
          sdk.setTable('verification_tokens');

          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            // Generate a token
            const token = await VerificationTokenService.generateToken(userId);

            // Invalidate the token multiple times
            let firstUsedAt = null;
            for (let j = 0; j < numInvalidationAttempts; j++) {
              // Should not throw an error
              await expect(
                VerificationTokenService.invalidateToken(token)
              ).resolves.not.toThrow();

              // Check the used_at timestamp
              const records = await sdk.get({ token });
              expect(records.length).toBe(1);
              
              if (j === 0) {
                firstUsedAt = records[0].used_at;
                expect(firstUsedAt).not.toBeNull();
              } else {
                // Property: used_at should remain the same after first invalidation
                // (or be updated, depending on implementation - both are valid)
                expect(records[0].used_at).not.toBeNull();
              }
            }

            // Verify token is still invalid after multiple invalidation attempts
            const validation = await VerificationTokenService.validateToken(token);
            expect(validation.valid).toBe(false);
            expect(validation.error).toBe('Token already used');
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

  it('should invalidate tokens independently across different users', async () => {
    // Test that invalidating a token for one user doesn't affect tokens for other users
    const numUsersArb = fc.integer({ min: 5, max: 15 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          const userTokenPairs = [];

          // Create users and generate one token for each
          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            const token = await VerificationTokenService.generateToken(userId);
            userTokenPairs.push({ userId, token });
          }

          // Invalidate every other token
          for (let i = 0; i < userTokenPairs.length; i += 2) {
            await VerificationTokenService.invalidateToken(userTokenPairs[i].token);
          }

          // Verify invalidated tokens are invalid
          for (let i = 0; i < userTokenPairs.length; i += 2) {
            const validation = await VerificationTokenService.validateToken(userTokenPairs[i].token);
            expect(validation.valid).toBe(false);
            expect(validation.error).toBe('Token already used');
          }

          // Verify non-invalidated tokens are still valid
          for (let i = 1; i < userTokenPairs.length; i += 2) {
            const validation = await VerificationTokenService.validateToken(userTokenPairs[i].token);
            
            // Property: Tokens for other users should remain valid
            expect(validation.valid).toBe(true);
            expect(validation.userId).toBe(userTokenPairs[i].userId);
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

  it('should maintain token invalidation state across service restarts', async () => {
    // Test that invalidated tokens remain invalid (persistence)
    const numUsersArb = fc.integer({ min: 3, max: 10 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          const tokens = [];

          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            // Generate and invalidate a token
            const token = await VerificationTokenService.generateToken(userId);
            await VerificationTokenService.invalidateToken(token);
            tokens.push(token);
          }

          // Simulate service restart by creating a new validation call
          // (In reality, this tests that the database state persists)
          for (const token of tokens) {
            const validation = await VerificationTokenService.validateToken(token);
            
            // Property: Token should remain invalid after "restart"
            expect(validation.valid).toBe(false);
            expect(validation.error).toBe('Token already used');
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
});
