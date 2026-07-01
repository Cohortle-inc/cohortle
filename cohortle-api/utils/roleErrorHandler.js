/**
 * Role Error Handler Utility
 * 
 * Provides consistent error response formatting, logging, and user guidance
 * for all role validation and authorization errors.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

const errorLogger = require('./errorLogger');

/**
 * Error codes for role-related errors
 */
const ErrorCodes = {
  // Authorization errors (403)
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  ROLE_REQUIRED: 'ROLE_REQUIRED',
  PERMISSION_REQUIRED: 'PERMISSION_REQUIRED',
  RESOURCE_ACCESS_DENIED: 'RESOURCE_ACCESS_DENIED',
  
  // Role assignment errors (400)
  INVALID_ROLE: 'INVALID_ROLE',
  INVALID_ROLE_ASSIGNMENT: 'INVALID_ROLE_ASSIGNMENT',
  ROLE_ASSIGNMENT_FAILED: 'ROLE_ASSIGNMENT_FAILED',
  
  // Role transition errors (409)
  ROLE_TRANSITION_VIOLATION: 'ROLE_TRANSITION_VIOLATION',
  LAST_ADMIN_PROTECTION: 'LAST_ADMIN_PROTECTION',
  INVALID_ROLE_TRANSITION: 'INVALID_ROLE_TRANSITION',
  
  // Token errors (401)
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_ROLE_MISMATCH: 'TOKEN_ROLE_MISMATCH',
  
  // Resource errors (404)
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  ROLE_NOT_FOUND: 'ROLE_NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND'
};

/**
 * Role guidance messages for users
 */
const RoleGuidance = {
  learner: 'This is the default role for all users. You can join programmes and participate in learning activities.',
  convener: 'To access convener features, you need to be upgraded to the convener role. Contact an administrator to request convener access.',
  administrator: 'Administrator access is restricted to platform administrators. Contact the platform owner if you need administrative privileges.'
};

/**
 * Create a consistent error response object
 * 
 * @param {string} code - Error code from ErrorCodes
 * @param {string} message - Human-readable error message
 * @param {object} details - Additional error details (optional)
 * @returns {object} - Formatted error response
 */
function createErrorResponse(code, message, details = {}) {
  const response = {
    error: true,
    message,
    code,
    timestamp: new Date().toISOString()
  };

  if (Object.keys(details).length > 0) {
    response.details = details;
  }

  return response;
}

/**
 * Handle insufficient permissions error (403)
 * 
 * @param {string} requiredRole - Role required for the action
 * @param {string} userRole - User's current role
 * @param {string} action - Action being attempted (optional)
 * @returns {object} - Formatted error response
 * 
 * Requirements: 8.1, 8.3, 8.4
 */
function insufficientPermissions(requiredRole, userRole = null, action = null) {
  let message = 'Insufficient permissions to perform this action.';
  
  if (requiredRole) {
    message = `Insufficient permissions. Required role: ${requiredRole}`;
  }

  const details = {
    required_role: requiredRole
  };

  if (userRole) {
    details.current_role = userRole;
  }

  if (action) {
    details.attempted_action = action;
  }

  // Add user guidance
  if (requiredRole && RoleGuidance[requiredRole]) {
    details.guidance = RoleGuidance[requiredRole];
  }

  return createErrorResponse(ErrorCodes.INSUFFICIENT_PERMISSIONS, message, details);
}

/**
 * Handle role required error (403)
 * 
 * @param {string} requiredRole - Role required
 * @param {string} resource - Resource being accessed (optional)
 * @returns {object} - Formatted error response
 * 
 * Requirements: 8.1, 8.3, 8.4
 */
function roleRequired(requiredRole, resource = null) {
  const message = `Access denied. ${requiredRole} role required.`;
  
  const details = {
    required_role: requiredRole,
    guidance: RoleGuidance[requiredRole] || 'Contact an administrator for access.'
  };

  if (resource) {
    details.resource = resource;
  }

  return createErrorResponse(ErrorCodes.ROLE_REQUIRED, message, details);
}

/**
 * Handle permission required error (403)
 * 
 * @param {string} permission - Permission required
 * @param {string} resource - Resource being accessed (optional)
 * @returns {object} - Formatted error response
 * 
 * Requirements: 8.1, 8.3
 */
function permissionRequired(permission, resource = null) {
  const message = `Access denied. Required permission: ${permission}`;
  
  const details = {
    required_permission: permission,
    guidance: 'Your current role does not have the required permission. Contact an administrator if you need access.'
  };

  if (resource) {
    details.resource = resource;
  }

  return createErrorResponse(ErrorCodes.PERMISSION_REQUIRED, message, details);
}

/**
 * Handle resource access denied error (403 or 404)
 * 
 * @param {string} resourceType - Type of resource
 * @param {string} resourceId - Resource ID (optional)
 * @param {string} reason - Reason for denial (optional)
 * @returns {object} - Formatted error response
 * 
 * Requirements: 8.1, 8.3
 */
function resourceAccessDenied(resourceType, resourceId = null, reason = null) {
  const message = 'Resource not found or access denied.';
  
  const details = {
    resource_type: resourceType
  };

  if (resourceId) {
    details.resource_id = resourceId;
  }

  if (reason) {
    details.reason = reason;
  } else {
    details.guidance = 'You do not have permission to access this resource. Ensure you have the required role or are enrolled in the programme.';
  }

  return createErrorResponse(ErrorCodes.RESOURCE_ACCESS_DENIED, message, details);
}

/**
 * Handle invalid role error (400)
 * 
 * @param {string} providedRole - Role that was provided
 * @param {Array<string>} validRoles - List of valid roles
 * @returns {object} - Formatted error response
 * 
 * Requirements: 8.2
 */
function invalidRole(providedRole, validRoles = ['learner', 'convener', 'administrator']) {
  const message = 'Invalid role specified.';
  
  const details = {
    provided_role: providedRole,
    valid_roles: validRoles,
    guidance: `Role must be one of: ${validRoles.join(', ')}`
  };

  return createErrorResponse(ErrorCodes.INVALID_ROLE, message, details);
}

/**
 * Handle invalid role assignment error (400)
 * 
 * @param {string} reason - Reason for invalid assignment
 * @param {object} validationErrors - Specific validation errors (optional)
 * @returns {object} - Formatted error response
 * 
 * Requirements: 8.2
 */
function invalidRoleAssignment(reason, validationErrors = {}) {
  const message = 'Invalid role assignment.';
  
  const details = {
    reason
  };

  if (Object.keys(validationErrors).length > 0) {
    details.validation_errors = validationErrors;
  }

  return createErrorResponse(ErrorCodes.INVALID_ROLE_ASSIGNMENT, message, details);
}

/**
 * Handle role transition violation error (409)
 * 
 * @param {string} reason - Reason for violation
 * @param {string} currentRole - Current role (optional)
 * @param {string} targetRole - Target role (optional)
 * @returns {object} - Formatted error response
 * 
 * Requirements: 8.2
 */
function roleTransitionViolation(reason, currentRole = null, targetRole = null) {
  const message = 'Role transition not allowed.';
  
  const details = {
    reason
  };

  if (currentRole) {
    details.current_role = currentRole;
  }

  if (targetRole) {
    details.target_role = targetRole;
  }

  return createErrorResponse(ErrorCodes.ROLE_TRANSITION_VIOLATION, message, details);
}

/**
 * Handle last admin protection error (409)
 * 
 * @returns {object} - Formatted error response
 * 
 * Requirements: 8.2
 */
function lastAdminProtection() {
  const message = 'Cannot change role: System would be left without administrators.';
  
  const details = {
    reason: 'At least one administrator must remain in the system.',
    guidance: 'Assign another user as administrator before changing this user\'s role.'
  };

  return createErrorResponse(ErrorCodes.LAST_ADMIN_PROTECTION, message, details);
}

/**
 * Handle token validation error (401)
 * 
 * @param {string} reason - Reason for token error
 * @returns {object} - Formatted error response
 */
function tokenInvalid(reason = 'Invalid or expired token') {
  const message = reason;
  
  const details = {
    guidance: 'Please log in again to continue.'
  };

  return createErrorResponse(ErrorCodes.TOKEN_INVALID, message, details);
}

/**
 * Handle user not found error (404)
 * 
 * @param {number} userId - User ID that was not found
 * @returns {object} - Formatted error response
 */
function userNotFound(userId) {
  const message = 'User not found.';
  
  const details = {
    user_id: userId
  };

  return createErrorResponse(ErrorCodes.USER_NOT_FOUND, message, details);
}

/**
 * Handle role not found error (404)
 * 
 * @param {string} roleName - Role name that was not found
 * @returns {object} - Formatted error response
 */
function roleNotFound(roleName) {
  const message = 'Role not found.';
  
  const details = {
    role: roleName
  };

  return createErrorResponse(ErrorCodes.ROLE_NOT_FOUND, message, details);
}

/**
 * Log role validation failure for security auditing
 * 
 * @param {object} context - Context information about the failure
 * @param {number} context.userId - User ID
 * @param {string} context.action - Action attempted
 * @param {string} context.requiredRole - Required role
 * @param {string} context.userRole - User's current role
 * @param {string} context.resource - Resource being accessed (optional)
 * @param {string} context.ip - IP address (optional)
 * 
 * Requirements: 8.5
 */
function logRoleValidationFailure(context) {
  const logEntry = {
    type: 'ROLE_VALIDATION_FAILURE',
    timestamp: new Date().toISOString(),
    user_id: context.userId,
    action: context.action,
    required_role: context.requiredRole,
    user_role: context.userRole,
    resource: context.resource || null,
    ip: context.ip || null
  };

  errorLogger.logSecurityEvent(logEntry);
}

/**
 * Log role assignment/modification for auditing
 * 
 * @param {object} context - Context information about the assignment
 * @param {number} context.userId - User ID whose role changed
 * @param {string} context.previousRole - Previous role
 * @param {string} context.newRole - New role
 * @param {number} context.changedBy - Admin who made the change
 * @param {string} context.reason - Reason for change (optional)
 * 
 * Requirements: 8.5
 */
function logRoleAssignment(context) {
  const logEntry = {
    type: 'ROLE_ASSIGNMENT',
    timestamp: new Date().toISOString(),
    user_id: context.userId,
    previous_role: context.previousRole,
    new_role: context.newRole,
    changed_by: context.changedBy,
    reason: context.reason || null
  };

  errorLogger.logSecurityEvent(logEntry);
}

/**
 * Log resource access denial for security monitoring
 * 
 * @param {object} context - Context information about the denial
 * @param {number} context.userId - User ID
 * @param {string} context.resourceType - Type of resource
 * @param {string} context.resourceId - Resource ID
 * @param {string} context.action - Action attempted
 * @param {string} context.reason - Reason for denial
 * 
 * Requirements: 8.5
 */
function logResourceAccessDenial(context) {
  const logEntry = {
    type: 'RESOURCE_ACCESS_DENIED',
    timestamp: new Date().toISOString(),
    user_id: context.userId,
    resource_type: context.resourceType,
    resource_id: context.resourceId,
    action: context.action,
    reason: context.reason
  };

  errorLogger.logSecurityEvent(logEntry);
}

module.exports = {
  ErrorCodes,
  RoleGuidance,
  createErrorResponse,
  insufficientPermissions,
  roleRequired,
  permissionRequired,
  resourceAccessDenied,
  invalidRole,
  invalidRoleAssignment,
  roleTransitionViolation,
  lastAdminProtection,
  tokenInvalid,
  userNotFound,
  roleNotFound,
  logRoleValidationFailure,
  logRoleAssignment,
  logResourceAccessDenial
};
