/**
 * Simple script to get an auth token for testing
 * Usage: node get-auth-token.js your-email@example.com your-password
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://z8ssok8c0k8040w0kkocog0s.107.175.94.134.sslip.io';

async function getAuthToken(email, password) {
  try {
    console.log('🔐 Logging in...');
    console.log(`   Email: ${email}`);
    console.log(`   API: ${API_URL}`);
    console.log('');

    const response = await axios.post(`${API_URL}/v1/api/auth/login`, {
      email,
      password
    });

    if (response.data.error) {
      console.error('❌ Login failed:', response.data.message);
      process.exit(1);
    }

    console.log('✅ Login successful!');
    console.log('');
    console.log('📋 Your Auth Token:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(response.data.token);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('👤 User Info:');
    console.log(`   ID: ${response.data.user.id}`);
    console.log(`   Email: ${response.data.user.email}`);
    console.log(`   Role: ${response.data.user.role}`);
    console.log('');
    console.log('📝 Example Usage:');
    console.log('');
    console.log('curl -X GET https://api.cohortle.com/v1/api/modules/1/lessons \\');
    console.log(`  -H "Authorization: Bearer ${response.data.token}"`);
    console.log('');

    return response.data.token;
  } catch (error) {
    if (error.response) {
      console.error('❌ Login failed:', error.response.data.message || error.response.statusText);
      console.error('   Status:', error.response.status);
    } else if (error.request) {
      console.error('❌ Network error: Could not reach the API');
      console.error('   Make sure the API is running at:', API_URL);
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

// Get email and password from command line arguments
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: node get-auth-token.js <email> <password>');
  console.log('');
  console.log('Example:');
  console.log('  node get-auth-token.js user@example.com mypassword');
  console.log('');
  console.log('Or set API_URL environment variable to use a different API:');
  console.log('  API_URL=http://localhost:3000 node get-auth-token.js user@example.com mypassword');
  process.exit(1);
}

getAuthToken(email, password);
