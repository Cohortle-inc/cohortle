/**
 * Property-Based Test: Signup Success Message Content
 * Feature: email-verification-flow-improvement
 * Property 15: Signup Success Message Content
 * 
 * **Validates: Requirements 5.2**
 * 
 * For any successful signup, the success message should include both the user's
 * email address and information about the verification email being sent.
 */

const fc = require('fast-check');
const request = require('supertest');
const app = require('../../app');
const db = require('../../models');
const {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestData,
} = require('../helpers/testSetup');

describe('Feature: email-verification-flow-improvement, Property 15: Signup Success Message Content', () => {
  let testUserIds = [];
  let testEmails = [];

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await setupTestDatabase();
  });

  afterAll(async () => {
    // Clean up all test users
    for (const userId of testUserIds) {
      await cleanupTestData('verification_tokens', { user_id: userId });
      await cleanupTestData('preferences', { user_id: userId });
      await cleanupTestData('user_role_assignments', { user_id: userId });
    }
    
    for (const email of testEmails) {
      await cleanupTestData('users', { email });
    }
    
    await teardownTestDatabase();
  });

  it('should include user email address in signup response for any valid email', async () => {
    // Test that signup response contains the user's email address
    const emailArb = fc.emailAddress();
    const firstNameArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
    const lastNameArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
    const passwordArb = fc.string({ minLength: 8, maxLength: 100 });

    await fc.assert(
      fc.asyncProperty(
        emailArb,
        firstNameArb,
        lastNameArb,
        passwordArb,
        async (email, firstName, lastName, password) => {
          // Make email unique for this test run
          const uniqueEmail = `test_${Date.now()}_${Math.random().toString(36).substring(7)}@${email.split('@')[1]}`;
          testEmails.push(uniqueEmail);

          const response = await request(app)
            .post('/v1/api/auth/register-email')
            .send({
              email: uniqueEmail,
              password: password,
              first_name: firstName.trim(),
              last_name: lastName.trim(),
            });

          // Property: Response should be successful
          expect(response.status).toBe(200);
          expect(response.body.error).toBe(false);

          // Property: Response should include user object with email
          expect(response.body.user).toBeDefined();
          expect(response.body.user.email).toBe(uniqueEmail);

          // Store user ID for cleanup
          if (response.body.user.id) {
            testUserIds.push(response.body.user.id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include verification email information in signup success message', async () => {
    // Test that signup response message mentions verification email
    const emailArb = fc.emailAddress();
    const firstNameArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
    const lastNameArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
    const passwordArb = fc.string({ minLength: 8, maxLength: 100 });

    await fc.assert(
      fc.asyncProperty(
        emailArb,
        firstNameArb,
        lastNameArb,
        passwordArb,
        async (email, firstName, lastName, password) => {
          // Make email unique for this test run
          const uniqueEmail = `test_${Date.now()}_${Math.random().toString(36).substring(7)}@${email.split('@')[1]}`;
          testEmails.push(uniqueEmail);

          const response = await request(app)
            .post('/v1/api/auth/register-email')
            .send({
              email: uniqueEmail,
              password: password,
              first_name: firstName.trim(),
              last_name: lastName.trim(),
            });

          // Property: Response should be successful
          expect(response.status).toBe(200);
          expect(response.body.error).toBe(false);

          // Property: Message should mention verification email
          expect(response.body.message).toBeDefined();
          expect(typeof response.body.message).toBe('string');
          
          const message = response.body.message.toLowerCase();
          const hasVerificationMention = 
            message.includes('verification') && 
            (message.includes('email') || message.includes('sent'));
          
          expect(hasVerificationMention).toBe(true);

          // Store user ID for cleanup
          if (response.body.user && response.body.user.id) {
            testUserIds.push(response.body.user.id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide both email address and verification information together in signup response', async () => {
    // Test that both pieces of information are present in the same response
    const emailArb = fc.emailAddress();
    const firstNameArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
    const lastNameArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
    const passwordArb = fc.string({ minLength: 8, maxLength: 100 });

    await fc.assert(
      fc.asyncProperty(
        emailArb,
        firstNameArb,
        lastNameArb,
        passwordArb,
        async (email, firstName, lastName, password) => {
          // Make email unique for this test run
          const uniqueEmail = `test_${Date.now()}_${Math.random().toString(36).substring(7)}@${email.split('@')[1]}`;
          testEmails.push(uniqueEmail);

          const response = await request(app)
            .post('/v1/api/auth/register-email')
            .send({
              email: uniqueEmail,
              password: password,
              first_name: firstName.trim(),
              last_name: lastName.trim(),
            });

          // Property: Response should be successful
          expect(response.status).toBe(200);
          expect(response.body.error).toBe(false);

          // Property: Response must contain both email address and verification message
          expect(response.body.user).toBeDefined();
          expect(response.body.user.email).toBe(uniqueEmail);
          expect(response.body.message).toBeDefined();
          
          const message = response.body.message.toLowerCase();
          const hasVerificationMention = 
            message.includes('verification') && 
            (message.includes('email') || message.includes('sent'));
          
          expect(hasVerificationMention).toBe(true);

          // Property: Both pieces of information should be present
          const hasEmail = response.body.user.email === uniqueEmail;
          expect(hasEmail && hasVerificationMention).toBe(true);

          // Store user ID for cleanup
          if (response.body.user.id) {
            testUserIds.push(response.body.user.id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain consistent message format across different user inputs', async () => {
    // Test that message format is consistent regardless of input variations
    const emailArb = fc.emailAddress();
    const firstNameArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
    const lastNameArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
    const passwordArb = fc.string({ minLength: 8, maxLength: 100 });

    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            email: emailArb,
            firstName: firstNameArb,
            lastName: lastNameArb,
            password: passwordArb,
          }),
          { minLength: 5, maxLength: 15 }
        ),
        async (users) => {
          const messages = [];
          const emails = [];

          for (const user of users) {
            // Make email unique for this test run
            const uniqueEmail = `test_${Date.now()}_${Math.random().toString(36).substring(7)}@${user.email.split('@')[1]}`;
            testEmails.push(uniqueEmail);
            emails.push(uniqueEmail);

            const response = await request(app)
              .post('/v1/api/auth/register-email')
              .send({
                email: uniqueEmail,
                password: user.password,
                first_name: user.firstName.trim(),
                last_name: user.lastName.trim(),
              });

            if (response.status === 200) {
              messages.push(response.body.message);
              
              // Property: Each response should contain email and verification info
              expect(response.body.user.email).toBe(uniqueEmail);
              expect(response.body.message).toBeDefined();
              
              const message = response.body.message.toLowerCase();
              const hasVerificationMention = 
                message.includes('verification') && 
                (message.includes('email') || message.includes('sent'));
              
              expect(hasVerificationMention).toBe(true);

              // Store user ID for cleanup
              if (response.body.user.id) {
                testUserIds.push(response.body.user.id);
              }
            }
          }

          // Property: All messages should be identical (consistent format)
          const uniqueMessages = new Set(messages);
          expect(uniqueMessages.size).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include email address in user object for users with different name formats', async () => {
    // Test that email is always included regardless of name variations
    const emailArb = fc.emailAddress();
    const nameArb = fc.oneof(
      fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
      fc.constant('A'), // Single character
      fc.constant('Test User With Spaces'),
      fc.constant('O\'Brien'), // Name with apostrophe
      fc.constant('Jean-Pierre'), // Name with hyphen
    );
    const passwordArb = fc.string({ minLength: 8, maxLength: 100 });

    await fc.assert(
      fc.asyncProperty(
        emailArb,
        nameArb,
        nameArb,
        passwordArb,
        async (email, firstName, lastName, password) => {
          // Make email unique for this test run
          const uniqueEmail = `test_${Date.now()}_${Math.random().toString(36).substring(7)}@${email.split('@')[1]}`;
          testEmails.push(uniqueEmail);

          const response = await request(app)
            .post('/v1/api/auth/register-email')
            .send({
              email: uniqueEmail,
              password: password,
              first_name: firstName.trim(),
              last_name: lastName.trim(),
            });

          // Property: Response should be successful
          expect(response.status).toBe(200);
          expect(response.body.error).toBe(false);

          // Property: Email should always be present in user object
          expect(response.body.user).toBeDefined();
          expect(response.body.user.email).toBe(uniqueEmail);
          expect(typeof response.body.user.email).toBe('string');
          expect(response.body.user.email.length).toBeGreaterThan(0);

          // Store user ID for cleanup
          if (response.body.user.id) {
            testUserIds.push(response.body.user.id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return complete signup information immediately without requiring additional requests', async () => {
    // Test that all required information is in the initial response
    const emailArb = fc.emailAddress();
    const firstNameArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
    const lastNameArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
    const passwordArb = fc.string({ minLength: 8, maxLength: 100 });

    await fc.assert(
      fc.asyncProperty(
        emailArb,
        firstNameArb,
        lastNameArb,
        passwordArb,
        async (email, firstName, lastName, password) => {
          // Make email unique for this test run
          const uniqueEmail = `test_${Date.now()}_${Math.random().toString(36).substring(7)}@${email.split('@')[1]}`;
          testEmails.push(uniqueEmail);

          const response = await request(app)
            .post('/v1/api/auth/register-email')
            .send({
              email: uniqueEmail,
              password: password,
              first_name: firstName.trim(),
              last_name: lastName.trim(),
            });

          // Property: Single response should contain all required information
          expect(response.status).toBe(200);
          expect(response.body.error).toBe(false);
          
          // All required fields should be present
          expect(response.body.message).toBeDefined();
          expect(response.body.token).toBeDefined();
          expect(response.body.user).toBeDefined();
          expect(response.body.user.id).toBeDefined();
          expect(response.body.user.email).toBe(uniqueEmail);
          
          // Verification information should be in message
          const message = response.body.message.toLowerCase();
          const hasVerificationMention = 
            message.includes('verification') && 
            (message.includes('email') || message.includes('sent'));
          
          expect(hasVerificationMention).toBe(true);

          // Store user ID for cleanup
          if (response.body.user.id) {
            testUserIds.push(response.body.user.id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve email address format exactly as provided in signup', async () => {
    // Test that email is not modified or normalized in unexpected ways
    const emailArb = fc.emailAddress();
    const firstNameArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
    const lastNameArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
    const passwordArb = fc.string({ minLength: 8, maxLength: 100 });

    await fc.assert(
      fc.asyncProperty(
        emailArb,
        firstNameArb,
        lastNameArb,
        passwordArb,
        async (email, firstName, lastName, password) => {
          // Make email unique for this test run
          const uniqueEmail = `test_${Date.now()}_${Math.random().toString(36).substring(7)}@${email.split('@')[1]}`;
          testEmails.push(uniqueEmail);

          const response = await request(app)
            .post('/v1/api/auth/register-email')
            .send({
              email: uniqueEmail,
              password: password,
              first_name: firstName.trim(),
              last_name: lastName.trim(),
            });

          // Property: Email in response should exactly match input
          expect(response.status).toBe(200);
          expect(response.body.user.email).toBe(uniqueEmail);
          
          // Verify in database as well
          const user = await db.users.findOne({ where: { email: uniqueEmail } });
          expect(user).toBeDefined();
          expect(user.email).toBe(uniqueEmail);

          // Store user ID for cleanup
          if (response.body.user.id) {
            testUserIds.push(response.body.user.id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include verification token creation for all successful signups', async () => {
    // Test that verification token is created for every signup
    const emailArb = fc.emailAddress();
    const firstNameArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
    const lastNameArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
    const passwordArb = fc.string({ minLength: 8, maxLength: 100 });

    await fc.assert(
      fc.asyncProperty(
        emailArb,
        firstNameArb,
        lastNameArb,
        passwordArb,
        async (email, firstName, lastName, password) => {
          // Make email unique for this test run
          const uniqueEmail = `test_${Date.now()}_${Math.random().toString(36).substring(7)}@${email.split('@')[1]}`;
          testEmails.push(uniqueEmail);

          const response = await request(app)
            .post('/v1/api/auth/register-email')
            .send({
              email: uniqueEmail,
              password: password,
              first_name: firstName.trim(),
              last_name: lastName.trim(),
            });

          // Property: Signup should be successful
          expect(response.status).toBe(200);
          expect(response.body.error).toBe(false);

          // Property: Verification token should exist in database
          const userId = response.body.user.id;
          testUserIds.push(userId);

          const token = await db.verification_tokens.findOne({
            where: { user_id: userId }
          });

          expect(token).toBeDefined();
          expect(token.token).toBeDefined();
          expect(token.expires_at).toBeDefined();
          
          // Property: Message should indicate verification email was sent
          const message = response.body.message.toLowerCase();
          const hasVerificationMention = 
            message.includes('verification') && 
            (message.includes('email') || message.includes('sent'));
          
          expect(hasVerificationMention).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
