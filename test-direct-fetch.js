/**
 * Test Direct Fetch vs Axios
 * Tests if the issue is with axios or the proxy
 */

const FRONTEND_URL = 'https://cohortle.com';

async function testDirectFetch() {
  console.log('🔍 Testing Direct Fetch vs Axios...\n');

  const testToken = 'test-token-123';

  try {
    // Test 1: Direct fetch
    console.log('Test 1: Direct fetch with Authorization header...');
    const fetchResponse = await fetch(`${FRONTEND_URL}/api/proxy/v1/api/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const fetchData = await fetchResponse.json();
    console.log('Direct fetch result:', {
      status: fetchResponse.status,
      data: fetchData
    });

    // Test 2: Test with lowercase authorization
    console.log('\nTest 2: Direct fetch with lowercase authorization header...');
    const fetchResponse2 = await fetch(`${FRONTEND_URL}/api/proxy/v1/api/profile`, {
      method: 'GET',
      headers: {
        'authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const fetchData2 = await fetchResponse2.json();
    console.log('Lowercase authorization result:', {
      status: fetchResponse2.status,
      data: fetchData2
    });

    // Test 3: Test POST request (like password reset)
    console.log('\nTest 3: POST request with Authorization header...');
    const postResponse = await fetch(`${FRONTEND_URL}/api/proxy/v1/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        password: 'testpassword123'
      })
    });
    
    const postData = await postResponse.json();
    console.log('POST request result:', {
      status: postResponse.status,
      data: postData
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testDirectFetch();