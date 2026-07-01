const fc = require('fast-check');

// Mock the resend client
jest.mock('../../lib/resend', () => ({
  emails: {
    send: jest.fn().mockResolvedValue({ id: 'test-message-id' })
  }
}));

// Mock error logger
jest.mock('../../utils/errorLogger', () => ({
  logSuccess: jest.fn(),
  logApiError: jest.fn()
}));

const { sendEmail, SENDER_EMAIL, SENDER_NAME } = require('../../services/ResendService');
const resendClient = require('../../lib/resend');

describe('Feature: resend-email-integration, Property 6: Sender address consistency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should always use noreply@mail.cohortle.com as sender for any email type', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('welcome', 'password_reset', 'enrollment_confirmation', 'notification'),
        fc.emailAddress(),
        fc.object(),
        async (emailType, recipientEmail, data) => {
          await sendEmail({
            to: recipientEmail,
            type: emailType,
            data
          });

          expect(resendClient.emails.send).toHaveBeenCalledWith(
            expect.objectContaining({
              from: `${SENDER_NAME} <${SENDER_EMAIL}>`
            })
          );
        }
      ),
      { numRuns: 20 }
    );
  });

  test('should use consistent sender format across all emails', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('welcome', 'password_reset', 'enrollment_confirmation', 'notification'),
        fc.emailAddress(),
        async (emailType, recipientEmail) => {
          await sendEmail({
            to: recipientEmail,
            type: emailType,
            data: { first_name: 'Test' }
          });

          const calls = resendClient.emails.send.mock.calls;
          const lastCall = calls[calls.length - 1];
          
          expect(lastCall[0].from).toBe('Cohortle <noreply@mail.cohortle.com>');
        }
      ),
      { numRuns: 20 }
    );
  });

  test('should never allow sender address override', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.emailAddress(),
        async (recipientEmail, attemptedSender) => {
          // Try to send email with custom data that might include sender
          await sendEmail({
            to: recipientEmail,
            type: 'notification',
            data: {
              from: attemptedSender,
              sender: attemptedSender,
              message: 'Test'
            }
          });

          // Verify sender is still the hardcoded value
          expect(resendClient.emails.send).toHaveBeenCalledWith(
            expect.objectContaining({
              from: 'Cohortle <noreply@mail.cohortle.com>'
            })
          );
        }
      ),
      { numRuns: 20 }
    );
  });

  test('should maintain sender consistency with custom subjects', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 1, maxLength: 200 }),
        async (recipientEmail, customSubject) => {
          await sendEmail({
            to: recipientEmail,
            type: 'welcome',
            data: { first_name: 'Test' },
            subject: customSubject
          });

          expect(resendClient.emails.send).toHaveBeenCalledWith(
            expect.objectContaining({
              from: 'Cohortle <noreply@mail.cohortle.com>',
              subject: customSubject
            })
          );
        }
      ),
      { numRuns: 20 }
    );
  });

  test('should verify SENDER_EMAIL constant is correct', () => {
    expect(SENDER_EMAIL).toBe('noreply@mail.cohortle.com');
  });

  test('should verify SENDER_NAME constant is correct', () => {
    expect(SENDER_NAME).toBe('Cohortle');
  });
});
