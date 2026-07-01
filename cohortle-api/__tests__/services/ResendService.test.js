const ResendService = require('../../services/ResendService');
const resendClient = require('../../lib/resend');

// Mock the resend client
jest.mock('../../lib/resend', () => ({
  emails: {
    send: jest.fn()
  },
  contacts: {
    create: jest.fn()
  }
}));

// Mock error logger
jest.mock('../../utils/errorLogger', () => ({
  logSuccess: jest.fn(),
  logApiError: jest.fn()
}));

describe('ResendService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isValidEmail', () => {
    test('should accept valid email formats', () => {
      expect(ResendService.isValidEmail('user@example.com')).toBe(true);
      expect(ResendService.isValidEmail('test.user@domain.co.uk')).toBe(true);
      expect(ResendService.isValidEmail('user+tag@example.com')).toBe(true);
    });

    test('should reject invalid email formats', () => {
      expect(ResendService.isValidEmail('invalid')).toBe(false);
      expect(ResendService.isValidEmail('invalid@')).toBe(false);
      expect(ResendService.isValidEmail('@example.com')).toBe(false);
      expect(ResendService.isValidEmail('user@')).toBe(false);
      expect(ResendService.isValidEmail('user@domain')).toBe(false);
      expect(ResendService.isValidEmail('')).toBe(false);
      expect(ResendService.isValidEmail(null)).toBe(false);
      expect(ResendService.isValidEmail(undefined)).toBe(false);
    });
  });

  describe('sendEmail', () => {
    test('should send welcome email successfully', async () => {
      resendClient.emails.send.mockResolvedValue({ id: 'test-message-id' });

      const result = await ResendService.sendEmail({
        to: 'user@example.com',
        type: 'welcome',
        data: { first_name: 'John' }
      });

      expect(result.error).toBe(false);
      expect(result.message).toBe('Email sent successfully');
      expect(result.messageId).toBe('test-message-id');
      expect(resendClient.emails.send).toHaveBeenCalledWith({
        from: 'Cohortle <noreply@mail.cohortle.com>',
        to: ['user@example.com'],
        subject: 'Welcome to Cohortle!',
        html: expect.stringContaining('John')
      });
    });

    test('should send password reset email successfully', async () => {
      resendClient.emails.send.mockResolvedValue({ id: 'test-message-id' });

      const result = await ResendService.sendEmail({
        to: 'user@example.com',
        type: 'password_reset',
        data: { 
          first_name: 'Jane',
          reset_link: 'https://example.com/reset'
        }
      });

      expect(result.error).toBe(false);
      expect(resendClient.emails.send).toHaveBeenCalledWith({
        from: 'Cohortle <noreply@mail.cohortle.com>',
        to: ['user@example.com'],
        subject: 'Reset Your Cohortle Password',
        html: expect.stringContaining('Jane')
      });
    });

    test('should send enrollment confirmation email successfully', async () => {
      resendClient.emails.send.mockResolvedValue({ id: 'test-message-id' });

      const result = await ResendService.sendEmail({
        to: 'user@example.com',
        type: 'enrollment_confirmation',
        data: {
          first_name: 'Bob',
          programme_name: 'Web Development',
          cohort_name: 'Cohort 2024',
          start_date: '2024-01-15'
        }
      });

      expect(result.error).toBe(false);
      expect(resendClient.emails.send).toHaveBeenCalledWith({
        from: 'Cohortle <noreply@mail.cohortle.com>',
        to: ['user@example.com'],
        subject: 'Enrollment Confirmed',
        html: expect.stringContaining('Web Development')
      });
    });

    test('should send notification email successfully', async () => {
      resendClient.emails.send.mockResolvedValue({ id: 'test-message-id' });

      const result = await ResendService.sendEmail({
        to: 'user@example.com',
        type: 'notification',
        data: {
          title: 'New Announcement',
          message: 'Check out our latest update'
        }
      });

      expect(result.error).toBe(false);
      expect(resendClient.emails.send).toHaveBeenCalledWith({
        from: 'Cohortle <noreply@mail.cohortle.com>',
        to: ['user@example.com'],
        subject: 'New Announcement',
        html: expect.stringContaining('Check out our latest update')
      });
    });

    test('should use custom subject when provided', async () => {
      resendClient.emails.send.mockResolvedValue({ id: 'test-message-id' });

      await ResendService.sendEmail({
        to: 'user@example.com',
        type: 'welcome',
        data: { first_name: 'John' },
        subject: 'Custom Subject'
      });

      expect(resendClient.emails.send).toHaveBeenCalledWith({
        from: 'Cohortle <noreply@mail.cohortle.com>',
        to: ['user@example.com'],
        subject: 'Custom Subject',
        html: expect.any(String)
      });
    });

    test('should always use noreply@mail.cohortle.com as sender', async () => {
      resendClient.emails.send.mockResolvedValue({ id: 'test-message-id' });

      await ResendService.sendEmail({
        to: 'user@example.com',
        type: 'welcome',
        data: { first_name: 'John' }
      });

      expect(resendClient.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'Cohortle <noreply@mail.cohortle.com>'
        })
      );
    });

    test('should return error for invalid email address', async () => {
      const result = await ResendService.sendEmail({
        to: 'invalid-email',
        type: 'welcome',
        data: { first_name: 'John' }
      });

      expect(result.error).toBe(true);
      expect(result.message).toBe('Invalid email address format');
      expect(resendClient.emails.send).not.toHaveBeenCalled();
    });

    test('should return error for invalid email type', async () => {
      const result = await ResendService.sendEmail({
        to: 'user@example.com',
        type: 'invalid_type',
        data: {}
      });

      expect(result.error).toBe(true);
      expect(result.message).toContain('Invalid email type');
      expect(resendClient.emails.send).not.toHaveBeenCalled();
    });

    test('should handle Resend API failure', async () => {
      resendClient.emails.send.mockRejectedValue(new Error('API Error'));

      const result = await ResendService.sendEmail({
        to: 'user@example.com',
        type: 'welcome',
        data: { first_name: 'John' }
      });

      expect(result.error).toBe(true);
      expect(result.message).toBe('API Error');
    });

    test('should support custom HTML in notification emails', async () => {
      resendClient.emails.send.mockResolvedValue({ id: 'test-message-id' });

      const customHtml = '<html><body><h1>Custom Email</h1></body></html>';
      await ResendService.sendEmail({
        to: 'user@example.com',
        type: 'notification',
        data: { customHtml }
      });

      expect(resendClient.emails.send).toHaveBeenCalledWith({
        from: 'Cohortle <noreply@mail.cohortle.com>',
        to: ['user@example.com'],
        subject: 'Notification from Cohortle',
        html: customHtml
      });
    });
  });

  describe('addToAudience', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv, RESEND_AUDIENCE_ID: 'test-audience-id' };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    test('should add contact to audience successfully', async () => {
      resendClient.contacts.create.mockResolvedValue({ id: 'test-contact-id' });

      const result = await ResendService.addToAudience({
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe'
      });

      expect(result.error).toBe(false);
      expect(result.message).toBe('Contact added to audience successfully');
      expect(result.contactId).toBe('test-contact-id');
      expect(resendClient.contacts.create).toHaveBeenCalledWith({
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        audienceId: 'test-audience-id'
      });
    });

    test('should use custom audience ID when provided', async () => {
      resendClient.contacts.create.mockResolvedValue({ id: 'test-contact-id' });

      await ResendService.addToAudience({
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        audienceId: 'custom-audience-id'
      });

      expect(resendClient.contacts.create).toHaveBeenCalledWith({
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        audienceId: 'custom-audience-id'
      });
    });

    test('should return error for invalid email address', async () => {
      const result = await ResendService.addToAudience({
        email: 'invalid-email',
        firstName: 'John',
        lastName: 'Doe'
      });

      expect(result.error).toBe(true);
      expect(result.message).toBe('Invalid email address format');
      expect(resendClient.contacts.create).not.toHaveBeenCalled();
    });

    test('should handle duplicate contact gracefully', async () => {
      resendClient.contacts.create.mockRejectedValue(new Error('Contact already exists'));

      const result = await ResendService.addToAudience({
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe'
      });

      expect(result.error).toBe(false);
      expect(result.message).toBe('Contact already exists in audience');
    });

    test('should handle API failure', async () => {
      resendClient.contacts.create.mockRejectedValue(new Error('API Error'));

      const result = await ResendService.addToAudience({
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe'
      });

      expect(result.error).toBe(true);
      expect(result.message).toBe('API Error');
    });

    test('should skip audience management when RESEND_AUDIENCE_ID is not configured', async () => {
      delete process.env.RESEND_AUDIENCE_ID;

      const result = await ResendService.addToAudience({
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe'
      });

      expect(result.error).toBe(false);
      expect(result.message).toBe('Audience management skipped (audience ID not configured)');
      expect(resendClient.contacts.create).not.toHaveBeenCalled();
    });
  });

  describe('EMAIL_TEMPLATES', () => {
    test('should have all required template types', () => {
      expect(ResendService.EMAIL_TEMPLATES).toHaveProperty('welcome');
      expect(ResendService.EMAIL_TEMPLATES).toHaveProperty('password_reset');
      expect(ResendService.EMAIL_TEMPLATES).toHaveProperty('enrollment_confirmation');
      expect(ResendService.EMAIL_TEMPLATES).toHaveProperty('notification');
    });

    test('should generate HTML for each template type', () => {
      const welcomeHtml = ResendService.EMAIL_TEMPLATES.welcome.getHtml({ first_name: 'John' });
      expect(welcomeHtml).toContain('John');
      expect(welcomeHtml).toContain('Welcome to Cohortle');

      const resetHtml = ResendService.EMAIL_TEMPLATES.password_reset.getHtml({ 
        first_name: 'Jane',
        reset_link: 'https://example.com/reset'
      });
      expect(resetHtml).toContain('Jane');
      expect(resetHtml).toContain('https://example.com/reset');

      const enrollmentHtml = ResendService.EMAIL_TEMPLATES.enrollment_confirmation.getHtml({
        first_name: 'Bob',
        programme_name: 'Web Dev',
        cohort_name: 'Cohort 1',
        start_date: '2024-01-15'
      });
      expect(enrollmentHtml).toContain('Bob');
      expect(enrollmentHtml).toContain('Web Dev');

      const notificationHtml = ResendService.EMAIL_TEMPLATES.notification.getHtml({
        title: 'Test',
        message: 'Test message'
      });
      expect(notificationHtml).toContain('Test');
      expect(notificationHtml).toContain('Test message');
    });
  });
});
