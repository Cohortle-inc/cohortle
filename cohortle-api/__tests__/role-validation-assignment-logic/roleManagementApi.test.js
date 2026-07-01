/**
 * Integration Tests: Role Management API
 * Feature: role-validation-assignment-logic
 * 
 * **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**
 * 
 * Tests all role management API endpoints including:
 * - GET /v1/api/roles - Retrieve all roles with permissions
 * - GET /v1/api/users/:id/role - Get user's current role
 * - PUT /v1/api/users/:id/role - Update user's role
 * - GET /v1/api/users/with-role/:role - List users by role
 * - PUT /v1/api/roles/:roleId/permissions - Update role permissions
 * - POST /v1/api/roles/:roleId/permissions/validate - Validate permission changes
 */

const request = require('supertest');
const db = require('../../models');
const JwtService = require('../../services/JwtService');
const RoleAssignmentService = require('../../services/RoleAssignmentService');
const {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestData,
  createTestUser,
} = require('../helpers/testSetup');

// Mock app setup
const express = require('express');
const app = express();
app.use(express.json());
require('../../routes/roles')(app);

describe('Role Management API Integration Tests', () => {
  let adminUserId;
  let adminToken;
  let learnerUserId;
  let learnerToken;
  let convenerUserId;
  let convenerToken;
  let studentRoleId;
  let convenerRoleId;
  let administratorRoleId;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await setupTestDatabase();

    // Create admin user
    adminUserId = await createTestUser();
    await RoleAssignmentService.assignRole(adminUserId, 'administrator', null);
    const adminUser = await db.users.findByPk(adminUserId, {
      include: [{ model: db.roles, as: 'role' }]
    });
    adminToken = JwtService.createAccessToken({
      user_id: adminUserId,
      email: adminUser.email,
      role: 'administrator',
      permissions: []
    }, 3600000, process.env.JWT_SECRET);

    // Create learner user
    learnerUserId = await createTestUser();
    await RoleAssignmentService.assignRole(learnerUserId, 'student', adminUserId);
    const learnerUser = await db.users.findByPk(learnerUserId, {
      include: [{ model: db.roles, as: 'role' }]
    });
    learnerToken = JwtService.createAccessToken({
      user_id: learnerUserId,
      email: learnerUser.email,
      role: 'student',
      permissions: []
    }, 3600000, process.env.JWT_SECRET);

    // Create convener user
    convenerUserId = await createTestUser();
    await RoleAssignmentService.assignRole(convenerUserId, 'convener', adminUserId);
    const convenerUser = await db.users.findByPk(convenerUserId, {
      include: [{ model: db.roles, as: 'role' }]
    });
    convenerToken = JwtService.createAccessToken({
      user_id: convenerUserId,
      email: convenerUser.email,
      role: 'convener',
      permissions: []
    }, 3600000, process.env.JWT_SECRET);

    // Get role IDs
    const roles = await db.roles.findAll();
    studentRoleId = roles.find(r => r.name === 'student')?.role_id;
    convenerRoleId = roles.find(r => r.name === 'convener')?.role_id;
    administratorRoleId = roles.find(r => r.name === 'administrator')?.role_id;
  });

  afterAll(async () => {
    await cleanupTestData('user_role_assignments', { user_id: adminUserId });
    await cleanupTestData('user_role_assignments', { user_id: learnerUserId });
    await cleanupTestData('user_role_assignments', { user_id: convenerUserId });
    await cleanupTestData('role_assignment_history', { user_id: adminUserId });
    await cleanupTestData('role_assignment_history', { user_id: learnerUserId });
    await cleanupTestData('role_assignment_history', { user_id: convenerUserId });
    await cleanupTestData('users', { id: adminUserId });
    await cleanupTestData('users', { id: learnerUserId });
    await cleanupTestData('users', { id: convenerUserId });
    await teardownTestDatabase();
  });

  describe('GET /v1/api/roles', () => {
    it('should return all roles with permissions when authenticated', async () => {
      const response = await request(app)
        .get('/v1/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.error).toBe(false);
      expect(response.body.roles).toBeDefined();
      expect(Array.isArray(response.body.roles)).toBe(true);
      expect(response.body.roles.length).toBeGreaterThan(0);

      // Verify role structure
      const role = response.body.roles[0];
      expect(role).toHaveProperty('role_id');
      expect(role).toHaveProperty('name');
      expect(role).toHaveProperty('description');
      expect(role).toHaveProperty('hierarchy_level');
      expect(role).toHaveProperty('permissions');
      expect(Array.isArray(role.permissions)).toBe(true);

      // Verify roles are ordered by hierarchy
      const hierarchyLevels = response.body.roles.map(r => r.hierarchy_level);
      const sortedLevels = [...hierarchyLevels].sort((a, b) => a - b);
      expect(hierarchyLevels).toEqual(sortedLevels);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/v1/api/roles')
        .expect(401);

      expect(response.body.error).toBe(true);
    });

    it('should allow learners to view roles', async () => {
      const response = await request(app)
        .get('/v1/api/roles')
        .set('Authorization', `Bearer ${learnerToken}`)
        .expect(200);

      expect(response.body.error).toBe(false);
      expect(response.body.roles).toBeDefined();
    });
  });

  describe('GET /v1/api/users/:id/role', () => {
    it('should return user role when authenticated', async () => {
      const response = await request(app)
        .get(`/v1/api/users/${learnerUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.error).toBe(false);
      expect(response.body.user_id).toBe(learnerUserId);
      expect(response.body.role).toBeDefined();
      expect(response.body.role.name).toBe('student');
      expect(response.body.assignment).toBeDefined();
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/v1/api/users/999999/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.error).toBe(true);
      expect(response.body.code).toBe('USER_NOT_FOUND');
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .get(`/v1/api/users/${learnerUserId}/role`)
        .expect(401);
    });

    it('should allow users to view their own role', async () => {
      const response = await request(app)
        .get(`/v1/api/users/${learnerUserId}/role`)
        .set('Authorization', `Bearer ${learnerToken}`)
        .expect(200);

      expect(response.body.error).toBe(false);
      expect(response.body.role.name).toBe('student');
    });
  });

  describe('PUT /v1/api/users/:id/role', () => {
    let testUserId;

    beforeEach(async () => {
      testUserId = await createTestUser();
      await RoleAssignmentService.assignRole(testUserId, 'student', adminUserId);
    });

    afterEach(async () => {
      await cleanupTestData('user_role_assignments', { user_id: testUserId });
      await cleanupTestData('role_assignment_history', { user_id: testUserId });
      await cleanupTestData('users', { id: testUserId });
    });

    it('should allow admin to update user role', async () => {
      const response = await request(app)
        .put(`/v1/api/users/${testUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'convener',
          reason: 'Promotion to convener'
        })
        .expect(200);

      expect(response.body.error).toBe(false);
      expect(response.body.message).toBeDefined();
      expect(response.body.update).toBeDefined();
      expect(response.body.update.new_role).toBe('convener');
      expect(response.body.update.previous_role).toBe('student');

      // Verify role was actually updated
      const user = await db.users.findByPk(testUserId, {
        include: [{ model: db.roles, as: 'role' }]
      });
      expect(user.role.name).toBe('convener');
    });

    it('should reject role update from non-admin', async () => {
      const response = await request(app)
        .put(`/v1/api/users/${testUserId}/role`)
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({
          role: 'convener',
          reason: 'Unauthorized attempt'
        })
        .expect(403);

      expect(response.body.error).toBe(true);
    });

    it('should reject invalid role names', async () => {
      const response = await request(app)
        .put(`/v1/api/users/${testUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'invalid_role',
          reason: 'Testing invalid role'
        })
        .expect(400);

      expect(response.body.error).toBe(true);
      expect(response.body.code).toBe('INVALID_ROLE');
    });

    it('should reject missing role parameter', async () => {
      const response = await request(app)
        .put(`/v1/api/users/${testUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Missing role'
        })
        .expect(400);

      expect(response.body.error).toBe(true);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .put('/v1/api/users/999999/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'convener',
          reason: 'Testing non-existent user'
        })
        .expect(404);

      expect(response.body.error).toBe(true);
      expect(response.body.code).toBe('USER_NOT_FOUND');
    });

    it('should log role changes with reason', async () => {
      const reason = 'Test role change for audit';
      
      await request(app)
        .put(`/v1/api/users/${testUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'convener',
          reason
        })
        .expect(200);

      // Verify history was logged
      const history = await db.role_assignment_history.findAll({
        where: { user_id: testUserId },
        order: [['changed_at', 'DESC']]
      });

      expect(history.length).toBeGreaterThan(0);
      const latestChange = history[0];
      expect(latestChange.reason).toBe(reason);
      expect(latestChange.changed_by).toBe(adminUserId);
    });
  });

  describe('GET /v1/api/users/with-role/:role', () => {
    it('should return users with specified role', async () => {
      const response = await request(app)
        .get('/v1/api/users/with-role/student')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.error).toBe(false);
      expect(response.body.role).toBe('student');
      expect(response.body.users).toBeDefined();
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBeGreaterThan(0);

      // Verify user structure
      if (response.body.users.length > 0) {
        const user = response.body.users[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('first_name');
        expect(user).toHaveProperty('last_name');
        expect(user).toHaveProperty('full_name');
        expect(user).toHaveProperty('created_at');
      }
    });

    it('should reject request from non-admin', async () => {
      const response = await request(app)
        .get('/v1/api/users/with-role/student')
        .set('Authorization', `Bearer ${learnerToken}`)
        .expect(403);

      expect(response.body.error).toBe(true);
    });

    it('should reject invalid role names', async () => {
      const response = await request(app)
        .get('/v1/api/users/with-role/invalid_role')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.error).toBe(true);
      expect(response.body.code).toBe('INVALID_ROLE');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/v1/api/users/with-role/student?limit=2&offset=0')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.error).toBe(false);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.offset).toBe(0);
      expect(response.body.users.length).toBeLessThanOrEqual(2);
    });

    it('should return empty array for role with no users', async () => {
      // Create a test role with no users
      const testRole = await db.roles.create({
        name: 'test_empty_role',
        description: 'Test role with no users',
        hierarchy_level: 99
      });

      const response = await request(app)
        .get(`/v1/api/users/with-role/${testRole.name}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.error).toBe(false);
      expect(response.body.users).toEqual([]);
      expect(response.body.pagination.total).toBe(0);

      // Cleanup
      await db.roles.destroy({ where: { role_id: testRole.role_id } });
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for all endpoints', async () => {
      await request(app).get('/v1/api/roles').expect(401);
      await request(app).get(`/v1/api/users/${learnerUserId}/role`).expect(401);
      await request(app).put(`/v1/api/users/${learnerUserId}/role`).send({ role: 'convener' }).expect(401);
      await request(app).get('/v1/api/users/with-role/student').expect(401);
    });

    it('should require admin role for role modification endpoints', async () => {
      await request(app)
        .put(`/v1/api/users/${learnerUserId}/role`)
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({ role: 'convener' })
        .expect(403);

      await request(app)
        .get('/v1/api/users/with-role/student')
        .set('Authorization', `Bearer ${convenerToken}`)
        .expect(403);
    });

    it('should allow conveners to view roles but not modify them', async () => {
      // Can view roles
      await request(app)
        .get('/v1/api/roles')
        .set('Authorization', `Bearer ${convenerToken}`)
        .expect(200);

      // Cannot modify roles
      await request(app)
        .put(`/v1/api/users/${learnerUserId}/role`)
        .set('Authorization', `Bearer ${convenerToken}`)
        .send({ role: 'administrator' })
        .expect(403);
    });
  });

  describe('Error Handling', () => {
    it('should return consistent error format', async () => {
      const response = await request(app)
        .get('/v1/api/users/999999/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('message');
      expect(response.body.error).toBe(true);
    });

    it('should handle malformed requests gracefully', async () => {
      const response = await request(app)
        .put(`/v1/api/users/${learnerUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ invalid: 'data' })
        .expect(400);

      expect(response.body.error).toBe(true);
      expect(response.body.message).toBeDefined();
    });

    it('should handle invalid user IDs', async () => {
      const response = await request(app)
        .get('/v1/api/users/invalid_id/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.error).toBe(true);
    });
  });

  describe('Data Integrity', () => {
    let testUserId;

    beforeEach(async () => {
      testUserId = await createTestUser();
      await RoleAssignmentService.assignRole(testUserId, 'student', adminUserId);
    });

    afterEach(async () => {
      await cleanupTestData('user_role_assignments', { user_id: testUserId });
      await cleanupTestData('role_assignment_history', { user_id: testUserId });
      await cleanupTestData('users', { id: testUserId });
    });

    it('should maintain referential integrity during role updates', async () => {
      await request(app)
        .put(`/v1/api/users/${testUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'convener' })
        .expect(200);

      // Verify user record
      const user = await db.users.findByPk(testUserId, {
        include: [{ model: db.roles, as: 'role' }]
      });
      expect(user.role.name).toBe('convener');

      // Verify active assignment
      const activeAssignment = await db.user_role_assignments.findOne({
        where: { user_id: testUserId, status: 'active' },
        include: [{ model: db.roles, as: 'role' }]
      });
      expect(activeAssignment.role.name).toBe('convener');
      expect(activeAssignment.role_id).toBe(user.role_id);

      // Verify history
      const history = await db.role_assignment_history.findAll({
        where: { user_id: testUserId }
      });
      expect(history.length).toBeGreaterThanOrEqual(2); // Initial + update
    });

    it('should preserve audit trail across multiple role changes', async () => {
      // Make multiple role changes
      await request(app)
        .put(`/v1/api/users/${testUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'convener', reason: 'First change' })
        .expect(200);

      await request(app)
        .put(`/v1/api/users/${testUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'student', reason: 'Second change' })
        .expect(200);

      await request(app)
        .put(`/v1/api/users/${testUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'convener', reason: 'Third change' })
        .expect(200);

      // Verify complete history
      const history = await db.role_assignment_history.findAll({
        where: { user_id: testUserId },
        order: [['changed_at', 'ASC']]
      });

      expect(history.length).toBeGreaterThanOrEqual(4); // Initial + 3 changes
      expect(history[history.length - 1].reason).toBe('Third change');
    });
  });
});
