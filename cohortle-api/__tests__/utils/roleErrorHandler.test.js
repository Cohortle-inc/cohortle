/**
 * Tests for Role Error Handler Utility
 * 
 * Validates consistent error response formatting, logging, and user guidance
 * for all role validation and authorization errors.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

const roleErrorHandler = require('../../utils/roleErrorHandler');
const errorLogger = require('../../utils/errorLogger');

// Mock errorLogger
jest.mock('../../utils/errorLogger', () => ({
  logSecurityEvent: jest.fn()
}));

describe('Role Error Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Error Response Format', () => {
    it('should create consistent error response with required fields', () => {
      const error = roleErrorHandler.createErrorResponse(
        'TEST_CODE',
        'Test message',
        { detail: 'test' }
      );

      expect(error).toHaveProperty('error', true);
      expect(error).toHaveProperty('message', 'Test message');
      expect(error).toHaveProperty('code', 'TEST_CODE');
      expect(error).toHaveProperty('timestamp');
      expect(error).toHaveProperty('details');
      expect(error.details).toEqual({ detail: 'test' });
    });

    it('should create error response without details when not provided', () => {
      const error = roleErrorHandler.createErrorResponse(
        'TEST_CODE',
        'Test message'
      );

      expect(error).toHaveProperty('error', true);
      expect(error).toHaveProperty('message', 'Test message');
      expect(error).toHaveProperty('code', 'TEST_CODE');
      expect(error).toHaveProperty('timestamp');
      expect(error).not.toHaveProperty('details');
    });
  });

  describe('Insufficient Permissions Error', () => {
    it('should return error with required role and user guidance', () => {
      const error = roleErrorHandler.insufficientPermissions(
        'convener',
        'learner',
        'create_programme'
      );

      expect(error.code).toBe('INSUFFICIENT_PERMISSIONS');
      expect(error.message).toContain('convener');
      expect(error.details.required_role).toBe('convener');
      expect(error.details.current_role).toBe('learner');
      expect(error.details.attempted_action).toBe('create_programme');
      expect(error.details.guidance).toBeDefined();
      expect(error.details.guidance).toContain('administrator');
    });

    it('should provide guidance for learner role', () => {
      const error = roleErrorHandler.insufficientPermissions('learner');

      expect(error.details.guidance).toContain('default role');
    });

    it('should provide guidance for convener role', () => {
      const error = roleErrorHandler.insufficientPermissions('convener');

      expect(error.details.guidance).toContain('administrator');
      expect(error.details.guidance).toContain('convener access');
    });

    it('should provide guidance for administrator role', () => {
      const error = roleErrorHandler.insufficientPermissions('administrator');

      expect(error.details.guidance).toContain('platform owner');
    });
  });

  describe('Role Required Error', () => {
    it('should return error with role requirement and guidance', () => {
      const error = roleErrorHandler.roleRequired('convener', 'programme:123');

      expect(error.code).toBe('ROLE_REQUIRED');
      expect(error.message).toContain('convener');
      expect(error.details.required_role).toBe('convener');
      expect(error.details.resource).toBe('programme:123');
      expect(error.details.guidance).toBeDefined();
    });
  });

  describe('Permission Required Error', () => {
    it('should return error with permission requirement', () => {
      const error = roleErrorHandler.permissionRequired(
        'create_programme',
        'programme'
      );

      expect(error.code).toBe('PERMISSION_REQUIRED');
      expect(error.message).toContain('create_programme');
      expect(error.details.required_permission).toBe('create_programme');
      expect(error.details.resource).toBe('programme');
      expect(error.details.guidance).toContain('administrator');
    });
  });

  describe('Resource Access Denied Error', () => {
    it('should return error with resource information', () => {
      const error = roleErrorHandler.resourceAccessDenied(
        'programme',
        '123',
        'Not enrolled'
      );

      expect(error.code).toBe('RESOURCE_ACCESS_DENIED');
      expect(error.message).toContain('access denied');
      expect(error.details.resource_type).toBe('programme');
      expect(error.details.resource_id).toBe('123');
      expect(error.details.reason).toBe('Not enrolled');
    });

    it('should provide default guidance when reason not specified', () => {
      const error = roleErrorHandler.resourceAccessDenied('programme', '123');

      expect(error.details.guidance).toBeDefined();
      expect(error.details.guidance).toContain('permission');
    });
  });

  describe('Invalid Role Error', () => {
    it('should return error with valid roles list', () => {
      const error = roleErrorHandler.invalidRole('invalid_role');

      expect(error.code).toBe('INVALID_ROLE');
      expect(error.details.provided_role).toBe('invalid_role');
      expect(error.details.valid_roles).toEqual([
        'learner',
        'convener',
        'administrator'
      ]);
      expect(error.details.guidance).toContain('learner');
      expect(error.details.guidance).toContain('convener');
      expect(error.details.guidance).toContain('administrator');
    });
  });

  describe('Invalid Role Assignment Error', () => {
    it('should return error with validation errors', () => {
      const validationErrors = {
        role: 'Invalid role',
        user: 'User not found'
      };

      const error = roleErrorHandler.invalidRoleAssignment(
        'Validation failed',
        validationErrors
      );

      expect(error.code).toBe('INVALID_ROLE_ASSIGNMENT');
      expect(error.details.reason).toBe('Validation failed');
      expect(error.details.validation_errors).toEqual(validationErrors);
    });
  });

  describe('Role Transition Violation Error', () => {
    it('should return error with transition details', () => {
      const error = roleErrorHandler.roleTransitionViolation(
        'Cannot downgrade from administrator',
        'administrator',
        'convener'
      );

      expect(error.code).toBe('ROLE_TRANSITION_VIOLATION');
      expect(error.details.reason).toBe('Cannot downgrade from administrator');
      expect(error.details.current_role).toBe('administrator');
      expect(error.details.target_role).toBe('convener');
    });
  });

  describe('Last Admin Protection Error', () => {
    it('should return error with protection message', () => {
      const error = roleErrorHandler.lastAdminProtection();

      expect(error.code).toBe('LAST_ADMIN_PROTECTION');
      expect(error.message).toContain('administrators');
      expect(error.details.reason).toContain('At least one administrator');
      expect(error.details.guidance).toContain('another user');
    });
  });

  describe('Token Invalid Error', () => {
    it('should return error with token guidance', () => {
      const error = roleErrorHandler.tokenInvalid('Token expired');

      expect(error.code).toBe('TOKEN_INVALID');
      expect(error.message).toBe('Token expired');
      expect(error.details.guidance).toContain('log in again');
    });
  });

  describe('User Not Found Error', () => {
    it('should return error with user ID', () => {
      const error = roleErrorHandler.userNotFound(123);

      expect(error.code).toBe('USER_NOT_FOUND');
      expect(error.details.user_id).toBe(123);
    });
  });

  describe('Role Not Found Error', () => {
    it('should return error with role name', () => {
      const error = roleErrorHandler.roleNotFound('invalid_role');

      expect(error.code).toBe('ROLE_NOT_FOUND');
      expect(error.details.role).toBe('invalid_role');
    });
  });

  describe('Logging Functions', () => {
    it('should log role validation failure with context', () => {
      const context = {
        userId: 123,
        action: 'create_programme',
        requiredRole: 'convener',
        userRole: 'learner',
        resource: 'programme:456',
        ip: '192.168.1.1'
      };

      roleErrorHandler.logRoleValidationFailure(context);

      expect(errorLogger.logSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ROLE_VALIDATION_FAILURE',
          user_id: 123,
          action: 'create_programme',
          required_role: 'convener',
          user_role: 'learner',
          resource: 'programme:456',
          ip: '192.168.1.1'
        })
      );
    });

    it('should log role assignment with context', () => {
      const context = {
        userId: 123,
        previousRole: 'learner',
        newRole: 'convener',
        changedBy: 456,
        reason: 'Promoted to convener'
      };

      roleErrorHandler.logRoleAssignment(context);

      expect(errorLogger.logSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ROLE_ASSIGNMENT',
          user_id: 123,
          previous_role: 'learner',
          new_role: 'convener',
          changed_by: 456,
          reason: 'Promoted to convener'
        })
      );
    });

    it('should log resource access denial with context', () => {
      const context = {
        userId: 123,
        resourceType: 'programme',
        resourceId: '456',
        action: 'update',
        reason: 'Not owner'
      };

      roleErrorHandler.logResourceAccessDenial(context);

      expect(errorLogger.logSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'RESOURCE_ACCESS_DENIED',
          user_id: 123,
          resource_type: 'programme',
          resource_id: '456',
          action: 'update',
          reason: 'Not owner'
        })
      );
    });
  });

  describe('Error Codes', () => {
    it('should export all error codes', () => {
      expect(roleErrorHandler.ErrorCodes).toBeDefined();
      expect(roleErrorHandler.ErrorCodes.INSUFFICIENT_PERMISSIONS).toBe(
        'INSUFFICIENT_PERMISSIONS'
      );
      expect(roleErrorHandler.ErrorCodes.ROLE_REQUIRED).toBe('ROLE_REQUIRED');
      expect(roleErrorHandler.ErrorCodes.INVALID_ROLE).toBe('INVALID_ROLE');
      expect(roleErrorHandler.ErrorCodes.TOKEN_INVALID).toBe('TOKEN_INVALID');
    });
  });

  describe('Role Guidance', () => {
    it('should export role guidance messages', () => {
      expect(roleErrorHandler.RoleGuidance).toBeDefined();
      expect(roleErrorHandler.RoleGuidance.learner).toContain('default role');
      expect(roleErrorHandler.RoleGuidance.convener).toContain('administrator');
      expect(roleErrorHandler.RoleGuidance.administrator).toContain(
        'platform owner'
      );
    });
  });
});
