const request = require('supertest');
const app = require('../../app');
const db = require('../../models');
const JwtService = require('../../services/JwtService');
const { createTestUser, cleanupTestData } = require('../helpers/testSetup');

describe('Auth Token Refresh for Role Conflicts', () => {
  let testUser;
  let studentRole;
  let convenerRole;
  let testToken;

  beforeAll(async () => {
    await cleanupTestData();
    
    // Get roles
    studentRole = await db.roles.findOne({ where: { name: 'student' } });
    convenerRole = await db.roles.findOne({ where: { name: 'convener' } });
  });

  beforeEach(async () => {
    // Create test user with student role
    testUser = await createTestUser();
    
    // Assign student role
    await db.user_role_assignments.create({
      user_id: testUser.id,
      role_id: studentRole.role_id,
      assigned_by: testUser.id,
      assigned_at: new Date(),
      effective_from: new Date(),
      status: 'active'
    });

    // Update user's denormalized role_id
    await db.users.update(
      { role_id: studentRole.role_id },
      { where: { id: testUser.id } }
    );

    // Create token with student role
    testToken = JwtService.createAccessToken(
      {
        user_id: testUser.id,
        email: testUser.email,
        role: 'student',
        permissions: ['view_lessons', 'complete_lessons']
      },
      24 * 60 * 60 * 1000,
      process.env.JWT_SECRET
    );
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe('POST /v1/api/auth/refresh-token', () => {
    it('should refresh token with current role from database', async () => {
      const response = await request(app)
        .post('/v1/api/auth/refresh-token')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.error).toBe(false);
      expect(response.body.message).toContain('Token refreshed successfully');
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.role).toBe('student');
      expect(response.body.user.permissions).toBeInstanceOf(Array);
      expect(response.body.role_changed).toBe(false);
    });

    it('should detect role conflict and return new token with updated role', async () => {
      // Change user role in database to convener
      await db.user_role_assignments.update(
        { status: 'inactive' },
        { where: { user_id: testUser.id, status: 'active' } }
      );

      await db.user_role_assignments.create({
        user_id: testUser.id,
        role_id: convenerRole.role_id,
        assigned_by: testUser.id,
        assigned_at: new Date(),
        effective_from: new Date(),
        status: 'active'
      });

      await db.users.update(
        { role_id: convenerRole.role_id },
        { where: { id: testUser.id } }
      );

      // Token still has student role, but database has convener
      const response = await request(app)
        .post('/v1/api/auth/refresh-token')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.error).toBe(false);
      expect(response.body.role_changed).toBe(true);
      expect(response.body.previous_role).toBe('student');
      expect(response.body.user.role).toBe('convener');
      expect(response.body.message).toContain('Role updated from student to convener');

      // Verify new token has correct role
      const newToken = response.body.token;
      const decoded = JwtService.verifyAccessToken(newToken, process.env.JWT_SECRET);
      expect(decoded.role).toBe('convener');
      expect(decoded.permissions).toBeInstanceOf(Array);
      expect(decoded.permissions.length).toBeGreaterThan(0);
    });

    it('should return 401 when token is missing', async () => {
      const response = await request(app)
        .post('/v1/api/auth/refresh-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 when token is invalid', async () => {
      const response = await request(app)
        .post('/v1/api/auth/refresh-token')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('TOKEN_EXPIRED');
    });

    it('should return 404 when user is not found', async () => {
      // Create token for non-existent user
      const fakeToken = JwtService.createAccessToken(
        {
          user_id: 99999,
          email: 'fake@example.com',
          role: 'student',
          permissions: []
        },
        24 * 60 * 60 * 1000,
        process.env.JWT_SECRET
      );

      const response = await request(app)
        .post('/v1/api/auth/refresh-token')
        .set('Authorization', `Bearer ${fakeToken}`)
        .expect(404);

      expect(response.body.error).toBe(true);
      expect(response.body.message).toContain('User not found');
    });

    it('should include updated permissions in refreshed token', async () => {
      // Change to convener role which has more permissions
      await db.user_role_assignments.update(
        { status: 'inactive' },
        { where: { user_id: testUser.id, status: 'active' } }
      );

      await db.user_role_assignments.create({
        user_id: testUser.id,
        role_id: convenerRole.role_id,
        assigned_by: testUser.id,
        assigned_at: new Date(),
        effective_from: new Date(),
        status: 'active'
      });

      await db.users.update(
        { role_id: convenerRole.role_id },
        { where: { id: testUser.id } }
      );

      const response = await request(app)
        .post('/v1/api/auth/refresh-token')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.user.permissions).toBeInstanceOf(Array);
      
      // Convener should have more permissions than student
      const convenerPermissions = response.body.user.permissions;
      expect(convenerPermissions.length).toBeGreaterThan(2);
      
      // Verify token contains permissions
      const newToken = response.body.token;
      const decoded = JwtService.verifyAccessToken(newToken, process.env.JWT_SECRET);
      expect(decoded.permissions).toEqual(convenerPermissions);
    });
  });

  describe('Role Conflict Detection Scenarios', () => {
    it('should handle role upgrade (student to convener)', async () => {
      // Upgrade user to convener
      await db.user_role_assignments.update(
        { status: 'inactive' },
        { where: { user_id: testUser.id, status: 'active' } }
      );

      await db.user_role_assignments.create({
        user_id: testUser.id,
        role_id: convenerRole.role_id,
        assigned_by: testUser.id,
        assigned_at: new Date(),
        effective_from: new Date(),
        status: 'active'
      });

      await db.users.update(
        { role_id: convenerRole.role_id },
        { where: { id: testUser.id } }
      );

      const response = await request(app)
        .post('/v1/api/auth/refresh-token')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.role_changed).toBe(true);
      expect(response.body.previous_role).toBe('student');
      expect(response.body.user.role).toBe('convener');
    });

    it('should handle role downgrade (convener to student)', async () => {
      // First set user as convener
      await db.user_role_assignments.update(
        { status: 'inactive' },
        { where: { user_id: testUser.id, status: 'active' } }
      );

      await db.user_role_assignments.create({
        user_id: testUser.id,
        role_id: convenerRole.role_id,
        assigned_by: testUser.id,
        assigned_at: new Date(),
        effective_from: new Date(),
        status: 'active'
      });

      await db.users.update(
        { role_id: convenerRole.role_id },
        { where: { id: testUser.id } }
      );

      // Create token with convener role
      const convenerToken = JwtService.createAccessToken(
        {
          user_id: testUser.id,
          email: testUser.email,
          role: 'convener',
          permissions: ['create_programme', 'manage_cohorts']
        },
        24 * 60 * 60 * 1000,
        process.env.JWT_SECRET
      );

      // Now downgrade back to student
      await db.user_role_assignments.update(
        { status: 'inactive' },
        { where: { user_id: testUser.id, status: 'active' } }
      );

      await db.user_role_assignments.create({
        user_id: testUser.id,
        role_id: studentRole.role_id,
        assigned_by: testUser.id,
        assigned_at: new Date(),
        effective_from: new Date(),
        status: 'active'
      });

      await db.users.update(
        { role_id: studentRole.role_id },
        { where: { id: testUser.id } }
      );

      const response = await request(app)
        .post('/v1/api/auth/refresh-token')
        .set('Authorization', `Bearer ${convenerToken}`)
        .expect(200);

      expect(response.body.role_changed).toBe(true);
      expect(response.body.previous_role).toBe('convener');
      expect(response.body.user.role).toBe('student');
      
      // Verify permissions were reduced
      expect(response.body.user.permissions.length).toBeLessThan(5);
    });
  });
});
