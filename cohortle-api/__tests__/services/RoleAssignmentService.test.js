const RoleAssignmentService = require('../../services/RoleAssignmentService');
const RoleValidationService = require('../../services/RoleValidationService');
const roleErrorHandler = require('../../utils/roleErrorHandler');
const db = require('../../models');

// Mock the database models
jest.mock('../../models', () => ({
  sequelize: {
    transaction: jest.fn()
  },
  users: {
    findByPk: jest.fn(),
    update: jest.fn()
  },
  roles: {
    findOne: jest.fn()
  },
  user_role_assignments: {
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findAndCountAll: jest.fn(),
    count: jest.fn()
  },
  role_assignment_history: {
    create: jest.fn(),
    findAndCountAll: jest.fn()
  }
}));

// Mock RoleValidationService
jest.mock('../../services/RoleValidationService', () => ({
  getUserRole: jest.fn(),
  validateRoleTransition: jest.fn()
}));

// Mock roleErrorHandler
jest.mock('../../utils/roleErrorHandler', () => ({
  invalidRoleAssignment: jest.fn((reason, details) => ({
    message: reason,
    code: 'INVALID_ROLE_ASSIGNMENT',
    details
  })),
  userNotFound: jest.fn((userId) => ({
    message: 'User not found',
    code: 'USER_NOT_FOUND',
    details: { user_id: userId }
  })),
  invalidRole: jest.fn((role) => ({
    message: `Invalid role: ${role}`,
    code: 'INVALID_ROLE',
    details: { provided_role: role }
  })),
  insufficientPermissions: jest.fn((required, current, action) => ({
    message: 'Insufficient permissions',
    code: 'INSUFFICIENT_PERMISSIONS',
    details: { required_role: required, current_role: current, attempted_action: action }
  })),
  roleTransitionViolation: jest.fn((reason, current, target) => ({
    message: 'Role transition not allowed',
    code: 'ROLE_TRANSITION_VIOLATION',
    details: { reason, current_role: current, target_role: target }
  })),
  createErrorResponse: jest.fn((code, message, details) => ({
    error: true,
    message,
    code,
    details
  })),
  logRoleAssignment: jest.fn(),
  logRoleValidationFailure: jest.fn()
}));

describe('RoleAssignmentService', () => {
  let mockTransaction;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock transaction
    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn()
    };
    db.sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  describe('assignRole', () => {
    const userId = 1;
    const roleName = 'student';
    const assignedBy = 2;
    const mockUser = { id: userId, email: 'test@example.com' };
    const mockRole = { 
      role_id: 'role-uuid-123', 
      name: 'student',
      hierarchy_level: 1
    };

    it('should successfully assign a role to a user', async () => {
      // Arrange
      db.users.findByPk.mockResolvedValue(mockUser);
      db.roles.findOne.mockResolvedValue(mockRole);
      db.user_role_assignments.findOne.mockResolvedValue(null); // No existing assignment
      RoleValidationService.getUserRole.mockResolvedValue('administrator');
      
      const mockAssignment = {
        assignment_id: 'assignment-uuid-123',
        user_id: userId,
        role_id: mockRole.role_id,
        assigned_by: assignedBy,
        assigned_at: new Date(),
        effective_from: new Date(),
        effective_until: null,
        status: 'active'
      };
      db.user_role_assignments.create.mockResolvedValue(mockAssignment);
      db.users.update.mockResolvedValue([1]);
      db.role_assignment_history.create.mockResolvedValue({});

      // Act
      const result = await RoleAssignmentService.assignRole(userId, roleName, assignedBy);

      // Assert
      expect(result.success).toBe(true);
      expect(result.assignment).toBeDefined();
      expect(result.assignment.user_id).toBe(userId);
      expect(result.assignment.role).toBe(roleName);
      expect(result.assignment.assigned_by).toBe(assignedBy);
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(mockTransaction.rollback).not.toHaveBeenCalled();
    });

    it('should reject assignment if user not found', async () => {
      // Arrange
      db.users.findByPk.mockResolvedValue(null);

      // Act
      const result = await RoleAssignmentService.assignRole(userId, roleName, assignedBy);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
      expect(result.code).toBe('USER_NOT_FOUND');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should reject assignment if role is invalid', async () => {
      // Arrange
      db.users.findByPk.mockResolvedValue(mockUser);
      db.roles.findOne.mockResolvedValue(null);

      // Act
      const result = await RoleAssignmentService.assignRole(userId, 'invalid_role', assignedBy);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid role');
      expect(result.code).toBe('INVALID_ROLE');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should reject assignment if user already has active role', async () => {
      // Arrange
      db.users.findByPk.mockResolvedValue(mockUser);
      db.roles.findOne.mockResolvedValue(mockRole);
      db.user_role_assignments.findOne.mockResolvedValue({ assignment_id: 'existing' });

      // Act
      const result = await RoleAssignmentService.assignRole(userId, roleName, assignedBy);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('already has an active role assignment');
      expect(result.code).toBe('INVALID_ROLE_ASSIGNMENT');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should reject assignment if assigner is not administrator', async () => {
      // Arrange
      db.users.findByPk.mockResolvedValue(mockUser);
      db.roles.findOne.mockResolvedValue(mockRole);
      db.user_role_assignments.findOne.mockResolvedValue(null);
      RoleValidationService.getUserRole.mockResolvedValue('student');

      // Act
      const result = await RoleAssignmentService.assignRole(userId, roleName, assignedBy);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient permissions');
      expect(result.code).toBe('INSUFFICIENT_PERMISSIONS');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should handle missing required parameters', async () => {
      // Act
      const result = await RoleAssignmentService.assignRole(null, null);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required parameters');
      expect(result.code).toBe('INVALID_ROLE_ASSIGNMENT');
    });
  });

  describe('updateUserRole', () => {
    const userId = 1;
    const currentRoleName = 'student';
    const newRoleName = 'convener';
    const updatedBy = 2;
    const mockCurrentRole = { role_id: 'role-uuid-1', name: 'student', hierarchy_level: 1 };
    const mockNewRole = { role_id: 'role-uuid-2', name: 'convener', hierarchy_level: 2 };

    it('should successfully update user role', async () => {
      // Arrange
      RoleValidationService.getUserRole.mockResolvedValue(currentRoleName);
      RoleValidationService.validateRoleTransition.mockResolvedValue(true);
      db.roles.findOne
        .mockResolvedValueOnce(mockCurrentRole)
        .mockResolvedValueOnce(mockNewRole);
      db.user_role_assignments.update.mockResolvedValue([1]);
      db.user_role_assignments.create.mockResolvedValue({
        assignment_id: 'new-assignment-uuid',
        user_id: userId,
        role_id: mockNewRole.role_id
      });
      db.users.update.mockResolvedValue([1]);
      db.role_assignment_history.create.mockResolvedValue({});

      // Act
      const result = await RoleAssignmentService.updateUserRole(userId, newRoleName, updatedBy);

      // Assert
      expect(result.success).toBe(true);
      expect(result.update.previous_role).toBe(currentRoleName);
      expect(result.update.new_role).toBe(newRoleName);
      expect(result.update.user_id).toBe(userId);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should reject update if user has no current role', async () => {
      // Arrange
      RoleValidationService.getUserRole.mockResolvedValue(null);

      // Act
      const result = await RoleAssignmentService.updateUserRole(userId, newRoleName, updatedBy);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('User does not have a current role assignment');
      expect(result.code).toBe('INVALID_ROLE_ASSIGNMENT');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should reject update if new role is same as current role', async () => {
      // Arrange
      RoleValidationService.getUserRole.mockResolvedValue(currentRoleName);

      // Act
      const result = await RoleAssignmentService.updateUserRole(userId, currentRoleName, updatedBy);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('User already has the specified role');
      expect(result.code).toBe('INVALID_ROLE_ASSIGNMENT');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should reject update if role transition is invalid', async () => {
      // Arrange
      RoleValidationService.getUserRole
        .mockResolvedValueOnce(currentRoleName) // First call for current role
        .mockResolvedValueOnce('student'); // Second call for updatedBy role
      RoleValidationService.validateRoleTransition.mockResolvedValue(false);

      // Act
      const result = await RoleAssignmentService.updateUserRole(userId, newRoleName, updatedBy);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Role transition');
      expect(result.code).toBe('ROLE_TRANSITION_VIOLATION');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should handle missing required parameters', async () => {
      // Act
      const result = await RoleAssignmentService.updateUserRole(null, null, null);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required parameters');
      expect(result.code).toBe('INVALID_ROLE_ASSIGNMENT');
    });
  });

  describe('getRoleAssignmentHistory', () => {
    const userId = 1;
    const mockUser = { id: userId, email: 'test@example.com' };
    const mockHistory = [
      {
        history_id: 'history-1',
        user_id: userId,
        previous_role: {
          role_id: 'role-1',
          name: 'student',
          description: 'Student role',
          hierarchy_level: 1
        },
        new_role: {
          role_id: 'role-2',
          name: 'convener',
          description: 'Convener role',
          hierarchy_level: 2
        },
        changer: {
          id: 2,
          email: 'admin@example.com',
          first_name: 'Admin',
          last_name: 'User'
        },
        changed_at: new Date(),
        reason: 'Promoted to convener',
        metadata: { assignment_type: 'update' }
      }
    ];

    it('should successfully retrieve role assignment history', async () => {
      // Arrange
      db.users.findByPk.mockResolvedValue(mockUser);
      db.role_assignment_history.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: mockHistory
      });

      // Act
      const result = await RoleAssignmentService.getRoleAssignmentHistory(userId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.history).toHaveLength(1);
      expect(result.history[0].user_id).toBe(userId);
      expect(result.pagination.total).toBe(1);
    });

    it('should reject if user not found', async () => {
      // Arrange
      db.users.findByPk.mockResolvedValue(null);

      // Act
      const result = await RoleAssignmentService.getRoleAssignmentHistory(userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
      expect(result.code).toBe('USER_NOT_FOUND');
    });

    it('should handle missing userId parameter', async () => {
      // Act
      const result = await RoleAssignmentService.getRoleAssignmentHistory(null);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required parameter');
      expect(result.code).toBe('INVALID_PARAMETERS');
    });

    it('should apply pagination options', async () => {
      // Arrange
      db.users.findByPk.mockResolvedValue(mockUser);
      db.role_assignment_history.findAndCountAll.mockResolvedValue({
        count: 100,
        rows: mockHistory
      });

      // Act
      const result = await RoleAssignmentService.getRoleAssignmentHistory(userId, {
        limit: 10,
        offset: 20
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.offset).toBe(20);
      expect(result.pagination.has_more).toBe(true);
    });
  });

  describe('getCurrentAssignment', () => {
    const userId = 1;
    const mockAssignment = {
      assignment_id: 'assignment-uuid',
      user_id: userId,
      role: {
        role_id: 'role-uuid',
        name: 'student',
        description: 'Student role',
        hierarchy_level: 1
      },
      assigner: {
        id: 2,
        email: 'admin@example.com',
        first_name: 'Admin',
        last_name: 'User'
      },
      assigned_at: new Date(),
      effective_from: new Date(),
      effective_until: null,
      status: 'active',
      notes: 'Initial assignment'
    };

    it('should successfully retrieve current assignment', async () => {
      // Arrange
      db.user_role_assignments.findOne.mockResolvedValue(mockAssignment);

      // Act
      const result = await RoleAssignmentService.getCurrentAssignment(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result.assignment_id).toBe(mockAssignment.assignment_id);
      expect(result.user_id).toBe(userId);
      expect(result.role.name).toBe('student');
    });

    it('should return null if no active assignment found', async () => {
      // Arrange
      db.user_role_assignments.findOne.mockResolvedValue(null);

      // Act
      const result = await RoleAssignmentService.getCurrentAssignment(userId);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null if userId is not provided', async () => {
      // Act
      const result = await RoleAssignmentService.getCurrentAssignment(null);

      // Assert
      expect(result).toBeNull();
    });
  });
});