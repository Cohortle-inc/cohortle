/**
 * Test Dashboard Components
 * Tests the dashboard API endpoints and component functionality
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'password123';

async function testDashboardComponents() {
  console.log('🧪 Testing Dashboard Components...\n');

  try {
    // Step 1: Login to get auth token
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/v1/api/auth/login`, {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });

    if (loginResponse.data.error) {
      throw new Error(`Login failed: ${loginResponse.data.message}`);
    }

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Set up auth headers
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Step 2: Test upcoming sessions endpoint
    console.log('\n2. Testing upcoming sessions...');
    try {
      const sessionsResponse = await axios.get(
        `${API_BASE_URL}/v1/api/dashboard/upcoming-sessions`,
        { headers: authHeaders }
      );

      console.log('✅ Upcoming sessions endpoint working');
      console.log(`   Sessions found: ${sessionsResponse.data.sessions?.length || 0}`);
      
      if (sessionsResponse.data.sessions?.length > 0) {
        console.log('   Sample session:', {
          title: sessionsResponse.data.sessions[0].title,
          programmeName: sessionsResponse.data.sessions[0].programmeName,
          dateTime: sessionsResponse.data.sessions[0].dateTime,
        });
      }
    } catch (error) {
      console.log('❌ Upcoming sessions endpoint failed:', error.response?.data?.message || error.message);
    }

    // Step 3: Test recent activity endpoint
    console.log('\n3. Testing recent activity...');
    try {
      const activityResponse = await axios.get(
        `${API_BASE_URL}/v1/api/dashboard/recent-activity?limit=5`,
        { headers: authHeaders }
      );

      console.log('✅ Recent activity endpoint working');
      console.log(`   Activities found: ${activityResponse.data.activities?.length || 0}`);
      
      if (activityResponse.data.activities?.length > 0) {
        console.log('   Sample activity:', {
          title: activityResponse.data.activities[0].title,
          programmeName: activityResponse.data.activities[0].programmeName,
          completedAt: activityResponse.data.activities[0].completedAt,
        });
      }
    } catch (error) {
      console.log('❌ Recent activity endpoint failed:', error.response?.data?.message || error.message);
    }

    // Step 4: Test next lesson endpoint
    console.log('\n4. Testing next lesson...');
    try {
      const nextLessonResponse = await axios.get(
        `${API_BASE_URL}/v1/api/dashboard/next-lesson`,
        { headers: authHeaders }
      );

      console.log('✅ Next lesson endpoint working');
      
      if (nextLessonResponse.data.lesson) {
        console.log('   Next lesson:', {
          title: nextLessonResponse.data.lesson.title,
          programmeId: nextLessonResponse.data.lesson.programmeId,
        });
      } else {
        console.log('   No incomplete lessons found');
      }
    } catch (error) {
      console.log('❌ Next lesson endpoint failed:', error.response?.data?.message || error.message);
    }

    // Step 5: Test enrolled programmes endpoint
    console.log('\n5. Testing enrolled programmes...');
    try {
      const programmesResponse = await axios.get(
        `${API_BASE_URL}/v1/api/programmes/enrolled`,
        { headers: authHeaders }
      );

      console.log('✅ Enrolled programmes endpoint working');
      console.log(`   Programmes found: ${programmesResponse.data.programmes?.length || 0}`);
      
      if (programmesResponse.data.programmes?.length > 0) {
        console.log('   Sample programme:', {
          name: programmesResponse.data.programmes[0].name,
          cohortId: programmesResponse.data.programmes[0].cohortId,
        });
      }
    } catch (error) {
      console.log('❌ Enrolled programmes endpoint failed:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Dashboard component testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testDashboardComponents().catch(console.error);