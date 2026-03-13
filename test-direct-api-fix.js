/**
 * Test Direct API Fix for Password Reset
 * Tests the direct API call with lowercase authorization header
 */

const API_URL = 'https://api.cohortle.com';

async function testDirectApiFix() {
  console.log('🔍 Testing Direct API Fix...\n');

  try {
    // Step 1: Get a fresh token
    console.log('Step 1: Getting fresh token...');
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
    const resetLink = forgotData.link;
    const tokenMatch = resetLink.match(/token=([^&]+)/);
    const token = tokenMatch[1];
    console.log('✅ Token obtained');

    // Step 2: Test with lowercase 'authorization' header (what backend expects)
    console.log('\nStep 2: Testing with lowercase authorization header...');
    
    const response = await fetch(`${API_URL}/v1/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${token}`, // lowercase - matches backend JwtService.getToken()
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        password: 'testpassword123'
      })
    });
    
    const data = await response.json();
    console.log('Direct API with lowercase header result:', {
      status: response.status,
      success: response.status === 200 && !data.error,
      message: data.message || data.error
    });

    if (response.status === 200 && !data.error) {
      console.log('🎉 SUCCESS! Direct API with lowercase header works!');
      console.log('✅ This confirms the fix - backend expects lowercase "authorization" header');
    } else {
      console.log('❌ Still failing - may be a different issue');
    }

    // Step 3: Compare with uppercase (what was failing before)
    console.log('\nStep 3: Testing with uppercase Authorization header (old way)...');
    
    const upperResponse = await fetch(`${API_URL}/v1/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`, // uppercase - what proxy was sending
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        password: 'testpassword123'
      })
    });
    
    const upperData = await upperResponse.json();
    console.log('Direct API with uppercase header result:', {
      status: upperResponse.status,
      success: upperResponse.status === 200 && !upperData.error,
      message: upperData.message || upperData.error
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDirectApiFix();