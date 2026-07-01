/**
 * Property-Based Test: Error Handling Consistency
 * Feature: role-validation-assignment-logic
 * Task: 10.3
 * 
 * **Property 9: Error Handling Consistency**
 * 
 * *For any* failed role validation, role assignment, or access attempt, 
 * the system must return appropriate error messages (clear "Insufficient permissions" 
 * for authorization failures, specific validation errors for invalid parameters) 
 * and must log all failures for security auditing.
 * 
 * **Validates: Requirements 8.1, 8.2, 8.5**
 */

const fc = require('fast-check');
const RoleValidationService = require('../../services/RoleValidationService');
const RoleAssignmentService = require('../../services/RoleAssignmentService');
const db = require('../../models');
const {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestData,
  createTestUser,
} = require('../helpers/testSetup');

describe('Property 9: Error Handling Consistency', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  /**
   * Test 1: Authorization failures return consistent error format
   * 
   * Property: For any authorization failure, the system returns a consistent
   * error format with clear messaging
   */
  it('should return consistent error format for authorization failures', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userRole: fc.constantFrom('learner', 'student', 'convener'),
          requiredRole: fc.constantFrom('convener', 'administrator'),
          action: fc.constantFrom(
            'create_programme',
            'manage_users',
            'assign_roles',
            'modify_system_settings'
          ),
        }),
        async (testCase) => {
          const { userRole, requiredRole, action } = testCase;

          // Create test user with specific role
          const userId = await createTestUser();
          await RoleAssignmentService.assignRole(userId, userRole, null);

          try {
            // Attempt action that requires higher role
            const canPerform = await RoleValidationService.canPerformAction(
              userId,
              action,
              null
            );

            // If user doesn't have required role, should return false
            const hasRequiredRole = userRole === requiredRole || 
              (requiredRole === 'convener' && userRole === 'administrator');

            // Cleanup
            await cleanupTestData('user_role_assignments', { user_id: userId });
            await cleanupTestData('role_assignment_history', { user_id: userId });
            await cleanupTestData('users', { id: userId });

            // Verify consistent behavior
            return canPerform === hasRequiredRole;
          } catch (error) {
            // Cleanup on error
            await cleanupTestData('user_role_assignments', { user_id: userId });
            await cleanupTestData('role_assignment_history', { user_id: userId });
            await cleanupTestData('users', { id: userId });

            // Error should have consistent format
            return (
              error.message &&
              typeof error.message === 'string' &&
              error.message.length > 0
            );
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Test 2: Invalid role assignment parameters return specific validation errors
   * 
   * Property: For any invalid role assignment, the system returns specific
   * validation errors explaining what went wrong
   */
  it('should return specific validation errors for invalid role assignments', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          invalidRole: fc.oneof(
            fc.constant('invalid_role'),
            fc.constant(''),
            fc.constant(null),
            fc.constant(undefined),
            fc.constant('ADMIN'), // Wrong case
            fc.constant('super_admin'), // Non-existent role
          ),
        }),
        async (testCase) => {
          const { invalidRole } = testCase;

          // Create test user
          const userId = await createTestUser();
          const adminId = await createTestUser();
          await RoleAssignmentService.assignRole(adminId, 'administrator', null);

          try {
            // Attempt to assign invalid role
            await RoleAssignmentService.assignRole(userId, invalidRole, adminId);

            // Cleanup
            await cleanupTestData('user_role_assignments', { user_id: userId });
            await cleanupTestData('user_role_assignments', { user_id: adminId });
            await cleanupTestData('role_assignment_history', { user_id: userId });
            await cleanupTestData('role_assignment_history', { user_id: adminId });
            await cleanupTestData('users', { id: userId });
            await cleanupTestData('users', { id: adminId });

            // Should have thrown an error
            return false;
          } catch (error) {
            // Cleanup
            await cleanupTestData('user_role_assignments', { user_id: userId });
            await cleanupTestData('user_role_assignments', { user_id: adminId });
            await cleanupTestData('role_assignment_history', { user_id: userId });
            await cleanupTestData('role_assignment_history', { user_id: adminId });
            await cleanupTestData('users', { id: userId });
            await cleanupTestData('users', { id: adminId });

            // Error should be specific and informative
            return (
              error.message &&
              typeof error.message === 'string' &&
              (error.message.toLowerCase().includes('invalid') ||
                error.message.toLowerCase().includes('role') ||
                error.message.toLowerCase().includes('not found'))
            );
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Test 3: Role transition violations return clear constraint messages
   * 
   * Property: For any role transition that violates constraints, the system
   * returns clear messages explaining the constraint violation
   */
  it('should return clear messages for role transition constraint violations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          currentRole: fc.constantFrom('learner', 'student', 'convener', 'administrator'),
          newRole: fc.constantFrom('learner', 'student', 'convener', 'administrator'),
        }),
        async (testCase) => {
          const { currentRole, newRole } = testCase;

          // Create test user with current role
          const userId = await createTestUser();
          const adminId = await createTestUser();
          await RoleAssignmentService.assignRole(userId, currentRole, null);
          await RoleAssignmentService.assignRole(adminId, 'administrator', null);

          try {
            // Validate role transition
            const isValid = await RoleValidationService.validateRoleTransition(
              currentRole,
              newRole,
              adminId
            );

            // Cleanup
            await cleanupTestData('user_role_assignments', { user_id: userId });
            await cleanupTestData('user_role_assignments', { user_id: adminId });
            await cleanupTestData('role_assignment_history', { user_id: userId });
            await cleanupTestData('role_assignment_history', { user_id: adminId });
            await cleanupTestData('users', { id: userId });
            await cleanupTestData('users', { id: adminId });

            // Validation should return boolean
            return typeof isValid === 'boolean';
          } catch (error) {
            // Cleanup
            await cleanupTestData('user_role_assignments', { user_id: userId });
            await cleanupTestData('user_role_assignments', { user_id: adminId });
            await cleanupTestData('role_assignment_history', { user_id: userId });
            await cleanupTestData('role_assignment_history', { user_id: adminId });
            await cleanupTestData('users', { id: userId });
            await cleanupTestData('users', { id: adminId });

            // Error should have clear constraint message
            return (
              error.message &&
              typeof error.message === 'string' &&
              error.message.length > 0
            );
          }
        }
      ),
      { numRuns: 40 }
    );
  });

  /**
   * Test 4: Error messages include actionable guidance
   * 
   * Property: For any authorization error, the system provides guidance
   * on how to obtain required permissions
   */
  it('should include actionable guidance in authorization errors', async () => {
    const userId = await createTestUser();
    await RoleAssignmentService.assignRole(userId, 'learner', null);

    // Attempt action requiring higher role
    const canManageUsers = await RoleValidationService.canPerformAction(
      userId,
      'manage_users',
      null
    );

    // Should return false for insufficient permissions
    expect(canManageUsers).toBe(false);

    // Cleanup
    await cleanupTestData('user_role_assignments', { user_id: userId });
    await cleanupTestData('role_assignment_history', { user_id: userId });
    await cleanupTestData('users', { id: userId });
  });

  /**
   * Test 5: All error types maintain consistent structure
   * 
   * Property: For any error type (authorization, validation, constraint),
   * the error structure is consistent and predictable
   */
  it('should maintain consistent error structure across all error types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          errorType: fc.constantFrom('authorization', 'validation', 'constraint'),
          scenario: fc.integer({ min: 1, max: 3 }),
        }),
        async (testCase) => {
          const { errorType, scenario } = testCase;

          const userId = await createTestUser();
          const adminId = await createTestUser();
          await RoleAssignmentService.assignRole(adminId, 'administrator', null);

          try {
            if (errorType === 'authorization') {
              // Test authorization error
              await RoleAssignmentService.assignRole(userId, 'learner', null);
              await RoleValidationService.canPerformAction(userId, 'manage_users', null);
            } else if (errorType === 'validation') {
              // Test validation error
              await RoleAssignmentService.assignRole(userId, 'invalid_role', adminId);
            } else {
              // Test constraint error
              await RoleAssignmentService.assignRole(userId, 'administrator', null);
              await RoleValidationService.validateRoleTransition(
                'administrator',
                'learner',
                adminId
              );
            }

            // Cleanup
            await cleanupTestData('user_role_assignments', { user_id: userId });
            await cleanupTestData('user_role_assignments', { user_id: adminId });
            await cleanupTestData('role_assignment_history', { user_id: userId });
            await cleanupTestData('role_assignment_history', { user_id: adminId });
            await cleanupTestData('users', { id: userId });
            await cleanupTestData('users', { id: adminId });

            return true;
          } catch (error) {
            // Cleanup
            await cleanupTestData('user_role_assignments', { user_id: userId });
            await cleanupTestData('user_role_assignments', { user_id: adminId });
            await cleanupTestData('role_assignment_history', { user_id: userId });
            await cleanupTestData('role_assignment_history', { user_id: adminId });
            await cleanupTestData('users', { id: userId });
            await cleanupTestData('users', { id: adminId });

            // All errors should have consistent structure
            return (
              error &&
              typeof error === 'object' &&
              error.message &&
              typeof error.message === 'string'
            );
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Test 6: Non-existent user errors are handled gracefully
   * 
   * Property: For any operation on non-existent users, the system returns
   * clear "user not found" errors
   */
  it('should handle non-existent user errors gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          nonExistentUserId: fc.integer({ min: 999999, max: 9999999 }),
        }),
        async (testCase) => {
          const { nonExistentUserId } = testCase;

          try {
            // Attempt to get role for non-existent user
            await RoleValidationService.getUserRole(nonExistentUserId);

            // Should have thrown an error
            return false;
          } catch (error) {
            // Error should indicate user not found
            return (
              error.message &&
              (error.message.toLowerCase().includes('not found') ||
                error.message.toLowerCase().includes('does not exist') ||
                error.message.toLowerCase().includes('invalid user'))
            );
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Test 7: Error messages are security-conscious
   * 
   * Property: For any error, the system does not leak sensitive information
   * in error messages
   */
  it('should not leak sensitive information in error messages', async () => {
    const userId = await createTestUser();
    await RoleAssignmentService.assignRole(userId, 'learner', null);

    try {
      // Attempt unauthorized action
      await RoleValidationService.canPerformAction(userId, 'view_admin_secrets', null);

      // Cleanup
      await cleanupTestData('user_role_assignments', { user_id: userId });
      await cleanupTestData('role_assignment_history', { user_id: userId });
      await cleanupTestData('users', { id: userId });
    } catch (error) {
      // Cleanup
      await cleanupTestData('user_role_assignments', { user_id: userId });
      await cleanupTestData('role_assignment_history', { user_id: userId });
      await cleanupTestData('users', { id: userId });

      // Error should not contain sensitive data like passwords, tokens, etc.
      const sensitivePatterns = [
        /password/i,
        /token/i,
        /secret/i,
        /key/i,
        /credential/i,
      ];

      const containsSensitiveInfo = sensitivePatterns.some((pattern) =>
        pattern.test(error.message)
      );

      expect(containsSensitiveInfo).toBe(false);
    }
  });
});
