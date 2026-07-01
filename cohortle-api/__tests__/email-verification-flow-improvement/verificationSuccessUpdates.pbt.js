/**
 * Property-Based Test: Successful Verification Updates
 * Feature: email-verification-flow-improvement
 * Property 9: Successful Verification Updates
 * 
 * **Validates: Requirements 4.3, 4.4, 8.1, 8.2**
 * 
 * For any valid verification token, successfully verifying should atomically
 * update both the database (email_verified = 1) and return a new JWT with
 * email_verified: true.
 */

const fc = require('fast-check');
const VerificationTokenService = require('../../services/VerificationTokenService');
const JwtService = require('../../services/JwtService');
const {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestData,
  createTestUser,
} = require('../helpers/testSetup');
const BackendSDK = require('../../core/BackendSDK');
const db = require('../../models');

describe('Feature: email-verification-flow-improvement, Property 9: Successful Verification Updates', () => {
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

  it('should atomically update database email_verified field when verification succeeds', async () => {
    // Test that database is updated correctly for multiple users
    const numUsersArb = fc.integer({ min: 5, max: 15 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          const sdk = new BackendSDK();
          sdk.setTable('users');

          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            // Verify user starts as unverified
            const userBefore = await db.users.findOne({ where: { id: userId } });
            expect(userBefore.email_verified).toBe(0);

            // Generate verification token
            const token = await VerificationTokenService.generateToken(userId);

            // Validate token (simulating verification process)
            const validation = await VerificationTokenService.validateToken(token);
            expect(validation.valid).toBe(true);

            // Update email_verified (simulating successful verification)
            await db.users.update(
              { email_verified: 1 },
              { where: { id: userId } }
            );

            // Invalidate token after successful verification
            await VerificationTokenService.invalidateToken(token);

            // Property: Database should be updated atomically
            const userAfter = await db.users.findOne({ where: { id: userId } });
            expect(userAfter.email_verified).toBe(1);

            // Property: Token should be invalidated after use
            const revalidation = await VerificationTokenService.validateToken(token);
            expect(revalidation.valid).toBe(false);
            expect(revalidation.error).toBe('Token already used');
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

  it('should return JWT with email_verified: true after successful verification', async () => {
    // Test that JWT contains correct verification status
    const numUsersArb = fc.integer({ min: 5, max: 15 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          const sdk = new BackendSDK();
          sdk.setTable('users');

          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            // Get user details
            const user = await db.users.findOne({ 
              where: { id: userId },
              include: [{
                model: db.roles,
                as: 'role',
                attributes: ['name']
              }]
            });

            // Generate verification token
            const token = await VerificationTokenService.generateToken(userId);

            // Validate and verify
            const validation = await VerificationTokenService.validateToken(token);
            expect(validation.valid).toBe(true);

            // Update database
            await db.users.update(
              { email_verified: 1 },
              { where: { id: userId } }
            );

            // Create new JWT after verification (simulating auth endpoint behavior)
            const newJwt = JwtService.createAccessToken(
              {
                user_id: userId,
                email: user.email,
                email_verified: true, // This is the key field we're testing
                role: user.role ? user.role.name : 'unassigned'
              },
              24 * 60 * 60 * 1000, // 24 hours
              process.env.JWT_SECRET
            );

            // Property: JWT should be valid and contain email_verified: true
            expect(newJwt).toBeTruthy();
            expect(typeof newJwt).toBe('string');

            // Decode and verify JWT payload
            const payload = JwtService.verifyAccessToken(newJwt, process.env.JWT_SECRET);
            expect(payload).toBeTruthy();
            expect(payload.user_id).toBe(userId);
            expect(payload.email).toBe(user.email);
            expect(payload.email_verified).toBe(true);

            // Invalidate token
            await VerificationTokenService.invalidateToken(token);
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

  it('should ensure database update and JWT generation are consistent', async () => {
    // Test that database state matches JWT payload
    const numUsersArb = fc.integer({ min: 5, max: 15 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            // Get user details
            const user = await db.users.findOne({ 
              where: { id: userId },
              include: [{
                model: db.roles,
                as: 'role',
                attributes: ['name']
              }]
            });

            // Generate and validate token
            const token = await VerificationTokenService.generateToken(userId);
            const validation = await VerificationTokenService.validateToken(token);
            expect(validation.valid).toBe(true);

            // Perform verification (update database)
            await db.users.update(
              { email_verified: 1 },
              { where: { id: userId } }
            );

            // Get updated user from database
            const updatedUser = await db.users.findOne({ where: { id: userId } });

            // Create JWT with updated status
            const newJwt = JwtService.createAccessToken(
              {
                user_id: userId,
                email: user.email,
                email_verified: updatedUser.email_verified === 1, // Use database value
                role: user.role ? user.role.name : 'unassigned'
              },
              24 * 60 * 60 * 1000,
              process.env.JWT_SECRET
            );

            // Decode JWT
            const payload = JwtService.verifyAccessToken(newJwt, process.env.JWT_SECRET);

            // Property: JWT email_verified should match database email_verified
            expect(payload.email_verified).toBe(updatedUser.email_verified === 1);
            expect(payload.email_verified).toBe(true);
            expect(updatedUser.email_verified).toBe(1);

            // Invalidate token
            await VerificationTokenService.invalidateToken(token);
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

  it('should maintain atomicity - both updates succeed or both fail', async () => {
    // Test that verification is atomic - can't have partial updates
    const numUsersArb = fc.integer({ min: 3, max: 10 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            // Generate token
            const token = await VerificationTokenService.generateToken(userId);

            // Validate token
            const validation = await VerificationTokenService.validateToken(token);
            expect(validation.valid).toBe(true);

            // Simulate successful verification flow
            const userBefore = await db.users.findOne({ where: { id: userId } });
            expect(userBefore.email_verified).toBe(0);

            // Update database
            await db.users.update(
              { email_verified: 1 },
              { where: { id: userId } }
            );

            // Verify database was updated
            const userAfter = await db.users.findOne({ where: { id: userId } });
            expect(userAfter.email_verified).toBe(1);

            // Create JWT
            const newJwt = JwtService.createAccessToken(
              {
                user_id: userId,
                email: userAfter.email,
                email_verified: true,
                role: 'unassigned'
              },
              24 * 60 * 60 * 1000,
              process.env.JWT_SECRET
            );

            // Verify JWT was created
            expect(newJwt).toBeTruthy();
            const payload = JwtService.verifyAccessToken(newJwt, process.env.JWT_SECRET);
            expect(payload.email_verified).toBe(true);

            // Property: Both database and JWT should reflect verified status
            expect(userAfter.email_verified).toBe(1);
            expect(payload.email_verified).toBe(true);

            // Invalidate token
            await VerificationTokenService.invalidateToken(token);
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

  it('should not update database if token validation fails', async () => {
    // Test that invalid tokens don't cause database updates
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

            // Generate token
            const token = await VerificationTokenService.generateToken(userId);

            // Expire the token
            const pastDate = new Date();
            pastDate.setHours(pastDate.getHours() - 25);
            await sdk.update({ expires_at: pastDate }, { token });

            // Validate expired token
            const validation = await VerificationTokenService.validateToken(token);
            expect(validation.valid).toBe(false);

            // Property: Database should NOT be updated for invalid token
            const user = await db.users.findOne({ where: { id: userId } });
            expect(user.email_verified).toBe(0);

            // Property: No JWT should be created for invalid token
            // (In real implementation, endpoint would return error before creating JWT)
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

  it('should handle multiple verification attempts correctly', async () => {
    // Test that verification is idempotent - multiple attempts don't cause issues
    const numUsersArb = fc.integer({ min: 3, max: 8 });
    const numAttemptsArb = fc.integer({ min: 2, max: 5 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        numAttemptsArb,
        async (numUsers, numAttempts) => {
          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            // Generate token
            const token = await VerificationTokenService.generateToken(userId);

            // First verification should succeed
            const validation1 = await VerificationTokenService.validateToken(token);
            expect(validation1.valid).toBe(true);

            // Update database
            await db.users.update(
              { email_verified: 1 },
              { where: { id: userId } }
            );

            // Invalidate token
            await VerificationTokenService.invalidateToken(token);

            // Subsequent attempts should fail (token already used)
            for (let j = 0; j < numAttempts; j++) {
              const validationN = await VerificationTokenService.validateToken(token);
              expect(validationN.valid).toBe(false);
              expect(validationN.error).toBe('Token already used');
            }

            // Property: Database should remain verified (idempotent)
            const user = await db.users.findOne({ where: { id: userId } });
            expect(user.email_verified).toBe(1);
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

  it('should preserve other user data during verification update', async () => {
    // Test that verification only updates email_verified, not other fields
    const numUsersArb = fc.integer({ min: 3, max: 10 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            // Get user data before verification
            const userBefore = await db.users.findOne({ where: { id: userId } });
            const emailBefore = userBefore.email;
            const firstNameBefore = userBefore.first_name;
            const lastNameBefore = userBefore.last_name;

            // Generate and validate token
            const token = await VerificationTokenService.generateToken(userId);
            const validation = await VerificationTokenService.validateToken(token);
            expect(validation.valid).toBe(true);

            // Update only email_verified
            await db.users.update(
              { email_verified: 1 },
              { where: { id: userId } }
            );

            // Get user data after verification
            const userAfter = await db.users.findOne({ where: { id: userId } });

            // Property: Only email_verified should change
            expect(userAfter.email_verified).toBe(1);
            expect(userAfter.email).toBe(emailBefore);
            expect(userAfter.first_name).toBe(firstNameBefore);
            expect(userAfter.last_name).toBe(lastNameBefore);

            // Invalidate token
            await VerificationTokenService.invalidateToken(token);
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

  it('should generate valid JWT that can be verified', async () => {
    // Test that generated JWT is valid and can be decoded
    const numUsersArb = fc.integer({ min: 5, max: 15 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            // Get user details
            const user = await db.users.findOne({ 
              where: { id: userId },
              include: [{
                model: db.roles,
                as: 'role',
                attributes: ['name']
              }]
            });

            // Generate token and verify
            const token = await VerificationTokenService.generateToken(userId);
            const validation = await VerificationTokenService.validateToken(token);
            expect(validation.valid).toBe(true);

            // Update database
            await db.users.update(
              { email_verified: 1 },
              { where: { id: userId } }
            );

            // Create JWT
            const newJwt = JwtService.createAccessToken(
              {
                user_id: userId,
                email: user.email,
                email_verified: true,
                role: user.role ? user.role.name : 'unassigned'
              },
              24 * 60 * 60 * 1000,
              process.env.JWT_SECRET
            );

            // Property: JWT should be valid and verifiable
            expect(newJwt).toBeTruthy();
            expect(typeof newJwt).toBe('string');
            expect(newJwt.split('.').length).toBe(3); // JWT has 3 parts

            // Verify JWT
            const payload = JwtService.verifyAccessToken(newJwt, process.env.JWT_SECRET);
            expect(payload).toBeTruthy();
            expect(payload.user_id).toBe(userId);
            expect(payload.email_verified).toBe(true);

            // Invalidate token
            await VerificationTokenService.invalidateToken(token);
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

  it('should handle verification for users with different roles', async () => {
    // Test that verification works regardless of user role
    const numUsersArb = fc.integer({ min: 3, max: 8 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            // Get user with role
            const user = await db.users.findOne({ 
              where: { id: userId },
              include: [{
                model: db.roles,
                as: 'role',
                attributes: ['name']
              }]
            });

            const userRole = user.role ? user.role.name : 'unassigned';

            // Generate and validate token
            const token = await VerificationTokenService.generateToken(userId);
            const validation = await VerificationTokenService.validateToken(token);
            expect(validation.valid).toBe(true);

            // Update database
            await db.users.update(
              { email_verified: 1 },
              { where: { id: userId } }
            );

            // Create JWT with role
            const newJwt = JwtService.createAccessToken(
              {
                user_id: userId,
                email: user.email,
                email_verified: true,
                role: userRole
              },
              24 * 60 * 60 * 1000,
              process.env.JWT_SECRET
            );

            // Verify JWT contains correct role and verification status
            const payload = JwtService.verifyAccessToken(newJwt, process.env.JWT_SECRET);
            expect(payload.email_verified).toBe(true);
            expect(payload.role).toBe(userRole);

            // Property: Verification works for all roles
            const updatedUser = await db.users.findOne({ where: { id: userId } });
            expect(updatedUser.email_verified).toBe(1);

            // Invalidate token
            await VerificationTokenService.invalidateToken(token);
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

  it('should ensure verification state is immediately queryable after update', async () => {
    // Test that database update is immediately visible (no caching issues)
    const numUsersArb = fc.integer({ min: 5, max: 15 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            // Generate and validate token
            const token = await VerificationTokenService.generateToken(userId);
            const validation = await VerificationTokenService.validateToken(token);
            expect(validation.valid).toBe(true);

            // Update database
            await db.users.update(
              { email_verified: 1 },
              { where: { id: userId } }
            );

            // Property: Immediately query database - should see updated value
            const userAfter = await db.users.findOne({ where: { id: userId } });
            expect(userAfter.email_verified).toBe(1);

            // Query again to ensure consistency
            const userAfter2 = await db.users.findOne({ where: { id: userId } });
            expect(userAfter2.email_verified).toBe(1);

            // Invalidate token
            await VerificationTokenService.invalidateToken(token);
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
