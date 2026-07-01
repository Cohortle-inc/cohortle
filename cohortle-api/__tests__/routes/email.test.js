const request = require('supertest');
const express = require('express');

// Mock resend client before any imports
jest.mock('../../lib/resend', () => ({
  emails: {
    send: jest.fn()
  }
}));

const emailRoute = require('../../routes/email');
const ResendService = require('../../services/ResendService');
const ValidationService = require('../../services/ValidationService');

// Mock dependencies
jest.mock('../../services/ResendService');
jest.mock('../../services/ValidationService');
jest.mock('../../middleware/TokenMiddleware', () => (req, res, next) => {
  if (req.headers.authorization) {
    req.user_id = 'test-user-id';
    next();
  } else {
    res.status(401).json({ error: true, message: 'Unauthorized' });
  }
});
jest.mock('../../middleware/UrlMiddleware', () => (req, res, next) => next());

describe('Email Route', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    emailRoute(app);
    jest.clearAllMocks();
  });

  describe('POST /v1/api/email/send', () => {
    test('should send email successfully and return 200', async () => {
      ValidationService.validateObject.mockResolvedValue({ error: false });
      ResendService.isValidEmail.mockReturnValue(true);
      ResendService.sendEmail.mockResolvedValue({
        error: false,
        message: 'Email sent successfully',
        messageId: 'test-message-id'
      });

      const response = await request(app)
        .post('/v1/api/email/send')
        .set('Authorization', 'Bearer test-token')
        .send({
          to: 'user@example.com',
          type: 'welcome',
          data: { first_name: 'John' }
        });

      expect(response.status).toBe(200);
      expect(response.body.error).toBe(false);
      expect(response.body.message).toBe('Email sent successfully');
      expect(response.body.messageId).toBe('test-message-id');
    });

    test('should return 400 when required fields are missing', async () => {
      ValidationService.validateObject.mockResolvedValue({
        error: true,
        message: 'Validation failed'
      });

      const response = await request(app)
        .post('/v1/api/email/send')
        .set('Authorization', 'Bearer test-token')
        .send({
          to: 'user@example.com'
          // Missing 'type' field
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(true);
    });

    test('should return 400 for invalid email format', async () => {
      ValidationService.validateObject.mockResolvedValue({ error: false });
      ResendService.isValidEmail.mockReturnValue(false);

      const response = await request(app)
        .post('/v1/api/email/send')
        .set('Authorization', 'Bearer test-token')
        .send({
          to: 'invalid-email',
          type: 'welcome',
          data: {}
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(true);
      expect(response.body.message).toBe('Invalid email address format');
    });

    test('should return 400 when subject exceeds 200 characters', async () => {
      ValidationService.validateObject.mockResolvedValue({ error: false });
      ResendService.isValidEmail.mockReturnValue(true);

      const longSubject = 'a'.repeat(201);

      const response = await request(app)
        .post('/v1/api/email/send')
        .set('Authorization', 'Bearer test-token')
        .send({
          to: 'user@example.com',
          type: 'welcome',
          data: {},
          subject: longSubject
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(true);
      expect(response.body.message).toBe('Subject line must be 200 characters or less');
    });

    test('should return 401 when authentication is missing', async () => {
      const response = await request(app)
        .post('/v1/api/email/send')
        .send({
          to: 'user@example.com',
          type: 'welcome',
          data: {}
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe(true);
    });

    test('should return 500 when Resend service fails', async () => {
      ValidationService.validateObject.mockResolvedValue({ error: false });
      ResendService.isValidEmail.mockReturnValue(true);
      ResendService.sendEmail.mockResolvedValue({
        error: true,
        message: 'Resend API error'
      });

      const response = await request(app)
        .post('/v1/api/email/send')
        .set('Authorization', 'Bearer test-token')
        .send({
          to: 'user@example.com',
          type: 'welcome',
          data: {}
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe(true);
      expect(response.body.message).toBe('Resend API error');
    });

    test('should handle all email types', async () => {
      ValidationService.validateObject.mockResolvedValue({ error: false });
      ResendService.isValidEmail.mockReturnValue(true);
      ResendService.sendEmail.mockResolvedValue({
        error: false,
        message: 'Email sent successfully',
        messageId: 'test-id'
      });

      const emailTypes = ['welcome', 'password_reset', 'enrollment_confirmation', 'notification'];

      for (const type of emailTypes) {
        const response = await request(app)
          .post('/v1/api/email/send')
          .set('Authorization', 'Bearer test-token')
          .send({
            to: 'user@example.com',
            type,
            data: {}
          });

        expect(response.status).toBe(200);
        expect(ResendService.sendEmail).toHaveBeenCalledWith(
          expect.objectContaining({ type })
        );
      }
    });

    test('should pass custom subject to ResendService', async () => {
      ValidationService.validateObject.mockResolvedValue({ error: false });
      ResendService.isValidEmail.mockReturnValue(true);
      ResendService.sendEmail.mockResolvedValue({
        error: false,
        message: 'Email sent successfully',
        messageId: 'test-id'
      });

      await request(app)
        .post('/v1/api/email/send')
        .set('Authorization', 'Bearer test-token')
        .send({
          to: 'user@example.com',
          type: 'welcome',
          data: {},
          subject: 'Custom Subject'
        });

      expect(ResendService.sendEmail).toHaveBeenCalledWith({
        to: 'user@example.com',
        type: 'welcome',
        data: {},
        subject: 'Custom Subject'
      });
    });

    test('should handle empty data object', async () => {
      ValidationService.validateObject.mockResolvedValue({ error: false });
      ResendService.isValidEmail.mockReturnValue(true);
      ResendService.sendEmail.mockResolvedValue({
        error: false,
        message: 'Email sent successfully',
        messageId: 'test-id'
      });

      const response = await request(app)
        .post('/v1/api/email/send')
        .set('Authorization', 'Bearer test-token')
        .send({
          to: 'user@example.com',
          type: 'welcome'
          // No data field
        });

      expect(response.status).toBe(200);
      expect(ResendService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({ data: {} })
      );
    });

    test('should return descriptive error messages', async () => {
      ValidationService.validateObject.mockResolvedValue({
        error: true,
        message: 'Field "to" is required'
      });

      const response = await request(app)
        .post('/v1/api/email/send')
        .set('Authorization', 'Bearer test-token')
        .send({
          type: 'welcome',
          data: {}
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });
  });
});
