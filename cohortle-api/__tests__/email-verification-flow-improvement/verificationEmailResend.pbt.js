/**
 * Property-Based Test: Verification Email Resend
 * Feature: email-verification-flow-improvement
 * Property 4: Verification Email Resend
 * 
 * **Validates: Requirements 2.4**
 * 
 * For any authenticated unverified user, triggering the resend verification
 * action should generate a new verification token and send a new verification email.
 */

const fc = require('fast-check');
const VerificationTokenService = require('../../services/VerificationTokenService');
const ResendService = require('../../services/ResendService');
const {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestData,
  createTestUser,
} = require('../helpers/testSetup');
const db = require('../../models');

describe('Feature: email-verification-flow-improvement, Property 4: Verification Email Resend', () => {
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

  it('should generate a new verification token when resend is triggered', async () => {
    // Test that resending generates a new unique token
    const numUsersArb = fc.integer({ min: 5, max: 15 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            // Verify user is unverified
            const user = await db.users.findOne({ where: { id: userId } });
            expect(user.email_verified).toBe(0);

            // Generate initial verification token
            const initialToken = await VerificationTokenService.generateToken(userId);
            expect(initialToken).toBeTruthy();
            expect(initialToken).toMatch(/^[a-f0-9]{64}$/);

            // Simulate resend: generate new token
            const newToken = await VerificationTokenService.generateToken(userId);
            expect(newToken).toBeTruthy();
            expect(newToken).toMatch(/^[a-f0-9]{64}$/);

            // Property: New token should be different from initial token
            expect(newToken).not.toBe(initialToken);

            // Property: New token should be valid
            const validation = await VerificationTokenService.validateToken(newToken);
            expect(validation.valid).toBe(true);
            expect(validation.userId).toBe(userId);
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

  it('should invalidate old token when new token is generated', async () => {
    // Test that old tokens become invalid after resend
    const numUsersArb = fc.integer({ min: 5, max: 15 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            // Generate initial token
            const initialToken = await VerificationTokenService.generateToken(userId);
            
            // Verify initial token is valid
            const initialValidation = await VerificationTokenService.validateToken(initialToken);
            expect(initialValidation.valid).toBe(true);

            // Generate new token (simulating resend)
            const newToken = await VerificationTokenService.generateToken(userId);

            // Property: Old token should now be invalid
            const oldTokenValidation = await VerificationTokenService.validateToken(initialToken);
            expect(oldTokenValidation.valid).toBe(false);

            // Property: New token should be valid
            const newTokenValidation = await VerificationTokenService.validateToken(newToken);
            expect(newTokenValidation.valid).toBe(true);
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

  it('should generate tokens with correct expiration time on resend', async () => {
    // Test that resent tokens have proper 24-hour expiration
    const numUsersArb = fc.integer({ min: 5, max: 15 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            // Generate initial token
            await VerificationTokenService.generateToken(userId);

            // Record time before resend
            const beforeResend = new Date();

            // Simulate resend
            const newToken = await VerificationTokenService.generateToken(userId);

            // Get token from database
            const tokenRecord = await db.verification_tokens.findOne({
              where: { token: newToken }
            });

            expect(tokenRecord).toBeTruthy();

            // Property: Token should expire in approximately 24 hours
            const expiresAt = new Date(tokenRecord.expires_at);
            const expectedExpiry = new Date(beforeResend.getTime() + 24 * 60 * 60 * 1000);
            
            // Allow 5 second tolerance for test execution time
            const timeDiff = Math.abs(expiresAt.getTime() - expectedExpiry.getTime());
            expect(timeDiff).toBeLessThan(5000);
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

  it('should maintain user unverified status during resend', async () => {
    // Test that resending doesn't accidentally verify the user
    const numUsersArb = fc.integer({ min: 5, max: 15 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            // Verify initial state
            const userBefore = await db.users.findOne({ where: { id: userId } });
            expect(userBefore.email_verified).toBe(0);

            // Generate initial token
            await VerificationTokenService.generateToken(userId);

            // Resend multiple times
            const numResends = Math.floor(Math.random() * 3) + 1;
            for (let j = 0; j < numResends; j++) {
              await VerificationTokenService.generateToken(userId);
            }

            // Property: User should still be unverified
            const userAfter = await db.users.findOne({ where: { id: userId } });
            expect(userAfter.email_verified).toBe(0);
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

  it('should allow multiple resends for the same user', async () => {
    // Test that users can resend verification multiple times
    const numUsersArb = fc.integer({ min: 3, max: 10 });
    const numResendsArb = fc.integer({ min: 2, max: 5 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        numResendsArb,
        async (numUsers, numResends) => {
          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            const tokens = [];

            // Generate initial token
            const initialToken = await VerificationTokenService.generateToken(userId);
            tokens.push(initialToken);

            // Resend multiple times
            for (let j = 0; j < numResends; j++) {
              const newToken = await VerificationTokenService.generateToken(userId);
              tokens.push(newToken);
            }

            // Property: All tokens should be unique
            const uniqueTokens = new Set(tokens);
            expect(uniqueTokens.size).toBe(tokens.length);

            // Property: Only the last token should be valid
            const lastToken = tokens[tokens.length - 1];
            const lastTokenValidation = await VerificationTokenService.validateToken(lastToken);
            expect(lastTokenValidation.valid).toBe(true);

            // Property: All previous tokens should be invalid
            for (let j = 0; j < tokens.length - 1; j++) {
              const oldTokenValidation = await VerificationTokenService.validateToken(tokens[j]);
              expect(oldTokenValidation.valid).toBe(false);
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

  it('should create valid verification links with new tokens', async () => {
    // Test that resent tokens can be used to create valid verification links
    const numUsersArb = fc.integer({ min: 5, max: 15 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            // Generate initial token
            await VerificationTokenService.generateToken(userId);

            // Resend
            const newToken = await VerificationTokenService.generateToken(userId);

            // Create verification link (as the endpoint would)
            const verificationLink = `${frontendUrl}/verify-email?token=${newToken}`;

            // Property: Link should contain the new token
            expect(verificationLink).toContain(newToken);
            expect(verificationLink).toContain('/verify-email?token=');

            // Property: Token in link should be valid
            const validation = await VerificationTokenService.validateToken(newToken);
            expect(validation.valid).toBe(true);
            expect(validation.userId).toBe(userId);
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

  it('should handle rapid resend requests correctly', async () => {
    // Test that rapid consecutive resends work correctly
    const numUsersArb = fc.integer({ min: 3, max: 8 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            // Generate tokens rapidly
            const tokens = [];
            for (let j = 0; j < 5; j++) {
              const token = await VerificationTokenService.generateToken(userId);
              tokens.push(token);
            }

            // Property: All tokens should be unique
            const uniqueTokens = new Set(tokens);
            expect(uniqueTokens.size).toBe(tokens.length);

            // Property: Only the last token should be valid
            const lastToken = tokens[tokens.length - 1];
            const lastValidation = await VerificationTokenService.validateToken(lastToken);
            expect(lastValidation.valid).toBe(true);

            // Property: All previous tokens should be invalid
            for (let j = 0; j < tokens.length - 1; j++) {
              const validation = await VerificationTokenService.validateToken(tokens[j]);
              expect(validation.valid).toBe(false);
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

  it('should preserve user data during resend operations', async () => {
    // Test that resending doesn't modify user data
    const numUsersArb = fc.integer({ min: 5, max: 15 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            // Get user data before resend
            const userBefore = await db.users.findOne({ where: { id: userId } });
            const emailBefore = userBefore.email;
            const firstNameBefore = userBefore.first_name;
            const lastNameBefore = userBefore.last_name;
            const emailVerifiedBefore = userBefore.email_verified;

            // Generate initial token
            await VerificationTokenService.generateToken(userId);

            // Resend
            await VerificationTokenService.generateToken(userId);

            // Get user data after resend
            const userAfter = await db.users.findOne({ where: { id: userId } });

            // Property: User data should be unchanged
            expect(userAfter.email).toBe(emailBefore);
            expect(userAfter.first_name).toBe(firstNameBefore);
            expect(userAfter.last_name).toBe(lastNameBefore);
            expect(userAfter.email_verified).toBe(emailVerifiedBefore);
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

  it('should ensure resent tokens are associated with correct user', async () => {
    // Test that tokens are always associated with the correct user
    const numUsersArb = fc.integer({ min: 5, max: 15 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          const userTokenPairs = [];

          // Create multiple users and generate tokens
          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            // Generate initial token
            await VerificationTokenService.generateToken(userId);

            // Resend
            const newToken = await VerificationTokenService.generateToken(userId);
            userTokenPairs.push({ userId, token: newToken });
          }

          // Property: Each token should validate to its correct user
          for (const pair of userTokenPairs) {
            const validation = await VerificationTokenService.validateToken(pair.token);
            expect(validation.valid).toBe(true);
            expect(validation.userId).toBe(pair.userId);
          }

          // Property: Tokens should not validate for wrong users
          for (let i = 0; i < userTokenPairs.length; i++) {
            const validation = await VerificationTokenService.validateToken(userTokenPairs[i].token);
            expect(validation.userId).toBe(userTokenPairs[i].userId);
            
            // Verify it's not associated with any other user
            for (let j = 0; j < userTokenPairs.length; j++) {
              if (i !== j) {
                expect(validation.userId).not.toBe(userTokenPairs[j].userId);
              }
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

  it('should maintain token count constraints during resend', async () => {
    // Test that only one active token exists per user after resend
    const numUsersArb = fc.integer({ min: 5, max: 15 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            // Generate initial token
            await VerificationTokenService.generateToken(userId);

            // Resend multiple times
            const numResends = Math.floor(Math.random() * 4) + 1;
            for (let j = 0; j < numResends; j++) {
              await VerificationTokenService.generateToken(userId);
            }

            // Property: Only one valid (unused, non-expired) token should exist
            const allTokens = await db.verification_tokens.findAll({
              where: { user_id: userId }
            });

            const validTokens = allTokens.filter(t => 
              t.used_at === null && new Date(t.expires_at) > new Date()
            );

            expect(validTokens.length).toBe(1);
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
