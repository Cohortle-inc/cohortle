#!/usr/bin/env node

/**
 * Standalone Environment Validation Script for Frontend
 * 
 * This script can be run from the command line to validate environment variables
 * before building or deploying the frontend application.
 * 
 * Usage:
 *   node validate-environment.js
 *   npm run validate-env (if added to package.json scripts)
 * 
 * Requirements: 2.3, 2.5
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local if it exists
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key] = value;
      }
    }
  });
}

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_API_URL'
];

/**
 * Validates environment configuration
 */
function validateEnvironment() {
  const errors = [];
  const warnings = [];

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

    // Check if pointing to correct production endpoint
    const isProduction = process.env.NODE_ENV === 'production';
    const isProductionUrl = apiUrl.includes('cohortle.com') || apiUrl.includes('production');
    
    if (isProduction && !isProductionUrl && !apiUrl.includes('localhost')) {
      warnings.push(`NEXT_PUBLIC_API_URL (${apiUrl}) may not be pointing to production endpoint in production build.`);
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
 * Main validation function
 */
function main() {
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
  
  // Display errors and exit with error code if validation fails
  if (!result.valid) {
    console.error('\n❌ Environment Validation Failed:');
    result.errors.forEach(error => {
      console.error(`  - ${error.variable}: Expected "${error.expected}", got "${error.actual}" [${error.severity}]`);
    });
    console.error('\nPlease fix the environment configuration and try again.\n');
    console.error('For build time: Ensure NEXT_PUBLIC_API_URL is set in your environment or .env.local file');
    console.error('For runtime: Ensure NEXT_PUBLIC_API_URL is available in the browser\n');
    
    process.exit(1);
  }
  
  console.log('✅ Environment validation passed\n');
  process.exit(0);
}

// Run validation
main();
