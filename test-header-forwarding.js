/**
 * Test Header Forwarding
 * Tests if Next.js API routes can receive Authorization headers
 */

const FRONTEND_URL = 'https://cohortle.com';

async function testHeaderForwarding() {
  console.log('🔍 Testing Header Forwarding...\n');

  const testToken = 'test-token-123';

  try {
    console.log('Testing direct API route with Authorization header...');
    const response = await fetch(`${FRONTEND_URL}/api/test-headers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        test: 'data'
      })
    });
    
    const data = await response.json();
    console.log('Header test result:', {
      status: response.status,
      data: data
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testHeaderForwarding();