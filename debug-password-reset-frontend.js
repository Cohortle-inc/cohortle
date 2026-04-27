/**
 * Debug Password Reset Frontend Issue
 * Tests the password reset flow to identify where it's failing
 */

const FRONTEND_URL = 'https://cohortle.com';
const API_URL = 'https://api.cohortle.com';

async function debugPasswordReset() {
  console.log('🔍 Debugging Password Reset Frontend Issue...\n');

  try {
    // Step 1: Request password reset
    console.log('Step 1: Requesting password reset...');
    const forgotResponse = await fetch(`${API_URL}/v1/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'teamcohortle@gmail.com'
      })
    });
    
    const forgotData = await forgotResponse.json();
    console.log('✅ Forgot password response:', {
      status: forgotResponse.status,
      data: forgotData
    });

    // Extract token from the link
    const resetLink = forgotData.link;
    const tokenMatch = resetLink.match(/token=([^&]+)/);
    
    if (!tokenMatch) {
      console.error('❌ No token found in reset link');
      return;
    }

    const token = tokenMatch[1];
    console.log('🔑 Extracted token:', token.substring(0, 20) + '...');

    // Step 2: Test token validation by calling reset-password endpoint directly
    console.log('\nStep 2: Testing password reset with token (direct API)...');
    
    try {
      const resetResponse = await fetch(`${API_URL}/v1/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: 'newpassword123'
        })
      });
      
      const resetData = await resetResponse.json();
      console.log('✅ Direct API password reset:', {
        status: resetResponse.status,
        data: resetData
      });
      
    } catch (resetError) {
      console.error('❌ Direct API password reset failed:', resetError.message);
    }

    // Step 3: Test frontend proxy
    console.log('\nStep 3: Testing frontend proxy...');
    
    try {
      const proxyResponse = await fetch(`${FRONTEND_URL}/api/proxy/v1/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: 'newpassword123'
        })
      });
      
      const proxyData = await proxyResponse.json();
      console.log('✅ Frontend proxy result:', {
        status: proxyResponse.status,
        data: proxyData
      });
      
    } catch (proxyError) {
      console.error('❌ Frontend proxy failed:', proxyError.message);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugPasswordReset();