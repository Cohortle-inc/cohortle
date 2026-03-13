const jwt = require('jsonwebtoken');

// Fresh token from production API
const freshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJlbWFpbCI6InRlYW1jb2hvcnRsZUBnbWFpbC5jb20iLCJyb2xlIjoic3R1ZGVudCIsInBlcm1pc3Npb25zIjpbInZpZXdfZGFzaGJvYXJkIiwiZW5yb2xsX3Byb2dyYW1tZSIsInZpZXdfbGVzc29ucyIsImNvbXBsZXRlX2xlc3NvbnMiLCJwYXJ0aWNpcGF0ZV9jb21tdW5pdHkiXSwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJpYXQiOjE3NzM0MTE1NzIsImV4cCI6MTc3MzQxNTE3Mn0.V2n3-qlDilNXMtpBMdWEMgLFVydv6II7T-9KHQ0QWiQ';

console.log('=== TESTING FRESH PRODUCTION TOKEN ===');

// Decode without verification to see payload
const decoded = jwt.decode(freshToken, { complete: true });
console.log('Token payload:', decoded.payload);

// Check if token is expired
const now = Math.floor(Date.now() / 1000);
console.log('Current timestamp:', now);
console.log('Token expires at:', decoded.payload.exp);
console.log('Token is expired:', now > decoded.payload.exp);
console.log('Time until expiry (minutes):', Math.round((decoded.payload.exp - now) / 60));

// Try to verify with different secrets
const secrets = [
  'sharingan',
  'your-secret-key-change-in-production'
];

secrets.forEach(secret => {
  try {
    const verified = jwt.verify(freshToken, secret);
    console.log(`✅ Token verified successfully with secret: ${secret}`);
    console.log('User ID:', verified.user_id);
    console.log('Email:', verified.email);
  } catch (error) {
    console.log(`❌ Token verification failed with secret "${secret}": ${error.message}`);
  }
});

// Test the reset password API call
console.log('\n=== TESTING RESET PASSWORD API CALL ===');
const https = require('https');

const postData = JSON.stringify({
  password: 'newpassword123'
});

const options = {
  hostname: 'api.cohortle.com',
  port: 443,
  path: '/v1/api/auth/reset-password',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${freshToken}`,
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response body:', data);
    if (res.statusCode === 200) {
      console.log('✅ Password reset successful!');
    } else {
      console.log('❌ Password reset failed');
    }
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

req.write(postData);
req.end();