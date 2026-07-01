const RoleValidationService = require('../../services/RoleValidationService');
const db = require('../../models');

// Mock the database models
jest.mock('../../models', () => ({
  users: {
    findByPk: jest.fn(),
  },
  roles: {
    findOne: jest.fn(),
  },
  permissions: {
    findOne: jest.fn(),
  },
  user_role_assignments: {
    findOne: jest.fn(),
    count: jest.fn(),
  },
  enrollments: {
    findOne: jest.fn(),
  },
}));

describe('RoleValidationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserRole', () => {
    it('should return user role from user table', async () => {
      const mockUser = {
        id: 1,
        role: {
          role_id: 'role-uuid',
          name: 'student',
          hierarchy_level: 1
        }
      };

      db.users.findByPk.mockResolvedValue(mockUser);

      const result = await RoleValidationService.getUserRole(1);

      expect(result).toBe('student');
      expect(db.users.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('should return null for invalid user ID', async () => {
      const result = await RoleValidationService.getUserRole(null);
      expect(result).toBeNull();
    });

    it('should return null when user not found', async () => {
      db.users.findByPk.mockResolvedValue(null);

      const result = await RoleValidationService.getUserRole(999);

      expect(result).toBeNull();
    });

    it('should fallback to user_role_assignments when user has no role', async () => {
      db.users.findByPk.mockResolvedValue({ id: 1, role: null });
      
      const mockAssignment = {
        user_id: 1,
        status: 'active',
        role: {
          role_id: 'role-uuid',
          name: 'convener',
          hierarchy_level: 2
        }
      };

      db.user_role_assignments.findOne.mockResolvedValue(mockAssignment);

      const result = await RoleValidationService.getUserRole(1);

      expect(result).toBe('convener');
    });
  });

  describe('canPerformAction', () => {
    beforeEach(() => {
      // Mock getUserRole
      jest.spyOn(RoleValidationService, 'getUserRole');
      // Mock _getRolePermissions
      jest.spyOn(RoleValidationService, '_getRolePermissions');
    });

    it('should return false for invalid parameters', async () => {
      const result = await RoleValidationService.canPerformAction(null, 'some_action');
      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return false when user has no role', async () => {
      RoleValidationService.getUserRole.mockResolvedValue(null);

      const result = await RoleValidationService.canPerformAction(1, 'create_programme');

      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should allow convener to create programme', async () => {
      RoleValidationService.getUserRole.mockResolvedValue('convener');
      RoleValidationService._getRolePermissions.mockResolvedValue([
        { name: 'create_programme', resource_type: 'programme', scope: 'all' }
      ]);

      const result = await RoleValidationService.canPerformAction(1, 'create_programme');

      expect(result.allowed).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should deny student from creating programme', async () => {
      RoleValidationService.getUserRole.mockResolvedValue('student');
      RoleValidationService._getRolePermissions.mockResolvedValue([
        { name: 'enroll_programme', resource_type: 'programme', scope: 'all' }
      ]);

      const result = await RoleValidationService.canPerformAction(1, 'create_programme');

      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should allow administrator to access convener dashboard', async () => {
      RoleValidationService.getUserRole.mockResolvedValue('administrator');
      RoleValidationService._getRolePermissions.mockResolvedValue([
        { name: 'create_programme', resource_type: 'programme', scope: 'all' },
        { name: 'manage_users', resource_type: 'user', scope: 'all' }
      ]);

      const result = await RoleValidationService.canPerformAction(1, 'access_convener_dashboard');

      expect(result.allowed).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should return false for unknown action', async () => {
      RoleValidationService.getUserRole.mockResolvedValue('administrator');
      RoleValidationService._getRolePermissions.mockResolvedValue([
        { name: 'manage_users', resource_type: 'user', scope: 'all' }
      ]);

      const result = await RoleValidationService.canPerformAction(1, 'unknown_action');

      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateRoleTransition', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.spyOn(RoleValidationService, 'getUserRole');
      jest.spyOn(RoleValidationService, '_countActiveAdministrators');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return false for invalid parameters', async () => {
      const result = await RoleValidationService.validateRoleTransition(null, 'convener', 1);
      expect(result).toBe(false);
    });

    it('should return false when roles do not exist', async () => {
      db.roles.findOne.mockResolvedValueOnce(null);

      const result = await RoleValidationService.validateRoleTransition('student', 'invalid_role', 1);

      expect(result).toBe(false);
    });

    it('should return false when admin is not an administrator', async () => {
      db.roles.findOne
        .mockResolvedValueOnce({ role_id: 'uuid', name: 'student' })
        .mockResolvedValueOnce({ role_id: 'uuid2', name: 'convener' });
      RoleValidationService.getUserRole.mockResolvedValueOnce('student');

      const result = await RoleValidationService.validateRoleTransition('student', 'convener', 1);

      expect(result).toBe(false);
    });

    it('should allow administrator to change student to convener', async () => {
      db.roles.findOne
        .mockResolvedValueOnce({ role_id: 'uuid', name: 'student' })
        .mockResolvedValueOnce({ role_id: 'uuid2', name: 'convener' });
      RoleValidationService.getUserRole.mockResolvedValueOnce('administrator');

      const result = await RoleValidationService.validateRoleTransition('student', 'convener', 1);

      expect(result).toBe(true);
    });

    it('should prevent removing last administrator', async () => {
      db.roles.findOne
        .mockResolvedValueOnce({ role_id: 'uuid', name: 'administrator' })
        .mockResolvedValueOnce({ role_id: 'uuid2', name: 'convener' });
      RoleValidationService.getUserRole.mockResolvedValueOnce('administrator');
      RoleValidationService._countActiveAdministrators.mockResolvedValueOnce(1);

      const result = await RoleValidationService.validateRoleTransition('administrator', 'convener', 1);

      expect(result).toBe(false);
    });

    it('should allow removing administrator when multiple exist', async () => {
      db.roles.findOne
        .mockResolvedValueOnce({ role_id: 'uuid', name: 'administrator' })
        .mockResolvedValueOnce({ role_id: 'uuid2', name: 'convener' });
      RoleValidationService.getUserRole.mockResolvedValueOnce('administrator');
      RoleValidationService._countActiveAdministrators.mockResolvedValueOnce(3);

      const result = await RoleValidationService.validateRoleTransition('administrator', 'convener', 1);

      expect(result).toBe(true);
    });
  });

  describe('_getRolePermissions', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return permissions for a role', async () => {
      const mockRole = {
        role_id: 'uuid',
        name: 'student',
        permissions: [
          { name: 'view_lessons', resource_type: 'lesson', scope: 'enrolled' },
          { name: 'enroll_programme', resource_type: 'programme', scope: 'all' }
        ]
      };

      db.roles.findOne.mockResolvedValueOnce(mockRole);

      const result = await RoleValidationService._getRolePermissions('student');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('view_lessons');
    });

    it('should return empty array when role not found', async () => {
      db.roles.findOne.mockResolvedValueOnce(null);

      const result = await RoleValidationService._getRolePermissions('invalid_role');

      expect(result).toEqual([]);
    });
  });

  describe('_countActiveAdministrators', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should count active administrators', async () => {
      db.roles.findOne.mockResolvedValueOnce({ role_id: 'admin-uuid', name: 'administrator' });
      db.user_role_assignments.count.mockResolvedValueOnce(3);

      const result = await RoleValidationService._countActiveAdministrators();

      expect(result).toBe(3);
    });

    it('should return 0 when administrator role not found', async () => {
      db.roles.findOne.mockResolvedValueOnce(null);

      const result = await RoleValidationService._countActiveAdministrators();

      expect(result).toBe(0);
    });
  });

  describe('_checkEnrollment', () => {
    it('should return true when user is enrolled', async () => {
      db.enrollments.findOne.mockResolvedValue({ user_id: 1, programme_id: 1 });

      const result = await RoleValidationService._checkEnrollment(1, 1);

      expect(result).toBe(true);
    });

    it('should return false when user is not enrolled', async () => {
      db.enrollments.findOne.mockResolvedValue(null);

      const result = await RoleValidationService._checkEnrollment(1, 1);

      expect(result).toBe(false);
    });
  });

  describe('validateRoleDefinitionModification', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      // Add missing mock for permissions.findAll
      db.permissions = {
        ...db.permissions,
        findAll: jest.fn()
      };
      // Add missing mock for roles.findAll
      db.roles = {
        ...db.roles,
        findAll: jest.fn()
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return invalid for missing role ID', async () => {
      const result = await RoleValidationService.validateRoleDefinitionModification(null, []);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('INVALID_REQUEST');
    });

    it('should return invalid for non-array permissions', async () => {
      const result = await RoleValidationService.validateRoleDefinitionModification('role-uuid', 'not-an-array');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('INVALID_REQUEST');
    });

    it('should return invalid when role not found', async () => {
      db.roles.findOne.mockResolvedValue(null);

      const result = await RoleValidationService.validateRoleDefinitionModification('invalid-role-uuid', []);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('ROLE_NOT_FOUND');
    });

    it('should detect invalid permissions being added', async () => {
      const mockRole = {
        role_id: 'role-uuid',
        name: 'convener',
        hierarchy_level: 2,
        permissions: [
          { permission_id: 'perm-1', name: 'create_programme' }
        ]
      };

      db.roles.findOne.mockResolvedValue(mockRole);
      // Mock findAll to return only valid permissions (perm-2), not invalid-perm
      db.permissions.findAll.mockResolvedValue([
        { permission_id: 'perm-2', name: 'manage_cohorts' }
      ]);
      db.user_role_assignments.count.mockResolvedValue(0);
      db.roles.findAll.mockResolvedValue([]);

      const result = await RoleValidationService.validateRoleDefinitionModification(
        'role-uuid',
        ['perm-1', 'perm-2', 'invalid-perm']
      );

      expect(result.valid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('INVALID_PERMISSIONS');
      expect(result.issues[0].permissions).toContain('invalid-perm');
    });

    it('should warn about removing permissions affecting active users', async () => {
      const mockRole = {
        role_id: 'role-uuid',
        name: 'convener',
        hierarchy_level: 2,
        permissions: [
          { permission_id: 'perm-1', name: 'create_programme' },
          { permission_id: 'perm-2', name: 'manage_cohorts' }
        ]
      };

      db.roles.findOne.mockResolvedValue(mockRole);
      db.user_role_assignments.count.mockResolvedValue(5);
      db.permissions.findAll.mockResolvedValue([
        { permission_id: 'perm-2', name: 'manage_cohorts', resource_type: 'cohort', action: 'read' }
      ]);
      db.roles.findAll.mockResolvedValue([]);

      const result = await RoleValidationService.validateRoleDefinitionModification(
        'role-uuid',
        ['perm-1'] // Removing perm-2
      );

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('PERMISSION_REMOVAL');
      expect(result.warnings[0].affectedUsers).toBe(5);
    });

    it('should block removing critical permissions without allowBreakingChanges', async () => {
      const mockRole = {
        role_id: 'role-uuid',
        name: 'administrator',
        hierarchy_level: 3,
        permissions: [
          { permission_id: 'perm-1', name: 'system_settings' },
          { permission_id: 'perm-2', name: 'manage_users' }
        ]
      };

      db.roles.findOne.mockResolvedValue(mockRole);
      db.user_role_assignments.count.mockResolvedValue(2);
      db.permissions.findAll.mockResolvedValue([
        { 
          permission_id: 'perm-2', 
          name: 'manage_users', 
          description: 'Manage all users',
          resource_type: 'user', 
          action: 'manage' 
        }
      ]);
      db.roles.findAll.mockResolvedValue([]);

      const result = await RoleValidationService.validateRoleDefinitionModification(
        'role-uuid',
        ['perm-1'], // Removing critical perm-2
        { allowBreakingChanges: false }
      );

      expect(result.valid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('CRITICAL_PERMISSION_REMOVAL');
      expect(result.issues[0].affectedUsers).toBe(2);
    });

    it('should allow removing critical permissions with allowBreakingChanges', async () => {
      const mockRole = {
        role_id: 'role-uuid',
        name: 'administrator',
        hierarchy_level: 3,
        permissions: [
          { permission_id: 'perm-1', name: 'system_settings' },
          { permission_id: 'perm-2', name: 'manage_users' }
        ]
      };

      db.roles.findOne.mockResolvedValue(mockRole);
      db.user_role_assignments.count.mockResolvedValue(2);
      db.permissions.findAll.mockResolvedValue([
        { 
          permission_id: 'perm-2', 
          name: 'manage_users', 
          description: 'Manage all users',
          resource_type: 'user', 
          action: 'manage' 
        }
      ]);
      db.roles.findAll.mockResolvedValue([]);

      const result = await RoleValidationService.validateRoleDefinitionModification(
        'role-uuid',
        ['perm-1'], // Removing critical perm-2
        { allowBreakingChanges: true }
      );

      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should detect hierarchy violations when removing inherited permissions', async () => {
      const mockRole = {
        role_id: 'role-uuid',
        name: 'convener',
        hierarchy_level: 2,
        permissions: [
          { permission_id: 'perm-1', name: 'create_programme' },
          { permission_id: 'perm-2', name: 'view_lessons' }
        ]
      };

      const lowerRole = {
        role_id: 'lower-role-uuid',
        name: 'student',
        hierarchy_level: 1,
        permissions: [
          { permission_id: 'perm-2', name: 'view_lessons' }
        ]
      };

      db.roles.findOne.mockResolvedValue(mockRole);
      db.roles.findAll.mockResolvedValue([lowerRole]);
      db.user_role_assignments.count.mockResolvedValue(0);
      db.permissions.findAll.mockResolvedValue([
        { permission_id: 'perm-2', name: 'view_lessons' }
      ]);

      const result = await RoleValidationService.validateRoleDefinitionModification(
        'role-uuid',
        ['perm-1'], // Removing perm-2 which is inherited from student
        { allowBreakingChanges: false }
      );

      expect(result.valid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('HIERARCHY_VIOLATION');
      expect(result.issues[0].lowerRole).toBe('student');
    });

    it('should provide info warning when adding permissions to role with active users', async () => {
      const mockRole = {
        role_id: 'role-uuid',
        name: 'convener',
        hierarchy_level: 2,
        permissions: [
          { permission_id: 'perm-1', name: 'create_programme' }
        ]
      };

      db.roles.findOne.mockResolvedValue(mockRole);
      db.user_role_assignments.count.mockResolvedValue(10);
      db.permissions.findAll.mockResolvedValue([
        { permission_id: 'perm-2', name: 'manage_cohorts' }
      ]);
      db.roles.findAll.mockResolvedValue([]);

      const result = await RoleValidationService.validateRoleDefinitionModification(
        'role-uuid',
        ['perm-1', 'perm-2'] // Adding perm-2
      );

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('PERMISSION_ADDITION');
      expect(result.warnings[0].affectedUsers).toBe(10);
    });

    it('should return valid for safe permission modifications', async () => {
      const mockRole = {
        role_id: 'role-uuid',
        name: 'convener',
        hierarchy_level: 2,
        permissions: [
          { permission_id: 'perm-1', name: 'create_programme' }
        ]
      };

      db.roles.findOne.mockResolvedValue(mockRole);
      db.user_role_assignments.count.mockResolvedValue(0);
      db.permissions.findAll.mockResolvedValue([
        { permission_id: 'perm-2', name: 'manage_cohorts' }
      ]);
      db.roles.findAll.mockResolvedValue([]);

      const result = await RoleValidationService.validateRoleDefinitionModification(
        'role-uuid',
        ['perm-1', 'perm-2']
      );

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.impact).toBeDefined();
      expect(result.impact.role.name).toBe('convener');
    });
  });
});
