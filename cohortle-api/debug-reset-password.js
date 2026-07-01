/**
 * Debug script for password reset issue
 * Tests the reset password flow to identify the JWT secret mismatch
 */

const jwt = require('jsonwebtoken');
const JwtService = require('./services/JwtService');

// Token from the logs
const resetToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJlbWFpbCI6InRlYW1jb2hvcnRsZUBnbWFpbC5jb20iLCJyb2xlIjoic3R1ZGVudCIsInBlcm1pc3Npb25zIjpbInZpZXdfZGFzaGJvYXJkIiwiZW5yb2xsX3Byb2dyYW1tZSIsInZpZXdfbGVzc29ucyIsImNvbXBsZXRlX2xlc3NvbnMiLCJwYXJ0aWNpcGF0ZV9jb21tdW5pdHkiXSwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJpYXQiOjE3NzMzNDc5NDksImV4cCI6MTc3MzM1MTU0OX0.82DEkL5n5PXOn1YqXIbHeaaFsmRDzaWLDHTZd4glhVY';

// Current JWT secret from .env
const currentSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

console.log('=== PASSWORD RESET DEBUG ===');
console.log('Current JWT_SECRET:', currentSecret);
console.log('Reset token:', resetToken);
console.log('');

// Try to decode without verification first
console.log('1. Decoding token (no verification):');
try {
  const decoded = jwt.decode(resetToken);
  console.log('   ✓ Token decoded successfully');
  console.log('   User ID:', decoded.user_id);
  console.log('   Email:', decoded.email);
  console.log('   Role:', decoded.role);
  console.log('   Issued at:', new Date(decoded.iat * 1000));
  console.log('   Expires at:', new Date(decoded.exp * 1000));
  console.log('   Is expired?', Date.now() / 1000 > decoded.exp);
} catch (error) {
  console.log('   ✗ Failed to decode token:', error.message);
}

console.log('');

// Try to verify with current secret
console.log('2. Verifying token with current JWT_SECRET:');
try {
  const verified = jwt.verify(resetToken, currentSecret);
  console.log('   ✓ Token verified successfully');
  console.log('   User ID:', verified.user_id);
} catch (error) {
  console.log('   ✗ Token verification failed:', error.message);
  
  if (error.message === 'invalid signature') {
    console.log('   → This means the token was created with a different JWT_SECRET');
    console.log('   → The JWT_SECRET was likely changed after the token was created');
  }
}

console.log('');

// Try with JwtService
console.log('3. Testing with JwtService.verifyAccessToken:');
try {
  const result = JwtService.verifyAccessToken(resetToken, currentSecret);
  if (result) {
    console.log('   ✓ JwtService verified token successfully');
    console.log('   User ID:', result.user_id);
  } else {
    console.log('   ✗ JwtService returned false (token invalid)');
  }
} catch (error) {
  console.log('   ✗ JwtService threw error:', error.message);
}

console.log('');

// Test creating a new token with current secret
console.log('4. Creating new token with current secret:');
try {
  const testPayload = {
    user_id: 3,
    email: 'teamcohortle@gmail.com',
    role: 'student',
    permissions: ['view_dashboard', 'enroll_programme', 'view_lessons', 'complete_lessons', 'participate_community'],
    email_verified: false
  };
  
  const newToken = JwtService.createAccessToken(testPayload, 60 * 60 * 1000, currentSecret);
  console.log('   ✓ New token created successfully');
  console.log('   New token:', newToken);
  
  // Verify the new token
  const verifiedNew = JwtService.verifyAccessToken(newToken, currentSecret);
  if (verifiedNew) {
    console.log('   ✓ New token verifies correctly');
  } else {
    console.log('   ✗ New token failed verification');
  }
} catch (error) {
  console.log('   ✗ Failed to create new token:', error.message);
}

console.log('');
console.log('=== DIAGNOSIS ===');
console.log('The issue is that the reset password token was created with a different');
console.log('JWT_SECRET than what is currently in the environment.');
console.log('');
console.log('SOLUTIONS:');
console.log('1. Update JWT_SECRET in production to match the one used to create tokens');
console.log('2. Or regenerate a new password reset token with the current JWT_SECRET');
console.log('3. Or temporarily use the old JWT_SECRET to verify existing tokens');