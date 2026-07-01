require('dotenv').config();

console.log('=== CURRENT JWT_SECRET CHECK ===');
console.log('JWT_SECRET from process.env:', process.env.JWT_SECRET);
console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 'undefined');

// Test creating a token with current secret
const jwt = require('jsonwebtoken');
const testPayload = { user_id: 999, test: true };

try {
  const testToken = jwt.sign(testPayload, process.env.JWT_SECRET, { expiresIn: '1h' });
  console.log('✅ Successfully created test token with current JWT_SECRET');
  
  // Verify the test token
  const verified = jwt.verify(testToken, process.env.JWT_SECRET);
  console.log('✅ Successfully verified test token');
  console.log('Test token payload:', verified);
} catch (error) {
  console.log('❌ Error with JWT operations:', error.message);
}