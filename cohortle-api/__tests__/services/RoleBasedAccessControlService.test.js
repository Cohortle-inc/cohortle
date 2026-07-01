const RoleBasedAccessControlService = require('../../services/RoleBasedAccessControlService');
const RoleValidationService = require('../../services/RoleValidationService');
const db = require('../../models');

// Mock dependencies
jest.mock('../../models');
jest.mock('../../services/RoleValidationService');
jest.mock('../../utils/errorLogger', () => ({
  logSecurityEvent: jest.fn()
}));

describe('RoleBasedAccessControlService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('canAccessResource', () => {
    it('should return access denied for invalid input parameters', async () => {
      const result = await RoleBasedAccessControlService.canAccessResource(null, 'programme', '1', 'read');
      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('RESOURCE_ACCESS_DENIED');
    });

    it('should return access denied when user has no role', async () => {
      RoleValidationService.getUserRole.mockResolvedValue(null);

      const result = await RoleBasedAccessControlService.canAccessResource(1, 'programme', '1', 'read');
      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should return access denied when user has no permissions', async () => {
      RoleValidationService.getUserRole.mockResolvedValue('learner');
      db.roles.findOne = jest.fn().mockResolvedValue({
        permissions: []
      });

      const result = await RoleBasedAccessControlService.canAccessResource(1, 'programme', '1', 'read');
      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should return access granted when user has permission with "all" scope', async () => {
      RoleValidationService.getUserRole.mockResolvedValue('administrator');
      db.roles.findOne = jest.fn().mockResolvedValue({
        permissions: [{
          permission_id: '1',
          name: 'manage_all_content',
          resource_type: 'all',
          action: 'manage',
          scope: 'all'
        }]
      });

      const result = await RoleBasedAccessControlService.canAccessResource(1, 'programme', '1', 'read');
      expect(result.allowed).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should check ownership for "own" scope permissions', async () => {
      RoleValidationService.getUserRole.mockResolvedValue('convener');
      db.roles.findOne = jest.fn().mockResolvedValue({
        permissions: [{
          permission_id: '2',
          name: 'manage_cohorts',
          resource_type: 'cohort',
          action: 'manage',
          scope: 'own'
        }]
      });

      db.programmes.findByPk = jest.fn().mockResolvedValue({
        id: 1,
        convener_id: 1
      });

      db.cohorts.findByPk = jest.fn().mockResolvedValue({
        id: 1,
        programme_id: 1,
        programme: {
          id: 1,
          convener_id: 1
        }
      });

      const result = await RoleBasedAccessControlService.canAccessResource(1, 'cohort', '1', 'manage');
      expect(result.allowed).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should return access denied when user does not own resource with "own" scope', async () => {
      RoleValidationService.getUserRole.mockResolvedValue('convener');
      db.roles.findOne = jest.fn().mockResolvedValue({
        permissions: [{
          permission_id: '2',
          name: 'manage_cohorts',
          resource_type: 'cohort',
          action: 'manage',
          scope: 'own'
        }]
      });

      db.cohorts.findByPk = jest.fn().mockResolvedValue({
        id: 1,
        programme_id: 1,
        programme: {
          id: 1,
          convener_id: 999 // Different user
        }
      });

      const result = await RoleBasedAccessControlService.canAccessResource(1, 'cohort', '1', 'manage');
      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('RESOURCE_ACCESS_DENIED');
    });

    it('should handle errors gracefully', async () => {
      RoleValidationService.getUserRole.mockRejectedValue(new Error('Database error'));

      const result = await RoleBasedAccessControlService.canAccessResource(1, 'programme', '1', 'read');
      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('getUserPermissions', () => {
    it('should return empty array for invalid user ID', async () => {
      const result = await RoleBasedAccessControlService.getUserPermissions(null);
      expect(result).toEqual([]);
    });

    it('should return empty array when user has no role', async () => {
      RoleValidationService.getUserRole.mockResolvedValue(null);

      const result = await RoleBasedAccessControlService.getUserPermissions(1);
      expect(result).toEqual([]);
    });

    it('should return user permissions for valid user', async () => {
      RoleValidationService.getUserRole.mockResolvedValue('convener');
      db.roles.findOne = jest.fn().mockResolvedValue({
        permissions: [
          {
            permission_id: '1',
            name: 'create_programme',
            description: 'Create new programmes',
            resource_type: 'programme',
            action: 'create',
            scope: 'all'
          },
          {
            permission_id: '2',
            name: 'manage_cohorts',
            description: 'Manage programme cohorts',
            resource_type: 'cohort',
            action: 'manage',
            scope: 'own'
          }
        ]
      });

      const result = await RoleBasedAccessControlService.getUserPermissions(1);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('create_programme');
      expect(result[1].name).toBe('manage_cohorts');
    });

    it('should handle errors gracefully', async () => {
      RoleValidationService.getUserRole.mockRejectedValue(new Error('Database error'));

      const result = await RoleBasedAccessControlService.getUserPermissions(1);
      expect(result).toEqual([]);
    });
  });

  describe('validateResourceOwnership', () => {
    it('should return false for invalid input parameters', async () => {
      const result = await RoleBasedAccessControlService.validateResourceOwnership(null, 'programme', '1');
      expect(result).toBe(false);
    });

    it('should validate programme ownership correctly', async () => {
      db.programmes.findByPk = jest.fn().mockResolvedValue({
        id: 1,
        convener_id: 1
      });

      const result = await RoleBasedAccessControlService.validateResourceOwnership(1, 'programme', '1');
      expect(result).toBe(true);
    });

    it('should return false when user does not own programme', async () => {
      db.programmes.findByPk = jest.fn().mockResolvedValue({
        id: 1,
        convener_id: 999
      });

      const result = await RoleBasedAccessControlService.validateResourceOwnership(1, 'programme', '1');
      expect(result).toBe(false);
    });

    it('should validate cohort ownership through programme', async () => {
      db.cohorts.findByPk = jest.fn().mockResolvedValue({
        id: 1,
        programme_id: 1,
        programme: {
          id: 1,
          convener_id: 1
        }
      });

      const result = await RoleBasedAccessControlService.validateResourceOwnership(1, 'cohort', '1');
      expect(result).toBe(true);
    });

    it('should validate lesson ownership through programme', async () => {
      db.lessons.findByPk = jest.fn().mockResolvedValue({
        id: 1,
        week_id: 1,
        week: {
          id: 1,
          programme_id: 1,
          programme: {
            id: 1,
            convener_id: 1
          }
        }
      });

      const result = await RoleBasedAccessControlService.validateResourceOwnership(1, 'lesson', '1');
      expect(result).toBe(true);
    });

    it('should validate week ownership through programme', async () => {
      db.weeks.findByPk = jest.fn().mockResolvedValue({
        id: 1,
        programme_id: 1,
        programme: {
          id: 1,
          convener_id: 1
        }
      });

      const result = await RoleBasedAccessControlService.validateResourceOwnership(1, 'week', '1');
      expect(result).toBe(true);
    });

    it('should validate user owns their own user resource', async () => {
      const result = await RoleBasedAccessControlService.validateResourceOwnership(1, 'user', '1');
      expect(result).toBe(true);
    });

    it('should return false when user does not own user resource', async () => {
      const result = await RoleBasedAccessControlService.validateResourceOwnership(1, 'user', '999');
      expect(result).toBe(false);
    });

    it('should validate user owns their own profile', async () => {
      const result = await RoleBasedAccessControlService.validateResourceOwnership(1, 'profile', '1');
      expect(result).toBe(true);
    });

    it('should return false for unknown resource types', async () => {
      const result = await RoleBasedAccessControlService.validateResourceOwnership(1, 'unknown', '1');
      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      db.programmes.findByPk = jest.fn().mockRejectedValue(new Error('Database error'));

      const result = await RoleBasedAccessControlService.validateResourceOwnership(1, 'programme', '1');
      expect(result).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing resource gracefully', async () => {
      db.programmes.findByPk = jest.fn().mockResolvedValue(null);

      const result = await RoleBasedAccessControlService.validateResourceOwnership(1, 'programme', '999');
      expect(result).toBe(false);
    });

    it('should handle missing nested resources gracefully', async () => {
      db.cohorts.findByPk = jest.fn().mockResolvedValue({
        id: 1,
        programme_id: 1,
        programme: null
      });

      const result = await RoleBasedAccessControlService.validateResourceOwnership(1, 'cohort', '1');
      expect(result).toBe(false);
    });

    it('should match resource type "content" for programmes', async () => {
      RoleValidationService.getUserRole.mockResolvedValue('convener');
      db.roles.findOne = jest.fn().mockResolvedValue({
        permissions: [{
          permission_id: '1',
          name: 'manage_content',
          resource_type: 'content',
          action: 'manage',
          scope: 'all'
        }]
      });

      const result = await RoleBasedAccessControlService.canAccessResource(1, 'programme', '1', 'manage');
      expect(result.allowed).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should match action "manage" for any specific action', async () => {
      RoleValidationService.getUserRole.mockResolvedValue('administrator');
      db.roles.findOne = jest.fn().mockResolvedValue({
        permissions: [{
          permission_id: '1',
          name: 'manage_all',
          resource_type: 'all',
          action: 'manage',
          scope: 'all'
        }]
      });

      const result = await RoleBasedAccessControlService.canAccessResource(1, 'programme', '1', 'delete');
      expect(result.allowed).toBe(true);
      expect(result.error).toBeNull();
    });
  });
});
