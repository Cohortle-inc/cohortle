/**
 * Debug Proxy Headers Test
 * Specifically tests header forwarding through the Next.js proxy
 */

const FRONTEND_URL = 'https://cohortle.com';

async function debugProxyHeaders() {
  console.log('🔍 Debug Proxy Headers Test...\n');

  try {
    // First, get a fresh token
    console.log('Step 1: Getting fresh token...');
    const forgotResponse = await fetch(`https://api.cohortle.com/v1/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'teamcohortle@gmail.com'
      })
    });
    
    const forgotData = await forgotResponse.json();
    const resetLink = forgotData.link;
    const tokenMatch = resetLink.match(/token=([^&]+)/);
    const token = tokenMatch[1];
    console.log('✅ Token obtained');

    // Test different header variations through proxy
    const testCases = [
      {
        name: 'Standard Authorization header',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      },
      {
        name: 'Lowercase authorization header',
        headers: {
          'authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      },
      {
        name: 'Custom X-Auth header',
        headers: {
          'X-Auth': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      },
      {
        name: 'Multiple auth headers',
        headers: {
          'Authorization': `Bearer ${token}`,
          'authorization': `Bearer ${token}`,
          'X-Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`\nTesting: ${testCase.name}`);
      
      try {
        const response = await fetch(`${FRONTEND_URL}/api/proxy/v1/api/auth/reset-password`, {
          method: 'POST',
          headers: testCase.headers,
          body: JSON.stringify({
            password: 'testpassword123'
          })
        });
        
        const data = await response.json();
        console.log(`Result: ${response.status} - ${data.message || 'Success'}`);
        
        if (response.status === 200) {
          console.log('🎉 SUCCESS! This header configuration works!');
          break;
        }
        
      } catch (error) {
        console.log(`Error: ${error.message}`);
      }
    }

    // Test if the proxy is receiving headers at all
    console.log('\nStep 2: Testing proxy endpoint directly...');
    try {
      const proxyTestResponse = await fetch(`${FRONTEND_URL}/api/proxy/v1/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Debug': 'true'
        },
        body: JSON.stringify({
          password: 'testpassword123'
        })
      });
      
      const proxyTestData = await proxyTestResponse.json();
      console.log('Proxy test result:', {
        status: proxyTestResponse.status,
        data: proxyTestData
      });
      
    } catch (error) {
      console.error('Proxy test error:', error.message);
    }

  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
  }
}

// Run the debug test
debugProxyHeaders();