/**
 * Comprehensive Password Reset Test
 * Tests the entire password reset flow step by step
 */

const FRONTEND_URL = 'https://cohortle.com';
const API_URL = 'https://api.cohortle.com';

async function comprehensiveTest() {
  console.log('🔍 Comprehensive Password Reset Test...\n');

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
      success: !forgotData.error
    });

    if (forgotData.error) {
      console.error('❌ Forgot password failed:', forgotData.message);
      return;
    }

    // Extract token from the link
    const resetLink = forgotData.link;
    const tokenMatch = resetLink.match(/token=([^&]+)/);
    
    if (!tokenMatch) {
      console.error('❌ No token found in reset link');
      return;
    }

    const token = tokenMatch[1];
    console.log('🔑 Token extracted successfully');

    // Step 2: Test direct API call
    console.log('\nStep 2: Testing direct API call...');
    try {
      const directResponse = await fetch(`${API_URL}/v1/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: 'testpassword123'
        })
      });
      
      const directData = await directResponse.json();
      console.log('✅ Direct API call:', {
        status: directResponse.status,
        success: !directData.error
      });
      
    } catch (error) {
      console.error('❌ Direct API call failed:', error.message);
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
          password: 'testpassword123'
        })
      });
      
      const proxyData = await proxyResponse.json();
      console.log('Frontend proxy result:', {
        status: proxyResponse.status,
        success: proxyResponse.status === 200 && !proxyData.error,
        data: proxyData
      });
      
      if (proxyResponse.status === 200 && !proxyData.error) {
        console.log('🎉 PASSWORD RESET WORKING!');
      } else {
        console.log('❌ Password reset still failing through proxy');
      }
      
    } catch (error) {
      console.error('❌ Frontend proxy failed:', error.message);
    }

    // Step 4: Test the actual frontend implementation
    console.log('\nStep 4: Testing actual frontend implementation...');
    
    // Simulate what the frontend does
    try {
      const frontendResponse = await fetch(`${FRONTEND_URL}/api/proxy/v1/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: 'finaltest123'
        })
      });
      
      const frontendData = await frontendResponse.json();
      console.log('Frontend implementation result:', {
        status: frontendResponse.status,
        success: frontendResponse.status === 200 && !frontendData.error,
        message: frontendData.message || frontendData.error
      });
      
      if (frontendResponse.status === 200 && !frontendData.error) {
        console.log('🎉 FRONTEND PASSWORD RESET IS NOW WORKING!');
        console.log('✅ The password reset functionality has been fixed!');
      } else {
        console.log('❌ Frontend password reset still has issues');
        console.log('Debug info:', frontendData);
      }
      
    } catch (error) {
      console.error('❌ Frontend implementation test failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Comprehensive test failed:', error.message);
  }
}

// Run the comprehensive test
comprehensiveTest();