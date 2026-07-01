const db = require('../models');
const { Op } = require('sequelize');
const roleErrorHandler = require('../utils/roleErrorHandler');

/**
 * RoleValidationService
 * 
 * Central service for validating user roles against actions and resources.
 * Provides core validation methods for role-based access control.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 8.1, 8.5
 */
class RoleValidationService {
  /**
   * Validate if a user can perform an action
   * 
   * @param {number} userId - User ID
   * @param {string} action - Action to perform (e.g., 'access_convener_dashboard', 'create_programme')
   * @param {object} resource - Resource being accessed (optional)
   * @param {string} resource.type - Type of resource (e.g., 'programme', 'cohort')
   * @param {string|number} resource.id - Resource ID
   * @param {number} resource.ownerId - Owner ID of the resource (for ownership checks)
   * @returns {Promise<object>} - { allowed: boolean, error: object|null }
   * 
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 8.1, 8.5
   */
  async canPerformAction(userId, action, resource = null) {
    try {
      // Validate input parameters
      if (!userId || !action) {
        return {
          allowed: false,
          error: roleErrorHandler.createErrorResponse(
            'INVALID_REQUEST',
            'User ID and action are required'
          )
        };
      }

      // Get user's role
      const userRole = await this.getUserRole(userId);
      if (!userRole) {
        roleErrorHandler.logRoleValidationFailure({
          userId,
          action,
          requiredRole: 'any',
          userRole: null,
          resource: resource ? `${resource.type}:${resource.id}` : null
        });

        return {
          allowed: false,
          error: roleErrorHandler.insufficientPermissions(null, null, action)
        };
      }

      // Get role permissions
      const permissions = await this._getRolePermissions(userRole);
      
      // Map actions to required permissions
      const actionPermissionMap = {
        'access_convener_dashboard': ['create_programme', 'manage_cohorts', 'manage_lessons'],
        'create_programme': ['create_programme'],
        'enroll_in_programme': ['enroll_programme'],
        'modify_system_settings': ['system_settings'],
        'manage_users': ['manage_users'],
        'manage_roles': ['manage_roles'],
        'view_analytics': ['view_analytics', 'view_all_analytics'],
        'manage_cohorts': ['manage_cohorts'],
        'manage_lessons': ['manage_lessons'],
        'manage_enrollments': ['manage_enrollments'],
      };

      // Get required permissions for the action
      const requiredPermissions = actionPermissionMap[action];
      if (!requiredPermissions) {
        // Unknown action - deny by default
        return {
          allowed: false,
          error: roleErrorHandler.createErrorResponse(
            'UNKNOWN_ACTION',
            `Unknown action: ${action}`
          )
        };
      }

      // Check if user has at least one of the required permissions
      const hasPermission = requiredPermissions.some(reqPerm => 
        permissions.some(userPerm => userPerm.name === reqPerm)
      );

      if (!hasPermission) {
        // Determine required role based on action
        let requiredRole = 'convener';
        if (action === 'modify_system_settings' || action === 'manage_users' || action === 'manage_roles') {
          requiredRole = 'administrator';
        }

        roleErrorHandler.logRoleValidationFailure({
          userId,
          action,
          requiredRole,
          userRole,
          resource: resource ? `${resource.type}:${resource.id}` : null
        });

        return {
          allowed: false,
          error: roleErrorHandler.insufficientPermissions(requiredRole, userRole, action)
        };
      }

      // If resource is provided, check resource-level permissions
      if (resource) {
        const resourceAccess = await this._validateResourceAccess(userId, userRole, resource, permissions);
        if (!resourceAccess) {
          roleErrorHandler.logRoleValidationFailure({
            userId,
            action,
            requiredRole: userRole,
            userRole,
            resource: `${resource.type}:${resource.id}`
          });

          return {
            allowed: false,
            error: roleErrorHandler.resourceAccessDenied(
              resource.type,
              resource.id,
              'You do not have permission to access this resource'
            )
          };
        }
      }

      return { allowed: true, error: null };
    } catch (error) {
      console.error('Error in canPerformAction:', error);
      return {
        allowed: false,
        error: roleErrorHandler.createErrorResponse(
          'INTERNAL_ERROR',
          'An error occurred while validating permissions',
          { error: error.message }
        )
      };
    }
  }

  /**
   * Get user's role
   * 
   * @param {number} userId - User ID
   * @returns {Promise<string|null>} - User's role name (e.g., 'student', 'convener', 'administrator')
   * 
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
   */
  async getUserRole(userId) {
    try {
      if (!userId) {
        return null;
      }

      // First check the user table for denormalized role_id
      const user = await db.users.findByPk(userId, {
        include: [{
          model: db.roles,
          as: 'role',
          attributes: ['role_id', 'name', 'hierarchy_level']
        }]
      });

      if (user && user.role) {
        return user.role.name;
      }

      // Fallback: Check user_role_assignments table for active assignment
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
        include: [{
          model: db.roles,
          as: 'role',
          attributes: ['role_id', 'name', 'hierarchy_level']
        }],
        order: [['assigned_at', 'DESC']]
      });

      if (assignment && assignment.role) {
        return assignment.role.name;
      }

      return null;
    } catch (error) {
      console.error('Error in getUserRole:', error);
      return null;
    }
  }

  /**
   * Validate role transition
   * 
   * Validates whether a role change from currentRole to newRole is valid.
   * Checks administrator permissions and ensures system constraints are met.
   * 
   * @param {string} currentRole - Current role name
   * @param {string} newRole - New role name
   * @param {number} adminId - Admin ID making the change
   * @returns {Promise<boolean>} - True if transition is valid
   * 
   * Requirements: 4.1, 4.2, 4.3, 4.4
   */
  async validateRoleTransition(currentRole, newRole, adminId) {
    try {
      // Validate input parameters
      if (!currentRole || !newRole || !adminId) {
        return false;
      }

      // Validate that both roles exist
      const [currentRoleRecord, newRoleRecord] = await Promise.all([
        db.roles.findOne({ where: { name: currentRole } }),
        db.roles.findOne({ where: { name: newRole } })
      ]);

      if (!currentRoleRecord || !newRoleRecord) {
        return false;
      }

      // Get admin's role
      const adminRole = await this.getUserRole(adminId);
      if (!adminRole) {
        return false;
      }

      // Only administrators can change roles
      if (adminRole !== 'administrator') {
        return false;
      }

      // If changing from administrator role, ensure system won't be left without administrators
      if (currentRole === 'administrator') {
        const adminCount = await this._countActiveAdministrators();
        if (adminCount <= 1) {
          // Cannot remove the last administrator
          return false;
        }
      }

      // All validation checks passed
      return true;
    } catch (error) {
      console.error('Error in validateRoleTransition:', error);
      return false;
    }
  }

  /**
   * Get role permissions
   * 
   * @private
   * @param {string} roleName - Role name
   * @returns {Promise<Array>} - Array of permission objects
   */
  async _getRolePermissions(roleName) {
    try {
      // Use the inheritance method to get all permissions including inherited ones
      return await this.getRolePermissionsWithInheritance(roleName);
    } catch (error) {
      console.error('Error in _getRolePermissions:', error);
      return [];
    }
  }

  /**
   * Validate resource access
   * 
   * @private
   * @param {number} userId - User ID
   * @param {string} userRole - User's role name
   * @param {object} resource - Resource object
   * @param {Array} permissions - User's permissions
   * @returns {Promise<boolean>} - True if access is granted
   */
  async _validateResourceAccess(userId, userRole, resource, permissions) {
    try {
      const { type, id, ownerId } = resource;

      // Find relevant permission for this resource type
      const relevantPermission = permissions.find(perm => 
        perm.resource_type === type || perm.resource_type === 'all'
      );

      if (!relevantPermission) {
        return false;
      }

      // Check scope
      switch (relevantPermission.scope) {
        case 'all':
          // Administrator or full access
          return true;
        
        case 'own':
          // User can only access their own resources
          if (ownerId) {
            return userId === ownerId;
          }
          return true;
        
        case 'enrolled':
          // User must be enrolled in the resource (e.g., programme)
          if (type === 'programme' && id) {
            return await this._checkEnrollment(userId, id);
          }
          return false;
        
        case 'assigned':
          // User must be assigned to the resource
          return await this._checkAssignment(userId, type, id);
        
        default:
          return false;
      }
    } catch (error) {
      console.error('Error in _validateResourceAccess:', error);
      return false;
    }
  }

  /**
   * Count active administrators
   * 
   * @private
   * @returns {Promise<number>} - Count of active administrators
   */
  async _countActiveAdministrators() {
    try {
      const adminRole = await db.roles.findOne({
        where: { name: 'administrator' }
      });

      if (!adminRole) {
        return 0;
      }

      const count = await db.user_role_assignments.count({
        where: {
          role_id: adminRole.role_id,
          status: 'active',
          effective_from: {
            [Op.lte]: new Date()
          },
          [Op.or]: [
            { effective_until: null },
            { effective_until: { [Op.gte]: new Date() } }
          ]
        }
      });

      return count;
    } catch (error) {
      console.error('Error in _countActiveAdministrators:', error);
      return 0;
    }
  }

  /**
   * Check if user is enrolled in a programme
   * 
   * @private
   * @param {number} userId - User ID
   * @param {number} programmeId - Programme ID
   * @returns {Promise<boolean>} - True if enrolled
   */
  async _checkEnrollment(userId, programmeId) {
    try {
      const enrollment = await db.enrollments.findOne({
        where: {
          user_id: userId,
          programme_id: programmeId
        }
      });

      return !!enrollment;
    } catch (error) {
      console.error('Error in _checkEnrollment:', error);
      return false;
    }
  }

  /**
   * Check if user is assigned to a resource
   * 
   * @private
   * @param {number} userId - User ID
   * @param {string} resourceType - Resource type
   * @param {string|number} resourceId - Resource ID
   * @returns {Promise<boolean>} - True if assigned
   */
  async _checkAssignment(userId, resourceType, resourceId) {
    try {
      // This would check resource-specific assignment tables
      // For now, return false as a safe default
      // TODO: Implement specific assignment checks based on resource type
      return false;
    } catch (error) {
      console.error('Error in _checkAssignment:', error);
      return false;
    }
  }

  /**
   * Validate role definition modification safety
   * 
   * Ensures that modifying a role definition (adding/removing permissions)
   * won't break existing user assignments or leave users in invalid states.
   * 
   * @param {string} roleId - Role ID being modified
   * @param {Array<string>} newPermissionIds - New set of permission IDs for the role
   * @param {object} options - Validation options
   * @param {boolean} options.checkUserImpact - Whether to check impact on existing users (default: true)
   * @param {boolean} options.allowBreakingChanges - Whether to allow changes that might break existing assignments (default: false)
   * @returns {Promise<object>} - Validation result with safety checks
   * 
   * Requirements: 1.4
   */
  async validateRoleDefinitionModification(roleId, newPermissionIds, options = {}) {
    try {
      const checkUserImpact = options.checkUserImpact !== false;
      const allowBreakingChanges = options.allowBreakingChanges === true;

      // Validate input parameters
      if (!roleId) {
        return {
          valid: false,
          error: roleErrorHandler.createErrorResponse(
            'INVALID_REQUEST',
            'Role ID is required'
          ),
          issues: []
        };
      }

      if (!Array.isArray(newPermissionIds)) {
        return {
          valid: false,
          error: roleErrorHandler.createErrorResponse(
            'INVALID_REQUEST',
            'New permission IDs must be an array'
          ),
          issues: []
        };
      }

      // Get the role being modified
      const role = await db.roles.findOne({
        where: { role_id: roleId },
        include: [{
          model: db.permissions,
          as: 'permissions',
          through: { attributes: [] }
        }]
      });

      if (!role) {
        return {
          valid: false,
          error: roleErrorHandler.createErrorResponse(
            'ROLE_NOT_FOUND',
            `Role with ID ${roleId} not found`
          ),
          issues: []
        };
      }

      // Get current permissions
      const currentPermissionIds = role.permissions.map(p => p.permission_id);

      // Identify changes
      const addedPermissions = newPermissionIds.filter(id => !currentPermissionIds.includes(id));
      const removedPermissions = currentPermissionIds.filter(id => !newPermissionIds.includes(id));

      const issues = [];
      const warnings = [];

      // Check if permissions being added exist
      if (addedPermissions.length > 0) {
        const existingPermissions = await db.permissions.findAll({
          where: { permission_id: addedPermissions }
        });

        const existingPermissionIds = existingPermissions.map(p => p.permission_id);
        const invalidPermissions = addedPermissions.filter(id => !existingPermissionIds.includes(id));

        if (invalidPermissions.length > 0) {
          issues.push({
            type: 'INVALID_PERMISSIONS',
            severity: 'error',
            message: `Cannot add non-existent permissions: ${invalidPermissions.join(', ')}`,
            permissions: invalidPermissions
          });
        }
      }

      // Check impact on existing user assignments
      if (checkUserImpact) {
        const activeAssignments = await db.user_role_assignments.count({
          where: {
            role_id: roleId,
            status: 'active',
            effective_from: {
              [Op.lte]: new Date()
            },
            [Op.or]: [
              { effective_until: null },
              { effective_until: { [Op.gte]: new Date() } }
            ]
          }
        });

        if (activeAssignments > 0) {
          // Check if removing critical permissions
          if (removedPermissions.length > 0) {
            const removedPermissionDetails = await db.permissions.findAll({
              where: { permission_id: removedPermissions },
              attributes: ['permission_id', 'name', 'description', 'resource_type', 'action']
            });

            // Check for critical permissions being removed
            const criticalPermissions = removedPermissionDetails.filter(p => 
              p.action === 'manage' || p.resource_type === 'system'
            );

            if (criticalPermissions.length > 0 && !allowBreakingChanges) {
              issues.push({
                type: 'CRITICAL_PERMISSION_REMOVAL',
                severity: 'error',
                message: `Removing critical permissions would affect ${activeAssignments} active user(s)`,
                affectedUsers: activeAssignments,
                permissions: criticalPermissions.map(p => ({
                  id: p.permission_id,
                  name: p.name,
                  description: p.description
                }))
              });
            } else if (removedPermissions.length > 0) {
              warnings.push({
                type: 'PERMISSION_REMOVAL',
                severity: 'warning',
                message: `Removing permissions will affect ${activeAssignments} active user(s)`,
                affectedUsers: activeAssignments,
                permissions: removedPermissionDetails.map(p => ({
                  id: p.permission_id,
                  name: p.name,
                  description: p.description
                }))
              });
            }
          }

          // Adding permissions is generally safe
          if (addedPermissions.length > 0) {
            warnings.push({
              type: 'PERMISSION_ADDITION',
              severity: 'info',
              message: `Adding permissions will grant new capabilities to ${activeAssignments} active user(s)`,
              affectedUsers: activeAssignments,
              permissionCount: addedPermissions.length
            });
          }
        }
      }

      // Check role hierarchy constraints
      if (role.hierarchy_level > 1) {
        // For higher-level roles, ensure they maintain permission inheritance
        const lowerRoles = await db.roles.findAll({
          where: {
            hierarchy_level: {
              [Op.lt]: role.hierarchy_level
            }
          },
          include: [{
            model: db.permissions,
            as: 'permissions',
            through: { attributes: [] }
          }]
        });

        // Check if new permission set includes all permissions from lower roles
        for (const lowerRole of lowerRoles) {
          const lowerRolePermissionIds = lowerRole.permissions.map(p => p.permission_id);
          const missingPermissions = lowerRolePermissionIds.filter(id => !newPermissionIds.includes(id));

          if (missingPermissions.length > 0 && !allowBreakingChanges) {
            const missingPermissionDetails = await db.permissions.findAll({
              where: { permission_id: missingPermissions },
              attributes: ['permission_id', 'name']
            });

            issues.push({
              type: 'HIERARCHY_VIOLATION',
              severity: 'error',
              message: `Role "${role.name}" (level ${role.hierarchy_level}) must inherit all permissions from "${lowerRole.name}" (level ${lowerRole.hierarchy_level})`,
              lowerRole: lowerRole.name,
              missingPermissions: missingPermissionDetails.map(p => ({
                id: p.permission_id,
                name: p.name
              }))
            });
          }
        }
      }

      // Determine if modification is valid
      const valid = issues.length === 0;

      return {
        valid,
        error: valid ? null : roleErrorHandler.createErrorResponse(
          'ROLE_MODIFICATION_UNSAFE',
          'Role definition modification would create unsafe conditions',
          { issues }
        ),
        issues,
        warnings,
        impact: {
          role: {
            id: role.role_id,
            name: role.name,
            hierarchy_level: role.hierarchy_level
          },
          changes: {
            addedPermissions: addedPermissions.length,
            removedPermissions: removedPermissions.length
          },
          affectedUsers: checkUserImpact ? await db.user_role_assignments.count({
            where: {
              role_id: roleId,
              status: 'active',
              effective_from: {
                [Op.lte]: new Date()
              },
              [Op.or]: [
                { effective_until: null },
                { effective_until: { [Op.gte]: new Date() } }
              ]
            }
          }) : null
        }
      };
    } catch (error) {
      console.error('Error in validateRoleDefinitionModification:', error);
      return {
        valid: false,
        error: roleErrorHandler.createErrorResponse(
          'INTERNAL_ERROR',
          'An error occurred while validating role modification',
          { error: error.message }
        ),
        issues: [],
        warnings: []
      };
    }
  }


   /**
    * Get all permissions for a role including inherited permissions
    *
    * Implements permission inheritance based on role hierarchy.
    * Higher-level roles automatically inherit all permissions from lower-level roles.
    *
    * @param {string} roleName - Role name
    * @returns {Promise<Array>} - Array of permission objects including inherited permissions
    *
    * Requirements: 1.3
    */
   async getRolePermissionsWithInheritance(roleName) {
     try {
       if (!roleName) {
         return [];
       }

       // Get the role with its hierarchy level
       const role = await db.roles.findOne({
         where: { name: roleName },
         include: [{
           model: db.permissions,
           as: 'permissions',
           through: { attributes: [] }
         }]
       });

       if (!role) {
         return [];
       }

       // Get all roles with lower hierarchy levels (to inherit from)
       const lowerRoles = await db.roles.findAll({
         where: {
           hierarchy_level: {
             [Op.lt]: role.hierarchy_level
           }
         },
         include: [{
           model: db.permissions,
           as: 'permissions',
           through: { attributes: [] }
         }]
       });

       // Collect all permissions (own + inherited)
       const allPermissions = new Map();

       // Add permissions from lower-level roles (inherited)
       for (const lowerRole of lowerRoles) {
         if (lowerRole.permissions) {
           for (const permission of lowerRole.permissions) {
             allPermissions.set(permission.permission_id, {
               ...permission.toJSON(),
               inherited_from: lowerRole.name
             });
           }
         }
       }

       // Add own permissions (override inherited if same permission exists)
       if (role.permissions) {
         for (const permission of role.permissions) {
           allPermissions.set(permission.permission_id, {
             ...permission.toJSON(),
             inherited_from: null // Own permission, not inherited
           });
         }
       }

       return Array.from(allPermissions.values());
     } catch (error) {
       console.error('Error in getRolePermissionsWithInheritance:', error);
       return [];
     }
   }

   /**
    * Validate role hierarchy consistency
    *
    * Ensures that higher-level roles have all permissions from lower-level roles.
    * This validates the permission inheritance is correctly maintained.
    *
    * @param {string} roleName - Role name to validate (optional, validates all if not provided)
    * @returns {Promise<object>} - Validation result with any inconsistencies found
    *
    * Requirements: 1.3
    */
   async validateRoleHierarchyConsistency(roleName = null) {
     try {
       const inconsistencies = [];

       // Get roles to validate
       let rolesToValidate;
       if (roleName) {
         const role = await db.roles.findOne({
           where: { name: roleName },
           include: [{
             model: db.permissions,
             as: 'permissions',
             through: { attributes: [] }
           }]
         });
         if (!role) {
           return {
             valid: false,
             error: roleErrorHandler.createErrorResponse(
               'ROLE_NOT_FOUND',
               `Role "${roleName}" not found`
             ),
             inconsistencies: []
           };
         }
         rolesToValidate = [role];
       } else {
         rolesToValidate = await db.roles.findAll({
           include: [{
             model: db.permissions,
             as: 'permissions',
             through: { attributes: [] }
           }],
           order: [['hierarchy_level', 'ASC']]
         });
       }

       // Validate each role
       for (const role of rolesToValidate) {
         // Skip level 1 roles (no inheritance needed)
         if (role.hierarchy_level <= 1) {
           continue;
         }

         // Get all lower-level roles
         const lowerRoles = await db.roles.findAll({
           where: {
             hierarchy_level: {
               [Op.lt]: role.hierarchy_level
             }
           },
           include: [{
             model: db.permissions,
             as: 'permissions',
             through: { attributes: [] }
           }]
         });

         // Collect all permissions that should be inherited
         const requiredPermissions = new Set();
         for (const lowerRole of lowerRoles) {
           if (lowerRole.permissions) {
             for (const permission of lowerRole.permissions) {
               requiredPermissions.add(permission.permission_id);
             }
           }
         }

         // Get current role's permissions
         const currentPermissions = new Set(
           role.permissions ? role.permissions.map(p => p.permission_id) : []
         );

         // Find missing permissions
         const missingPermissions = [];
         for (const requiredPermId of requiredPermissions) {
           if (!currentPermissions.has(requiredPermId)) {
             // Find the permission details
             const permissionDetails = await db.permissions.findByPk(requiredPermId);
             if (permissionDetails) {
               // Find which lower role has this permission
               const sourceRole = lowerRoles.find(lr =>
                 lr.permissions && lr.permissions.some(p => p.permission_id === requiredPermId)
               );

               missingPermissions.push({
                 permission_id: permissionDetails.permission_id,
                 permission_name: permissionDetails.name,
                 permission_description: permissionDetails.description,
                 should_inherit_from: sourceRole ? sourceRole.name : 'unknown'
               });
             }
           }
         }

         if (missingPermissions.length > 0) {
           inconsistencies.push({
             role_id: role.role_id,
             role_name: role.name,
             hierarchy_level: role.hierarchy_level,
             missing_permissions: missingPermissions,
             severity: 'error',
             message: `Role "${role.name}" (level ${role.hierarchy_level}) is missing ${missingPermissions.length} inherited permission(s)`
           });
         }
       }

       const valid = inconsistencies.length === 0;

       return {
         valid,
         error: valid ? null : roleErrorHandler.createErrorResponse(
           'HIERARCHY_INCONSISTENCY',
           'Role hierarchy has permission inheritance inconsistencies',
           { inconsistencies }
         ),
         inconsistencies,
         message: valid
           ? 'Role hierarchy is consistent'
           : `Found ${inconsistencies.length} role(s) with missing inherited permissions`
       };
     } catch (error) {
       console.error('Error in validateRoleHierarchyConsistency:', error);
       return {
         valid: false,
         error: roleErrorHandler.createErrorResponse(
           'INTERNAL_ERROR',
           'An error occurred while validating role hierarchy',
           { error: error.message }
         ),
         inconsistencies: []
       };
     }
   }

   /**
    * Ensure permission inheritance for a role
    *
    * Automatically adds missing inherited permissions to a role based on hierarchy.
    * This enforces the permission inheritance rule.
    *
    * @param {string} roleName - Role name to ensure inheritance for
    * @param {number} adminId - Admin ID performing the operation
    * @returns {Promise<object>} - Result with permissions added
    *
    * Requirements: 1.3
    */
   async ensurePermissionInheritance(roleName, adminId) {
     const transaction = await db.sequelize.transaction();

     try {
       // Validate admin permissions
       if (adminId) {
         const adminRole = await this.getUserRole(adminId);
         if (adminRole !== 'administrator') {
           await transaction.rollback();
           return {
             success: false,
             error: roleErrorHandler.insufficientPermissions(
               'administrator',
               adminRole,
               'ensure_permission_inheritance'
             )
           };
         }
       }

       // Get the role
       const role = await db.roles.findOne({
         where: { name: roleName },
         include: [{
           model: db.permissions,
           as: 'permissions',
           through: { attributes: [] }
         }],
         transaction
       });

       if (!role) {
         await transaction.rollback();
         return {
           success: false,
           error: roleErrorHandler.createErrorResponse(
             'ROLE_NOT_FOUND',
             `Role "${roleName}" not found`
           )
         };
       }

       // Skip level 1 roles (no inheritance needed)
       if (role.hierarchy_level <= 1) {
         await transaction.commit();
         return {
           success: true,
           permissions_added: 0,
           message: `Role "${roleName}" is level 1, no inheritance needed`
         };
       }

       // Get all lower-level roles
       const lowerRoles = await db.roles.findAll({
         where: {
           hierarchy_level: {
             [Op.lt]: role.hierarchy_level
           }
         },
         include: [{
           model: db.permissions,
           as: 'permissions',
           through: { attributes: [] }
         }],
         transaction
       });

       // Collect all permissions that should be inherited
       const requiredPermissions = new Set();
       for (const lowerRole of lowerRoles) {
         if (lowerRole.permissions) {
           for (const permission of lowerRole.permissions) {
             requiredPermissions.add(permission.permission_id);
           }
         }
       }

       // Get current role's permissions
       const currentPermissions = new Set(
         role.permissions ? role.permissions.map(p => p.permission_id) : []
       );

       // Find missing permissions
       const missingPermissions = Array.from(requiredPermissions).filter(
         permId => !currentPermissions.has(permId)
       );

       // Add missing permissions
       if (missingPermissions.length > 0) {
         const mappings = missingPermissions.map(permId => ({
           mapping_id: null, // Will be auto-generated
           role_id: role.role_id,
           permission_id: permId,
           granted_by: adminId,
           granted_at: new Date()
         }));

         await db.role_permissions.bulkCreate(mappings, { transaction });

         await transaction.commit();

         return {
           success: true,
           permissions_added: missingPermissions.length,
           message: `Added ${missingPermissions.length} inherited permission(s) to role "${roleName}"`,
           added_permissions: missingPermissions
         };
       }

       await transaction.commit();

       return {
         success: true,
         permissions_added: 0,
         message: `Role "${roleName}" already has all inherited permissions`
       };
     } catch (error) {
       await transaction.rollback();
       console.error('Error in ensurePermissionInheritance:', error);
       return {
         success: false,
         error: roleErrorHandler.createErrorResponse(
           'INTERNAL_ERROR',
           'Failed to ensure permission inheritance',
           { error: error.message }
         )
       };
     }
   }

  /**
   * Get all permissions for a role including inherited permissions
   * 
   * Implements permission inheritance based on role hierarchy.
   * Higher-level roles automatically inherit all permissions from lower-level roles.
   * 
   * @param {string} roleName - Role name
   * @returns {Promise<Array>} - Array of permission objects including inherited permissions
   * 
   * Requirements: 1.3
   */
  async getRolePermissionsWithInheritance(roleName) {
    try {
      if (!roleName) {
        return [];
      }

      // Get the role with its hierarchy level
      const role = await db.roles.findOne({
        where: { name: roleName },
        include: [{
          model: db.permissions,
          as: 'permissions',
          through: { attributes: [] }
        }]
      });

      if (!role) {
        return [];
      }

      // Get all roles with lower hierarchy levels (to inherit from)
      const lowerRoles = await db.roles.findAll({
        where: {
          hierarchy_level: {
            [Op.lt]: role.hierarchy_level
          }
        },
        include: [{
          model: db.permissions,
          as: 'permissions',
          through: { attributes: [] }
        }]
      });

      // Collect all permissions (own + inherited)
      const allPermissions = new Map();

      // Add permissions from lower-level roles (inherited)
      for (const lowerRole of lowerRoles) {
        if (lowerRole.permissions) {
          for (const permission of lowerRole.permissions) {
            allPermissions.set(permission.permission_id, {
              ...permission.toJSON(),
              inherited_from: lowerRole.name
            });
          }
        }
      }

      // Add own permissions (override inherited if same permission exists)
      if (role.permissions) {
        for (const permission of role.permissions) {
          allPermissions.set(permission.permission_id, {
            ...permission.toJSON(),
            inherited_from: null // Own permission, not inherited
          });
        }
      }

      return Array.from(allPermissions.values());
    } catch (error) {
      console.error('Error in getRolePermissionsWithInheritance:', error);
      return [];
    }
  }

  /**
   * Validate role hierarchy consistency
   * 
   * Ensures that higher-level roles have all permissions from lower-level roles.
   * This validates the permission inheritance is correctly maintained.
   * 
   * @param {string} roleName - Role name to validate (optional, validates all if not provided)
   * @returns {Promise<object>} - Validation result with any inconsistencies found
   * 
   * Requirements: 1.3
   */
  async validateRoleHierarchyConsistency(roleName = null) {
    try {
      const inconsistencies = [];

      // Get roles to validate
      let rolesToValidate;
      if (roleName) {
        const role = await db.roles.findOne({
          where: { name: roleName },
          include: [{
            model: db.permissions,
            as: 'permissions',
            through: { attributes: [] }
          }]
        });
        if (!role) {
          return {
            valid: false,
            error: roleErrorHandler.createErrorResponse(
              'ROLE_NOT_FOUND',
              `Role "${roleName}" not found`
            ),
            inconsistencies: []
          };
        }
        rolesToValidate = [role];
      } else {
        rolesToValidate = await db.roles.findAll({
          include: [{
            model: db.permissions,
            as: 'permissions',
            through: { attributes: [] }
          }],
          order: [['hierarchy_level', 'ASC']]
        });
      }

      // Validate each role
      for (const role of rolesToValidate) {
        // Skip level 1 roles (no inheritance needed)
        if (role.hierarchy_level <= 1) {
          continue;
        }

        // Get all lower-level roles
        const lowerRoles = await db.roles.findAll({
          where: {
            hierarchy_level: {
              [Op.lt]: role.hierarchy_level
            }
          },
          include: [{
            model: db.permissions,
            as: 'permissions',
            through: { attributes: [] }
          }]
        });

        // Collect all permissions that should be inherited
        const requiredPermissions = new Set();
        for (const lowerRole of lowerRoles) {
          if (lowerRole.permissions) {
            for (const permission of lowerRole.permissions) {
              requiredPermissions.add(permission.permission_id);
            }
          }
        }

        // Get current role's permissions
        const currentPermissions = new Set(
          role.permissions ? role.permissions.map(p => p.permission_id) : []
        );

        // Find missing permissions
        const missingPermissions = [];
        for (const requiredPermId of requiredPermissions) {
          if (!currentPermissions.has(requiredPermId)) {
            // Find the permission details
            const permissionDetails = await db.permissions.findByPk(requiredPermId);
            if (permissionDetails) {
              // Find which lower role has this permission
              const sourceRole = lowerRoles.find(lr => 
                lr.permissions && lr.permissions.some(p => p.permission_id === requiredPermId)
              );
              
              missingPermissions.push({
                permission_id: permissionDetails.permission_id,
                permission_name: permissionDetails.name,
                permission_description: permissionDetails.description,
                should_inherit_from: sourceRole ? sourceRole.name : 'unknown'
              });
            }
          }
        }

        if (missingPermissions.length > 0) {
          inconsistencies.push({
            role_id: role.role_id,
            role_name: role.name,
            hierarchy_level: role.hierarchy_level,
            missing_permissions: missingPermissions,
            severity: 'error',
            message: `Role "${role.name}" (level ${role.hierarchy_level}) is missing ${missingPermissions.length} inherited permission(s)`
          });
        }
      }

      const valid = inconsistencies.length === 0;

      return {
        valid,
        error: valid ? null : roleErrorHandler.createErrorResponse(
          'HIERARCHY_INCONSISTENCY',
          'Role hierarchy has permission inheritance inconsistencies',
          { inconsistencies }
        ),
        inconsistencies,
        message: valid 
          ? 'Role hierarchy is consistent' 
          : `Found ${inconsistencies.length} role(s) with missing inherited permissions`
      };
    } catch (error) {
      console.error('Error in validateRoleHierarchyConsistency:', error);
      return {
        valid: false,
        error: roleErrorHandler.createErrorResponse(
          'INTERNAL_ERROR',
          'An error occurred while validating role hierarchy',
          { error: error.message }
        ),
        inconsistencies: []
      };
    }
  }

  /**
   * Ensure permission inheritance for a role
   * 
   * Automatically adds missing inherited permissions to a role based on hierarchy.
   * This enforces the permission inheritance rule.
   * 
   * @param {string} roleName - Role name to ensure inheritance for
   * @param {number} adminId - Admin ID performing the operation
   * @returns {Promise<object>} - Result with permissions added
   * 
   * Requirements: 1.3
   */
  async ensurePermissionInheritance(roleName, adminId) {
    const transaction = await db.sequelize.transaction();
    
    try {
      // Validate admin permissions
      if (adminId) {
        const adminRole = await this.getUserRole(adminId);
        if (adminRole !== 'administrator') {
          await transaction.rollback();
          return {
            success: false,
            error: roleErrorHandler.insufficientPermissions(
              'administrator',
              adminRole,
              'ensure_permission_inheritance'
            )
          };
        }
      }

      // Get the role
      const role = await db.roles.findOne({
        where: { name: roleName },
        include: [{
          model: db.permissions,
          as: 'permissions',
          through: { attributes: [] }
        }],
        transaction
      });

      if (!role) {
        await transaction.rollback();
        return {
          success: false,
          error: roleErrorHandler.createErrorResponse(
            'ROLE_NOT_FOUND',
            `Role "${roleName}" not found`
          )
        };
      }

      // Skip level 1 roles (no inheritance needed)
      if (role.hierarchy_level <= 1) {
        await transaction.commit();
        return {
          success: true,
          permissions_added: 0,
          message: `Role "${roleName}" is level 1, no inheritance needed`
        };
      }

      // Get all lower-level roles
      const lowerRoles = await db.roles.findAll({
        where: {
          hierarchy_level: {
            [Op.lt]: role.hierarchy_level
          }
        },
        include: [{
          model: db.permissions,
          as: 'permissions',
          through: { attributes: [] }
        }],
        transaction
      });

      // Collect all permissions that should be inherited
      const requiredPermissions = new Set();
      for (const lowerRole of lowerRoles) {
        if (lowerRole.permissions) {
          for (const permission of lowerRole.permissions) {
            requiredPermissions.add(permission.permission_id);
          }
        }
      }

      // Get current role's permissions
      const currentPermissions = new Set(
        role.permissions ? role.permissions.map(p => p.permission_id) : []
      );

      // Find missing permissions
      const missingPermissions = Array.from(requiredPermissions).filter(
        permId => !currentPermissions.has(permId)
      );

      // Add missing permissions
      if (missingPermissions.length > 0) {
        const mappings = missingPermissions.map(permId => ({
          mapping_id: null, // Will be auto-generated
          role_id: role.role_id,
          permission_id: permId,
          granted_by: adminId,
          granted_at: new Date()
        }));

        await db.role_permissions.bulkCreate(mappings, { transaction });

        await transaction.commit();

        return {
          success: true,
          permissions_added: missingPermissions.length,
          message: `Added ${missingPermissions.length} inherited permission(s) to role "${roleName}"`,
          added_permissions: missingPermissions
        };
      }

      await transaction.commit();

      return {
        success: true,
        permissions_added: 0,
        message: `Role "${roleName}" already has all inherited permissions`
      };
    } catch (error) {
      await transaction.rollback();
      console.error('Error in ensurePermissionInheritance:', error);
      return {
        success: false,
        error: roleErrorHandler.createErrorResponse(
          'INTERNAL_ERROR',
          'Failed to ensure permission inheritance',
          { error: error.message }
        )
      };
    }
  }

}

module.exports = new RoleValidationService();
