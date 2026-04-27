/**
 * Generate a secure JWT secret for production use
 */

const crypto = require('crypto');

console.log('=== JWT SECRET GENERATOR ===');
console.log('');

// Generate a secure 64-byte random secret
const jwtSecret = crypto.randomBytes(64).toString('hex');

console.log('Generated JWT Secret:');
console.log(jwtSecret);
console.log('');
console.log('Length:', jwtSecret.length, 'characters');
console.log('');
console.log('=== DEPLOYMENT INSTRUCTIONS ===');
console.log('1. Copy the JWT secret above');
console.log('2. Update JWT_SECRET in your production environment');
console.log('3. Restart the application');
console.log('4. Test the forgot/reset password flow');
console.log('');
console.log('⚠️  WARNING: Changing JWT_SECRET will invalidate all existing user tokens');
console.log('   Users will need to log in again after this change');
console.log('');
console.log('For Coolify deployment:');
console.log('- Go to your cohortle-api service');
console.log('- Navigate to Environment Variables');
console.log('- Update JWT_SECRET with the value above');
console.log('- Deploy the changes');