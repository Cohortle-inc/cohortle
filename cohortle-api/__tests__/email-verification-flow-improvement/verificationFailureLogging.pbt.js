/**
 * Property-Based Test: Verification Failure Logging
 * Feature: email-verification-flow-improvement
 * Property 12: Verification Failure Logging
 * 
 * **Validates: Requirements 7.5**
 * 
 * For any failed token validation attempt, the system should log the failure
 * with the specific reason (expired, invalid, already used, etc.) for security monitoring.
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

describe('Feature: email-verification-flow-improvement, Property 12: Verification Failure Logging', () => {
  let testUserIds = [];
  let originalConsoleLog;
  let originalConsoleError;
  let originalConsoleGroup;
  let originalConsoleGroupEnd;
  let loggedMessages = [];

  beforeAll(async () => {
    // Set NODE_ENV to test to use test database configuration
    process.env.NODE_ENV = 'test';
    
    await setupTestDatabase();

    // Capture console output for verification
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    originalConsoleGroup = console.group;
    originalConsoleGroupEnd = console.groupEnd;

    console.log = (...args) => {
      loggedMessages.push({ type: 'log', args });
      originalConsoleLog(...args);
    };

    console.error = (...args) => {
      loggedMessages.push({ type: 'error', args });
      originalConsoleError(...args);
    };

    console.group = (...args) => {
      loggedMessages.push({ type: 'group', args });
      originalConsoleGroup(...args);
    };

    console.groupEnd = () => {
      loggedMessages.push({ type: 'groupEnd', args: [] });
      originalConsoleGroupEnd();
    };
  });

  afterAll(async () => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.group = originalConsoleGroup;
    console.groupEnd = originalConsoleGroupEnd;

    // Clean up all test users
    for (const userId of testUserIds) {
      await cleanupTestData('verification_tokens', { user_id: userId });
      await cleanupTestData('users', { id: userId });
    }
    
    await teardownTestDatabase();
  });

  beforeEach(() => {
    // Clear logged messages before each test
    loggedMessages = [];
  });

  it('should log failures for invalid token format with specific reason', async () => {
    // Generate various invalid token formats
    const invalidTokenArb = fc.oneof(
      fc.string({ minLength: 0, maxLength: 63 }), // Too short
      fc.string({ minLength: 65, maxLength: 100 }), // Too long
      fc.hexaString({ minLength: 64, maxLength: 64 }).map(s => s.toUpperCase()), // Uppercase
      fc.string({ minLength: 64, maxLength: 64 }), // Non-hex characters
      fc.constant(''), // Empty string
      fc.constant('g'.repeat(64)), // Invalid hex character
    );

    await fc.assert(
      fc.asyncProperty(
        invalidTokenArb,
        async (invalidToken) => {
          loggedMessages = [];

          const validation = await VerificationTokenService.validateToken(invalidToken);

          // Property: Validation should fail
          expect(validation.valid).toBe(false);
          expect(validation.error).toBe('Invalid token format');

          // Property: Failure should be logged with specific reason
          const securityLogs = loggedMessages.filter(msg => 
            msg.type === 'group' && 
            msg.args[0] && 
            msg.args[0].includes('Security Event')
          );

          expect(securityLogs.length).toBeGreaterThan(0);

          // Check that the log contains the failure reason
          const logContent = loggedMessages.map(msg => 
            msg.args.join(' ')
          ).join(' ');

          expect(logContent).toContain('Invalid token format');
          expect(logContent).toContain('token_validation_failed');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should log failures for non-existent tokens with specific reason', async () => {
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

          loggedMessages = [];

          const validation = await VerificationTokenService.validateToken(token);

          // Property: Validation should fail
          expect(validation.valid).toBe(false);
          expect(validation.error).toBe('Token not found');

          // Property: Failure should be logged with specific reason
          const securityLogs = loggedMessages.filter(msg => 
            msg.type === 'group' && 
            msg.args[0] && 
            msg.args[0].includes('Security Event')
          );

          expect(securityLogs.length).toBeGreaterThan(0);

          // Check that the log contains the failure reason
          const logContent = loggedMessages.map(msg => 
            msg.args.join(' ')
          ).join(' ');

          expect(logContent).toContain('Token not found');
          expect(logContent).toContain('token_validation_failed');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should log failures for expired tokens with specific reason', async () => {
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

            // Manually expire the token
            const pastDate = new Date();
            pastDate.setHours(pastDate.getHours() - 25);
            await sdk.update({ expires_at: pastDate }, { token });

            loggedMessages = [];

            // Validate the expired token
            const validation = await VerificationTokenService.validateToken(token);

            // Property: Validation should fail
            expect(validation.valid).toBe(false);
            expect(validation.error).toBe('Token expired');

            // Property: Failure should be logged with specific reason
            const securityLogs = loggedMessages.filter(msg => 
              msg.type === 'group' && 
              msg.args[0] && 
              msg.args[0].includes('Security Event')
            );

            expect(securityLogs.length).toBeGreaterThan(0);

            // Check that the log contains the failure reason
            const logContent = loggedMessages.map(msg => 
              msg.args.join(' ')
            ).join(' ');

            expect(logContent).toContain('Token expired');
            expect(logContent).toContain('token_validation_failed');
          }

          // Clean up
          for (let i = 0; i < numUsers; i++) {
            await cleanupTestData('verification_tokens', { 
              user_id: testUserIds[testUserIds.length - numUsers + i] 
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should log failures for already-used tokens with specific reason', async () => {
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

            loggedMessages = [];

            // Validate the used token
            const validation = await VerificationTokenService.validateToken(token);

            // Property: Validation should fail
            expect(validation.valid).toBe(false);
            expect(validation.error).toBe('Token already used');

            // Property: Failure should be logged with specific reason
            const securityLogs = loggedMessages.filter(msg => 
              msg.type === 'group' && 
              msg.args[0] && 
              msg.args[0].includes('Security Event')
            );

            expect(securityLogs.length).toBeGreaterThan(0);

            // Check that the log contains the failure reason
            const logContent = loggedMessages.map(msg => 
              msg.args.join(' ')
            ).join(' ');

            expect(logContent).toContain('Token already used');
            expect(logContent).toContain('token_validation_failed');
          }

          // Clean up
          for (let i = 0; i < numUsers; i++) {
            await cleanupTestData('verification_tokens', { 
              user_id: testUserIds[testUserIds.length - numUsers + i] 
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should log all failure types with distinct reasons for security monitoring', async () => {
    const numUsersArb = fc.integer({ min: 2, max: 5 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          const sdk = new BackendSDK();
          sdk.setTable('verification_tokens');

          const failureReasons = new Set();

          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            // Test 1: Invalid format
            loggedMessages = [];
            await VerificationTokenService.validateToken('invalid');
            let logContent = loggedMessages.map(msg => msg.args.join(' ')).join(' ');
            if (logContent.includes('token_validation_failed')) {
              const reasonMatch = logContent.match(/Reason: ([^\n]+)/);
              if (reasonMatch) failureReasons.add(reasonMatch[1].trim());
            }

            // Test 2: Token not found
            loggedMessages = [];
            await VerificationTokenService.validateToken('a'.repeat(64));
            logContent = loggedMessages.map(msg => msg.args.join(' ')).join(' ');
            if (logContent.includes('token_validation_failed')) {
              const reasonMatch = logContent.match(/Reason: ([^\n]+)/);
              if (reasonMatch) failureReasons.add(reasonMatch[1].trim());
            }

            // Test 3: Token already used
            const usedToken = await VerificationTokenService.generateToken(userId);
            await VerificationTokenService.invalidateToken(usedToken);
            loggedMessages = [];
            await VerificationTokenService.validateToken(usedToken);
            logContent = loggedMessages.map(msg => msg.args.join(' ')).join(' ');
            if (logContent.includes('token_validation_failed')) {
              const reasonMatch = logContent.match(/Reason: ([^\n]+)/);
              if (reasonMatch) failureReasons.add(reasonMatch[1].trim());
            }

            // Test 4: Token expired
            const expiredToken = await VerificationTokenService.generateToken(userId);
            const pastDate = new Date();
            pastDate.setHours(pastDate.getHours() - 25);
            await sdk.update({ expires_at: pastDate }, { token: expiredToken });
            loggedMessages = [];
            await VerificationTokenService.validateToken(expiredToken);
            logContent = loggedMessages.map(msg => msg.args.join(' ')).join(' ');
            if (logContent.includes('token_validation_failed')) {
              const reasonMatch = logContent.match(/Reason: ([^\n]+)/);
              if (reasonMatch) failureReasons.add(reasonMatch[1].trim());
            }
          }

          // Property: Each failure type should have a distinct logged reason
          expect(failureReasons.size).toBeGreaterThanOrEqual(4);

          // Clean up
          for (let i = 0; i < numUsers; i++) {
            await cleanupTestData('verification_tokens', { 
              user_id: testUserIds[testUserIds.length - numUsers + i] 
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include security context in failure logs', async () => {
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

            // Create an expired token
            const token = await VerificationTokenService.generateToken(userId);
            const pastDate = new Date();
            pastDate.setHours(pastDate.getHours() - 25);
            await sdk.update({ expires_at: pastDate }, { token });

            loggedMessages = [];

            await VerificationTokenService.validateToken(token);

            const logContent = loggedMessages.map(msg => 
              msg.args.join(' ')
            ).join(' ');

            // Property: Security logs should include context
            expect(logContent).toContain('Security Event');
            expect(logContent).toContain('token_validation_failed');
            expect(logContent).toContain('Timestamp');
            expect(logContent).toContain('Reason');
            
            // Should include the specific failure reason
            expect(logContent).toContain('Token expired');
          }

          // Clean up
          for (let i = 0; i < numUsers; i++) {
            await cleanupTestData('verification_tokens', { 
              user_id: testUserIds[testUserIds.length - numUsers + i] 
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should log failures consistently across multiple validation attempts', async () => {
    const numAttemptsArb = fc.integer({ min: 3, max: 10 });

    await fc.assert(
      fc.asyncProperty(
        numAttemptsArb,
        async (numAttempts) => {
          const userId = await createTestUser();
          testUserIds.push(userId);

          // Create an expired token
          const sdk = new BackendSDK();
          sdk.setTable('verification_tokens');
          const token = await VerificationTokenService.generateToken(userId);
          const pastDate = new Date();
          pastDate.setHours(pastDate.getHours() - 25);
          await sdk.update({ expires_at: pastDate }, { token });

          const logCounts = [];

          // Validate multiple times
          for (let i = 0; i < numAttempts; i++) {
            loggedMessages = [];
            await VerificationTokenService.validateToken(token);

            const securityLogs = loggedMessages.filter(msg => 
              msg.type === 'group' && 
              msg.args[0] && 
              msg.args[0].includes('Security Event')
            );

            logCounts.push(securityLogs.length);
          }

          // Property: Each validation attempt should log consistently
          logCounts.forEach(count => {
            expect(count).toBeGreaterThan(0);
          });

          // All attempts should log the same number of security events
          const firstCount = logCounts[0];
          logCounts.forEach(count => {
            expect(count).toBe(firstCount);
          });

          // Clean up
          await cleanupTestData('verification_tokens', { user_id: userId });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not log successful validations as failures', async () => {
    const numUsersArb = fc.integer({ min: 3, max: 10 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          for (let i = 0; i < numUsers; i++) {
            const userId = await createTestUser();
            testUserIds.push(userId);

            // Generate a valid token
            const token = await VerificationTokenService.generateToken(userId);

            loggedMessages = [];

            // Validate the token (should succeed)
            const validation = await VerificationTokenService.validateToken(token);

            // Property: Validation should succeed
            expect(validation.valid).toBe(true);

            // Property: No failure logs should be present
            const failureLogs = loggedMessages.filter(msg => {
              const content = msg.args.join(' ');
              return content.includes('token_validation_failed');
            });

            expect(failureLogs.length).toBe(0);
          }

          // Clean up
          for (let i = 0; i < numUsers; i++) {
            await cleanupTestData('verification_tokens', { 
              user_id: testUserIds[testUserIds.length - numUsers + i] 
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
