/**
 * Quick fix for password reset token issue
 * Generates a new token with the current JWT_SECRET
 */

require('dotenv').config();
const JwtService = require('./services/JwtService');

// User data from the original token
const userData = {
  user_id: 3,
  email: 'teamcohortle@gmail.com',
  role: 'student',
  permissions: [
    'view_dashboard',
    'enroll_programme', 
    'view_lessons',
    'complete_lessons',
    'participate_community'
  ],
  email_verified: false
};

console.log('=== GENERATING NEW RESET PASSWORD TOKEN ===');
console.log('Current JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
console.log('User email:', userData.email);
console.log('User ID:', userData.user_id);

try {
  // Create new token with 1 hour expiry
  const newToken = JwtService.createAccessToken(
    userData,
    60 * 60 * 1000, // 1 hour
    process.env.JWT_SECRET
  );
  
  console.log('\n✓ New reset password token generated:');
  console.log(newToken);
  
  console.log('\n✓ New reset password link:');
  console.log(`${process.env.FRONTEND_URL}/reset-password?token=${newToken}`);
  
  // Verify the new token works
  const verified = JwtService.verifyAccessToken(newToken, process.env.JWT_SECRET);
  if (verified) {
    console.log('\n✓ New token verification successful');
    console.log('User ID from token:', verified.user_id);
  } else {
    console.log('\n✗ New token verification failed');
  }
  
} catch (error) {
  console.error('\n✗ Failed to generate new token:', error.message);
}

console.log('\n=== INSTRUCTIONS ===');
console.log('1. Copy the new reset password link above');
console.log('2. Use it to reset the password for teamcohortle@gmail.com');
console.log('3. This should work with the current JWT_SECRET configuration');