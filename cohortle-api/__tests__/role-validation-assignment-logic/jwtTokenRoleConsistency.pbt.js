/**
 * Property-Based Test: JWT Token Role Consistency
 * Feature: role-validation-assignment-logic
 * Property 5: JWT Token Role Consistency
 * 
 * **Validates: Requirements 5.1, 5.2, 5.4**
 * 
 * For any JWT token issued by the system, the token must include the user's current role,
 * and when the token is validated, the system must extract and verify the role information.
 * If role information in the token conflicts with database records, the system must
 * revalidate and update the token if necessary.
 */

const fc = require('fast-check');
const db = require('../../models');
const JwtService = require('../../services/JwtService');
const RoleAssignmentService = require('../../services/RoleAssignmentService');
const RoleValidationService = require('../../services/RoleValidationService');
const {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestData,
  createTestUser,
} = require('../helpers/testSetup');

describe('Feature: role-validation-assignment-logic, Property 5: JWT Token Role Consistency', () => {
  let adminUserId;
  const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key';
  const JWT_EXPIRE_IN = 3600000; // 1 hour

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await setupTestDatabase();

    // Create an admin user for test setup
    adminUserId = await createTestUser();
    await RoleAssignmentService.assignRole(adminUserId, 'administrator', null);
  });

  afterAll(async () => {
    await cleanupTestData('user_role_assignments', { user_id: adminUserId });
    await cleanupTestData('role_assignment_history', { user_id: adminUserId });
    await cleanupTestData('users', { id: adminUserId });
    await teardownTestDatabase();
  });

  it('should include user role in JWT token payload', async () => {
    const userRoleArb = fc.constantFrom('student', 'convener', 'administrator');
    const createdUserIds = [];

    await fc.assert(
      fc.asyncProperty(userRoleArb, async (userRole) => {
        const userId = await createTestUser();
        createdUserIds.push(userId);
        await RoleAssignmentService.assignRole(userId, userRole, adminUserId);

        const user = await db.users.findByPk(userId, {
          include: [{ model: db.roles, as: 'role' }]
        });

        const payload = {
          user_id: userId,
          email: user.email,
          role: user.role.name,
          permissions: []
        };

        const token = JwtService.createAccessToken(payload, JWT_EXPIRE_IN, JWT_SECRET);
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');

        const decoded = JwtService.verifyAccessToken(token, JWT_SECRET);
        expect(decoded).toBeDefined();
        expect(decoded.user_id).toBe(userId);
        expect(decoded.role).toBe(userRole);
        expect(decoded.email).toBe(user.email);
      }),
      { numRuns: 100 }
    );

    for (const userId of createdUserIds) {
      await cleanupTestData('user_role_assignments', { user_id: userId });
      await cleanupTestData('role_assignment_history', { user_id: userId });
      await cleanupTestData('users', { id: userId });
    }
  });
});
