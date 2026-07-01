const UrlMiddleware = require("../middleware/UrlMiddleware");
const JwtService = require("../services/JwtService");
const RoleValidationService = require("../services/RoleValidationService");
const RoleAssignmentService = require("../services/RoleAssignmentService");
const roleErrorHandler = require("../utils/roleErrorHandler");
const db = require("../models");

module.exports = function (app) {
  /**
   * @swagger
   * /v1/api/roles:
   *   get:
   *     summary: Get all available roles with their permissions
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of all roles with permissions
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: boolean
   *                   example: false
   *                 roles:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       role_id:
   *                         type: string
   *                       name:
   *                         type: string
   *                       description:
   *                         type: string
   *                       hierarchy_level:
   *                         type: number
   *                       permissions:
   *                         type: array
   *                         items:
   *                           type: object
   *       401:
   *         description: Unauthorized
   */
  app.get(
    "/v1/api/roles",
    [UrlMiddleware, JwtService.verifyTokenMiddleware(process.env.JWT_SECRET)],
    async function (req, res) {
      try {
        // Get all roles with their permissions
        const roles = await db.roles.findAll({
          include: [{
            model: db.permissions,
            as: 'permissions',
            through: { attributes: [] },
            attributes: ['permission_id', 'name', 'description', 'resource_type', 'action', 'scope']
          }],
          order: [['hierarchy_level', 'ASC']]
        });

        // Format response
        const formattedRoles = roles.map(role => ({
          role_id: role.role_id,
          name: role.name,
          description: role.description,
          hierarchy_level: role.hierarchy_level,
          permissions: role.permissions.map(perm => ({
            permission_id: perm.permission_id,
            name: perm.name,
            description: perm.description,
            resource_type: perm.resource_type,
            action: perm.action,
            scope: perm.scope
          }))
        }));

        return res.status(200).json({
          error: false,
          roles: formattedRoles
        });
      } catch (err) {
        console.error('Error fetching roles:', err);
        
        // Log error for monitoring
        roleErrorHandler.logResourceAccessDenial({
          userId: req.user_id,
          resourceType: 'roles',
          resourceId: 'all',
          action: 'read',
          reason: err.message
        });

        res.status(500).json(
          roleErrorHandler.createErrorResponse(
            'INTERNAL_ERROR',
            'Failed to fetch roles',
            { error: err.message }
          )
        );
      }
    }
  );

  /**
   * @swagger
   * /v1/api/users/{id}/role:
   *   get:
   *     summary: Get a user's current role
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: User ID
   *     responses:
   *       200:
   *         description: User's current role
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: User not found
   */
  app.get(
    "/v1/api/users/:id/role",
    [UrlMiddleware, JwtService.verifyTokenMiddleware(process.env.JWT_SECRET)],
    async function (req, res) {
      try {
        const userId = parseInt(req.params.id);

        // Validate user exists
        const user = await db.users.findByPk(userId);
        if (!user) {
          return res.status(404).json(
            roleErrorHandler.userNotFound(userId)
          );
        }

        // Get user's current role
        const roleName = await RoleValidationService.getUserRole(userId);
        
        if (!roleName) {
          return res.status(200).json({
            error: false,
            user_id: userId,
            role: null,
            message: "User has no role assigned"
          });
        }

        // Get full role details
        const assignment = await RoleAssignmentService.getCurrentAssignment(userId);

        return res.status(200).json({
          error: false,
          user_id: userId,
          role: assignment ? assignment.role : { name: roleName },
          assignment: assignment
        });
      } catch (err) {
        console.error('Error fetching user role:', err);
        res.status(500).json(
          roleErrorHandler.createErrorResponse(
            'INTERNAL_ERROR',
            'Failed to fetch user role',
            { error: err.message }
          )
        );
      }
    }
  );

  /**
   * @swagger
   * /v1/api/users/{id}/role:
   *   put:
   *     summary: Update a user's role
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: User ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - role
   *             properties:
   *               role:
   *                 type: string
   *                 enum: [student, convener, administrator]
   *               reason:
   *                 type: string
   *     responses:
   *       200:
   *         description: Role updated successfully
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Insufficient permissions
   *       404:
   *         description: User not found
   */
  app.put(
    "/v1/api/users/:id/role",
    [UrlMiddleware, JwtService.verifyRoleMiddleware('administrator', process.env.JWT_SECRET)],
    async function (req, res) {
      try {
        const userId = parseInt(req.params.id);
        const { role, reason } = req.body;

        // Validate input
        if (!role) {
          return res.status(400).json(
            roleErrorHandler.invalidRoleAssignment(
              'Role is required',
              { role: 'This field is required' }
            )
          );
        }

        const validRoles = ['student', 'convener', 'administrator'];
        if (!validRoles.includes(role)) {
          return res.status(400).json(
            roleErrorHandler.invalidRole(role, validRoles)
          );
        }

        // Validate user exists
        const user = await db.users.findByPk(userId);
        if (!user) {
          return res.status(404).json(
            roleErrorHandler.userNotFound(userId)
          );
        }

        // Check if user has a current role
        const currentRole = await RoleValidationService.getUserRole(userId);
        
        if (!currentRole) {
          // User has no role, assign initial role
          const result = await RoleAssignmentService.assignRole(
            userId,
            role,
            req.user_id,
            { notes: reason || 'Role assigned by administrator' }
          );

          if (!result.success) {
            // Log the failed assignment
            roleErrorHandler.logRoleAssignment({
              userId,
              previousRole: null,
              newRole: role,
              changedBy: req.user_id,
              reason: `Assignment failed: ${result.error}`
            });

            return res.status(400).json(
              roleErrorHandler.invalidRoleAssignment(
                result.error,
                result.details || {}
              )
            );
          }

          // Log successful assignment
          roleErrorHandler.logRoleAssignment({
            userId,
            previousRole: null,
            newRole: role,
            changedBy: req.user_id,
            reason: reason || 'Role assigned by administrator'
          });

          return res.status(200).json({
            error: false,
            message: `Role ${role} assigned successfully`,
            assignment: result.assignment
          });
        }

        // User has a role, update it
        const result = await RoleAssignmentService.updateUserRole(
          userId,
          role,
          req.user_id,
          { reason: reason || 'Role updated by administrator' }
        );

        if (!result.success) {
          // Log the failed update
          roleErrorHandler.logRoleAssignment({
            userId,
            previousRole: currentRole,
            newRole: role,
            changedBy: req.user_id,
            reason: `Update failed: ${result.error}`
          });

          return res.status(400).json(
            roleErrorHandler.invalidRoleAssignment(
              result.error,
              result.details || {}
            )
          );
        }

        // Log successful update
        roleErrorHandler.logRoleAssignment({
          userId,
          previousRole: currentRole,
          newRole: role,
          changedBy: req.user_id,
          reason: reason || 'Role updated by administrator'
        });

        return res.status(200).json({
          error: false,
          message: result.message,
          update: result.update
        });
      } catch (err) {
        console.error('Error updating user role:', err);
        res.status(500).json(
          roleErrorHandler.createErrorResponse(
            'INTERNAL_ERROR',
            'Failed to update user role',
            { error: err.message }
          )
        );
      }
    }
  );

  /**
   * @swagger
   * /v1/api/users/with-role/{role}:
   *   get:
   *     summary: Get all users with a specific role
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: role
   *         required: true
   *         schema:
   *           type: string
   *           enum: [student, convener, administrator]
   *         description: Role name
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *         description: Maximum number of users to return
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Number of users to skip
   *     responses:
   *       200:
   *         description: List of users with the specified role
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Insufficient permissions
   */
  app.get(
    "/v1/api/users/with-role/:role",
    [UrlMiddleware, JwtService.verifyRoleMiddleware('administrator', process.env.JWT_SECRET)],
    async function (req, res) {
      try {
        const roleName = req.params.role;
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        // Validate role
        const validRoles = ['student', 'convener', 'administrator'];
        if (!validRoles.includes(roleName)) {
          return res.status(400).json(
            roleErrorHandler.invalidRole(roleName, validRoles)
          );
        }

        // Get role record
        const role = await db.roles.findOne({
          where: { name: roleName }
        });

        if (!role) {
          return res.status(404).json(
            roleErrorHandler.roleNotFound(roleName)
          );
        }

        // Get users with this role
        const { count, rows: users } = await db.users.findAndCountAll({
          where: { role_id: role.role_id },
          attributes: ['id', 'email', 'first_name', 'last_name', 'created_at'],
          limit,
          offset,
          order: [['created_at', 'DESC']]
        });

        // Format response
        const formattedUsers = users.map(user => ({
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          created_at: user.created_at
        }));

        return res.status(200).json({
          error: false,
          role: roleName,
          users: formattedUsers,
          pagination: {
            total: count,
            limit,
            offset,
            has_more: offset + limit < count
          }
        });
      } catch (err) {
        console.error('Error fetching users by role:', err);
        res.status(500).json(
          roleErrorHandler.createErrorResponse(
            'INTERNAL_ERROR',
            'Failed to fetch users by role',
            { error: err.message }
          )
        );
      }
    }
  );

  /**
   * @swagger
   * /v1/api/roles/{roleId}/permissions:
   *   put:
   *     summary: Update role permissions with safety validation
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: roleId
   *         required: true
   *         schema:
   *           type: string
   *         description: Role ID (UUID)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - permissions
   *             properties:
   *               permissions:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Array of permission IDs to assign to the role
   *               allowBreakingChanges:
   *                 type: boolean
   *                 default: false
   *                 description: Whether to allow changes that might break existing assignments
   *               reason:
   *                 type: string
   *                 description: Reason for the modification
   *     responses:
   *       200:
   *         description: Role permissions updated successfully
   *       400:
   *         description: Invalid request or unsafe modification
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Insufficient permissions
   *       404:
   *         description: Role not found
   */
  app.put(
    "/v1/api/roles/:roleId/permissions",
    [UrlMiddleware, JwtService.verifyRoleMiddleware('administrator', process.env.JWT_SECRET)],
    async function (req, res) {
      const transaction = await db.sequelize.transaction();
      
      try {
        const roleId = req.params.roleId;
        const { permissions, allowBreakingChanges, reason } = req.body;

        // Validate input
        if (!permissions || !Array.isArray(permissions)) {
          return res.status(400).json(
            roleErrorHandler.createErrorResponse(
              'INVALID_REQUEST',
              'Permissions array is required',
              { permissions: 'Must be an array of permission IDs' }
            )
          );
        }

        // Validate role definition modification safety
        const validation = await RoleValidationService.validateRoleDefinitionModification(
          roleId,
          permissions,
          {
            checkUserImpact: true,
            allowBreakingChanges: allowBreakingChanges === true
          }
        );

        if (!validation.valid) {
          await transaction.rollback();
          
          // Log the failed modification attempt
          roleErrorHandler.logRoleValidationFailure({
            userId: req.user_id,
            action: 'modify_role_permissions',
            requiredRole: 'administrator',
            userRole: 'administrator',
            resource: `role:${roleId}`,
            reason: 'Safety validation failed'
          });

          return res.status(400).json({
            error: true,
            message: validation.error.message,
            code: validation.error.code,
            issues: validation.issues,
            warnings: validation.warnings,
            impact: validation.impact
          });
        }

        // Get the role
        const role = await db.roles.findOne({
          where: { role_id: roleId },
          transaction
        });

        if (!role) {
          await transaction.rollback();
          return res.status(404).json(
            roleErrorHandler.roleNotFound(roleId)
          );
        }

        // Remove all existing permissions for this role
        await db.role_permissions.destroy({
          where: { role_id: roleId },
          transaction
        });

        // Add new permissions
        const permissionMappings = permissions.map(permissionId => ({
          role_id: roleId,
          permission_id: permissionId,
          granted_by: req.user_id
        }));

        await db.role_permissions.bulkCreate(permissionMappings, { transaction });

        await transaction.commit();

        // Log successful modification
        console.log(`Role permissions modified: ${role.name} by user ${req.user_id}`, {
          roleId,
          roleName: role.name,
          permissionCount: permissions.length,
          affectedUsers: validation.impact.affectedUsers,
          reason: reason || 'No reason provided',
          modifiedBy: req.user_id
        });

        return res.status(200).json({
          error: false,
          message: 'Role permissions updated successfully',
          role: {
            id: role.role_id,
            name: role.name
          },
          permissions: {
            count: permissions.length,
            ids: permissions
          },
          impact: validation.impact,
          warnings: validation.warnings
        });
      } catch (err) {
        await transaction.rollback();
        console.error('Error updating role permissions:', err);
        res.status(500).json(
          roleErrorHandler.createErrorResponse(
            'INTERNAL_ERROR',
            'Failed to update role permissions',
            { error: err.message }
          )
        );
      }
    }
  );

  /**
   * @swagger
   * /v1/api/roles/{roleId}/permissions/validate:
   *   post:
   *     summary: Validate role permission modification without applying changes
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: roleId
   *         required: true
   *         schema:
   *           type: string
   *         description: Role ID (UUID)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - permissions
   *             properties:
   *               permissions:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Array of permission IDs to validate
   *               allowBreakingChanges:
   *                 type: boolean
   *                 default: false
   *     responses:
   *       200:
   *         description: Validation result
   *       400:
   *         description: Invalid request
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Insufficient permissions
   */
  app.post(
    "/v1/api/roles/:roleId/permissions/validate",
    [UrlMiddleware, JwtService.verifyRoleMiddleware('administrator', process.env.JWT_SECRET)],
    async function (req, res) {
      try {
        const roleId = req.params.roleId;
        const { permissions, allowBreakingChanges } = req.body;

        // Validate input
        if (!permissions || !Array.isArray(permissions)) {
          return res.status(400).json(
            roleErrorHandler.createErrorResponse(
              'INVALID_REQUEST',
              'Permissions array is required',
              { permissions: 'Must be an array of permission IDs' }
            )
          );
        }

        // Validate role definition modification safety
        const validation = await RoleValidationService.validateRoleDefinitionModification(
          roleId,
          permissions,
          {
            checkUserImpact: true,
            allowBreakingChanges: allowBreakingChanges === true
          }
        );

        return res.status(200).json({
          error: false,
          valid: validation.valid,
          issues: validation.issues,
          warnings: validation.warnings,
          impact: validation.impact,
          message: validation.valid 
            ? 'Role modification is safe to apply' 
            : 'Role modification has safety concerns'
        });
      } catch (err) {
        console.error('Error validating role permissions:', err);
        res.status(500).json(
          roleErrorHandler.createErrorResponse(
            'INTERNAL_ERROR',
            'Failed to validate role permissions',
            { error: err.message }
          )
        );
      }
    }
  );

  return [];
};
