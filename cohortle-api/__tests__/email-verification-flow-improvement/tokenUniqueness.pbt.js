/**
 * Property-Based Test: Verification Token Uniqueness
 * Feature: email-verification-flow-improvement
 * Property 7: Verification Token Uniqueness
 * 
 * **Validates: Requirements 4.1, 7.1**
 * 
 * For any set of generated verification tokens, all tokens should be unique,
 * cryptographically secure (sufficient entropy), and properly formatted.
 */

const fc = require('fast-check');
const VerificationTokenService = require('../../services/VerificationTokenService');
const {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestData,
  createTestUser,
} = require('../helpers/testSetup');

describe('Feature: email-verification-flow-improvement, Property 7: Verification Token Uniqueness', () => {
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

  it('should generate unique tokens across multiple users and multiple generations', async () => {
    // Arbitrary for number of users to create
    const numUsersArb = fc.integer({ min: 5, max: 15 });
    
    // Arbitrary for number of tokens to generate per user
    const tokensPerUserArb = fc.integer({ min: 2, max: 5 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        tokensPerUserArb,
        async (numUsers, tokensPerUser) => {
          const allTokens = [];
          const userIds = [];

          // Create multiple users and generate multiple tokens for each
          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            userIds.push(userId);
            testUserIds.push(userId);

            // Generate multiple tokens for this user
            for (let j = 0; j < tokensPerUser; j++) {
              const token = await VerificationTokenService.generateToken(userId);
              allTokens.push(token);
            }
          }

          // Property 1: All tokens should be unique
          const uniqueTokens = new Set(allTokens);
          expect(uniqueTokens.size).toBe(allTokens.length);

          // Property 2: All tokens should be properly formatted (64 character hex string)
          allTokens.forEach(token => {
            expect(token).toMatch(/^[a-f0-9]{64}$/);
            expect(token.length).toBe(64);
          });

          // Property 3: Tokens should have sufficient entropy (no obvious patterns)
          // Check that tokens don't have repeating patterns
          allTokens.forEach(token => {
            // Token should not be all the same character
            const uniqueChars = new Set(token.split(''));
            expect(uniqueChars.size).toBeGreaterThan(10); // At least 10 different hex chars
            
            // Token should not have long runs of the same character
            const maxRun = token.split('').reduce((acc, char, idx, arr) => {
              if (idx === 0) return { max: 1, current: 1, prev: char };
              if (char === acc.prev) {
                const newCurrent = acc.current + 1;
                return { max: Math.max(acc.max, newCurrent), current: newCurrent, prev: char };
              }
              return { max: acc.max, current: 1, prev: char };
            }, { max: 1, current: 1, prev: '' }).max;
            
            expect(maxRun).toBeLessThan(8); // No more than 7 consecutive same characters
          });

          // Clean up tokens for these users
          for (const userId of userIds) {
            await cleanupTestData('verification_tokens', { user_id: userId });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate unique tokens even when called rapidly in sequence', async () => {
    // Test rapid sequential token generation for the same user
    const numTokensArb = fc.integer({ min: 10, max: 50 });

    await fc.assert(
      fc.asyncProperty(
        numTokensArb,
        async (numTokens) => {
          const userId = await createTestUser();
          testUserIds.push(userId);

          const tokens = [];
          
          // Generate tokens rapidly in sequence
          for (let i = 0; i < numTokens; i++) {
            const token = await VerificationTokenService.generateToken(userId);
            tokens.push(token);
          }

          // All tokens should be unique despite rapid generation
          const uniqueTokens = new Set(tokens);
          expect(uniqueTokens.size).toBe(tokens.length);

          // All tokens should be properly formatted
          tokens.forEach(token => {
            expect(token).toMatch(/^[a-f0-9]{64}$/);
            expect(token.length).toBe(64);
          });

          // Clean up
          await cleanupTestData('verification_tokens', { user_id: userId });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate tokens with cryptographic randomness (no predictable patterns)', async () => {
    // Test that tokens don't follow predictable patterns
    const numTokensArb = fc.integer({ min: 20, max: 50 });

    await fc.assert(
      fc.asyncProperty(
        numTokensArb,
        async (numTokens) => {
          const userId = await createTestUser();
          testUserIds.push(userId);

          const tokens = [];
          
          for (let i = 0; i < numTokens; i++) {
            const token = await VerificationTokenService.generateToken(userId);
            tokens.push(token);
          }

          // Check for cryptographic properties
          // 1. Hamming distance between consecutive tokens should be high
          for (let i = 1; i < tokens.length; i++) {
            const token1 = tokens[i - 1];
            const token2 = tokens[i];
            
            let differences = 0;
            for (let j = 0; j < token1.length; j++) {
              if (token1[j] !== token2[j]) {
                differences++;
              }
            }
            
            // At least 50% of characters should be different (high entropy)
            expect(differences).toBeGreaterThan(32);
          }

          // 2. Character distribution should be relatively uniform
          const charCounts = {};
          const hexChars = '0123456789abcdef';
          hexChars.split('').forEach(char => charCounts[char] = 0);
          
          tokens.forEach(token => {
            token.split('').forEach(char => {
              charCounts[char]++;
            });
          });

          // Each hex character should appear at least once in the full set
          // (with high probability for sufficient tokens)
          if (numTokens >= 20) {
            Object.values(charCounts).forEach(count => {
              expect(count).toBeGreaterThan(0);
            });
          }

          // Clean up
          await cleanupTestData('verification_tokens', { user_id: userId });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should ensure tokens are unique across the entire database', async () => {
    // Test that no two tokens in the database are ever the same
    const numUsersArb = fc.integer({ min: 3, max: 10 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          const userIds = [];
          const allGeneratedTokens = [];

          // Create multiple users and generate one token for each
          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            userIds.push(userId);
            testUserIds.push(userId);

            const token = await VerificationTokenService.generateToken(userId);
            allGeneratedTokens.push(token);
          }

          // Verify all tokens are unique
          const uniqueTokens = new Set(allGeneratedTokens);
          expect(uniqueTokens.size).toBe(allGeneratedTokens.length);

          // Verify each token is properly stored in database
          const BackendSDK = require('../../core/BackendSDK');
          const sdk = new BackendSDK();
          sdk.setTable('verification_tokens');

          for (const token of allGeneratedTokens) {
            const records = await sdk.get({ token });
            
            // Each token should appear exactly once in the database
            expect(records.length).toBe(1);
            expect(records[0].token).toBe(token);
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
});
