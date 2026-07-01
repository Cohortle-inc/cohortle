/**
 * Property-Based Test: Access Control Enforcement
 * Feature: role-validation-assignment-logic
 * Property 3: Access Control Enforcement
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 6.2, 6.3**
 * 
 * For any user attempting to perform an action or access a resource, the system must validate
 * that the user has the required role, and must return a "403 Forbidden" error with a clear
 * message if the user lacks the required role.
 */

const fc = require('fast-check');
const db = require('../../models');
const RoleValidationService = require('../../services/RoleValidationService');
const RoleAssignmentService = require('../../services/RoleAssignmentService');
const {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestData,
  createTestUser,
} = require('../helpers/testSetup');

describe('Feature: role-validation-assignment-logic, Property 3: Access Control Enforcement', () => {
  let adminUserId;
  let roleValidationService;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await setupTestDatabase();

    // Create an admin user for test setup
    adminUserId = await createTestUser();
    await RoleAssignmentService.assignRole(adminUserId, 'administrator', null);

    roleValidationService = new RoleValidationService();
  });

  afterAll(async () => {
    await cleanupTestData('user_role_assignments', { user_id: adminUserId });
    await cleanupTestData('role_assignment_history', { user_id: adminUserId });
    await cleanupTestData('users', { id: adminUserId });
    await teardownTestDatabase();
  });

  it('should validate user roles before allowing access to convener dashboard', async () => {
    // Arbitrary for generating users with different roles
    const userRoleArb = fc.constantFrom('student', 'convener', 'administrator');

    const createdUserIds = [];

    await fc.assert(
      fc.asyncProperty(
        userRoleArb,
        async (userRole) => {
          // Create a test user with the specified role
          const userId = await createTestUser();
          createdUserIds.push(userId);

          await RoleAssignmentService.assignRole(userId, userRole, adminUserId);

          // Attempt to access convener dashboard
          const result = await roleValidationService.canPerformAction(
            userId,
            'access_convener_dashboard'
          );

          // Only convener and administrator should be allowed
          const shouldBeAllowed = userRole === 'convener' || userRole === 'administrator';

          expect(result.allowed).toBe(shouldBeAllowed);

          if (!shouldBeAllowed) {
            // Should return error with clear message
            expect(result.error).toBeDefined();
            expect(result.error.message).toContain('Insufficient permissions');
            expect(result.error.code).toBe('ROLE_REQUIRED');
          }
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

  it('should validate user roles before allowing programme creation', async () => {
    const userRoleArb = fc.constantFrom('student', 'convener', 'administrator');

    const createdUserIds = [];

    await fc.assert(
      fc.asyncProperty(
        userRoleArb,
        async (userRole) => {
          // Create a test user with the specified role
          const userId = await createTestUser();
          createdUserIds.push(userId);

          await RoleAssignmentService.assignRole(userId, userRole, adminUserId);

          // Attempt to create a programme
          const result = await roleValidationService.canPerformAction(
            userId,
            'create_programme'
          );

          // Only convener and administrator should be allowed
          const shouldBeAllowed = userRole === 'convener' || userRole === 'administrator';

          expect(result.allowed).toBe(shouldBeAllowed);

          if (!shouldBeAllowed) {
            // Should return error with clear message
            expect(result.error).toBeDefined();
            expect(result.error.message).toContain('Insufficient permissions');
            expect(result.error.code).toBe('ROLE_REQUIRED');
          }
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

  it('should validate user roles before allowing cohort enrollment', async () => {
    const userRoleArb = fc.constantFrom('student', 'convener', 'administrator');

    const createdUserIds = [];

    await fc.assert(
      fc.asyncProperty(
        userRoleArb,
        async (userRole) => {
          // Create a test user with the specified role
          const userId = await createTestUser();
          createdUserIds.push(userId);

          await RoleAssignmentService.assignRole(userId, userRole, adminUserId);

          // Attempt to enroll in a programme
          const result = await roleValidationService.canPerformAction(
            userId,
            'enroll_in_programme'
          );

          // All roles should be allowed to enroll (students, conveners, admins)
          expect(result.allowed).toBe(true);
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

  it('should validate user roles before allowing system settings modification', async () => {
    const userRoleArb = fc.constantFrom('student', 'convener', 'administrator');

    const createdUserIds = [];

    await fc.assert(
      fc.asyncProperty(
        userRoleArb,
        async (userRole) => {
          // Create a test user with the specified role
          const userId = await createTestUser();
          createdUserIds.push(userId);

          await RoleAssignmentService.assignRole(userId, userRole, adminUserId);

          // Attempt to modify system settings
          const result = await roleValidationService.canPerformAction(
            userId,
            'modify_system_settings'
          );

          // Only administrator should be allowed
          const shouldBeAllowed = userRole === 'administrator';

          expect(result.allowed).toBe(shouldBeAllowed);

          if (!shouldBeAllowed) {
            // Should return error with clear message
            expect(result.error).toBeDefined();
            expect(result.error.message).toContain('Insufficient permissions');
            expect(result.error.code).toBe('ROLE_REQUIRED');
          }
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

  it('should return clear error messages for unauthorized actions', async () => {
    const actionArb = fc.constantFrom(
      'access_convener_dashboard',
      'create_programme',
      'modify_system_settings',
      'manage_users'
    );

    const createdUserIds = [];

    await fc.assert(
      fc.asyncProperty(
        actionArb,
        async (action) => {
          // Create a student user (lowest privilege)
          const userId = await createTestUser();
          createdUserIds.push(userId);

          await RoleAssignmentService.assignRole(userId, 'student', adminUserId);

          // Attempt the action
          const result = await roleValidationService.canPerformAction(userId, action);

          // Student should not be allowed for these actions
          if (action !== 'enroll_in_programme') {
            expect(result.allowed).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error.message).toBeDefined();
            expect(result.error.code).toBe('ROLE_REQUIRED');
            
            // Error message should be clear and informative
            expect(result.error.message).toMatch(/Insufficient permissions|Required role/i);
          }
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

  it('should enforce role-based access control consistently across all actions', async () => {
    // Test all combinations of roles and actions
    const roleActionArb = fc.record({
      role: fc.constantFrom('student', 'convener', 'administrator'),
      action: fc.constantFrom(
        'access_convener_dashboard',
        'create_programme',
        'enroll_in_programme',
        'modify_system_settings',
        'manage_users',
        'manage_cohorts',
        'manage_lessons'
      )
    });

    const createdUserIds = [];

    await fc.assert(
      fc.asyncProperty(
        roleActionArb,
        async ({ role, action }) => {
          // Create a test user with the specified role
          const userId = await createTestUser();
          createdUserIds.push(userId);

          await RoleAssignmentService.assignRole(userId, role, adminUserId);

          // Attempt the action
          const result = await roleValidationService.canPerformAction(userId, action);

          // Define expected access based on role and action
          const accessMatrix = {
            'student': {
              'access_convener_dashboard': false,
              'create_programme': false,
              'enroll_in_programme': true,
              'modify_system_settings': false,
              'manage_users': false,
              'manage_cohorts': false,
              'manage_lessons': false
            },
            'convener': {
              'access_convener_dashboard': true,
              'create_programme': true,
              'enroll_in_programme': true,
              'modify_system_settings': false,
              'manage_users': false,
              'manage_cohorts': true,
              'manage_lessons': true
            },
            'administrator': {
              'access_convener_dashboard': true,
              'create_programme': true,
              'enroll_in_programme': true,
              'modify_system_settings': true,
              'manage_users': true,
              'manage_cohorts': true,
              'manage_lessons': true
            }
          };

          const expectedAllowed = accessMatrix[role][action];

          expect(result.allowed).toBe(expectedAllowed);

          if (!expectedAllowed) {
            // Should return error with clear message
            expect(result.error).toBeDefined();
            expect(result.error.code).toBe('ROLE_REQUIRED');
          }
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

  it('should validate resource-level access when resource is provided', async () => {
    const roleArb = fc.constantFrom('student', 'convener', 'administrator');
    const resourceArb = fc.record({
      type: fc.constantFrom('programme', 'cohort', 'lesson'),
      id: fc.integer({ min: 1, max: 1000 })
    });

    const createdUserIds = [];

    await fc.assert(
      fc.asyncProperty(
        roleArb,
        resourceArb,
        async (role, resource) => {
          // Create a test user with the specified role
          const userId = await createTestUser();
          createdUserIds.push(userId);

          await RoleAssignmentService.assignRole(userId, role, adminUserId);

          // Attempt to access resource
          const result = await roleValidationService.canPerformAction(
            userId,
            'manage_cohorts',
            resource
          );

          // Students should never be allowed to manage cohorts
          if (role === 'student') {
            expect(result.allowed).toBe(false);
            expect(result.error).toBeDefined();
          }

          // Result should be consistent (either allowed or denied with error)
          if (!result.allowed) {
            expect(result.error).toBeDefined();
            expect(result.error.code).toMatch(/ROLE_REQUIRED|RESOURCE_ACCESS_DENIED/);
          }
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

  it('should handle invalid or missing user IDs gracefully', async () => {
    const invalidUserIdArb = fc.oneof(
      fc.constant(null),
      fc.constant(undefined),
      fc.constant(0),
      fc.constant(-1),
      fc.integer({ min: 999999, max: 9999999 }) // Non-existent user ID
    );

    const actionArb = fc.constantFrom(
      'access_convener_dashboard',
      'create_programme',
      'modify_system_settings'
    );

    await fc.assert(
      fc.asyncProperty(
        invalidUserIdArb,
        actionArb,
        async (userId, action) => {
          // Attempt action with invalid user ID
          const result = await roleValidationService.canPerformAction(userId, action);

          // Should deny access
          expect(result.allowed).toBe(false);
          expect(result.error).toBeDefined();
          
          // Should have appropriate error code
          expect(result.error.code).toMatch(/INVALID_REQUEST|ROLE_REQUIRED/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle unknown actions gracefully', async () => {
    const unknownActionArb = fc.oneof(
      fc.constant('unknown_action'),
      fc.constant('invalid_action'),
      fc.constant(''),
      fc.string({ minLength: 1, maxLength: 50 }).filter(s => 
        !['access_convener_dashboard', 'create_programme', 'enroll_in_programme', 
          'modify_system_settings', 'manage_users'].includes(s)
      )
    );

    const createdUserIds = [];

    await fc.assert(
      fc.asyncProperty(
        unknownActionArb,
        async (action) => {
          // Create a test user
          const userId = await createTestUser();
          createdUserIds.push(userId);

          await RoleAssignmentService.assignRole(userId, 'administrator', adminUserId);

          // Attempt unknown action
          const result = await roleValidationService.canPerformAction(userId, action);

          // Should deny access for unknown actions
          expect(result.allowed).toBe(false);
          expect(result.error).toBeDefined();
          expect(result.error.code).toMatch(/UNKNOWN_ACTION|INVALID_REQUEST/);
        }
      ),
      { numRuns: 50 }
    );

    // Cleanup
    for (const userId of createdUserIds) {
      await cleanupTestData('user_role_assignments', { user_id: userId });
      await cleanupTestData('role_assignment_history', { user_id: userId });
      await cleanupTestData('users', { id: userId });
    }
  });

  it('should maintain consistent access control across multiple sequential checks', async () => {
    const roleArb = fc.constantFrom('student', 'convener', 'administrator');
    const actionsArb = fc.array(
      fc.constantFrom(
        'access_convener_dashboard',
        'create_programme',
        'enroll_in_programme',
        'modify_system_settings'
      ),
      { minLength: 2, maxLength: 5 }
    );

    const createdUserIds = [];

    await fc.assert(
      fc.asyncProperty(
        roleArb,
        actionsArb,
        async (role, actions) => {
          // Create a test user with the specified role
          const userId = await createTestUser();
          createdUserIds.push(userId);

          await RoleAssignmentService.assignRole(userId, role, adminUserId);

          // Perform multiple checks for the same action
          const results = [];
          for (const action of actions) {
            const result = await roleValidationService.canPerformAction(userId, action);
            results.push({ action, result });
          }

          // Check each action twice to ensure consistency
          for (const { action, result } of results) {
            const secondCheck = await roleValidationService.canPerformAction(userId, action);
            
            // Results should be consistent
            expect(secondCheck.allowed).toBe(result.allowed);
            
            if (!result.allowed) {
              expect(secondCheck.error).toBeDefined();
              expect(secondCheck.error.code).toBe(result.error.code);
            }
          }
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
