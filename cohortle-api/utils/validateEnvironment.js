/**
 * Environment Validation Utility
 * 
 * Validates that all required environment variables are set correctly
 * and logs configuration for debugging (without sensitive values).
 * 
 * Requirements: 2.1, 2.2, 2.5, 2.6
 */

const { resolveDbConfig } = require('./dbEnvironment');

const REQUIRED_ENV_VARS = [
  'NODE_ENV',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
  'PORT'
];

const SENSITIVE_VARS = [
  'DB_PASSWORD',
  'JWT_SECRET',
  'BUNNY_STREAM_API_KEY'
];

/**
 * Validates environment configuration
 * @returns {Object} { valid: boolean, errors: Array, warnings: Array }
 */
function validateEnvironment() {
  const errors = [];
  const warnings = [];
  const dbConfig = resolveDbConfig();

  // Check all required environment variables are present
  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      errors.push({
        variable: varName,
        expected: 'non-empty value',
        actual: 'undefined or empty',
        severity: 'critical'
      });
    }
  }

  if (!process.env.DB_HOSTNAME && !process.env.DB_HOST && !process.env.DB_HOSTNAME) {
    errors.push({
      variable: 'DB_HOSTNAME/DB_HOST',
      expected: 'non-empty value',
      actual: 'undefined or empty',
      severity: 'critical'
    });
  }

  if (!process.env.DB_DATABASE && !process.env.DB_NAME) {
    errors.push({
      variable: 'DB_DATABASE/DB_NAME',
      expected: 'non-empty value',
      actual: 'undefined or empty',
      severity: 'critical'
    });
  }

  // Check NODE_ENV is set correctly
  if (process.env.NODE_ENV) {
    const nodeEnv = process.env.NODE_ENV.toLowerCase();

    // In production, NODE_ENV should be "production"
    if (dbConfig.host && !dbConfig.host.includes('127.0.0.1') && !dbConfig.host.includes('localhost')) {
      if (nodeEnv !== 'production') {
        errors.push({
          variable: 'NODE_ENV',
          expected: 'production',
          actual: process.env.NODE_ENV,
          severity: 'critical'
        });
      }
    }
  }

  // Check DB_DATABASE is not "cohortle.com" (common mistake)
  if (dbConfig.database === 'cohortle.com') {
    errors.push({
      variable: 'DB_DATABASE/DB_NAME',
      expected: 'actual database name (e.g., "cohortle")',
      actual: 'cohortle.com',
      severity: 'critical'
    });
  }

  // Check JWT_SECRET is not the default value
  if (process.env.JWT_SECRET === 'your-secret-key-change-in-production') {
    warnings.push('JWT_SECRET is set to default value. Please change it in production.');
  }

  // Check PORT is a valid number
  if (process.env.PORT) {
    const port = parseInt(process.env.PORT, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      errors.push({
        variable: 'PORT',
        expected: 'valid port number (1-65535)',
        actual: process.env.PORT,
        severity: 'critical'
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Logs environment configuration (without sensitive values)
 */
function logEnvironmentConfig() {
  console.log('\n=== Environment Configuration ===');
  const dbConfig = resolveDbConfig();
  console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
  console.log('PORT:', process.env.PORT || 'NOT SET');
  console.log('DB_HOSTNAME/DB_HOST:', dbConfig.host || 'NOT SET');
  console.log('DB_PORT:', dbConfig.port || 'NOT SET');
  console.log('DB_USER:', dbConfig.user || 'NOT SET');
  console.log('DB_DATABASE/DB_NAME:', dbConfig.database || 'NOT SET');
  
  // Log sensitive variables as masked
  for (const varName of SENSITIVE_VARS) {
    if (process.env[varName]) {
      console.log(`${varName}:`, '***SET***');
    } else {
      console.log(`${varName}:`, 'NOT SET');
    }
  }
  
  console.log('=================================\n');
}

/**
 * Validates environment and fails fast if configuration is invalid
 * @throws {Error} If environment configuration is invalid
 */
function validateAndFailFast() {
  console.log('Validating environment configuration...');
  
  const result = validateEnvironment();
  
  // Log configuration for debugging
  logEnvironmentConfig();
  
  // Display warnings
  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Environment Warnings:');
    result.warnings.forEach(warning => {
      console.warn(`  - ${warning}`);
    });
  }
  
  // Display errors and fail if any critical issues
  if (!result.valid) {
    console.error('\n❌ Environment Validation Failed:');
    result.errors.forEach(error => {
      console.error(`  - ${error.variable}: Expected "${error.expected}", got "${error.actual}" [${error.severity}]`);
    });
    console.error('\nPlease fix the environment configuration and restart the server.\n');
    
    throw new Error('Invalid environment configuration. Server cannot start.');
  }
  
  console.log('✅ Environment validation passed\n');
}

module.exports = {
  validateEnvironment,
  logEnvironmentConfig,
  validateAndFailFast
};
