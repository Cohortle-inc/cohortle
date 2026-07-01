/**
 * Property-Based Test: Role Assignment Validation
 * Feature: role-validation-assignment-logic
 * Property 2: Role Assignment Validation
 * 
 * **Validates: Requirements 2.1, 2.3, 2.4, 2.5**
 * 
 * For any user registration attempt, the system must assign a role that is appropriate
 * for the registration context, and must reject invalid role assignment parameters with
 * clear error messages. All new users must receive the Learner role by default, and
 * enrollment codes must NOT affect role assignment.
 */

const fc = require('fast-check');
const db = require('../../models');
const RoleAssignmentService = require('../../services/RoleAssignmentService');
const RoleValidationService = require('../../services/RoleValidationService');
const {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestData,
  createTestUser,
} = require('../helpers/testSetup');

describe('Feature: role-validation-assignment-logic, Property 2: Role Assignment Validation', () => {
  let adminUserId;

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

  it('should assign Learner role by default to all new user registrations', async () => {
    const createdUserIds = [];

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          firstName: fc.string({ minLength: 1, maxLength: 50 }),
          lastName: fc.string({ minLength: 1, maxLength: 50 })
        }),
        async (userData) => {
          // Create a new user (simulating registration)
          const userId = await createTestUser();
          createdUserIds.push(userId);

          // Assign default role (this simulates what happens during registration)
          const assignResult = await RoleAssignmentService.assignRole(
            userId,
            'student', // Default role for all new users
            null // No admin assigned it (automatic assignment)
          );

          // Verify assignment succeeded
          expect(assignResult.success).toBe(true);
          expect(assignResult.assignment).toBeDefined();
          expect(assignResult.assignment.role.name).toBe('student');

          // Verify user has Learner role
          const userRole = await RoleValidationService.getUserRole(userId);
          expect(userRole).toBe('student');

          // Verify user record has correct role_id
          const user = await db.users.findByPk(userId, {
            include: [{
              model: db.roles,
              as: 'role'
            }]
          });

          expect(user).toBeDefined();
          expect(user.role).toBeDefined();
          expect(user.role.name).toBe('student');

          // Verify assignment is active
          const activeAssignment = await db.user_role_assignments.findOne({
            where: {
              user_id: userId,
              status: 'active'
            },
            include: [{
              model: db.roles,
              as: 'role'
            }]
          });

          expect(activeAssignment).toBeDefined();
          expect(activeAssignment.role.name).toBe('student');
        }
      ),
      { numRuns: 100 }
    );

    // Cleanup
    for (const userId of createdUserIds) {
      await cleanupTestData('user_role_assignments', { user_id: userId });
      await cleanupTestData('role_assignment_history', { user_id: userId });
      await cleanupTestData('users', { id: userId });
    }
  });

  it('should create persistent learner identity that can accumulate programme history', async () => {
    const createdUserIds = [];

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // Number of role changes
        async (numChanges) => {
          // Create a new user
          const userId = await createTestUser();
          createdUserIds.push(userId);

          // Assign initial Learner role
          await RoleAssignmentService.assignRole(userId, 'student', null);

          // Simulate role changes (e.g., upgrade to Convener and back)
          const roles = ['student', 'convener'];
          for (let i = 0; i < numChanges; i++) {
            const targetRole = roles[i % roles.length];
            await RoleAssignmentService.updateUserRole(
              userId,
              targetRole,
              adminUserId,
              { reason: `Test change ${i + 1}` }
            );
          }

          // Verify user still exists with persistent identity
          const user = await db.users.findByPk(userId);
          expect(user).toBeDefined();
          expect(user.id).toBe(userId);

          // Verify complete history is preserved
          const historyResult = await RoleAssignmentService.getRoleAssignmentHistory(userId);
          expect(historyResult.success).toBe(true);
          expect(historyResult.history.length).toBeGreaterThanOrEqual(numChanges + 1); // Initial + changes

          // Verify all history records reference the same user
          historyResult.history.forEach(record => {
            expect(record.user_id).toBe(userId);
          });

          // Verify learner identity persists even if role changed to Convener
          const currentRole = await RoleValidationService.getUserRole(userId);
          expect(['student', 'convener']).toContain(currentRole);

          // Verify user can still be identified by their original user_id
          const userById = await db.users.findByPk(userId);
          expect(userById).toBeDefined();
          expect(userById.id).toBe(userId);
        }
      ),
      { numRuns: 100 }
    );

    // Cleanup
    for (const userId of createdUserIds) {
      await cleanupTestData('user_role_assignments', { user_id: userId });
      await cleanupTestData('role_assignment_history', { user_id: userId });
      await cleanupTestData('users', { id: userId });
    }
  });

  it('should reject invalid role assignment parameters with clear error messages', async () => {
    const createdUserIds = [];

    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined),
          fc.constant(''),
          fc.constant('invalid_role'),
          fc.constant('STUDENT'), // Wrong case
          fc.constant('learner'), // Wrong name (should be 'student')
          fc.constant(123), // Wrong type
          fc.constant({}) // Wrong type
        ),
        async (invalidRole) => {
          // Create a test user
          const userId = await createTestUser();
          createdUserIds.push(userId);

          // Try to assign invalid role
          const result = await RoleAssignmentService.assignRole(
            userId,
            invalidRole,
            adminUserId
          );

          // Should fail with clear error
          expect(result.success).toBe(false);
          expect(result.code).toBeDefined();
          expect(result.message).toBeDefined();
          expect(typeof result.message).toBe('string');
          expect(result.message.length).toBeGreaterThan(0);

          // Verify user has no active role assignment
          const activeAssignment = await db.user_role_assignments.findOne({
            where: {
              user_id: userId,
              status: 'active'
            }
          });

          expect(activeAssignment).toBeNull();

          // Verify user role is null or undefined
          const userRole = await RoleValidationService.getUserRole(userId);
          expect(userRole).toBeNull();
        }
      ),
      { numRuns: 100 }
    );

    // Cleanup
    for (const userId of createdUserIds) {
      await cleanupTestData('user_role_assignments', { user_id: userId });
      await cleanupTestData('role_assignment_history', { user_id: userId });
      await cleanupTestData('users', { id: userId });
    }
  });

  it('should reject role assignment attempts with invalid user IDs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined),
          fc.constant(0),
          fc.constant(-1),
          fc.integer({ min: 999999, max: 9999999 }), // Non-existent user ID
          fc.constant('not_a_number'),
          fc.constant({})
        ),
        async (invalidUserId) => {
          // Try to assign role to invalid user
          const result = await RoleAssignmentService.assignRole(
            invalidUserId,
            'student',
            adminUserId
          );

          // Should fail with clear error
          expect(result.success).toBe(false);
          expect(result.code).toBeDefined();
          expect(result.message).toBeDefined();
          expect(typeof result.message).toBe('string');
          expect(result.message.length).toBeGreaterThan(0);

          // Error should indicate user-related issue
          expect(
            result.code === 'USER_NOT_FOUND' ||
            result.code === 'INVALID_USER_ID' ||
            result.message.toLowerCase().includes('user')
          ).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should ensure enrollment codes do not affect role assignment', async () => {
    const createdUserIds = [];

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          enrollmentCode: fc.oneof(
            fc.string({ minLength: 6, maxLength: 12 }),
            fc.hexaString({ minLength: 8, maxLength: 16 }),
            fc.constant('CONVENER_CODE'),
            fc.constant('ADMIN_CODE'),
            fc.constant('SPECIAL_ROLE_CODE')
          )
        }),
        async ({ enrollmentCode }) => {
          // Create a new user
          const userId = await createTestUser();
          createdUserIds.push(userId);

          // Assign default Learner role (enrollment code should not affect this)
          const assignResult = await RoleAssignmentService.assignRole(
            userId,
            'student',
            null,
            { enrollmentCode } // Pass enrollment code in metadata
          );

          // Verify assignment succeeded with Learner role
          expect(assignResult.success).toBe(true);
          expect(assignResult.assignment.role.name).toBe('student');

          // Verify user has Learner role (not affected by enrollment code)
          const userRole = await RoleValidationService.getUserRole(userId);
          expect(userRole).toBe('student');

          // Verify enrollment code did not grant elevated privileges
          const user = await db.users.findByPk(userId, {
            include: [{
              model: db.roles,
              as: 'role'
            }]
          });

          expect(user.role.name).toBe('student');
          expect(user.role.name).not.toBe('convener');
          expect(user.role.name).not.toBe('administrator');

          // Verify assignment history shows Learner role assignment
          const historyResult = await RoleAssignmentService.getRoleAssignmentHistory(userId);
          expect(historyResult.success).toBe(true);
          expect(historyResult.history.length).toBeGreaterThanOrEqual(1);
          expect(historyResult.history[0].new_role.name).toBe('student');
        }
      ),
      { numRuns: 100 }
    );

    // Cleanup
    for (const userId of createdUserIds) {
      await cleanupTestData('user_role_assignments', { user_id: userId });
      await cleanupTestData('role_assignment_history', { user_id: userId });
      await cleanupTestData('users', { id: userId });
    }
  });

  it('should validate that only administrators can assign non-Learner roles', async () => {
    const createdUserIds = [];

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('convener', 'administrator'),
        async (elevatedRole) => {
          // Create a new user
          const userId = await createTestUser();
          createdUserIds.push(userId);

          // Create a non-admin user
          const nonAdminId = await createTestUser();
          createdUserIds.push(nonAdminId);
          await RoleAssignmentService.assignRole(nonAdminId, 'student', adminUserId);

          // Try to assign elevated role without admin (should fail)
          const nonAdminResult = await RoleAssignmentService.assignRole(
            userId,
            elevatedRole,
            nonAdminId
          );

          // Should fail because non-admin cannot assign elevated roles
          expect(nonAdminResult.success).toBe(false);
          expect(nonAdminResult.code).toBeDefined();

          // Try to assign elevated role with admin (should succeed)
          const adminResult = await RoleAssignmentService.assignRole(
            userId,
            elevatedRole,
            adminUserId
          );

          // Should succeed because admin can assign any role
          expect(adminResult.success).toBe(true);
          expect(adminResult.assignment.role.name).toBe(elevatedRole);

          // Verify user has the elevated role
          const userRole = await RoleValidationService.getUserRole(userId);
          expect(userRole).toBe(elevatedRole);
        }
      ),
      { numRuns: 100 }
    );

    // Cleanup
    for (const userId of createdUserIds) {
      await cleanupTestData('user_role_assignments', { user_id: userId });
      await cleanupTestData('role_assignment_history', { user_id: userId });
      await cleanupTestData('users', { id: userId });
    }
  });

  it('should maintain referential integrity during role assignment', async () => {
    const createdUserIds = [];

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('student', 'convener', 'administrator'),
        async (roleName) => {
          // Create a new user
          const userId = await createTestUser();
          createdUserIds.push(userId);

          // Assign role
          const assignResult = await RoleAssignmentService.assignRole(
            userId,
            roleName,
            adminUserId
          );

          expect(assignResult.success).toBe(true);

          // Verify user record references valid role
          const user = await db.users.findByPk(userId, {
            include: [{
              model: db.roles,
              as: 'role'
            }]
          });

          expect(user).toBeDefined();
          expect(user.role_id).toBeDefined();
          expect(user.role).toBeDefined();
          expect(user.role.role_id).toBe(user.role_id);
          expect(user.role.name).toBe(roleName);

          // Verify assignment record references valid role
          const assignment = await db.user_role_assignments.findOne({
            where: {
              user_id: userId,
              status: 'active'
            },
            include: [{
              model: db.roles,
              as: 'role'
            }]
          });

          expect(assignment).toBeDefined();
          expect(assignment.role_id).toBe(user.role_id);
          expect(assignment.role).toBeDefined();
          expect(assignment.role.name).toBe(roleName);

          // Verify history record references valid role
          const history = await db.role_assignment_history.findOne({
            where: {
              user_id: userId,
              new_role_id: user.role_id
            },
            include: [{
              model: db.roles,
              as: 'new_role'
            }]
          });

          expect(history).toBeDefined();
          expect(history.new_role).toBeDefined();
          expect(history.new_role.name).toBe(roleName);
        }
      ),
      { numRuns: 100 }
    );

    // Cleanup
    for (const userId of createdUserIds) {
      await cleanupTestData('user_role_assignments', { user_id: userId });
      await cleanupTestData('role_assignment_history', { user_id: userId });
      await cleanupTestData('users', { id: userId });
    }
  });
});
