const jwt = require('jsonwebtoken');

// Token from the logs
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJlbWFpbCI6InRlYW1jb2hvcnRsZUBnbWFpbC5jb20iLCJyb2xlIjoic3R1ZGVudCIsInBlcm1pc3Npb25zIjpbInZpZXdfZGFzaGJvYXJkIiwiZW5yb2xsX3Byb2dyYW1tZSIsInZpZXdfbGVzc29ucyIsImNvbXBsZXRlX2xlc3NvbnMiLCJwYXJ0aWNpcGF0ZV9jb21tdW5pdHkiXSwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJpYXQiOjE3NzMzNTM4NjQsImV4cCI6MTc3MzM1NzQ2NH0.DHPXrcGwtaRITQJQLmgnWhnMy8RYTvzgxD791lMT_Rs';

console.log('=== TOKEN DEBUGGING ===');

// Decode without verification to see payload
const decoded = jwt.decode(token, { complete: true });
console.log('Token header:', decoded.header);
console.log('Token payload:', decoded.payload);

// Check if token is expired
const now = Math.floor(Date.now() / 1000);
console.log('Current timestamp:', now);
console.log('Token expires at:', decoded.payload.exp);
console.log('Token is expired:', now > decoded.payload.exp);

// Try to verify with current JWT_SECRET
const currentSecret = 'sharingan';
try {
  const verified = jwt.verify(token, currentSecret);
  console.log('✅ Token verified successfully with current secret');
  console.log('Verified payload:', verified);
} catch (error) {
  console.log('❌ Token verification failed with current secret:', error.message);
}

// Try to verify with old JWT_SECRET
const oldSecret = 'your-secret-key-change-in-production';
try {
  const verified = jwt.verify(token, oldSecret);
  console.log('✅ Token verified successfully with old secret');
  console.log('Verified payload:', verified);
} catch (error) {
  console.log('❌ Token verification failed with old secret:', error.message);
}