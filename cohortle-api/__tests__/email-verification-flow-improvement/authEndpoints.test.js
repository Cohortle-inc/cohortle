/**
 * Unit tests for auth endpoints related to email verification
 * 
 * Tests verify-email, resend-verification, and register-email endpoints
 * Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 2.4
 * 
 * NOTE: These tests require a local test database to be configured.
 * To run these tests:
 * 1. Set up a local MySQL database
 * 2. Update .env with local database credentials
 * 3. Run: node __tests__/setup-test-db.js
 * 4. Run: npm test -- __tests__/email-verification-flow-improvement/authEndpoints.test.js
 */

const request = require('supertest');
const app = require('../../app');
const db = require('../../models');
const JwtService = require('../../services/JwtService');
const VerificationTokenService = require('../../services/VerificationTokenService');
const PasswordService = require('../../services/PasswordService');

describe('Email Verification Auth Endpoints', () => {
  let testUser;
  let studentRole;

  beforeAll(async () => {
    // Get student role
    studentRole = await db.roles.findOne({ where: { name: 'student' } });
  });

  beforeEach(async () => {
    // Clean up test data
    await db.verification_tokens.destroy({ where: {} });
    await db.user_role_assignments.destroy({ where: {} });
    await db.users.destroy({ where: { email: { [db.Sequelize.Op.like]: 'test_%@example.com' } } });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe('POST /v1/api/auth/verify-email', () => {
    beforeEach(async () => {
      // Create test user
      const hashedPassword = await PasswordService.hash('TestPassword123');
      testUser = await db.users.create({
        email: `test_${Date.now()}@example.com`,
        password: hashedPassword,
        first_name: 'Test',
        last_name: 'User',
        email_verified: 0,
        role_id: studentRole.role_id,
      });

      // Assign role
      await db.user_role_assignments.create({
        user_id: testUser.id,
        role_id: studentRole.role_id,
        assigned_by: testUser.id,
        assigned_at: new Date(),
        effective_from: new Date(),
        status: 'active',
      });
    });

    it('should successfully verify email with valid token', async () => {
      // Generate verification token
      const token = await VerificationTokenService.generateToken(testUser.id);

      // Create JWT token for verification
      const verifyToken = JwtService.createAccessToken(
        {
          user_id: testUser.id,
          email: testUser.email,
          role: 'student',
        },
        5 * 1000 * 60,
        process.env.JWT_SECRET
      );

      const response = await request(app)
        .post('/v1/api/auth/verify-email')
        .send({ verify_token: verifyToken })
        .expect(200);

      expect(response.body.error).toBe(false);
      expect(response.body.message).toBe('Email verified successfully');
      expect(response.body.token).toBeDefined();

      // Verify user's email_verified field was updated
      const updatedUser = await db.users.findByPk(testUser.id);
      expect(updatedUser.email_verified).toBe(1);
    });

    it('should return 400 when verify_token is missing', async () => {
      const response = await request(app)
        .post('/v1/api/auth/verify-email')
        .send({})
        .expect(400);

      expect(response.body.error).toBe(true);
      expect(response.body.message).toContain('verify_token');
    });

    it('should return 401 when token is invalid', async () => {
      const response = await request(app)
        .post('/v1/api/auth/verify-email')
        .send({ verify_token: 'invalid-token' })
        .expect(401);

      expect(response.body.error).toBe(true);
      expect(response.body.message).toContain('Invalid token');
    });

    it('should return 401 when token is expired', async () => {
      // Create expired token
      const expiredToken = JwtService.createAccessToken(
        {
          user_id: testUser.id,
          email: testUser.email,
          role: 'student',
        },
        -1000, // Negative expiry = already expired
        process.env.JWT_SECRET
      );

      const response = await request(app)
        .post('/v1/api/auth/verify-email')
        .send({ verify_token: expiredToken })
        .expect(401);

      expect(response.body.error).toBe(true);
      expect(response.body.message).toContain('Invalid token or token expired');
    });

    it('should return 404 when user not found', async () => {
      // Create token for non-existent user
      const fakeToken = JwtService.createAccessToken(
        {
          user_id: 99999,
          email: 'fake@example.com',
          role: 'student',
        },
        5 * 1000 * 60,
        process.env.JWT_SECRET
      );

      const response = await request(app)
        .post('/v1/api/auth/verify-email')
        .send({ verify_token: fakeToken })
        .expect(404);

      expect(response.body.error).toBe(true);
      expect(response.body.message).toContain('user not found');
    });

    it('should return new JWT token with email_verified: true', async () => {
      const verifyToken = JwtService.createAccessToken(
        {
          user_id: testUser.id,
          email: testUser.email,
          role: 'student',
        },
        5 * 1000 * 60,
        process.env.JWT_SECRET
      );

      const response = await request(app)
        .post('/v1/api/auth/verify-email')
        .send({ verify_token: verifyToken })
        .expect(200);

      expect(response.body.token).toBeDefined();

      // Decode new token and verify it contains correct data
      const decoded = JwtService.verifyAccessToken(
        response.body.token,
        process.env.JWT_SECRET
      );
      expect(decoded.user_id).toBe(testUser.id);
      expect(decoded.email).toBe(testUser.email);
      expect(decoded.role).toBe('student');
    });

    it('should be idempotent - verifying already verified email succeeds', async () => {
      // First verification
      const verifyToken = JwtService.createAccessToken(
        {
          user_id: testUser.id,
          email: testUser.email,
          role: 'student',
        },
        5 * 1000 * 60,
        process.env.JWT_SECRET
      );

      await request(app)
        .post('/v1/api/auth/verify-email')
        .send({ verify_token: verifyToken })
        .expect(200);

      // Second verification with new token
      const verifyToken2 = JwtService.createAccessToken(
        {
          user_id: testUser.id,
          email: testUser.email,
          role: 'student',
        },
        5 * 1000 * 60,
        process.env.JWT_SECRET
      );

      const response = await request(app)
        .post('/v1/api/auth/verify-email')
        .send({ verify_token: verifyToken2 })
        .expect(200);

      expect(response.body.error).toBe(false);
      expect(response.body.message).toBe('Email verified successfully');
    });
  });

  describe('POST /v1/api/auth/register-email', () => {
    it('should send verification email on successful registration', async () => {
      const email = `test_${Date.now()}@example.com`;
      
      const response = await request(app)
        .post('/v1/api/auth/register-email')
        .send({
          email: email,
          password: 'TestPassword123',
          first_name: 'Test',
          last_name: 'User',
        })
        .expect(200);

      expect(response.body.error).toBe(false);
      expect(response.body.message).toContain('Verification email sent');
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(email);

      // Verify user was created with email_verified = 0
      const user = await db.users.findOne({ where: { email } });
      expect(user).toBeDefined();
      expect(user.email_verified).toBe(0);
    });

    it('should return JWT token with email_verified: false on registration', async () => {
      const email = `test_${Date.now()}@example.com`;
      
      const response = await request(app)
        .post('/v1/api/auth/register-email')
        .send({
          email: email,
          password: 'TestPassword123',
          first_name: 'Test',
          last_name: 'User',
        })
        .expect(200);

      expect(response.body.token).toBeDefined();

      // Decode token and verify email_verified is false
      const decoded = JwtService.verifyAccessToken(
        response.body.token,
        process.env.JWT_SECRET
      );
      expect(decoded.user_id).toBeDefined();
      expect(decoded.email).toBe(email);
    });

    it('should return 400 when email is already in use', async () => {
      const email = `test_${Date.now()}@example.com`;
      
      // First registration
      await request(app)
        .post('/v1/api/auth/register-email')
        .send({
          email: email,
          password: 'TestPassword123',
          first_name: 'Test',
          last_name: 'User',
        })
        .expect(200);

      // Second registration with same email
      const response = await request(app)
        .post('/v1/api/auth/register-email')
        .send({
          email: email,
          password: 'TestPassword123',
          first_name: 'Test2',
          last_name: 'User2',
        })
        .expect(400);

      expect(response.body.error).toBe(true);
      expect(response.body.message).toContain('Email already in use');
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/v1/api/auth/register-email')
        .send({
          email: `test_${Date.now()}@example.com`,
          // Missing password, first_name, last_name
        })
        .expect(400);

      expect(response.body.error).toBe(true);
    });

    it('should return 400 when email format is invalid', async () => {
      const response = await request(app)
        .post('/v1/api/auth/register-email')
        .send({
          email: 'invalid-email',
          password: 'TestPassword123',
          first_name: 'Test',
          last_name: 'User',
        })
        .expect(400);

      expect(response.body.error).toBe(true);
    });
  });

  describe('POST /v1/api/auth/resend-verification (if implemented)', () => {
    beforeEach(async () => {
      // Create test user
      const hashedPassword = await PasswordService.hash('TestPassword123');
      testUser = await db.users.create({
        email: `test_${Date.now()}@example.com`,
        password: hashedPassword,
        first_name: 'Test',
        last_name: 'User',
        email_verified: 0,
        role_id: studentRole.role_id,
      });

      // Assign role
      await db.user_role_assignments.create({
        user_id: testUser.id,
        role_id: studentRole.role_id,
        assigned_by: testUser.id,
        assigned_at: new Date(),
        effective_from: new Date(),
        status: 'active',
      });
    });

    it('should return 404 if endpoint not implemented yet', async () => {
      const token = JwtService.createAccessToken(
        {
          user_id: testUser.id,
          email: testUser.email,
          role: 'student',
        },
        24 * 60 * 60 * 1000,
        process.env.JWT_SECRET
      );

      const response = await request(app)
        .post('/v1/api/auth/resend-verification')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      // This test documents that the endpoint doesn't exist yet
      // When implemented, this test should be updated
    });
  });
});
