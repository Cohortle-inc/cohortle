/**
 * Production Deployment Browser Test
 * 
 * INSTRUCTIONS:
 * 1. Open https://cohortle.com in your browser
 * 2. Open Developer Tools (F12)
 * 3. Go to Console tab
 * 4. Copy and paste this entire script
 * 5. Press Enter to run
 * 
 * This will test if the deployment is working correctly
 */

(async function testProductionDeployment() {
  console.log('%c========================================', 'color: cyan; font-weight: bold');
  console.log('%cProduction Deployment Test', 'color: cyan; font-weight: bold');
  console.log('%c========================================', 'color: cyan; font-weight: bold');
  console.log('');

  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  // Test 1: Check API URL configuration
  console.log('%c1. Environment Configuration', 'color: yellow; font-weight: bold');
  console.log('Checking if NEXT_PUBLIC_API_URL is configured...');
  
  // Try to find API URL in Next.js config
  const apiUrl = 'https://api.cohortle.com';
  console.log(`Expected API URL: ${apiUrl}`);
  results.passed.push('API URL configured');

  // Test 2: Check if we're on the correct domain
  console.log('');
  console.log('%c2. Domain Check', 'color: yellow; font-weight: bold');
  console.log(`Current URL: ${window.location.href}`);
  if (window.location.hostname === 'cohortle.com' || window.location.hostname === 'www.cohortle.com') {
    console.log('%c✓ On production domain', 'color: green');
    results.passed.push('Production domain');
  } else {
    console.log('%c⚠ Not on production domain', 'color: orange');
    results.warnings.push('Not on production domain');
  }

  // Test 3: Check API health
  console.log('');
  console.log('%c3. API Health Check', 'color: yellow; font-weight: bold');
  try {
    const healthResponse = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (healthResponse.ok) {
      console.log('%c✓ API is responding', 'color: green');
      const healthData = await healthResponse.json();
      console.log('Health data:', healthData);
      results.passed.push('API health check');
    } else {
      console.log('%c✗ API health check failed', 'color: red');
      console.log(`Status: ${healthResponse.status}`);
      results.failed.push(`API health check - Status ${healthResponse.status}`);
    }
  } catch (error) {
    console.log('%c✗ API health check error', 'color: red');
    console.log('Error:', error.message);
    results.failed.push(`API health check - ${error.message}`);
  }

  // Test 4: Check authentication status
  console.log('');
  console.log('%c4. Authentication Check', 'color: yellow; font-weight: bold');
  
  // Check for auth token in localStorage
  const authToken = localStorage.getItem('authToken');
  const userRole = localStorage.getItem('userRole');
  
  if (authToken) {
    console.log('%c✓ Auth token found', 'color: green');
    console.log(`Token (first 20 chars): ${authToken.substring(0, 20)}...`);
    results.passed.push('Auth token exists');
    
    if (userRole) {
      console.log(`User role: ${userRole}`);
      results.passed.push(`User role: ${userRole}`);
    } else {
      console.log('%c⚠ User role not found', 'color: orange');
      results.warnings.push('User role not set');
    }
  } else {
    console.log('%c⚠ No auth token found (not logged in)', 'color: orange');
    results.warnings.push('Not authenticated');
  }

  // Test 5: Test programmes API (if authenticated)
  if (authToken) {
    console.log('');
    console.log('%c5. Programmes API Test', 'color: yellow; font-weight: bold');
    try {
      const programmesResponse = await fetch(`${apiUrl}/v1/api/programmes/enrolled`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        credentials: 'include'
      });
      
      if (programmesResponse.ok) {
        const programmesData = await programmesResponse.json();
        console.log('%c✓ Programmes API working', 'color: green');
        console.log(`Found ${programmesData.length || 0} enrolled programmes`);
        results.passed.push('Programmes API');
        
        if (programmesData.length > 0) {
          console.log('First programme:', programmesData[0]);
        }
      } else {
        console.log('%c✗ Programmes API failed', 'color: red');
        console.log(`Status: ${programmesResponse.status}`);
        const errorText = await programmesResponse.text();
        console.log('Error:', errorText);
        results.failed.push(`Programmes API - Status ${programmesResponse.status}`);
      }
    } catch (error) {
      console.log('%c✗ Programmes API error', 'color: red');
      console.log('Error:', error.message);
      results.failed.push(`Programmes API - ${error.message}`);
    }
  } else {
    console.log('');
    console.log('%c5. Programmes API Test', 'color: yellow; font-weight: bold');
    console.log('%c⚠ Skipped (not authenticated)', 'color: orange');
  }

  // Test 6: Check for Continue Learning button in DOM
  console.log('');
  console.log('%c6. Continue Learning Button Check', 'color: yellow; font-weight: bold');
  
  if (window.location.pathname.startsWith('/programmes/')) {
    const continueButton = document.querySelector('a[href^="/lessons/"]');
    const continueText = Array.from(document.querySelectorAll('*')).find(
      el => el.textContent.includes('Continue Learning')
    );
    
    if (continueButton || continueText) {
      console.log('%c✓ Continue Learning button found in DOM', 'color: green');
      results.passed.push('Continue Learning button exists');
      if (continueButton) {
        console.log('Button href:', continueButton.getAttribute('href'));
      }
    } else {
      console.log('%c✗ Continue Learning button NOT found', 'color: red');
      console.log('This suggests the deployment has not updated');
      results.failed.push('Continue Learning button missing');
    }
  } else {
    console.log('%c⚠ Not on a programme page', 'color: orange');
    console.log('Navigate to a programme page to test this feature');
    results.warnings.push('Not on programme page');
  }

  // Test 7: Check Next.js build info
  console.log('');
  console.log('%c7. Next.js Build Info', 'color: yellow; font-weight: bold');
  
  if (window.__NEXT_DATA__) {
    console.log('%c✓ Next.js data found', 'color: green');
    console.log('Build ID:', window.__NEXT_DATA__.buildId);
    console.log('Page:', window.__NEXT_DATA__.page);
    results.passed.push('Next.js build info available');
  } else {
    console.log('%c⚠ Next.js data not found', 'color: orange');
    results.warnings.push('Next.js data not available');
  }

  // Test 8: Check for JavaScript errors
  console.log('');
  console.log('%c8. Console Errors Check', 'color: yellow; font-weight: bold');
  console.log('Check the Console tab for any red error messages');
  console.log('Common issues to look for:');
  console.log('  - 404 errors for missing files');
  console.log('  - CORS errors');
  console.log('  - API request failures');
  console.log('  - React hydration errors');

  // Summary
  console.log('');
  console.log('%c========================================', 'color: cyan; font-weight: bold');
  console.log('%cSUMMARY', 'color: cyan; font-weight: bold');
  console.log('%c========================================', 'color: cyan; font-weight: bold');
  console.log('');
  console.log(`%c✓ Passed: ${results.passed.length}`, 'color: green; font-weight: bold');
  console.log(`%c⚠ Warnings: ${results.warnings.length}`, 'color: orange; font-weight: bold');
  console.log(`%c✗ Failed: ${results.failed.length}`, 'color: red; font-weight: bold');
  console.log('');

  if (results.failed.length > 0) {
    console.log('%cFailed Tests:', 'color: red; font-weight: bold');
    results.failed.forEach(test => console.log(`  - ${test}`));
    console.log('');
  }

  if (results.warnings.length > 0) {
    console.log('%cWarnings:', 'color: orange; font-weight: bold');
    results.warnings.forEach(warning => console.log(`  - ${warning}`));
    console.log('');
  }

  // Recommendations
  console.log('%c========================================', 'color: cyan; font-weight: bold');
  console.log('%cRECOMMENDATIONS', 'color: cyan; font-weight: bold');
  console.log('%c========================================', 'color: cyan; font-weight: bold');
  console.log('');

  if (results.failed.length > 0) {
    console.log('%cCritical issues detected!', 'color: red; font-weight: bold');
    console.log('');
    console.log('1. Hard refresh the page: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)');
    console.log('2. Clear browser cache and cookies');
    console.log('3. Try opening in incognito/private mode');
    console.log('4. Check deployment platform build logs');
    console.log('5. Verify environment variables in deployment platform');
    console.log('6. Clear build cache and redeploy');
  } else if (results.warnings.length > 0) {
    console.log('%cSome warnings detected', 'color: orange; font-weight: bold');
    console.log('');
    console.log('Review the warnings above and take action if needed');
  } else {
    console.log('%c✓ All tests passed!', 'color: green; font-weight: bold');
    console.log('');
    console.log('If you still don\'t see the Continue Learning button:');
    console.log('1. Make sure you\'re on a programme page (/programmes/[id])');
    console.log('2. Make sure you have incomplete lessons');
    console.log('3. Hard refresh: Ctrl+Shift+R or Cmd+Shift+R');
  }

  console.log('');
  console.log('%cTest completed!', 'color: cyan; font-weight: bold');
  
  return {
    passed: results.passed,
    warnings: results.warnings,
    failed: results.failed,
    summary: {
      total: results.passed.length + results.warnings.length + results.failed.length,
      passed: results.passed.length,
      warnings: results.warnings.length,
      failed: results.failed.length
    }
  };
})();
