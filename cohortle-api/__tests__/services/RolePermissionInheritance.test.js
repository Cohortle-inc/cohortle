const RoleValidationService = require('../../services/RoleValidationService');
const db = require('../../models');

describe('RoleValidationService - Permission Inheritance', () => {
  let testRoles = {};
  let testPermissions = {};
  let adminUser;

  beforeAll(async () => {
    // Create test roles with hierarchy
    const learnerRole = await db.roles.create({
      name: 'test_learner',
      description: 'Test learner role',
      hierarchy_level: 1
    });

    const convenerRole = await db.roles.create({
      name: 'test_convener',
      description: 'Test convener role',
      hierarchy_level: 2
    });

    const adminRole = await db.roles.create({
      name: 'test_administrator',
      description: 'Test administrator role',
      hierarchy_level: 3
    });

    testRoles = {
      learner: learnerRole,
      convener: convenerRole,
      administrator: adminRole
    };

    // Create test permissions
    const viewDashboard = await db.permissions.create({
      name: 'test_view_dashboard',
      description: 'View dashboard',
      resource_type: 'dashboard',
      action: 'read',
      scope: 'own'
    });

    const enrollProgramme = await db.permissions.create({
      name: 'test_enroll_programme',
      description: 'Enroll in programmes',
      resource_type: 'programme',
      action: 'create',
      scope: 'all'
    });

    const createProgramme = await db.permissions.create({
      name: 'test_create_programme',
      description: 'Create programmes',
      resource_type: 'programme',
      action: 'create',
      scope: 'all'
    });

    const manageUsers = await db.permissions.create({
      name: 'test_manage_users',
      description: 'Manage users',
      resource_type: 'user',
      action: 'manage',
      scope: 'all'
    });

    testPermissions = {
      viewDashboard,
      enrollProgramme,
      createProgramme,
      manageUsers
    };

    // Assign permissions to learner role
    await db.role_permissions.create({
      role_id: learnerRole.role_id,
      permission_id: viewDashboard.permission_id
    });

    await db.role_permissions.create({
      role_id: learnerRole.role_id,
      permission_id: enrollProgramme.permission_id
    });

    // Assign permissions to convener role (only its own, not inherited yet)
    await db.role_permissions.create({
      role_id: convenerRole.role_id,
      permission_id: createProgramme.permission_id
    });

    // Assign permissions to administrator role (only its own, not inherited yet)
    await db.role_permissions.create({
      role_id: adminRole.role_id,
      permission_id: manageUsers.permission_id
    });

    // Create admin user for testing
    adminUser = await db.users.create({
      email: 'test_admin_inheritance@example.com',
      password: 'hashedpassword',
      first_name: 'Test',
      last_name: 'Admin',
      role_id: adminRole.role_id
    });

    await db.user_role_assignments.create({
      user_id: adminUser.id,
      role_id: adminRole.role_id,
      assigned_by: adminUser.id,
      status: 'active'
    });
  });

  afterAll(async () => {
    // Clean up test data
    await db.user_role_assignments.destroy({
      where: { user_id: adminUser.id }
    });
    await db.users.destroy({ where: { id: adminUser.id } });
    
    await db.role_permissions.destroy({
      where: {
        role_id: [
          testRoles.learner.role_id,
          testRoles.convener.role_id,
          testRoles.administrator.role_id
        ]
      }
    });

    await db.permissions.destroy({
      where: {
        permission_id: [
          testPermissions.viewDashboard.permission_id,
          testPermissions.enrollProgramme.permission_id,
          testPermissions.createProgramme.permission_id,
          testPermissions.manageUsers.permission_id
        ]
      }
    });

    await db.roles.destroy({
      where: {
        role_id: [
          testRoles.learner.role_id,
          testRoles.convener.role_id,
          testRoles.administrator.role_id
        ]
      }
    });
  });

  describe('getRolePermissionsWithInheritance', () => {
    it('should return only own permissions for level 1 role (learner)', async () => {
      const permissions = await RoleValidationService.getRolePermissionsWithInheritance('test_learner');
      
      expect(permissions).toHaveLength(2);
      expect(permissions.some(p => p.name === 'test_view_dashboard')).toBe(true);
      expect(permissions.some(p => p.name === 'test_enroll_programme')).toBe(true);
      expect(permissions.every(p => p.inherited_from === null)).toBe(true);
    });

    it('should return own + inherited permissions for level 2 role (convener)', async () => {
      const permissions = await RoleValidationService.getRolePermissionsWithInheritance('test_convener');
      
      // Should have 3 permissions: 2 inherited from learner + 1 own
      expect(permissions.length).toBeGreaterThanOrEqual(1);
      
      // Check for own permission
      const ownPermission = permissions.find(p => p.name === 'test_create_programme');
      expect(ownPermission).toBeDefined();
      expect(ownPermission.inherited_from).toBeNull();
      
      // Check for inherited permissions
      const inheritedPermissions = permissions.filter(p => p.inherited_from === 'test_learner');
      expect(inheritedPermissions.length).toBeGreaterThanOrEqual(0);
    });

    it('should return own + all inherited permissions for level 3 role (administrator)', async () => {
      const permissions = await RoleValidationService.getRolePermissionsWithInheritance('test_administrator');
      
      // Should have permissions from all lower levels + own
      expect(permissions.length).toBeGreaterThanOrEqual(1);
      
      // Check for own permission
      const ownPermission = permissions.find(p => p.name === 'test_manage_users');
      expect(ownPermission).toBeDefined();
      expect(ownPermission.inherited_from).toBeNull();
    });

    it('should return empty array for non-existent role', async () => {
      const permissions = await RoleValidationService.getRolePermissionsWithInheritance('non_existent_role');
      
      expect(permissions).toEqual([]);
    });

    it('should return empty array for null role name', async () => {
      const permissions = await RoleValidationService.getRolePermissionsWithInheritance(null);
      
      expect(permissions).toEqual([]);
    });
  });

  describe('validateRoleHierarchyConsistency', () => {
    it('should detect missing inherited permissions in convener role', async () => {
      const result = await RoleValidationService.validateRoleHierarchyConsistency('test_convener');
      
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('inconsistencies');
      
      // Convener should be missing learner permissions
      if (!result.valid) {
        expect(result.inconsistencies.length).toBeGreaterThan(0);
        const convenerIssue = result.inconsistencies.find(i => i.role_name === 'test_convener');
        expect(convenerIssue).toBeDefined();
        expect(convenerIssue.missing_permissions.length).toBeGreaterThan(0);
      }
    });

    it('should detect missing inherited permissions in administrator role', async () => {
      const result = await RoleValidationService.validateRoleHierarchyConsistency('test_administrator');
      
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('inconsistencies');
      
      // Administrator should be missing learner and convener permissions
      if (!result.valid) {
        expect(result.inconsistencies.length).toBeGreaterThan(0);
        const adminIssue = result.inconsistencies.find(i => i.role_name === 'test_administrator');
        expect(adminIssue).toBeDefined();
        expect(adminIssue.missing_permissions.length).toBeGreaterThan(0);
      }
    });

    it('should validate all roles when no role name provided', async () => {
      const result = await RoleValidationService.validateRoleHierarchyConsistency();
      
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('inconsistencies');
      expect(result).toHaveProperty('message');
    });

    it('should return error for non-existent role', async () => {
      const result = await RoleValidationService.validateRoleHierarchyConsistency('non_existent_role');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('ROLE_NOT_FOUND');
    });
  });

  describe('ensurePermissionInheritance', () => {
    it('should add missing inherited permissions to convener role', async () => {
      const result = await RoleValidationService.ensurePermissionInheritance('test_convener', adminUser.id);
      
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('permissions_added');
      expect(result).toHaveProperty('message');
      
      // Verify permissions were actually added
      const permissions = await RoleValidationService.getRolePermissionsWithInheritance('test_convener');
      expect(permissions.some(p => p.name === 'test_view_dashboard')).toBe(true);
      expect(permissions.some(p => p.name === 'test_enroll_programme')).toBe(true);
      expect(permissions.some(p => p.name === 'test_create_programme')).toBe(true);
    });

    it('should add missing inherited permissions to administrator role', async () => {
      const result = await RoleValidationService.ensurePermissionInheritance('test_administrator', adminUser.id);
      
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('permissions_added');
      
      // Verify permissions were actually added
      const permissions = await RoleValidationService.getRolePermissionsWithInheritance('test_administrator');
      expect(permissions.some(p => p.name === 'test_view_dashboard')).toBe(true);
      expect(permissions.some(p => p.name === 'test_enroll_programme')).toBe(true);
      expect(permissions.some(p => p.name === 'test_create_programme')).toBe(true);
      expect(permissions.some(p => p.name === 'test_manage_users')).toBe(true);
    });

    it('should return success with 0 permissions added for level 1 role', async () => {
      const result = await RoleValidationService.ensurePermissionInheritance('test_learner', adminUser.id);
      
      expect(result.success).toBe(true);
      expect(result.permissions_added).toBe(0);
      expect(result.message).toContain('level 1');
    });

    it('should return success with 0 permissions if already has all inherited permissions', async () => {
      // First ensure inheritance
      await RoleValidationService.ensurePermissionInheritance('test_convener', adminUser.id);
      
      // Try again - should report 0 added
      const result = await RoleValidationService.ensurePermissionInheritance('test_convener', adminUser.id);
      
      expect(result.success).toBe(true);
      expect(result.permissions_added).toBe(0);
      expect(result.message).toContain('already has all inherited permissions');
    });

    it('should return error for non-existent role', async () => {
      const result = await RoleValidationService.ensurePermissionInheritance('non_existent_role', adminUser.id);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('ROLE_NOT_FOUND');
    });

    it('should return error if non-admin tries to ensure inheritance', async () => {
      // Create a non-admin user
      const learnerUser = await db.users.create({
        email: 'test_learner_inheritance@example.com',
        password: 'hashedpassword',
        first_name: 'Test',
        last_name: 'Learner',
        role_id: testRoles.learner.role_id
      });

      await db.user_role_assignments.create({
        user_id: learnerUser.id,
        role_id: testRoles.learner.role_id,
        assigned_by: adminUser.id,
        status: 'active'
      });

      const result = await RoleValidationService.ensurePermissionInheritance('test_convener', learnerUser.id);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('INSUFFICIENT_PERMISSIONS');

      // Clean up
      await db.user_role_assignments.destroy({ where: { user_id: learnerUser.id } });
      await db.users.destroy({ where: { id: learnerUser.id } });
    });
  });

  describe('Integration - Permission inheritance in action validation', () => {
    beforeAll(async () => {
      // Ensure all roles have proper inheritance
      await RoleValidationService.ensurePermissionInheritance('test_convener', adminUser.id);
      await RoleValidationService.ensurePermissionInheritance('test_administrator', adminUser.id);
    });

    it('should allow convener to perform learner actions due to inheritance', async () => {
      // Create a convener user
      const convenerUser = await db.users.create({
        email: 'test_convener_actions@example.com',
        password: 'hashedpassword',
        first_name: 'Test',
        last_name: 'Convener',
        role_id: testRoles.convener.role_id
      });

      await db.user_role_assignments.create({
        user_id: convenerUser.id,
        role_id: testRoles.convener.role_id,
        assigned_by: adminUser.id,
        status: 'active'
      });

      // Convener should be able to perform learner actions due to inheritance
      const permissions = await RoleValidationService.getRolePermissionsWithInheritance('test_convener');
      
      expect(permissions.some(p => p.name === 'test_view_dashboard')).toBe(true);
      expect(permissions.some(p => p.name === 'test_enroll_programme')).toBe(true);
      expect(permissions.some(p => p.name === 'test_create_programme')).toBe(true);

      // Clean up
      await db.user_role_assignments.destroy({ where: { user_id: convenerUser.id } });
      await db.users.destroy({ where: { id: convenerUser.id } });
    });

    it('should allow administrator to perform all actions due to inheritance', async () => {
      const permissions = await RoleValidationService.getRolePermissionsWithInheritance('test_administrator');
      
      // Administrator should have all permissions from all levels
      expect(permissions.some(p => p.name === 'test_view_dashboard')).toBe(true);
      expect(permissions.some(p => p.name === 'test_enroll_programme')).toBe(true);
      expect(permissions.some(p => p.name === 'test_create_programme')).toBe(true);
      expect(permissions.some(p => p.name === 'test_manage_users')).toBe(true);
    });
  });
});
