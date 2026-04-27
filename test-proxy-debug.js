/**
 * Test Proxy Debug - Create a simple test endpoint to see what headers are received
 */

const FRONTEND_URL = 'https://cohortle.com';

async function testProxyDebug() {
  console.log('🔍 Testing proxy debug endpoint...\n');

  try {
    // Test with a simple GET request to see if proxy is working at all
    console.log('Step 1: Testing basic proxy functionality...');
    
    const basicResponse = await fetch(`${FRONTEND_URL}/api/proxy/v1/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com'
      })
    });
    
    const basicData = await basicResponse.json();
    console.log('Basic proxy test:', {
      status: basicResponse.status,
      working: basicResponse.status === 200
    });

    // Test with Authorization header to see debug output
    console.log('\nStep 2: Testing with Authorization header...');
    
    const authResponse = await fetch(`${FRONTEND_URL}/api/proxy/v1/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token-123',
        'Content-Type': 'application/json',
        'X-Test-Header': 'debug-value'
      },
      body: JSON.stringify({
        password: 'testpassword'
      })
    });
    
    const authData = await authResponse.json();
    console.log('Auth header test:', {
      status: authResponse.status,
      data: authData
    });

    // The proxy should be logging debug information to the console
    // Since we can't see server logs directly, let's check if there's a way to get debug info

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testProxyDebug();