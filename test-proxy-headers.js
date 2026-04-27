/**
 * Test Proxy Headers
 * Tests if the proxy is properly forwarding Authorization headers
 */

const FRONTEND_URL = 'https://cohortle.com';

async function testProxyHeaders() {
  console.log('🔍 Testing Proxy Headers...\n');

  try {
    // Test with a simple endpoint that should show us the headers
    const testToken = 'test-token-123';
    
    console.log('Testing proxy with Authorization header...');
    const response = await fetch(`${FRONTEND_URL}/api/proxy/v1/api/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Proxy response:', {
      status: response.status,
      data: data
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testProxyHeaders();