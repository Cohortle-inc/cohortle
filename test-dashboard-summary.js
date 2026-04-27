/**
 * Test script to verify the convener dashboard summary is working correctly
 * This script tests the /programmes/my endpoint to ensure it returns enrolled counts
 */

const fetch = require('node-fetch');

async function testDashboardSummary() {
  try {
    console.log('Testing convener dashboard summary...');
    
    // You'll need to replace this with a valid convener token
    const token = process.env.CONVENER_TOKEN || 'your-convener-token-here';
    const apiUrl = process.env.API_URL || 'https://api.cohortle.com';
    
    if (token === 'your-convener-token-here') {
      console.log('❌ Please set CONVENER_TOKEN environment variable');
      console.log('   You can get a token by running: node get-convener-token.ps1');
      return;
    }
    
    const response = await fetch(`${apiUrl}/v1/api/programmes/my`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.message);
    }
    
    console.log('✅ API Response received successfully');
    console.log(`📊 Found ${data.programmes.length} programmes`);
    
    let totalLearners = 0;
    let activeProgrammes = 0;
    
    data.programmes.forEach((programme, index) => {
      const enrolledCount = programme.enrolledCount || programme.enrolled_count || 0;
      const cohortCount = programme.cohortCount || programme.cohort_count || 0;
      const status = programme.lifecycle_status || programme.status || 'draft';
      
      if (status === 'active' || status === 'recruiting' || status === 'published') {
        activeProgrammes++;
      }
      
      totalLearners += enrolledCount;
      
      console.log(`  ${index + 1}. ${programme.name}`);
      console.log(`     Status: ${status}`);
      console.log(`     Enrolled: ${enrolledCount} learners`);
      console.log(`     Cohorts: ${cohortCount}`);
      console.log('');
    });
    
    console.log('📈 Dashboard Summary:');
    console.log(`   Total Programmes: ${data.programmes.length}`);
    console.log(`   Active Programmes: ${activeProgrammes}`);
    console.log(`   Total Learners: ${totalLearners}`);
    console.log(`   Recruiting: ${data.programmes.filter(p => (p.lifecycle_status || p.status) === 'recruiting').length}`);
    
    if (totalLearners === 0) {
      console.log('⚠️  Total learners is 0 - this might indicate:');
      console.log('   1. No learners are enrolled in any programmes');
      console.log('   2. Backend is not returning enrolled_count correctly');
      console.log('   3. Database query issue in /programmes/my endpoint');
    } else {
      console.log('✅ Total learners count is working correctly!');
    }
    
  } catch (error) {
    console.error('❌ Error testing dashboard summary:', error.message);
    console.error('   Stack:', error.stack);
  }
}

// Run the test
testDashboardSummary();