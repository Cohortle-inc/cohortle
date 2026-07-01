/**
 * Multi-Level Access Control Middleware
 * 
 * Provides consistent access control at both route and resource levels.
 * Combines role-based route protection with resource-level permission validation.
 * 
 * Requirements: 6.4 - Multi-level access control
 */

const JwtService = require('../services/JwtService');
const RoleBasedAccessControlService = require('../services/RoleBasedAccessControlService');
const roleErrorHandler = require('../utils/roleErrorHandler');

/**
 * Create multi-level access control middleware
 * 
 * This middleware performs two levels of access control:
 * 1. Route-level: Validates user has required role to access the route
 * 2. Resource-level: Validates user has permission to perform action on specific resource
 * 
 * @param {object} config - Configuration object
 * @param {string|Array<string>} config.requiredRoles - Required role(s) for route access
 * @param {string} config.resourceType - Type of resource being accessed (optional for route-only checks)
 * @param {string} config.resourceIdParam - Request parameter containing resource ID (e.g., 'id', 'programmeId')
 * @param {string} config.action - Action being performed (e.g., 'read', 'update', 'delete', 'manage')
 * @param {boolean} config.skipResourceCheck - Skip resource-level check (route-level only)
 * @returns {Array<Function>} - Array of middleware functions
 * 
 * @example
 * // Route-level only (no specific resource)
 * app.get('/api/programmes', 
 *   multiLevelAccessControl({
 *     requiredRoles: ['student', 'convener', 'administrator'],
 *     skipResourceCheck: true
 *   }),
 *   handler
 * );
 * 
 * @example
 * // Route + resource level
 * app.put('/api/programmes/:id',
 *   multiLevelAccessControl({
 *     requiredRoles: ['convener', 'administrator'],
 *     resourceType: 'programme',
 *     resourceIdParam: 'id',
 *     action: 'update'
 *   }),
 *   handler
 * );
 * 
 * @example
 * // Multiple roles with resource check
 * app.delete('/api/cohorts/:cohortId',
 *   multiLevelAccessControl({
 *     requiredRoles: ['convener', 'administrator'],
 *     resourceType: 'cohort',
 *     resourceIdParam: 'cohortId',
 *     action: 'delete'
 *   }),
 *   handler
 * );
 */
function multiLevelAccessControl(config) {
  const {
    requiredRoles,
    resourceType,
    resourceIdParam,
    action,
    skipResourceCheck = false
  } = config;

  // Validate configuration
  if (!requiredRoles) {
    throw new Error('multiLevelAccessControl: requiredRoles is required');
  }

  if (!skipResourceCheck && (!resourceType || !resourceIdParam || !action)) {
    throw new Error('multiLevelAccessControl: resourceType, resourceIdParam, and action are required when skipResourceCheck is false');
  }

  const middlewares = [];

  // 1. Route-level access control: Validate user has required role
  middlewares.push(JwtService.verifyRoleMiddleware(requiredRoles, process.env.JWT_SECRET));

  // 2. Resource-level access control: Validate user can access specific resource
  if (!skipResourceCheck) {
    middlewares.push(async function resourceLevelAccessControl(req, res, next) {
      try {
        const userId = req.user_id;
        const resourceId = req.params[resourceIdParam] || req.body[resourceIdParam];

        if (!resourceId) {
          return res.status(400).json({
            success: false,
            error: true,
            message: `Resource ID parameter '${resourceIdParam}' is required`,
            code: 'MISSING_RESOURCE_ID'
          });
        }

        // Check resource-level access
        const { allowed, error } = await RoleBasedAccessControlService.canAccessResource(
          userId,
          resourceType,
          resourceId,
          action
        );

        if (!allowed) {
          // Log access denial for security monitoring
          roleErrorHandler.logResourceAccessDenial({
            userId,
            resourceType,
            resourceId,
            action,
            reason: error?.message || 'Access denied',
            route: req.path,
            method: req.method
          });

          return res.status(error?.code === 'RESOURCE_NOT_FOUND' ? 404 : 403).json({
            success: false,
            ...error
          });
        }

        // Access granted - attach resource info to request for handler use
        req.resourceAccess = {
          resourceType,
          resourceId,
          action,
          validated: true
        };

        next();
      } catch (error) {
        console.error('Error in resource-level access control:', error);
        return res.status(500).json({
          success: false,
          error: true,
          message: 'An error occurred while validating resource access',
          code: 'INTERNAL_ERROR'
        });
      }
    });
  }

  return middlewares;
}

/**
 * Create route-level only access control middleware
 * Convenience wrapper for route-level checks without resource validation
 * 
 * @param {string|Array<string>} requiredRoles - Required role(s)
 * @returns {Array<Function>} - Array of middleware functions
 * 
 * @example
 * app.get('/api/dashboard', routeLevelAccessControl('student'), handler);
 */
function routeLevelAccessControl(requiredRoles) {
  return multiLevelAccessControl({
    requiredRoles,
    skipResourceCheck: true
  });
}

/**
 * Create resource-level access control middleware
 * For routes that need resource validation but already have route-level auth
 * 
 * @param {object} config - Configuration object
 * @param {string} config.resourceType - Type of resource
 * @param {string} config.resourceIdParam - Request parameter containing resource ID
 * @param {string} config.action - Action being performed
 * @returns {Function} - Middleware function
 * 
 * @example
 * app.put('/api/programmes/:id',
 *   JwtService.verifyTokenMiddleware(process.env.JWT_SECRET),
 *   resourceLevelAccessControl({
 *     resourceType: 'programme',
 *     resourceIdParam: 'id',
 *     action: 'update'
 *   }),
 *   handler
 * );
 */
function resourceLevelAccessControl(config) {
  const { resourceType, resourceIdParam, action } = config;

  if (!resourceType || !resourceIdParam || !action) {
    throw new Error('resourceLevelAccessControl: resourceType, resourceIdParam, and action are required');
  }

  return async function (req, res, next) {
    try {
      const userId = req.user_id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: true,
          message: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
      }

      const resourceId = req.params[resourceIdParam] || req.body[resourceIdParam];

      if (!resourceId) {
        return res.status(400).json({
          success: false,
          error: true,
          message: `Resource ID parameter '${resourceIdParam}' is required`,
          code: 'MISSING_RESOURCE_ID'
        });
      }

      // Check resource-level access
      const { allowed, error } = await RoleBasedAccessControlService.canAccessResource(
        userId,
        resourceType,
        resourceId,
        action
      );

      if (!allowed) {
        // Log access denial for security monitoring
        roleErrorHandler.logResourceAccessDenial({
          userId,
          resourceType,
          resourceId,
          action,
          reason: error?.message || 'Access denied',
          route: req.path,
          method: req.method
        });

        return res.status(error?.code === 'RESOURCE_NOT_FOUND' ? 404 : 403).json({
          success: false,
          ...error
        });
      }

      // Access granted - attach resource info to request
      req.resourceAccess = {
        resourceType,
        resourceId,
        action,
        validated: true
      };

      next();
    } catch (error) {
      console.error('Error in resource-level access control:', error);
      return res.status(500).json({
        success: false,
        error: true,
        message: 'An error occurred while validating resource access',
        code: 'INTERNAL_ERROR'
      });
    }
  };
}

module.exports = {
  multiLevelAccessControl,
  routeLevelAccessControl,
  resourceLevelAccessControl
};
