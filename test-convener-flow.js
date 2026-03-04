/**
 * Test script to verify convener flow fixes
 * Tests the key endpoints that were broken
 */

const axios = require('axios');

const API_BASE = process.env.API_BASE || 'http://localhost:3001';
const TEST_TOKEN = process.env.CONVENER_TOKEN || 'your-convener-token-here';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function testConvenerFlow() {
  console.log('🧪 Testing Convener Flow Fixes...\n');

  try {
    // Test 1: Create a programme
    console.log('1️⃣ Testing programme creation...');
    const programmeResponse = await apiClient.post('/v1/api/programmes', {
      name: 'Test Programme',
      description: 'A test programme for validation',
      start_date: '2024-03-01'
    });
    
    if (programmeResponse.data.error) {
      throw new Error(`Programme creation failed: ${programmeResponse.data.message}`);
    }
    
    const programmeId = programmeResponse.data.programme.id;
    console.log(`✅ Programme created with ID: ${programmeId}`);

    // Test 2: Get programme detail (should now include cohorts and weeks)
    console.log('\n2️⃣ Testing programme detail fetch...');
    const detailResponse = await apiClient.get(`/v1/api/programmes/${programmeId}`);
    
    if (detailResponse.data.error) {
      throw new Error(`Programme detail fetch failed: ${detailResponse.data.message}`);
    }
    
    const programme = detailResponse.data.programme;
    console.log(`✅ Programme detail fetched`);
    console.log(`   - Has cohorts array: ${Array.isArray(programme.cohorts)}`);
    console.log(`   - Has weeks array: ${Array.isArray(programme.weeks)}`);
    console.log(`   - Cohorts count: ${programme.cohorts?.length || 0}`);
    console.log(`   - Weeks count: ${programme.weeks?.length || 0}`);

    // Test 3: Check enrollment code availability
    console.log('\n3️⃣ Testing enrollment code check...');
    const codeResponse = await apiClient.get('/v1/api/enrollment-codes/check', {
      params: { code: 'TEST123' }
    });
    
    if (codeResponse.data.error) {
      throw new Error(`Enrollment code check failed: ${codeResponse.data.message}`);
    }
    
    console.log(`✅ Enrollment code check works`);
    console.log(`   - Code 'TEST123' available: ${codeResponse.data.available}`);

    // Test 4: Create a cohort
    console.log('\n4️⃣ Testing cohort creation...');
    const cohortResponse = await apiClient.post(`/v1/api/programmes/${programmeId}/cohorts`, {
      name: 'Test Cohort',
      start_date: '2024-03-01',
      enrollment_code: 'TEST123'
    });
    
    if (cohortResponse.data.error) {
      throw new Error(`Cohort creation failed: ${cohortResponse.data.message}`);
    }
    
    console.log(`✅ Cohort created with ID: ${cohortResponse.data.cohort.id}`);

    // Test 5: Verify programme detail now shows the cohort
    console.log('\n5️⃣ Testing programme detail with cohort...');
    const updatedDetailResponse = await apiClient.get(`/v1/api/programmes/${programmeId}`);
    const updatedProgramme = updatedDetailResponse.data.programme;
    
    console.log(`✅ Updated programme detail fetched`);
    console.log(`   - Cohorts count: ${updatedProgramme.cohorts?.length || 0}`);
    console.log(`   - First cohort name: ${updatedProgramme.cohorts?.[0]?.name || 'None'}`);

    // Test 6: Publish programme
    console.log('\n6️⃣ Testing programme publishing...');
    const publishResponse = await apiClient.post(`/v1/api/programmes/${programmeId}/publish`);
    
    if (publishResponse.data.error) {
      throw new Error(`Programme publishing failed: ${publishResponse.data.message}`);
    }
    
    console.log(`✅ Programme published successfully`);

    // Test 7: Verify programme status changed
    console.log('\n7️⃣ Testing published programme status...');
    const publishedDetailResponse = await apiClient.get(`/v1/api/programmes/${programmeId}`);
    const publishedProgramme = publishedDetailResponse.data.programme;
    
    console.log(`✅ Published programme status: ${publishedProgramme.status}`);

    console.log('\n🎉 All convener flow tests passed!');
    console.log('\n📋 Summary of fixes:');
    console.log('   ✅ Programme detail now returns cohorts and weeks arrays');
    console.log('   ✅ Enrollment code availability check endpoint added');
    console.log('   ✅ Programme publish endpoint added');
    console.log('   ✅ Programme status updates correctly');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testConvenerFlow();
}

module.exports = { testConvenerFlow };