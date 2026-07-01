#!/usr/bin/env node

/**
 * Standalone Environment Validation Script
 * 
 * Run this script to validate environment configuration without starting the server.
 * Usage: node validate-environment.js
 * 
 * Requirements: 2.1, 2.2, 2.5, 2.6
 */

require('dotenv').config();
const { validateEnvironment, logEnvironmentConfig } = require('./utils/validateEnvironment');

console.log('===========================================');
console.log('  Environment Validation Script');
console.log('===========================================\n');

// Log current configuration
logEnvironmentConfig();

// Validate environment
const result = validateEnvironment();

// Display warnings
if (result.warnings.length > 0) {
  console.log('⚠️  Warnings:');
  result.warnings.forEach(warning => {
    console.log(`  - ${warning}`);
  });
  console.log('');
}

// Display results
if (result.valid) {
  console.log('✅ Environment validation PASSED');
  console.log('All required environment variables are set correctly.\n');
  process.exit(0);
} else {
  console.log('❌ Environment validation FAILED\n');
  console.log('Errors found:');
  result.errors.forEach(error => {
    console.log(`  - ${error.variable}:`);
    console.log(`    Expected: ${error.expected}`);
    console.log(`    Actual: ${error.actual}`);
    console.log(`    Severity: ${error.severity}`);
  });
  console.log('\nPlease fix these issues before starting the server.\n');
  process.exit(1);
}
