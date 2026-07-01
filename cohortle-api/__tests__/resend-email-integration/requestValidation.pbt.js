const fc = require('fast-check');
const request = require('supertest');
const express = require('express');

// Mock dependencies
jest.mock('../../lib/resend', () => ({
  emails: { send: jest.fn() }
}));
jest.mock('../../services/ResendService');
jest.mock('../../services/ValidationService');
jest.mock('../../middleware/TokenMiddleware', () => (req, res, next) => {
  req.user_id = 'test-user';
  next();
});
jest.mock('../../middleware/UrlMiddleware', () => (req, res, next) => next());

const emailRoute = require('../../routes/email');
const ValidationService = require('../../services/ValidationService');

describe('Feature: resend-email-integration, Property 4: Request validation rejects missing required fields', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    emailRoute(app);
    jest.clearAllMocks();
  });

  test('should reject requests missing "to" field', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('welcome', 'password_reset', 'enrollment_confirmation', 'notification'),
        fc.object(),
        async (type, data) => {
          ValidationService.validateObject.mockResolvedValue({
            error: true,
            message: 'Field "to" is required'
          });

          const response = await request(app)
            .post('/v1/api/email/send')
            .send({ type, data });

          expect(response.status).toBe(400);
          expect(response.body.error).toBe(true);
        }
      ),
      { numRuns: 10 }
    );
  });

  test('should reject requests missing "type" field', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.object(),
        async (to, data) => {
          ValidationService.validateObject.mockResolvedValue({
            error: true,
            message: 'Field "type" is required'
          });

          const response = await request(app)
            .post('/v1/api/email/send')
            .send({ to, data });

          expect(response.status).toBe(400);
          expect(response.body.error).toBe(true);
        }
      ),
      { numRuns: 10 }
    );
  });

  test('should reject requests with invalid type', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string().filter(s => !['welcome', 'password_reset', 'enrollment_confirmation', 'notification'].includes(s)),
        async (to, invalidType) => {
          ValidationService.validateObject.mockResolvedValue({
            error: true,
            message: 'Invalid email type'
          });

          const response = await request(app)
            .post('/v1/api/email/send')
            .send({ to, type: invalidType, data: {} });

          expect(response.status).toBe(400);
          expect(response.body.error).toBe(true);
        }
      ),
      { numRuns: 10 }
    );
  });
});
