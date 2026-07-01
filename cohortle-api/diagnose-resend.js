/**
 * Diagnostic script to check Resend email configuration
 * Run this in production to verify RESEND_API_KEY is set correctly
 */

require('dotenv').config();

console.log('=== Resend Email Configuration Diagnostic ===\n');

// Check if RESEND_API_KEY is set
const apiKey = process.env.RESEND_API_KEY;
console.log('1. RESEND_API_KEY environment variable:');
if (!apiKey) {
  console.error('   ❌ NOT SET - Email functionality will not work!');
  console.log('   → Add RESEND_API_KEY to your environment variables in Coolify');
} else {
  console.log('   ✓ SET');
  console.log(`   → Key starts with: ${apiKey.substring(0, 7)}...`);
  console.log(`   → Key length: ${apiKey.length} characters`);
}

console.log('\n2. Resend client initialization:');
try {
  const resendClient = require('./lib/resend');
  if (resendClient) {
    console.log('   ✓ Resend client initialized successfully');
  } else {
    console.error('   ❌ Resend client is null (API key missing)');
  }
} catch (error) {
  console.error('   ❌ Failed to initialize Resend client:', error.message);
}

console.log('\n3. ResendService availability:');
try {
  const ResendService = require('./services/ResendService');
  console.log('   ✓ ResendService loaded successfully');
  console.log(`   → Sender email: ${ResendService.SENDER_EMAIL}`);
  console.log(`   → Sender name: ${ResendService.SENDER_NAME}`);
} catch (error) {
  console.error('   ❌ Failed to load ResendService:', error.message);
}

console.log('\n4. Test email sending (dry run):');
if (!apiKey) {
  console.log('   ⚠ Skipped - RESEND_API_KEY not set');
} else {
  console.log('   ℹ To test actual email sending, use the forgot-password endpoint');
  console.log('   → POST /v1/api/auth/forgot-password');
  console.log('   → Body: { "email": "your-test-email@example.com" }');
}

console.log('\n=== Diagnostic Complete ===');
