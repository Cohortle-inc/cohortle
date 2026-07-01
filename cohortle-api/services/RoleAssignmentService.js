const db = require('../models');
const { Op } = require('sequelize');
const RoleValidationService = require('./RoleValidationService');
const roleErrorHandler = require('../utils/roleErrorHandler');

/**
 * RoleAssignmentService
 * 
 * Service for managing role assignments, modifications, and audit trails.
 * Handles initial role assignment, role changes, and maintains complete history.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 8.2, 8.5
 */
class RoleAssignmentService {
  /**
   * Assign role to user (initial assignment)
   * 
   * Creates a new role assignment for a user. This is typically used during
   * user registration or when assigning a role for the first time.
   * 
   * @param {number} userId - User ID to assign role to
   * @param {string} roleName - Role name to assign (e.g., 'student', 'convener', 'administrator')
   * @param {number} assignedBy - Admin ID making the assignment (can be null for system assignments)
   * @param {object} options - Additional options
   * @param {string} options.notes - Optional notes about the assignment
   * @param {Date} options.effectiveFrom - When the role becomes effective (defaults to now)
   * @param {Date} options.effectiveUntil - When the role expires (null for permanent)
   * @returns {Promise<object>} - Assignment result with success status and assignment details
   * 
   * Requirements: 4.1
   */
  async assignRole(userId, roleName, assignedBy = null, options = {}) {
    const transaction = await db.sequelize.transaction();
    
    try {
      // Validate input parameters
      if (!userId || !roleName) {
        const error = roleErrorHandler.invalidRoleAssignment(
          'Missing required parameters',
          { 
            userId: !userId ? 'User ID is required' : undefined,
            roleName: !roleName ? 'Role name is required' : undefined
          }
        );
        return {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details
        };
      }

      // Validate user exists
      const user = await db.users.findByPk(userId);
      if (!user) {
        await transaction.rollback();
        const error = roleErrorHandler.userNotFound(userId);
        return {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details
        };
      }

      // Validate role exists
      const role = await db.roles.findOne({
        where: { name: roleName }
      });
      
      if (!role) {
        await transaction.rollback();
        const error = roleErrorHandler.invalidRole(roleName);
        return {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details
        };
      }

      // Check if user already has an active role assignment
      const existingAssignment = await db.user_role_assignments.findOne({
        where: {
          user_id: userId,
          status: 'active',
          effective_from: {
            [Op.lte]: new Date()
          },
          [Op.or]: [
            { effective_until: null },
            { effective_until: { [Op.gte]: new Date() } }
          ]
        },
        transaction
      });

      if (existingAssignment) {
        await transaction.rollback();
        const error = roleErrorHandler.invalidRoleAssignment(
          'User already has an active role assignment',
          { suggestion: 'Use updateUserRole to change roles' }
        );
        return {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details
        };
      }

      // If assignedBy is provided, validate they have permission
      if (assignedBy) {
        const adminRole = await RoleValidationService.getUserRole(assignedBy);
        if (adminRole !== 'administrator') {
          await transaction.rollback();
          const error = roleErrorHandler.insufficientPermissions(
            'administrator',
            adminRole,
            'assign_role'
          );
          
          // Log the failed attempt
          roleErrorHandler.logRoleValidationFailure({
            userId: assignedBy,
            action: 'assign_role',
            requiredRole: 'administrator',
            userRole: adminRole,
            resource: `user:${userId}`
          });
          
          return {
            success: false,
            error: error.message,
            code: error.code,
            details: error.details
          };
        }
      }

      // Create the role assignment
      const effectiveFrom = options.effectiveFrom || new Date();
      const assignment = await db.user_role_assignments.create({
        user_id: userId,
        role_id: role.role_id,
        assigned_by: assignedBy,
        assigned_at: new Date(),
        effective_from: effectiveFrom,
        effective_until: options.effectiveUntil || null,
        status: 'active',
        notes: options.notes || null
      }, { transaction });

      // Update denormalized role_id in users table for performance
      await db.users.update(
        { role_id: role.role_id },
        { where: { id: userId }, transaction }
      );

      // Create history record
      await db.role_assignment_history.create({
        user_id: userId,
        previous_role_id: null, // No previous role for initial assignment
        new_role_id: role.role_id,
        changed_by: assignedBy || userId, // Use userId if system assignment
        changed_at: new Date(),
        reason: options.notes || 'Initial role assignment',
        metadata: {
          assignment_type: 'initial',
          effective_from: effectiveFrom,
          effective_until: options.effectiveUntil || null
        }
      }, { transaction });

      await transaction.commit();

      // Log successful assignment
      roleErrorHandler.logRoleAssignment({
        userId,
        previousRole: null,
        newRole: roleName,
        changedBy: assignedBy || userId,
        reason: options.notes || 'Initial role assignment'
      });

      return {
        success: true,
        assignment: {
          assignment_id: assignment.assignment_id,
          user_id: userId,
          role: roleName,
          assigned_by: assignedBy,
          assigned_at: assignment.assigned_at,
          effective_from: assignment.effective_from,
          effective_until: assignment.effective_until,
          status: assignment.status
        }
      };
    } catch (error) {
      await transaction.rollback();
      console.error('Error in assignRole:', error);
      
      const errorResponse = roleErrorHandler.createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to assign role due to internal error',
        { error: error.message }
      );
      
      return {
        success: false,
        error: errorResponse.message,
        code: errorResponse.code,
        details: errorResponse.details
      };
    }
  }

  /**
   * Update user role (change existing role)
   * 
   * Changes a user's role from their current role to a new role.
   * Validates the transition, revokes old permissions, grants new ones,
   * and maintains complete audit trail.
   * 
   * @param {number} userId - User ID whose role to update
   * @param {string} newRoleName - New role name to assign
   * @param {number} updatedBy - Admin ID making the update
   * @param {object} options - Additional options
   * @param {string} options.reason - Reason for the role change
   * @param {Date} options.effectiveFrom - When the new role becomes effective (defaults to now)
   * @returns {Promise<object>} - Update result with success status and details
   * 
   * Requirements: 4.1, 4.2, 4.3, 4.4
   */
  async updateUserRole(userId, newRoleName, updatedBy, options = {}) {
    const transaction = await db.sequelize.transaction();
    
    try {
      // Validate input parameters
      if (!userId || !newRoleName || !updatedBy) {
        const error = roleErrorHandler.invalidRoleAssignment(
          'Missing required parameters',
          {
            userId: !userId ? 'User ID is required' : undefined,
            newRoleName: !newRoleName ? 'New role name is required' : undefined,
            updatedBy: !updatedBy ? 'Updated by (admin ID) is required' : undefined
          }
        );
        return {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details
        };
      }

      // Get current role
      const currentRoleName = await RoleValidationService.getUserRole(userId);
      if (!currentRoleName) {
        await transaction.rollback();
        const error = roleErrorHandler.invalidRoleAssignment(
          'User does not have a current role assignment',
          { suggestion: 'Use assignRole to assign an initial role' }
        );
        return {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details
        };
      }

      // Check if new role is the same as current role
      if (currentRoleName === newRoleName) {
        await transaction.rollback();
        const error = roleErrorHandler.invalidRoleAssignment(
          'User already has the specified role',
          { current_role: currentRoleName, requested_role: newRoleName }
        );
        return {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details
        };
      }

      // Validate role transition
      const isValidTransition = await RoleValidationService.validateRoleTransition(
        currentRoleName,
        newRoleName,
        updatedBy
      );

      if (!isValidTransition) {
        await transaction.rollback();
        
        // Log the failed transition attempt
        roleErrorHandler.logRoleValidationFailure({
          userId: updatedBy,
          action: 'update_role',
          requiredRole: 'administrator',
          userRole: await RoleValidationService.getUserRole(updatedBy),
          resource: `user:${userId}`
        });
        
        const error = roleErrorHandler.roleTransitionViolation(
          'Role transition validation failed',
          currentRoleName,
          newRoleName
        );
        
        error.details.possible_reasons = [
          'Only administrators can change roles',
          'Cannot remove the last administrator',
          'Invalid role name'
        ];
        
        return {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details
        };
      }

      // Get role records
      const [currentRole, newRole] = await Promise.all([
        db.roles.findOne({ where: { name: currentRoleName } }),
        db.roles.findOne({ where: { name: newRoleName } })
      ]);

      if (!newRole) {
        await transaction.rollback();
        const error = roleErrorHandler.invalidRole(newRoleName);
        return {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details
        };
      }

      // Deactivate current role assignment
      await db.user_role_assignments.update(
        { 
          status: 'inactive',
          effective_until: new Date()
        },
        {
          where: {
            user_id: userId,
            status: 'active'
          },
          transaction
        }
      );

      // Create new role assignment
      const effectiveFrom = options.effectiveFrom || new Date();
      const newAssignment = await db.user_role_assignments.create({
        user_id: userId,
        role_id: newRole.role_id,
        assigned_by: updatedBy,
        assigned_at: new Date(),
        effective_from: effectiveFrom,
        effective_until: null,
        status: 'active',
        notes: options.reason || 'Role updated by administrator'
      }, { transaction });

      // Update denormalized role_id in users table
      await db.users.update(
        { role_id: newRole.role_id },
        { where: { id: userId }, transaction }
      );

      // Create history record
      await db.role_assignment_history.create({
        user_id: userId,
        previous_role_id: currentRole ? currentRole.role_id : null,
        new_role_id: newRole.role_id,
        changed_by: updatedBy,
        changed_at: new Date(),
        reason: options.reason || 'Role updated by administrator',
        metadata: {
          assignment_type: 'update',
          previous_role: currentRoleName,
          new_role: newRoleName,
          effective_from: effectiveFrom
        }
      }, { transaction });

      await transaction.commit();

      // Log successful role update
      roleErrorHandler.logRoleAssignment({
        userId,
        previousRole: currentRoleName,
        newRole: newRoleName,
        changedBy: updatedBy,
        reason: options.reason || 'Role updated by administrator'
      });

      return {
        success: true,
        update: {
          user_id: userId,
          previous_role: currentRoleName,
          new_role: newRoleName,
          updated_by: updatedBy,
          updated_at: new Date(),
          effective_from: effectiveFrom,
          assignment_id: newAssignment.assignment_id
        },
        message: `Role successfully updated from ${currentRoleName} to ${newRoleName}`
      };
    } catch (error) {
      await transaction.rollback();
      console.error('Error in updateUserRole:', error);
      
      const errorResponse = roleErrorHandler.createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to update role due to internal error',
        { error: error.message }
      );
      
      return {
        success: false,
        error: errorResponse.message,
        code: errorResponse.code,
        details: errorResponse.details
      };
    }
  }

  /**
   * Get role assignment history for a user
   * 
   * Retrieves the complete audit trail of role changes for a user,
   * including who made the changes, when, and why.
   * 
   * @param {number} userId - User ID to get history for
   * @param {object} options - Query options
   * @param {number} options.limit - Maximum number of records to return (default: 50)
   * @param {number} options.offset - Number of records to skip (default: 0)
   * @param {string} options.orderBy - Sort order: 'asc' or 'desc' (default: 'desc')
   * @returns {Promise<object>} - History result with records and metadata
   * 
   * Requirements: 4.3
   */
  async getRoleAssignmentHistory(userId, options = {}) {
    try {
      // Validate input
      if (!userId) {
        const error = roleErrorHandler.createErrorResponse(
          'INVALID_PARAMETERS',
          'Missing required parameter: userId',
          {}
        );
        return {
          success: false,
          error: error.message,
          code: error.code
        };
      }

      // Set defaults
      const limit = options.limit || 50;
      const offset = options.offset || 0;
      const orderBy = options.orderBy === 'asc' ? 'ASC' : 'DESC';

      // Validate user exists
      const user = await db.users.findByPk(userId);
      if (!user) {
        const error = roleErrorHandler.userNotFound(userId);
        return {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details
        };
      }

      // Get history records
      const { count, rows: history } = await db.role_assignment_history.findAndCountAll({
        where: { user_id: userId },
        include: [
          {
            model: db.roles,
            as: 'previous_role',
            attributes: ['role_id', 'name', 'description', 'hierarchy_level']
          },
          {
            model: db.roles,
            as: 'new_role',
            attributes: ['role_id', 'name', 'description', 'hierarchy_level']
          },
          {
            model: db.users,
            as: 'changer',
            attributes: ['id', 'email', 'first_name', 'last_name']
          }
        ],
        order: [['changed_at', orderBy]],
        limit,
        offset
      });

      // Format history records
      const formattedHistory = history.map(record => ({
        history_id: record.history_id,
        user_id: record.user_id,
        previous_role: record.previous_role ? {
          id: record.previous_role.role_id,
          name: record.previous_role.name,
          description: record.previous_role.description,
          hierarchy_level: record.previous_role.hierarchy_level
        } : null,
        new_role: {
          id: record.new_role.role_id,
          name: record.new_role.name,
          description: record.new_role.description,
          hierarchy_level: record.new_role.hierarchy_level
        },
        changed_by: {
          id: record.changer.id,
          email: record.changer.email,
          name: `${record.changer.first_name || ''} ${record.changer.last_name || ''}`.trim()
        },
        changed_at: record.changed_at,
        reason: record.reason,
        metadata: record.metadata
      }));

      return {
        success: true,
        history: formattedHistory,
        pagination: {
          total: count,
          limit,
          offset,
          has_more: offset + limit < count
        }
      };
    } catch (error) {
      console.error('Error in getRoleAssignmentHistory:', error);
      
      const errorResponse = roleErrorHandler.createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to retrieve role assignment history',
        { error: error.message }
      );
      
      return {
        success: false,
        error: errorResponse.message,
        code: errorResponse.code,
        details: errorResponse.details
      };
    }
  }

  /**
   * Get current role assignment for a user
   * 
   * Retrieves the active role assignment details for a user.
   * 
   * @param {number} userId - User ID
   * @returns {Promise<object|null>} - Current assignment or null if none
   */
  async getCurrentAssignment(userId) {
    try {
      if (!userId) {
        return null;
      }

      const assignment = await db.user_role_assignments.findOne({
        where: {
          user_id: userId,
          status: 'active',
          effective_from: {
            [Op.lte]: new Date()
          },
          [Op.or]: [
            { effective_until: null },
            { effective_until: { [Op.gte]: new Date() } }
          ]
        },
        include: [
          {
            model: db.roles,
            as: 'role',
            attributes: ['role_id', 'name', 'description', 'hierarchy_level']
          },
          {
            model: db.users,
            as: 'assigner',
            attributes: ['id', 'email', 'first_name', 'last_name']
          }
        ],
        order: [['assigned_at', 'DESC']]
      });

      if (!assignment) {
        return null;
      }

      return {
        assignment_id: assignment.assignment_id,
        user_id: assignment.user_id,
        role: {
          id: assignment.role.role_id,
          name: assignment.role.name,
          description: assignment.role.description,
          hierarchy_level: assignment.role.hierarchy_level
        },
        assigned_by: assignment.assigner ? {
          id: assignment.assigner.id,
          email: assignment.assigner.email,
          name: `${assignment.assigner.first_name || ''} ${assignment.assigner.last_name || ''}`.trim()
        } : null,
        assigned_at: assignment.assigned_at,
        effective_from: assignment.effective_from,
        effective_until: assignment.effective_until,
        status: assignment.status,
        notes: assignment.notes
      };
    } catch (error) {
      console.error('Error in getCurrentAssignment:', error);
      return null;
    }
  }
}

module.exports = new RoleAssignmentService();
