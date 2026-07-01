/**
 * Property-Based Test: Role Transition Integrity
 * Feature: role-validation-assignment-logic
 * Property 4: Role Transition Integrity
 * 
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
 * 
 * For any role change attempt, the system must validate that the administrator has permission
 * to make the change, must properly revoke old permissions and grant new ones, must log the
 * change with complete audit information, and must reject changes that would leave the system
 * without any administrators.
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

describe('Feature: role-validation-assignment-logic, Property 4: Role Transition Integrity', () => {
  let adminUserId;
  let studentRoleId;
  let convenerRoleId;
  let administratorRoleId;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await setupTestDatabase();

    // Create an admin user for making role changes
    adminUserId = await createTestUser();
    
    // Assign administrator role to the test user
    const adminRole = await db.roles.findOne({ where: { name: 'administrator' } });
    await RoleAssignmentService.assignRole(adminUserId, 'administrator', null);

    // Get role IDs
    const roles = await db.roles.findAll();
    studentRoleId = roles.find(r => r.name === 'student')?.role_id;
    convenerRoleId = roles.find(r => r.name === 'convener')?.role_id;
    administratorRoleId = roles.find(r => r.name === 'administrator')?.role_id;
  });

  afterAll(async () => {
    await cleanupTestData('user_role_assignments', { user_id: adminUserId });
    await cleanupTestData('role_assignment_history', { user_id: adminUserId });
    await cleanupTestData('users', { id: adminUserId });
    await teardownTestDatabase();
  });

  it('should validate administrator permissions before allowing role changes', async () => {
    // Arbitrary for generating test users with different roles
    const userRoleArb = fc.constantFrom('student', 'convener');
    const targetRoleArb = fc.constantFrom('student', 'convener', 'administrator');

    const createdUserIds = [];

    await fc.assert(
      fc.asyncProperty(
        userRoleArb,
        targetRoleArb,
        async (initialRole, targetRole) => {
          // Create a test user
          const userId = await createTestUser();
          createdUserIds.push(userId);

          // Assign initial role
          await RoleAssignmentService.assignRole(userId, initialRole, adminUserId);

          // Try to update role using admin (should succeed)
          const adminResult = await RoleAssignmentService.updateUserRole(
            userId,
            targetRole,
            adminUserId,
            { reason: 'Property test role change' }
          );

          // Admin should be able to change roles
          if (initialRole !== targetRole) {
            expect(adminResult.success).toBe(true);
            expect(adminResult.update.new_role).toBe(targetRole);
            expect(adminResult.update.previous_role).toBe(initialRole);
          } else {
            // Same role should fail
            expect(adminResult.success).toBe(false);
            expect(adminResult.code).toBe('ROLE_UNCHANGED');
          }

          // Create a non-admin user
          const nonAdminUserId = await createTestUser();
          createdUserIds.push(nonAdminUserId);

          await RoleAssignmentService.assignRole(nonAdminUserId, 'student', adminUserId);

          // Try to update role using non-admin (should fail)
          const nonAdminResult = await RoleAssignmentService.updateUserRole(
            userId,
            'convener',
            nonAdminUserId,
            { reason: 'Unauthorized attempt' }
          );

          // Non-admin should not be able to change roles
          expect(nonAdminResult.success).toBe(false);
          expect(nonAdminResult.code).toBe('INVALID_TRANSITION');
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

  it('should properly revoke old permissions and grant new ones during role transition', async () => {
    const roleTransitionArb = fc.tuple(
      fc.constantFrom('student', 'convener'),
      fc.constantFrom('student', 'convener', 'administrator')
    ).filter(([from, to]) => from !== to);

    const createdUserIds = [];

    await fc.assert(
      fc.asyncProperty(
        roleTransitionArb,
        async ([fromRole, toRole]) => {
          // Create a test user
          const userId = await createTestUser();
          createdUserIds.push(userId);

          // Assign initial role
          const assignResult = await RoleAssignmentService.assignRole(
            userId,
            fromRole,
            adminUserId
          );
          expect(assignResult.success).toBe(true);

          // Get initial role
          const initialRole = await RoleValidationService.getUserRole(userId);
          expect(initialRole).toBe(fromRole);

          // Update to new role
          const updateResult = await RoleAssignmentService.updateUserRole(
            userId,
            toRole,
            adminUserId,
            { reason: 'Property test transition' }
          );

          expect(updateResult.success).toBe(true);
          expect(updateResult.update.previous_role).toBe(fromRole);
          expect(updateResult.update.new_role).toBe(toRole);

          // Verify new role is active
          const newRole = await RoleValidationService.getUserRole(userId);
          expect(newRole).toBe(toRole);

          // Verify old role assignment is inactive
          const oldAssignments = await db.user_role_assignments.findAll({
            where: {
              user_id: userId,
              status: 'inactive'
            },
            include: [{
              model: db.roles,
              as: 'role'
            }]
          });

          expect(oldAssignments.length).toBeGreaterThan(0);
          expect(oldAssignments.some(a => a.role.name === fromRole)).toBe(true);

          // Verify new role assignment is active
          const activeAssignments = await db.user_role_assignments.findAll({
            where: {
              user_id: userId,
              status: 'active'
            },
            include: [{
              model: db.roles,
              as: 'role'
            }]
          });

          expect(activeAssignments.length).toBe(1);
          expect(activeAssignments[0].role.name).toBe(toRole);
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

  it('should log all role changes with complete audit information', async () => {
    const roleTransitionArb = fc.tuple(
      fc.constantFrom('student', 'convener'),
      fc.constantFrom('student', 'convener', 'administrator')
    ).filter(([from, to]) => from !== to);

    const reasonArb = fc.oneof(
      fc.constant('Promotion'),
      fc.constant('Demotion'),
      fc.constant('Role correction'),
      fc.constant('Administrative change')
    );

    const createdUserIds = [];

    await fc.assert(
      fc.asyncProperty(
        roleTransitionArb,
        reasonArb,
        async ([fromRole, toRole], reason) => {
          // Create a test user
          const userId = await createTestUser();
          createdUserIds.push(userId);

          // Assign initial role
          await RoleAssignmentService.assignRole(userId, fromRole, adminUserId);

          // Update role with reason
          const updateResult = await RoleAssignmentService.updateUserRole(
            userId,
            toRole,
            adminUserId,
            { reason }
          );

          expect(updateResult.success).toBe(true);

          // Get role assignment history
          const historyResult = await RoleAssignmentService.getRoleAssignmentHistory(userId);

          expect(historyResult.success).toBe(true);
          expect(historyResult.history.length).toBeGreaterThanOrEqual(2); // Initial + update

          // Find the update record
          const updateRecord = historyResult.history.find(
            h => h.new_role.name === toRole && h.previous_role?.name === fromRole
          );

          expect(updateRecord).toBeDefined();
          expect(updateRecord.changed_by.id).toBe(adminUserId);
          expect(updateRecord.reason).toBe(reason);
          expect(updateRecord.changed_at).toBeDefined();
          expect(updateRecord.metadata).toBeDefined();
          expect(updateRecord.metadata.assignment_type).toBe('update');
          expect(updateRecord.metadata.previous_role).toBe(fromRole);
          expect(updateRecord.metadata.new_role).toBe(toRole);
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

  it('should reject changes that would leave the system without administrators', async () => {
    const createdUserIds = [];

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('student', 'convener'),
        async (targetRole) => {
          // Count current administrators
          const adminCount = await db.user_role_assignments.count({
            where: { status: 'active' },
            include: [{
              model: db.roles,
              as: 'role',
              where: { name: 'administrator' }
            }]
          });

          // If there's only one admin (our test admin), trying to change their role should fail
          if (adminCount === 1) {
            const result = await RoleAssignmentService.updateUserRole(
              adminUserId,
              targetRole,
              adminUserId,
              { reason: 'Attempting to remove last admin' }
            );

            // Should fail because it would leave system without admins
            expect(result.success).toBe(false);
            expect(result.code).toBe('INVALID_TRANSITION');
          }

          // Create a second admin
          const secondAdminId = await createTestUser();
          createdUserIds.push(secondAdminId);

          await RoleAssignmentService.assignRole(
            secondAdminId,
            'administrator',
            adminUserId
          );

          // Now changing the first admin's role should succeed (we have a backup)
          const result = await RoleAssignmentService.updateUserRole(
            adminUserId,
            targetRole,
            secondAdminId,
            { reason: 'Safe to change with backup admin' }
          );

          expect(result.success).toBe(true);
          expect(result.update.new_role).toBe(targetRole);

          // Restore admin role for cleanup
          await RoleAssignmentService.updateUserRole(
            adminUserId,
            'administrator',
            secondAdminId,
            { reason: 'Restore for cleanup' }
          );
        }
      ),
      { numRuns: 50 } // Fewer runs since this test is more complex
    );

    // Cleanup
    for (const userId of createdUserIds) {
      await cleanupTestData('user_role_assignments', { user_id: userId });
      await cleanupTestData('role_assignment_history', { user_id: userId });
      await cleanupTestData('users', { id: userId });
    }
  });

  it('should maintain referential integrity during role transitions', async () => {
    const roleTransitionArb = fc.tuple(
      fc.constantFrom('student', 'convener'),
      fc.constantFrom('student', 'convener', 'administrator')
    ).filter(([from, to]) => from !== to);

    const createdUserIds = [];

    await fc.assert(
      fc.asyncProperty(
        roleTransitionArb,
        async ([fromRole, toRole]) => {
          // Create a test user
          const userId = await createTestUser();
          createdUserIds.push(userId);

          // Assign initial role
          await RoleAssignmentService.assignRole(userId, fromRole, adminUserId);

          // Update role
          await RoleAssignmentService.updateUserRole(
            userId,
            toRole,
            adminUserId,
            { reason: 'Integrity test' }
          );

          // Verify user record has correct role_id
          const user = await db.users.findByPk(userId, {
            include: [{
              model: db.roles,
              as: 'role'
            }]
          });

          expect(user).toBeDefined();
          expect(user.role).toBeDefined();
          expect(user.role.name).toBe(toRole);

          // Verify active assignment matches user record
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
          expect(activeAssignment.role_id).toBe(user.role_id);
          expect(activeAssignment.role.name).toBe(toRole);

          // Verify all history records reference valid roles
          const history = await db.role_assignment_history.findAll({
            where: { user_id: userId },
            include: [
              {
                model: db.roles,
                as: 'previous_role'
              },
              {
                model: db.roles,
                as: 'new_role'
              }
            ]
          });

          history.forEach(record => {
            expect(record.new_role).toBeDefined();
            expect(record.new_role.role_id).toBeDefined();
            // previous_role can be null for initial assignment
            if (record.previous_role_id) {
              expect(record.previous_role).toBeDefined();
            }
          });
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
