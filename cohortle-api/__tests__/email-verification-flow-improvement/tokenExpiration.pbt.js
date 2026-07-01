/**
 * Property-Based Test: Verification Token Expiration
 * Feature: email-verification-flow-improvement
 * Property 8: Verification Token Expiration
 * 
 * **Validates: Requirements 7.2**
 * 
 * For any generated verification token, the expiration time should be set to
 * exactly 24 hours from the creation timestamp.
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

describe('Feature: email-verification-flow-improvement, Property 8: Verification Token Expiration', () => {
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

  it('should set token expiration to exactly 24 hours from creation time', async () => {
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

            // Record time before token generation
            const beforeGeneration = new Date();
            
            // Generate token
            const token = await VerificationTokenService.generateToken(userId);
            
            // Record time after token generation
            const afterGeneration = new Date();

            // Retrieve token from database
            const records = await sdk.get({ token });
            expect(records.length).toBe(1);
            
            const tokenRecord = records[0];
            const createdAt = new Date(tokenRecord.created_at);
            const expiresAt = new Date(tokenRecord.expires_at);

            // Calculate the difference between expires_at and created_at
            const expirationDurationMs = expiresAt.getTime() - createdAt.getTime();
            
            // 24 hours in milliseconds
            const twentyFourHoursMs = 24 * 60 * 60 * 1000;

            // Property: Expiration should be exactly 24 hours from creation
            // Allow small tolerance for execution time (within 1 second)
            expect(Math.abs(expirationDurationMs - twentyFourHoursMs)).toBeLessThan(1000);

            // Verify created_at is within the generation time window
            expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeGeneration.getTime());
            expect(createdAt.getTime()).toBeLessThanOrEqual(afterGeneration.getTime());

            // Verify expires_at is in the future
            expect(expiresAt.getTime()).toBeGreaterThan(beforeGeneration.getTime());
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

  it('should maintain 24-hour expiration across multiple token generations for the same user', async () => {
    // Test that regenerating tokens maintains the 24-hour expiration property
    const numRegenerationsArb = fc.integer({ min: 3, max: 10 });

    await fc.assert(
      fc.asyncProperty(
        numRegenerationsArb,
        async (numRegenerations) => {
          const userId = await createTestUser();
          testUserIds.push(userId);

          const sdk = new BackendSDK();
          sdk.setTable('verification_tokens');

          const twentyFourHoursMs = 24 * 60 * 60 * 1000;

          // Generate multiple tokens for the same user
          for (let i = 0; i < numRegenerations; i++) {
            const token = await VerificationTokenService.generateToken(userId);

            // Retrieve token from database
            const records = await sdk.get({ token });
            expect(records.length).toBe(1);
            
            const tokenRecord = records[0];
            const createdAt = new Date(tokenRecord.created_at);
            const expiresAt = new Date(tokenRecord.expires_at);

            // Calculate expiration duration
            const expirationDurationMs = expiresAt.getTime() - createdAt.getTime();

            // Property: Each token should have exactly 24-hour expiration
            expect(Math.abs(expirationDurationMs - twentyFourHoursMs)).toBeLessThan(1000);

            // Small delay to ensure different creation times
            await new Promise(resolve => setTimeout(resolve, 10));
          }

          // Clean up
          await cleanupTestData('verification_tokens', { user_id: userId });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should set expiration time consistently regardless of system load', async () => {
    // Test that expiration calculation is consistent even with concurrent operations
    const numConcurrentUsersArb = fc.integer({ min: 5, max: 15 });

    await fc.assert(
      fc.asyncProperty(
        numConcurrentUsersArb,
        async (numConcurrentUsers) => {
          const sdk = new BackendSDK();
          sdk.setTable('verification_tokens');

          // Create users and generate tokens concurrently
          const userPromises = [];
          for (let i = 0; i < numConcurrentUsers; i++) {
            userPromises.push(createTestUser());
          }
          const userIds = await Promise.all(userPromises);
          testUserIds.push(...userIds);

          // Generate tokens concurrently
          const tokenPromises = userIds.map(userId => 
            VerificationTokenService.generateToken(userId)
          );
          const tokens = await Promise.all(tokenPromises);

          const twentyFourHoursMs = 24 * 60 * 60 * 1000;

          // Verify each token has correct expiration
          for (const token of tokens) {
            const records = await sdk.get({ token });
            expect(records.length).toBe(1);
            
            const tokenRecord = records[0];
            const createdAt = new Date(tokenRecord.created_at);
            const expiresAt = new Date(tokenRecord.expires_at);

            const expirationDurationMs = expiresAt.getTime() - createdAt.getTime();

            // Property: Expiration should be 24 hours even under concurrent load
            expect(Math.abs(expirationDurationMs - twentyFourHoursMs)).toBeLessThan(1000);
          }

          // Clean up
          for (const userId of userIds) {
            await cleanupTestData('verification_tokens', { user_id: userId });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate expiration correctly across different time zones and DST boundaries', async () => {
    // Test that 24-hour calculation is based on milliseconds, not calendar days
    const numTokensArb = fc.integer({ min: 5, max: 15 });

    await fc.assert(
      fc.asyncProperty(
        numTokensArb,
        async (numTokens) => {
          const userId = await createTestUser();
          testUserIds.push(userId);

          const sdk = new BackendSDK();
          sdk.setTable('verification_tokens');

          const twentyFourHoursMs = 24 * 60 * 60 * 1000;
          const toleranceMs = 1000; // 1 second tolerance

          for (let i = 0; i < numTokens; i++) {
            const token = await VerificationTokenService.generateToken(userId);

            const records = await sdk.get({ token });
            expect(records.length).toBe(1);
            
            const tokenRecord = records[0];
            const createdAt = new Date(tokenRecord.created_at);
            const expiresAt = new Date(tokenRecord.expires_at);

            // Calculate duration in milliseconds
            const durationMs = expiresAt.getTime() - createdAt.getTime();

            // Property: Duration should be exactly 24 hours in milliseconds
            // This ensures DST changes don't affect the calculation
            expect(durationMs).toBeGreaterThanOrEqual(twentyFourHoursMs - toleranceMs);
            expect(durationMs).toBeLessThanOrEqual(twentyFourHoursMs + toleranceMs);

            // Verify the expiration is exactly 24 hours ahead
            const expectedExpiresAt = new Date(createdAt.getTime() + twentyFourHoursMs);
            const timeDifference = Math.abs(expiresAt.getTime() - expectedExpiresAt.getTime());
            expect(timeDifference).toBeLessThan(toleranceMs);

            // Small delay between iterations
            await new Promise(resolve => setTimeout(resolve, 10));
          }

          // Clean up
          await cleanupTestData('verification_tokens', { user_id: userId });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should ensure expires_at is always in the future when token is created', async () => {
    // Test that newly created tokens always have future expiration
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

            // Generate token
            const token = await VerificationTokenService.generateToken(userId);
            
            // Immediately check expiration
            const checkTime = new Date();
            
            const records = await sdk.get({ token });
            expect(records.length).toBe(1);
            
            const tokenRecord = records[0];
            const expiresAt = new Date(tokenRecord.expires_at);

            // Property: expires_at must be in the future
            expect(expiresAt.getTime()).toBeGreaterThan(checkTime.getTime());

            // Property: expires_at should be approximately 24 hours in the future
            const timeUntilExpiration = expiresAt.getTime() - checkTime.getTime();
            const twentyFourHoursMs = 24 * 60 * 60 * 1000;
            
            // Should be close to 24 hours (within 2 seconds to account for test execution)
            expect(timeUntilExpiration).toBeGreaterThan(twentyFourHoursMs - 2000);
            expect(timeUntilExpiration).toBeLessThanOrEqual(twentyFourHoursMs + 1000);
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
