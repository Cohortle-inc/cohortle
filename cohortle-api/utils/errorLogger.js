/**
 * Error Logging Utility
 * Centralized error logging for API routes
 */

/**
 * Log API error with context
 * @param {string} context - Context of the error (e.g., "Create programme")
 * @param {Error} error - The error object
 * @param {Object} req - Express request object
 * @param {Object} data - Additional data to log
 */
function logApiError(context, error, req = null, data = null) {
  console.group(`❌ API Error: ${context}`);
  
  // Log timestamp
  console.log('Timestamp:', new Date().toISOString());
  
  // Log request details if available
  if (req) {
    console.log('Request:', {
      method: req.method,
      url: req.originalUrl || req.url,
      userId: req.user_id || 'anonymous',
      userRole: req.user_role || 'unknown',
      ip: req.ip || req.connection?.remoteAddress,
    });
    
    // Log request body (excluding sensitive data)
    if (req.body && Object.keys(req.body).length > 0) {
      const sanitizedBody = { ...req.body };
      // Remove sensitive fields
      delete sanitizedBody.password;
      delete sanitizedBody.token;
      console.log('Request Body:', sanitizedBody);
    }
  }
  
  // Log error details
  console.error('Error:', error.message);
  if (error.stack) {
    console.error('Stack:', error.stack);
  }
  
  // Log additional data
  if (data) {
    console.log('Additional Data:', data);
  }
  
  console.groupEnd();
}

/**
 * Log validation error with field details
 * @param {string} context - Context of the validation
 * @param {Object} errors - Validation errors object
 * @param {Object} req - Express request object
 */
function logValidationError(context, errors, req = null) {
  console.group(`⚠️  Validation Error: ${context}`);
  
  console.log('Timestamp:', new Date().toISOString());
  
  if (req) {
    console.log('Request:', {
      method: req.method,
      url: req.originalUrl || req.url,
      userId: req.user_id || 'anonymous',
    });
  }
  
  console.log('Validation Errors:', errors);
  
  console.groupEnd();
}

/**
 * Log successful operation
 * @param {string} context - Context of the operation
 * @param {Object} req - Express request object
 * @param {Object} data - Result data
 */
function logSuccess(context, req = null, data = null) {
  if (process.env.NODE_ENV === 'production') {
    // In production, only log minimal info
    console.log(`✅ ${context} - User: ${req?.user_id || 'anonymous'}`);
    return;
  }
  
  console.group(`✅ Success: ${context}`);
  
  console.log('Timestamp:', new Date().toISOString());
  
  if (req) {
    console.log('Request:', {
      method: req.method,
      url: req.originalUrl || req.url,
      userId: req.user_id || 'anonymous',
    });
  }
  
  if (data) {
    console.log('Result:', data);
  }
  
  console.groupEnd();
}

/**
 * Log database operation
 * @param {string} operation - Database operation (e.g., "INSERT", "UPDATE")
 * @param {string} table - Table name
 * @param {Object} data - Data being operated on
 */
function logDatabaseOperation(operation, table, data = null) {
  if (process.env.NODE_ENV === 'production') {
    // In production, only log minimal info
    console.log(`🗄️  ${operation} ${table}`);
    return;
  }
  
  console.group(`🗄️  Database: ${operation} ${table}`);
  
  console.log('Timestamp:', new Date().toISOString());
  
  if (data) {
    console.log('Data:', data);
  }
  
  console.groupEnd();
}

module.exports = {
  logApiError,
  logValidationError,
  logSuccess,
  logDatabaseOperation,
};

/**
 * Log security event (access denials, authorization failures, etc.)
 * @param {Object} event - Security event details
 */
function logSecurityEvent(event) {
  if (process.env.NODE_ENV === 'test') {
    // In test environment, don't log to avoid cluttering test output
    return;
  }

  console.group(`🔒 Security Event: ${event.type}`);
  
  console.log('Timestamp:', event.timestamp || new Date().toISOString());
  console.log('User ID:', event.user_id || 'anonymous');
  
  if (event.resource_type && event.resource_id) {
    console.log('Resource:', `${event.resource_type}:${event.resource_id}`);
  }
  
  if (event.action) {
    console.log('Action:', event.action);
  }
  
  if (event.reason) {
    console.log('Reason:', event.reason);
  }
  
  if (event.route) {
    console.log('Route:', `${event.method} ${event.route}`);
  }
  
  console.groupEnd();
}

module.exports = {
  logApiError,
  logValidationError,
  logSuccess,
  logDatabaseOperation,
  logSecurityEvent,
};
