/**
 * Environment Validation Utility for Frontend
 * 
 * Validates that all required environment variables are set correctly
 * for the Next.js frontend application.
 * 
 * Requirements: 2.3, 2.5
 */

interface EnvironmentError {
  variable: string;
  expected: string;
  actual: string;
  severity: 'critical' | 'warning';
}

interface ValidationResult {
  valid: boolean;
  errors: EnvironmentError[];
  warnings: string[];
}

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_API_URL'
];

/**
 * Validates environment configuration
 * @returns {ValidationResult} Validation result with errors and warnings
 */
export function validateEnvironment(): ValidationResult {
  const errors: EnvironmentError[] = [];
  const warnings: string[] = [];

  // Check all required environment variables are present
  for (const varName of REQUIRED_ENV_VARS) {
    const value = process.env[varName];
    
    if (!value) {
      errors.push({
        variable: varName,
        expected: 'non-empty value',
        actual: 'undefined or empty',
        severity: 'critical'
      });
    }
  }

  // Check NEXT_PUBLIC_API_URL points to correct endpoint
  if (process.env.NEXT_PUBLIC_API_URL) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    // Validate URL format
    try {
      new URL(apiUrl);
    } catch (e) {
      errors.push({
        variable: 'NEXT_PUBLIC_API_URL',
        expected: 'valid URL (e.g., https://api.cohortle.com)',
        actual: apiUrl,
        severity: 'critical'
      });
    }

    // Check if URL ends with trailing slash (common mistake)
    if (apiUrl.endsWith('/')) {
      warnings.push('NEXT_PUBLIC_API_URL ends with trailing slash. This may cause issues with API calls.');
    }

    // Warn if using localhost in production build
    if (process.env.NODE_ENV === 'production' && (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1'))) {
      warnings.push('NEXT_PUBLIC_API_URL points to localhost in production build. This will not work for deployed applications.');
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
export function logEnvironmentConfig(): void {
  console.log('\n=== Frontend Environment Configuration ===');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
  console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL || 'NOT SET');
  
  // Log optional variables
  if (process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID) {
    console.log('NEXT_PUBLIC_UMAMI_WEBSITE_ID:', '***SET***');
  } else {
    console.log('NEXT_PUBLIC_UMAMI_WEBSITE_ID:', 'NOT SET (optional)');
  }
  
  console.log('==========================================\n');
}

/**
 * Validates environment and logs results
 * Can be called at build time or runtime
 * @throws {Error} If environment configuration is invalid and failFast is true
 */
export function validateAndLog(failFast: boolean = false): ValidationResult {
  console.log('Validating frontend environment configuration...');
  
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
  
  // Display errors
  if (!result.valid) {
    console.error('\n❌ Environment Validation Failed:');
    result.errors.forEach(error => {
      console.error(`  - ${error.variable}: Expected "${error.expected}", got "${error.actual}" [${error.severity}]`);
    });
    
    if (failFast) {
      console.error('\nPlease fix the environment configuration and rebuild the application.\n');
      throw new Error('Invalid environment configuration. Build cannot proceed.');
    } else {
      console.error('\nPlease fix the environment configuration.\n');
    }
  } else {
    console.log('✅ Environment validation passed\n');
  }
  
  return result;
}

/**
 * Runtime validation for client-side code
 * Checks if NEXT_PUBLIC_API_URL is available in the browser
 */
export function validateRuntimeEnvironment(): ValidationResult {
  const errors: EnvironmentError[] = [];
  const warnings: string[] = [];

  // In browser, check if NEXT_PUBLIC_API_URL is available
  if (typeof window !== 'undefined') {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      errors.push({
        variable: 'NEXT_PUBLIC_API_URL',
        expected: 'non-empty value at runtime',
        actual: 'undefined or empty',
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
