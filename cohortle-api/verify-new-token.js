const jwt = require('jsonwebtoken');
require('dotenv').config();

// New token from the fix script
const newToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJlbWFpbCI6InRlYW1jb2hvcnRsZUBnbWFpbC5jb20iLCJyb2xlIjoic3R1ZGVudCIsInBlcm1pc3Npb25zIjpbInZpZXdfZGFzaGJvYXJkIiwiZW5yb2xsX3Byb2dyYW1tZSIsInZpZXdfbGVzc29ucyIsImNvbXBsZXRlX2xlc3NvbnMiLCJwYXJ0aWNpcGF0ZV9jb21tdW5pdHkiXSwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJpYXQiOjE3NzM0MDk4ODQsImV4cCI6MTc3MzQxMzQ4NH0.xM5wfACuOt245lTCE62KB1ccDpiH_yAS90k05M5Ax1Q';

console.log('=== VERIFYING NEW TOKEN ===');

// Decode without verification to see payload
const decoded = jwt.decode(newToken, { complete: true });
console.log('Token payload:', decoded.payload);

// Check if token is expired
const now = Math.floor(Date.now() / 1000);
console.log('Current timestamp:', now);
console.log('Token expires at:', decoded.payload.exp);
console.log('Token is expired:', now > decoded.payload.exp);
console.log('Time until expiry (minutes):', Math.round((decoded.payload.exp - now) / 60));

// Try to verify with current JWT_SECRET
const currentSecret = process.env.JWT_SECRET;
try {
  const verified = jwt.verify(newToken, currentSecret);
  console.log('✅ Token verified successfully with current JWT_SECRET');
  console.log('User ID:', verified.user_id);
  console.log('Email:', verified.email);
} catch (error) {
  console.log('❌ Token verification failed:', error.message);
}