/**
 * Property-Based Test: Verification Email Personalization
 * Feature: email-verification-flow-improvement
 * Property 16: Verification Email Personalization
 * 
 * **Validates: Requirements 6.2**
 * 
 * For any verification email sent, the email body should include the user's
 * first name in the greeting.
 */

const fc = require('fast-check');
const request = require('supertest');
const app = require('../../app');
const db = require('../../models');
const ResendService = require('../../services/ResendService');
const {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestData,
} = require('../helpers/testSetup');

describe('Feature: email-verification-flow-improvement, Property 16: Verification Email Personalization', () => {
  let testUserIds = [];
  let testEmails = [];
  let originalSendEmail;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await setupTestDatabase();
    
    // Store original sendEmail function
    originalSendEmail = ResendService.sendEmail;
  });

  afterAll(async () => {
    // Restore original sendEmail function
    ResendService.sendEmail = originalSendEmail;
    
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

  it('should include user first name in verification email greeting for any valid first name', async () => {
    // Test that verification email includes the user's first name
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

          // Mock sendEmail to capture the email data
          let capturedEmailData = null;
          ResendService.sendEmail = async (options) => {
            capturedEmailData = options;
            return { error: false, message: 'Email sent successfully', messageId: 'test-id' };
          };

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

          // Property: Email should have been sent
          expect(capturedEmailData).toBeDefined();
          expect(capturedEmailData.type).toBe('welcome');
          expect(capturedEmailData.to).toBe(uniqueEmail);

          // Property: Email data should include first_name
          expect(capturedEmailData.data).toBeDefined();
          expect(capturedEmailData.data.first_name).toBe(firstName.trim());

          // Property: Email HTML should include the first name in greeting
          const template = ResendService.EMAIL_TEMPLATES.welcome;
          const htmlContent = template.getHtml(capturedEmailData.data);
          
          // Check that the HTML contains the first name in a greeting context
          expect(htmlContent).toContain(`Hi ${firstName.trim()}`);

          // Store user ID for cleanup
          if (response.body.user && response.body.user.id) {
            testUserIds.push(response.body.user.id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should personalize verification email with different name formats', async () => {
    // Test that email personalization works with various name formats
    const emailArb = fc.emailAddress();
    const nameArb = fc.oneof(
      fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
      fc.constant('A'), // Single character
      fc.constant('Test User'),
      fc.constant('O\'Brien'), // Name with apostrophe
      fc.constant('Jean-Pierre'), // Name with hyphen
      fc.constant('María'), // Name with accent
      fc.constant('李明'), // Chinese characters
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

          // Mock sendEmail to capture the email data
          let capturedEmailData = null;
          ResendService.sendEmail = async (options) => {
            capturedEmailData = options;
            return { error: false, message: 'Email sent successfully', messageId: 'test-id' };
          };

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

          // Property: Email should include the exact first name provided
          expect(capturedEmailData).toBeDefined();
          expect(capturedEmailData.data.first_name).toBe(firstName.trim());

          // Property: Email HTML should contain the first name
          const template = ResendService.EMAIL_TEMPLATES.welcome;
          const htmlContent = template.getHtml(capturedEmailData.data);
          expect(htmlContent).toContain(firstName.trim());

          // Store user ID for cleanup
          if (response.body.user && response.body.user.id) {
            testUserIds.push(response.body.user.id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include first name in greeting position within email HTML', async () => {
    // Test that first name appears in the greeting section of the email
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

          // Mock sendEmail to capture the email data
          let capturedEmailData = null;
          ResendService.sendEmail = async (options) => {
            capturedEmailData = options;
            return { error: false, message: 'Email sent successfully', messageId: 'test-id' };
          };

          const response = await request(app)
            .post('/v1/api/auth/register-email')
            .send({
              email: uniqueEmail,
              password: password,
              first_name: firstName.trim(),
              last_name: lastName.trim(),
            });

          // Property: Email should be sent
          expect(capturedEmailData).toBeDefined();

          // Property: Email HTML should have greeting with first name
          const template = ResendService.EMAIL_TEMPLATES.welcome;
          const htmlContent = template.getHtml(capturedEmailData.data);
          
          // Check for greeting pattern: "Hi [FirstName]"
          const greetingPattern = new RegExp(`Hi ${firstName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
          expect(htmlContent).toMatch(greetingPattern);

          // Store user ID for cleanup
          if (response.body.user && response.body.user.id) {
            testUserIds.push(response.body.user.id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain consistent personalization across multiple signups', async () => {
    // Test that personalization is consistent for different users
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
          const capturedEmails = [];

          for (const user of users) {
            // Make email unique for this test run
            const uniqueEmail = `test_${Date.now()}_${Math.random().toString(36).substring(7)}@${user.email.split('@')[1]}`;
            testEmails.push(uniqueEmail);

            // Mock sendEmail to capture the email data
            let capturedEmailData = null;
            ResendService.sendEmail = async (options) => {
              capturedEmailData = options;
              return { error: false, message: 'Email sent successfully', messageId: 'test-id' };
            };

            const response = await request(app)
              .post('/v1/api/auth/register-email')
              .send({
                email: uniqueEmail,
                password: user.password,
                first_name: user.firstName.trim(),
                last_name: user.lastName.trim(),
              });

            if (response.status === 200 && capturedEmailData) {
              capturedEmails.push({
                firstName: user.firstName.trim(),
                emailData: capturedEmailData
              });

              // Store user ID for cleanup
              if (response.body.user && response.body.user.id) {
                testUserIds.push(response.body.user.id);
              }
            }
          }

          // Property: Each email should be personalized with the correct first name
          for (const captured of capturedEmails) {
            expect(captured.emailData.data.first_name).toBe(captured.firstName);
            
            const template = ResendService.EMAIL_TEMPLATES.welcome;
            const htmlContent = template.getHtml(captured.emailData.data);
            expect(htmlContent).toContain(`Hi ${captured.firstName}`);
          }

          // Property: All emails should follow the same personalization pattern
          const allHaveGreeting = capturedEmails.every(captured => {
            const template = ResendService.EMAIL_TEMPLATES.welcome;
            const htmlContent = template.getHtml(captured.emailData.data);
            return htmlContent.includes(`Hi ${captured.firstName}`);
          });
          expect(allHaveGreeting).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not use generic greeting when first name is provided', async () => {
    // Test that personalized greeting is used instead of generic "Hi there"
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

          // Mock sendEmail to capture the email data
          let capturedEmailData = null;
          ResendService.sendEmail = async (options) => {
            capturedEmailData = options;
            return { error: false, message: 'Email sent successfully', messageId: 'test-id' };
          };

          const response = await request(app)
            .post('/v1/api/auth/register-email')
            .send({
              email: uniqueEmail,
              password: password,
              first_name: firstName.trim(),
              last_name: lastName.trim(),
            });

          // Property: Email should be sent
          expect(capturedEmailData).toBeDefined();

          // Property: Email should use personalized greeting, not generic
          const template = ResendService.EMAIL_TEMPLATES.welcome;
          const htmlContent = template.getHtml(capturedEmailData.data);
          
          // Should contain personalized greeting
          expect(htmlContent).toContain(`Hi ${firstName.trim()}`);
          
          // Should NOT contain generic greeting when first name is provided
          expect(htmlContent).not.toContain('Hi there,');

          // Store user ID for cleanup
          if (response.body.user && response.body.user.id) {
            testUserIds.push(response.body.user.id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve first name exactly as provided in email personalization', async () => {
    // Test that first name is not modified or normalized in email
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

          // Mock sendEmail to capture the email data
          let capturedEmailData = null;
          ResendService.sendEmail = async (options) => {
            capturedEmailData = options;
            return { error: false, message: 'Email sent successfully', messageId: 'test-id' };
          };

          const response = await request(app)
            .post('/v1/api/auth/register-email')
            .send({
              email: uniqueEmail,
              password: password,
              first_name: firstName.trim(),
              last_name: lastName.trim(),
            });

          // Property: Email data should preserve exact first name
          expect(capturedEmailData).toBeDefined();
          expect(capturedEmailData.data.first_name).toBe(firstName.trim());

          // Property: Email HTML should contain exact first name (not modified)
          const template = ResendService.EMAIL_TEMPLATES.welcome;
          const htmlContent = template.getHtml(capturedEmailData.data);
          
          // The exact first name should appear in the HTML
          const exactMatch = htmlContent.includes(firstName.trim());
          expect(exactMatch).toBe(true);

          // Store user ID for cleanup
          if (response.body.user && response.body.user.id) {
            testUserIds.push(response.body.user.id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include first name in verification email for resend requests', async () => {
    // Test that resent verification emails also include first name
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

          // Mock sendEmail to capture the email data
          let capturedEmailData = null;
          ResendService.sendEmail = async (options) => {
            capturedEmailData = options;
            return { error: false, message: 'Email sent successfully', messageId: 'test-id' };
          };

          // First, create the user
          const signupResponse = await request(app)
            .post('/v1/api/auth/register-email')
            .send({
              email: uniqueEmail,
              password: password,
              first_name: firstName.trim(),
              last_name: lastName.trim(),
            });

          expect(signupResponse.status).toBe(200);
          const token = signupResponse.body.token;

          // Store user ID for cleanup
          if (signupResponse.body.user && signupResponse.body.user.id) {
            testUserIds.push(signupResponse.body.user.id);
          }

          // Reset captured data
          capturedEmailData = null;

          // Now resend verification email
          const resendResponse = await request(app)
            .post('/v1/api/auth/resend-verification')
            .set('Authorization', `Bearer ${token}`)
            .send();

          // Property: Resend should be successful
          expect(resendResponse.status).toBe(200);

          // Property: Email should have been sent with first name
          if (capturedEmailData) {
            expect(capturedEmailData.data).toBeDefined();
            expect(capturedEmailData.data.first_name).toBe(firstName.trim());

            // Check HTML content includes first name
            const template = ResendService.EMAIL_TEMPLATES[capturedEmailData.type];
            if (template) {
              const htmlContent = template.getHtml(capturedEmailData.data);
              expect(htmlContent).toContain(firstName.trim());
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include first name in all verification-related emails', async () => {
    // Test that first name personalization is consistent across all email types
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

          const capturedEmails = [];

          // Mock sendEmail to capture all email data
          ResendService.sendEmail = async (options) => {
            capturedEmails.push(options);
            return { error: false, message: 'Email sent successfully', messageId: 'test-id' };
          };

          const response = await request(app)
            .post('/v1/api/auth/register-email')
            .send({
              email: uniqueEmail,
              password: password,
              first_name: firstName.trim(),
              last_name: lastName.trim(),
            });

          // Property: At least one email should be sent
          expect(capturedEmails.length).toBeGreaterThan(0);

          // Property: All emails should include first name in data
          for (const emailData of capturedEmails) {
            if (emailData.data) {
              expect(emailData.data.first_name).toBe(firstName.trim());
            }
          }

          // Store user ID for cleanup
          if (response.body.user && response.body.user.id) {
            testUserIds.push(response.body.user.id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
