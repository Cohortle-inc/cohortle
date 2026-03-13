/**
 * Test basic proxy functionality with non-authenticated endpoints
 */

const FRONTEND_URL = 'https://cohortle.com';

async function testBasicProxy() {
  console.log('🔍 Testing basic proxy functionality...\n');

  try {
    // Test a non-authenticated endpoint through proxy
    console.log('Testing forgot-password through proxy (should work)...');
    
    const proxyResponse = await fetch(`${FRONTEND_URL}/api/proxy/v1/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com'
      })
    });
    
    const proxyData = await proxyResponse.json();
    console.log('Proxy forgot-password result:', {
      status: proxyResponse.status,
      working: proxyResponse.status === 200 || proxyResponse.status === 400, // 400 is expected for invalid email
      data: proxyData
    });

    // Test direct API call for comparison
    console.log('\nTesting forgot-password direct API (should work)...');
    
    const directResponse = await fetch(`https://api.cohortle.com/v1/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com'
      })
    });
    
    const directData = await directResponse.json();
    console.log('Direct API forgot-password result:', {
      status: directResponse.status,
      working: directResponse.status === 200 || directResponse.status === 400,
      data: directData
    });

    // Compare results
    if (proxyResponse.status === directResponse.status) {
      console.log('✅ Proxy is working for non-authenticated endpoints');
      console.log('❌ Issue is specifically with Authorization header forwarding');
    } else {
      console.log('❌ Proxy has fundamental issues');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBasicProxy();