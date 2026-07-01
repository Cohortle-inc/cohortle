/**
 * Integration tests for POST /v1/api/auth/google
 * Feature: google-auth-integration
 * Task 3.6
 *
 * Tests the full endpoint with GoogleAuthService and DB mocked.
 * Validates: Requirements 2.1, 2.4, 2.5, 3.5, 4.3
 */

// All mocks must be declared before any require() calls

jest.mock('../../services/GoogleAuthService', () => ({
  verifyIdToken: jest.fn(),
}));

jest.mock('../../services/RoleAssignmentService', () => ({
  assignRole: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('../../services/RoleValidationService', () => ({
  getUserRole: jest.fn().mockResolvedValue('student'),
}));

const MOCK_USER = {
  id: 1,
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  google_id: 'google-sub-123',
  password: null,
  email_verified: 1,
  status: 'active',
  role: 'student',
  role_id: 1,
  // Sequelize model instances have toJSON()
  toJSON() { return { ...this, toJSON: undefined }; },
};

jest.mock('../../models', () => ({
  users: {
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  roles: {
    findOne: jest.fn().mockResolvedValue({ role_id: 1, name: 'student' }),
    findByPk: jest.fn().mockResolvedValue({ role_id: 1, name: 'student' }),
  },
  user_role_assignments: {
    findOne: jest.fn().mockResolvedValue({ role_id: 1 }),
    create: jest.fn().mockResolvedValue({}),
  },
  role_permissions: {
    findAll: jest.fn().mockResolvedValue([]),
  },
  permissions: {
    findByPk: jest.fn().mockResolvedValue({ name: 'view_lessons' }),
  },
  Sequelize: {
    Op: { lte: Symbol('lte'), gte: Symbol('gte'), or: Symbol('or'), ne: Symbol('ne') },
  },
  sequelize: {
    query: jest.fn().mockResolvedValue([[]]),
    authenticate: jest.fn().mockResolvedValue(undefined),
    sync: jest.fn().mockResolvedValue(undefined),
  },
}));

// Now safe to require app and other modules
const request = require('supertest');
const app = require('../../app');
const GoogleAuthService = require('../../services/GoogleAuthService');
const db = require('../../models');

const MOCK_PAYLOAD = {
  email: 'test@example.com',
  sub: 'google-sub-123',
  given_name: 'Test',
  family_name: 'User',
  email_verified: true,
};

describe('POST /v1/api/auth/google', () => {
  const originalClientId = process.env.GOOGLE_CLIENT_ID;
  const originalJwtSecret = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
    process.env.JWT_SECRET = 'test-jwt-secret-32-chars-minimum!!';
  });

  afterAll(() => {
    process.env.GOOGLE_CLIENT_ID = originalClientId;
    process.env.JWT_SECRET = originalJwtSecret;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: returning user with matching google_id
    db.users.findOne.mockResolvedValue(MOCK_USER);
  });

  it('returns 400 when google_id_token is missing', async () => {
    const res = await request(app)
      .post('/v1/api/auth/google')
      .send({})
      .expect(400);

    expect(res.body.error).toBe(true);
    expect(res.body.message).toMatch(/google_id_token is required/i);
  });

  it('returns 401 when GoogleAuthService rejects the token', async () => {
    GoogleAuthService.verifyIdToken.mockRejectedValue(
      new Error('Token used too late')
    );

    const res = await request(app)
      .post('/v1/api/auth/google')
      .send({ google_id_token: 'invalid.token.here' })
      .expect(401);

    expect(res.body.error).toBe(true);
    expect(res.body.message).toMatch(/invalid or expired/i);
  });

  it('returns 200 with student role for a new user', async () => {
    GoogleAuthService.verifyIdToken.mockResolvedValue(MOCK_PAYLOAD);

    // First findOne: no existing user; second: getUserWithRole lookup
    db.users.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(MOCK_USER);
    db.users.create.mockResolvedValue(MOCK_USER);

    const res = await request(app)
      .post('/v1/api/auth/google')
      .send({ google_id_token: 'valid.google.token' })
      .expect(200);

    expect(res.body.error).toBe(false);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('student');
  });

  it('returns 200 for a returning Google user', async () => {
    GoogleAuthService.verifyIdToken.mockResolvedValue(MOCK_PAYLOAD);
    db.users.findOne.mockResolvedValue(MOCK_USER);

    const res = await request(app)
      .post('/v1/api/auth/google')
      .send({ google_id_token: 'valid.google.token' })
      .expect(200);

    expect(res.body.error).toBe(false);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('returns 200 and links account for existing email/password user, preserving role', async () => {
    GoogleAuthService.verifyIdToken.mockResolvedValue(MOCK_PAYLOAD);

    const existingUser = { ...MOCK_USER, google_id: null, password: 'hashed', role: 'convener' };
    const linkedUser = { ...existingUser, google_id: MOCK_PAYLOAD.sub, role: 'convener' };

    db.users.findOne
      .mockResolvedValueOnce(existingUser)  // existing user, google_id=null
      .mockResolvedValueOnce(linkedUser);   // getUserWithRole after update
    db.users.update.mockResolvedValue([1]);

    const res = await request(app)
      .post('/v1/api/auth/google')
      .send({ google_id_token: 'valid.google.token' })
      .expect(200);

    expect(res.body.error).toBe(false);
    expect(db.users.update).toHaveBeenCalledWith(
      { google_id: MOCK_PAYLOAD.sub, email_verified: 1 },
      expect.objectContaining({ where: { id: existingUser.id } })
    );
  });

  it('returns 503 when GOOGLE_CLIENT_ID is not set', async () => {
    const saved = process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_ID;

    try {
      const res = await request(app)
        .post('/v1/api/auth/google')
        .send({ google_id_token: 'some.token' })
        .expect(503);

      expect(res.body.error).toBe(true);
      expect(res.body.message).toMatch(/not configured/i);
    } finally {
      process.env.GOOGLE_CLIENT_ID = saved;
    }
  });
});
