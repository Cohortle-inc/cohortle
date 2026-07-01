const db = require('../models');
const RoleValidationService = require('./RoleValidationService');
const roleErrorHandler = require('../utils/roleErrorHandler');

/**
 * RoleBasedAccessControlService
 * 
 * Service for role-based resource access control.
 * Provides resource-level validation, permission retrieval, and ownership checks.
 * 
 * Note: This is separate from AccessControlService which handles post/community access.
 * This service focuses on role-based resource access validation.
 * 
 * Requirements: 6.4, 8.1, 8.2, 8.3, 8.4, 8.5
 */
class RoleBasedAccessControlService {
  /**
   * Check if user can access a specific resource
   * 
   * Validates user access to resources based on their role and permissions.
   * Checks both role-level permissions and resource-level ownership/assignment.
   * Logs access denials for security auditing.
   * 
   * @param {number} userId - User ID
   * @param {string} resourceType - Type of resource (e.g., 'programme', 'cohort', 'lesson', 'user')
   * @param {string|number} resourceId - Resource ID
   * @param {string} action - Action being performed (e.g., 'read', 'update', 'delete', 'manage')
   * @returns {Promise<object>} - { allowed: boolean, error: object|null }
   * 
   * Requirements: 6.4, 8.1, 8.5
   */
  async canAccessResource(userId, resourceType, resourceId, action) {
    try {
      // Validate input parameters
      if (!userId || !resourceType || !resourceId || !action) {
        return {
          allowed: false,
          error: roleErrorHandler.resourceAccessDenied(
            resourceType,
            resourceId,
            'Invalid request parameters'
          )
        };
      }

      // Get user's role
      const userRole = await RoleValidationService.getUserRole(userId);
      if (!userRole) {
        roleErrorHandler.logResourceAccessDenial({
          userId,
          resourceType,
          resourceId,
          action,
          reason: 'User has no role assigned'
        });

        return {
          allowed: false,
          error: roleErrorHandler.insufficientPermissions(null, null, action)
        };
      }

      // Get user's permissions
      const permissions = await this.getUserPermissions(userId);
      if (!permissions || permissions.length === 0) {
        roleErrorHandler.logResourceAccessDenial({
          userId,
          resourceType,
          resourceId,
          action,
          reason: 'User has no permissions'
        });

        return {
          allowed: false,
          error: roleErrorHandler.insufficientPermissions(null, userRole, action)
        };
      }

      // Find relevant permissions for this resource type and action
      const relevantPermissions = permissions.filter(perm => {
        // Match resource type (exact match or 'all')
        const resourceMatch = perm.resource_type === resourceType || 
                             perm.resource_type === 'all' ||
                             perm.resource_type === 'content'; // 'content' covers programmes, cohorts, lessons

        // Match action (exact match or 'manage' which covers all actions)
        const actionMatch = perm.action === action || 
                           perm.action === 'manage';

        return resourceMatch && actionMatch;
      });

      if (relevantPermissions.length === 0) {
        roleErrorHandler.logResourceAccessDenial({
          userId,
          resourceType,
          resourceId,
          action,
          reason: `No permissions for ${action} on ${resourceType}`
        });

        return {
          allowed: false,
          error: roleErrorHandler.permissionRequired(
            `${action}_${resourceType}`,
            `${resourceType}:${resourceId}`
          )
        };
      }

      // Check scope for each relevant permission
      for (const permission of relevantPermissions) {
        const hasAccess = await this._checkPermissionScope(
          userId, 
          userRole, 
          permission, 
          resourceType, 
          resourceId
        );

        if (hasAccess) {
          return { allowed: true, error: null };
        }
      }

      // Access denied - log for security monitoring
      roleErrorHandler.logResourceAccessDenial({
        userId,
        resourceType,
        resourceId,
        action,
        reason: 'Permission scope check failed'
      });

      return {
        allowed: false,
        error: roleErrorHandler.resourceAccessDenied(
          resourceType,
          resourceId,
          'You do not have permission to access this resource'
        )
      };
    } catch (error) {
      console.error('Error in canAccessResource:', error);
      return {
        allowed: false,
        error: roleErrorHandler.createErrorResponse(
          'INTERNAL_ERROR',
          'An error occurred while checking resource access',
          { error: error.message }
        )
      };
    }
  }

  /**
   * Get user's permissions
   * 
   * Retrieves all permissions associated with the user's current role.
   * Includes permission details like name, resource type, action, and scope.
   * 
   * @param {number} userId - User ID
   * @returns {Promise<Array>} - List of permission objects
   * 
   * Requirements: 6.4, 6.5
   */
  async getUserPermissions(userId) {
    try {
      if (!userId) {
        return [];
      }

      // Get user's role
      const userRole = await RoleValidationService.getUserRole(userId);
      if (!userRole) {
        return [];
      }

      // Get role with permissions
      const role = await db.roles.findOne({
        where: { name: userRole },
        include: [{
          model: db.permissions,
          as: 'permissions',
          through: { attributes: [] },
          attributes: [
            'permission_id',
            'name',
            'description',
            'resource_type',
            'action',
            'scope'
          ]
        }]
      });

      if (!role || !role.permissions) {
        return [];
      }

      // Return permissions as plain objects
      return role.permissions.map(perm => ({
        permission_id: perm.permission_id,
        name: perm.name,
        description: perm.description,
        resource_type: perm.resource_type,
        action: perm.action,
        scope: perm.scope
      }));
    } catch (error) {
      console.error('Error in getUserPermissions:', error);
      return [];
    }
  }

  /**
   * Validate resource ownership
   * 
   * Checks if a user owns or is assigned to a specific resource.
   * Used for scope validation when permissions require ownership.
   * 
   * @param {number} userId - User ID
   * @param {string} resourceType - Type of resource
   * @param {string|number} resourceId - Resource ID
   * @returns {Promise<boolean>} - True if user owns resource
   * 
   * Requirements: 6.4
   */
  async validateResourceOwnership(userId, resourceType, resourceId) {
    try {
      if (!userId || !resourceType || !resourceId) {
        return false;
      }

      switch (resourceType) {
        case 'programme':
          return await this._checkProgrammeOwnership(userId, resourceId);
        
        case 'cohort':
          return await this._checkCohortOwnership(userId, resourceId);
        
        case 'lesson':
          return await this._checkLessonOwnership(userId, resourceId);
        
        case 'week':
          return await this._checkWeekOwnership(userId, resourceId);
        
        case 'user':
          // User owns their own user resource
          return parseInt(userId) === parseInt(resourceId);
        
        case 'profile':
          // User owns their own profile
          return parseInt(userId) === parseInt(resourceId);
        
        default:
          return false;
      }
    } catch (error) {
      console.error('Error in validateResourceOwnership:', error);
      return false;
    }
  }

  /**
   * Check permission scope
   * 
   * @private
   * @param {number} userId - User ID
   * @param {string} userRole - User's role name
   * @param {object} permission - Permission object
   * @param {string} resourceType - Resource type
   * @param {string|number} resourceId - Resource ID
   * @returns {Promise<boolean>} - True if scope check passes
   */
  async _checkPermissionScope(userId, userRole, permission, resourceType, resourceId) {
    try {
      switch (permission.scope) {
        case 'all':
          // Full access (typically for administrators)
          return true;
        
        case 'own':
          // User can only access their own resources
          return await this.validateResourceOwnership(userId, resourceType, resourceId);
        
        case 'enrolled':
          // User must be enrolled in the resource
          return await this._checkEnrollment(userId, resourceType, resourceId);
        
        case 'assigned':
          // User must be assigned to the resource
          return await this._checkAssignment(userId, resourceType, resourceId);
        
        default:
          return false;
      }
    } catch (error) {
      console.error('Error in _checkPermissionScope:', error);
      return false;
    }
  }

  /**
   * Check programme ownership
   * 
   * @private
   * @param {number} userId - User ID
   * @param {string|number} programmeId - Programme ID
   * @returns {Promise<boolean>} - True if user owns programme
   */
  async _checkProgrammeOwnership(userId, programmeId) {
    try {
      const programme = await db.programmes.findByPk(programmeId, {
        attributes: ['id', 'created_by']
      });

      if (!programme) {
        return false;
      }

      return parseInt(programme.created_by) === parseInt(userId);
    } catch (error) {
      console.error('Error in _checkProgrammeOwnership:', error);
      return false;
    }
  }

  /**
   * Check cohort ownership
   * 
   * @private
   * @param {number} userId - User ID
   * @param {string|number} cohortId - Cohort ID
   * @returns {Promise<boolean>} - True if user owns cohort (via programme)
   */
  async _checkCohortOwnership(userId, cohortId) {
    try {
      const cohort = await db.cohorts.findByPk(cohortId, {
        attributes: ['id', 'programme_id'],
        include: [{
          model: db.programmes,
          as: 'programme',
          attributes: ['id', 'created_by']
        }]
      });

      if (!cohort || !cohort.programme) {
        return false;
      }

      return parseInt(cohort.programme.created_by) === parseInt(userId);
    } catch (error) {
      console.error('Error in _checkCohortOwnership:', error);
      return false;
    }
  }

  /**
   * Check lesson ownership
   * 
   * @private
   * @param {number} userId - User ID
   * @param {string|number} lessonId - Lesson ID
   * @returns {Promise<boolean>} - True if user owns lesson (via programme)
   */
  async _checkLessonOwnership(userId, lessonId) {
    try {
      const lesson = await db.lessons.findByPk(lessonId, {
        attributes: ['id', 'week_id'],
        include: [{
          model: db.weeks,
          as: 'week',
          attributes: ['id', 'programme_id'],
          include: [{
            model: db.programmes,
            as: 'programme',
            attributes: ['id', 'created_by']
          }]
        }]
      });

      if (!lesson || !lesson.week || !lesson.week.programme) {
        return false;
      }

      return parseInt(lesson.week.programme.created_by) === parseInt(userId);
    } catch (error) {
      console.error('Error in _checkLessonOwnership:', error);
      return false;
    }
  }

  /**
   * Check week ownership
   * 
   * @private
   * @param {number} userId - User ID
   * @param {string|number} weekId - Week ID
   * @returns {Promise<boolean>} - True if user owns week (via programme)
   */
  async _checkWeekOwnership(userId, weekId) {
    try {
      const week = await db.weeks.findByPk(weekId, {
        attributes: ['id', 'programme_id'],
        include: [{
          model: db.programmes,
          as: 'programme',
          attributes: ['id', 'created_by']
        }]
      });

      if (!week || !week.programme) {
        return false;
      }

      return parseInt(week.programme.created_by) === parseInt(userId);
    } catch (error) {
      console.error('Error in _checkWeekOwnership:', error);
      return false;
    }
  }

  /**
   * Check enrollment
   * 
   * @private
   * @param {number} userId - User ID
   * @param {string} resourceType - Resource type
   * @param {string|number} resourceId - Resource ID
   * @returns {Promise<boolean>} - True if user is enrolled
   */
  async _checkEnrollment(userId, resourceType, resourceId) {
    try {
      // For programme-level resources, check direct enrollment
      if (resourceType === 'programme') {
        const enrollment = await db.enrollments.findOne({
          where: {
            user_id: userId,
            programme_id: resourceId
          }
        });
        return !!enrollment;
      }

      // For cohort-level resources, check cohort enrollment
      if (resourceType === 'cohort') {
        const enrollment = await db.enrollments.findOne({
          where: {
            user_id: userId,
            cohort_id: resourceId
          }
        });
        return !!enrollment;
      }

      // For lesson-level resources, check if user is enrolled in the lesson's programme
      if (resourceType === 'lesson') {
        const lesson = await db.lessons.findByPk(resourceId, {
          attributes: ['id', 'week_id'],
          include: [{
            model: db.weeks,
            as: 'week',
            attributes: ['id', 'programme_id']
          }]
        });

        if (!lesson || !lesson.week) {
          return false;
        }

        const enrollment = await db.enrollments.findOne({
          where: {
            user_id: userId,
            programme_id: lesson.week.programme_id
          }
        });
        return !!enrollment;
      }

      return false;
    } catch (error) {
      console.error('Error in _checkEnrollment:', error);
      return false;
    }
  }

  /**
   * Check assignment
   * 
   * @private
   * @param {number} userId - User ID
   * @param {string} resourceType - Resource type
   * @param {string|number} resourceId - Resource ID
   * @returns {Promise<boolean>} - True if user is assigned
   */
  async _checkAssignment(userId, resourceType, resourceId) {
    try {
      // Check if user is assigned to manage specific resources
      // This could be extended for future features like:
      // - Teaching assistants assigned to specific cohorts
      // - Moderators assigned to specific communities
      // - Reviewers assigned to specific programmes
      
      // For now, return false as a safe default
      // TODO: Implement specific assignment checks based on resource type
      return false;
    } catch (error) {
      console.error('Error in _checkAssignment:', error);
      return false;
    }
  }
}

module.exports = new RoleBasedAccessControlService();
