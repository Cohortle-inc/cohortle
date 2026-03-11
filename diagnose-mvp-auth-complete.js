/**
 * Complete MVP Authentication Diagnostic Script
 * Tests authentication flow for both learner and convener roles
 * Checks programme creation, cohorts, weeks, and progress tracking
 */

const axios = require('axios');
require('dotenv').config({ path: './cohortle-api/.env' });

const API_URL = process.env.API_URL || 'https://api.cohortle.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://cohortle.com';

// Test credentials
const LEARNER_EMAIL = 'test-learner-mvp@example.com';
const CONVENER_EMAIL = 'test-convener-mvp@example.com';
const TEST_PASSWORD = 'TestPassword123!';

// Store tokens and IDs for testing
let learnerToken = null;
let convenerToken = null;
let programmeId = null;
let cohortId = null;
let weekId = null;
let lessonId = null;
let enrollmentCode = null;

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

function logTest(testName) {
  log(`\n→ ${testName}`, 'cyan');
}

function logSuccess(message) {
  log(`  ✓ ${message}`, 'green');
}

function logError(message) {
  log(`  ✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`  ⚠ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`  ℹ ${message}`, 'blue');
}

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status,
    };
  }
}

// Test 1: Learner Registration
async function testLearnerRegistration() {
  logTest('Test 1: Learner Registration');
  
  const result = await apiRequest('POST', '/v1/api/auth/register-email', {
    email: LEARNER_EMAIL,
    password: TEST_PASSWORD,
    first_name: 'Test',
    last_name: 'Learner',
    role: 'student',
  });

  if (result.success) {
    learnerToken = result.data.token;
    logSuccess(`Learner registered successfully`);
    logInfo(`Role: ${result.data.user?.role}`);
    logInfo(`Token received: ${learnerToken ? 'Yes' : 'No'}`);
    return true;
  } else {
    if (result.error?.message?.includes('already in use')) {
      logWarning('Learner already exists, attempting login...');
      return await testLearnerLogin();
    }
    logError(`Registration failed: ${result.error?.message || 'Unknown error'}`);
    return false;
  }
}

// Test 2: Learner Login
async function testLearnerLogin() {
  logTest('Test 2: Learner Login');
  
  const result = await apiRequest('POST', '/v1/api/auth/login', {
    email: LEARNER_EMAIL,
    password: TEST_PASSWORD,
  });

  if (result.success) {
    learnerToken = result.data.token;
    logSuccess(`Learner logged in successfully`);
    logInfo(`Role: ${result.data.user?.role}`);
    logInfo(`Email verified: ${result.data.user?.email_verified}`);
    return true;
  } else {
    logError(`Login failed: ${result.error?.message || 'Unknown error'}`);
    return false;
  }
}

// Test 3: Learner Profile Access
async function testLearnerProfile() {
  logTest('Test 3: Learner Profile Access');
  
  const result = await apiRequest('GET', '/v1/api/profile', null, learnerToken);

  if (result.success && !result.data.error) {
    logSuccess(`Profile accessed successfully`);
    logInfo(`User ID: ${result.data.user?.id}`);
    logInfo(`Email: ${result.data.user?.email}`);
    logInfo(`Role: ${result.data.user?.role}`);
    return true;
  } else {
    logError(`Profile access failed: ${result.data?.message || result.error?.message || 'Unknown error'}`);
    return false;
  }
}

// Test 4: Learner Dashboard Access
async function testLearnerDashboard() {
  logTest('Test 4: Learner Dashboard Access');
  
  const result = await apiRequest('GET', '/v1/api/dashboard', null, learnerToken);

  if (result.success && !result.data.error) {
    logSuccess(`Dashboard accessed successfully`);
    logInfo(`Enrolled programmes: ${result.data.enrolledProgrammes?.length || 0}`);
    return true;
  } else {
    logError(`Dashboard access failed: ${result.data?.message || result.error?.message || 'Unknown error'}`);
    return false;
  }
}

// Test 5: Convener Registration
async function testConvenerRegistration() {
  logTest('Test 5: Convener Registration');
  
  const result = await apiRequest('POST', '/v1/api/auth/register-email', {
    email: CONVENER_EMAIL,
    password: TEST_PASSWORD,
    first_name: 'Test',
    last_name: 'Convener',
    role: 'convener',
  });

  if (result.success) {
    convenerToken = result.data.token;
    logSuccess(`Convener registered successfully`);
    logInfo(`Role: ${result.data.user?.role}`);
    logInfo(`Token received: ${convenerToken ? 'Yes' : 'No'}`);
    return true;
  } else {
    if (result.error?.message?.includes('already in use')) {
      logWarning('Convener already exists, attempting login...');
      return await testConvenerLogin();
    }
    logError(`Registration failed: ${result.error?.message || 'Unknown error'}`);
    return false;
  }
}

// Test 6: Convener Login
async function testConvenerLogin() {
  logTest('Test 6: Convener Login');
  
  const result = await apiRequest('POST', '/v1/api/auth/login', {
    email: CONVENER_EMAIL,
    password: TEST_PASSWORD,
  });

  if (result.success) {
    convenerToken = result.data.token;
    logSuccess(`Convener logged in successfully`);
    logInfo(`Role: ${result.data.user?.role}`);
    logInfo(`Email verified: ${result.data.user?.email_verified}`);
    return true;
  } else {
    logError(`Login failed: ${result.error?.message || 'Unknown error'}`);
    return false;
  }
}

// Test 7: Convener Profile Access
async function testConvenerProfile() {
  logTest('Test 7: Convener Profile Access');
  
  const result = await apiRequest('GET', '/v1/api/profile', null, convenerToken);

  if (result.success && !result.data.error) {
    logSuccess(`Profile accessed successfully`);
    logInfo(`User ID: ${result.data.user?.id}`);
    logInfo(`Email: ${result.data.user?.email}`);
    logInfo(`Role: ${result.data.user?.role}`);
    return true;
  } else {
    logError(`Profile access failed: ${result.data?.message || result.error?.message || 'Unknown error'}`);
    return false;
  }
}

// Test 8: Programme Creation
async function testProgrammeCreation() {
  logTest('Test 8: Programme Creation');
  
  const result = await apiRequest('POST', '/v1/api/programmes', {
    name: 'MVP Test Programme',
    description: 'Test programme for MVP authentication testing',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  }, convenerToken);

  if (result.success && !result.data.error) {
    programmeId = result.data.programme?.id;
    logSuccess(`Programme created successfully`);
    logInfo(`Programme ID: ${programmeId}`);
    return true;
  } else {
    logError(`Programme creation failed: ${result.data?.message || result.error?.message || 'Unknown error'}`);
    return false;
  }
}

// Test 9: Cohort Creation
async function testCohortCreation() {
  logTest('Test 9: Cohort Creation');
  
  if (!programmeId) {
    logError('No programme ID available');
    return false;
  }

  enrollmentCode = `TEST${Date.now()}`;
  
  const result = await apiRequest('POST', '/v1/api/cohorts', {
    programme_id: programmeId,
    name: 'MVP Test Cohort',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    enrollment_code: enrollmentCode,
  }, convenerToken);

  if (result.success && !result.data.error) {
    cohortId = result.data.cohort?.id;
    logSuccess(`Cohort created successfully`);
    logInfo(`Cohort ID: ${cohortId}`);
    logInfo(`Enrollment code: ${enrollmentCode}`);
    return true;
  } else {
    logError(`Cohort creation failed: ${result.data?.message || result.error?.message || 'Unknown error'}`);
    return false;
  }
}

// Test 10: Week Creation
async function testWeekCreation() {
  logTest('Test 10: Week Creation');
  
  if (!programmeId) {
    logError('No programme ID available');
    return false;
  }

  const result = await apiRequest('POST', '/v1/api/weeks', {
    programme_id: programmeId,
    title: 'Week 1: Introduction',
    description: 'Introduction to the programme',
    week_number: 1,
    start_date: new Date().toISOString().split('T')[0],
  }, convenerToken);

  if (result.success && !result.data.error) {
    weekId = result.data.week?.id;
    logSuccess(`Week created successfully`);
    logInfo(`Week ID: ${weekId}`);
    return true;
  } else {
    logError(`Week creation failed: ${result.data?.message || result.error?.message || 'Unknown error'}`);
    return false;
  }
}

// Test 11: Lesson Creation
async function testLessonCreation() {
  logTest('Test 11: Lesson Creation');
  
  if (!weekId) {
    logError('No week ID available');
    return false;
  }

  const result = await apiRequest('POST', '/v1/api/lessons', {
    week_id: weekId,
    title: 'Lesson 1: Getting Started',
    description: 'Introduction lesson',
    content_type: 'text',
    content_text: 'Welcome to the programme!',
    order_index: 1,
  }, convenerToken);

  if (result.success && !result.data.error) {
    lessonId = result.data.lesson?.id;
    logSuccess(`Lesson created successfully`);
    logInfo(`Lesson ID: ${lessonId}`);
    return true;
  } else {
    logError(`Lesson creation failed: ${result.data?.message || result.error?.message || 'Unknown error'}`);
    return false;
  }
}

// Test 12: Learner Enrollment
async function testLearnerEnrollment() {
  logTest('Test 12: Learner Enrollment');
  
  if (!enrollmentCode) {
    logError('No enrollment code available');
    return false;
  }

  const result = await apiRequest('POST', '/v1/api/enroll', {
    enrollment_code: enrollmentCode,
  }, learnerToken);

  if (result.success && !result.data.error) {
    logSuccess(`Learner enrolled successfully`);
    logInfo(`Cohort: ${result.data.cohort?.name}`);
    return true;
  } else {
    logError(`Enrollment failed: ${result.data?.message || result.error?.message || 'Unknown error'}`);
    return false;
  }
}

// Test 13: Learner Programme Access
async function testLearnerProgrammeAccess() {
  logTest('Test 13: Learner Programme Access');
  
  if (!programmeId) {
    logError('No programme ID available');
    return false;
  }

  const result = await apiRequest('GET', `/v1/api/programmes/${programmeId}`, null, learnerToken);

  if (result.success && !result.data.error) {
    logSuccess(`Programme accessed successfully`);
    logInfo(`Programme: ${result.data.programme?.name}`);
    logInfo(`Weeks: ${result.data.weeks?.length || 0}`);
    return true;
  } else {
    logError(`Programme access failed: ${result.data?.message || result.error?.message || 'Unknown error'}`);
    return false;
  }
}

// Test 14: Learner Lesson Access
async function testLearnerLessonAccess() {
  logTest('Test 14: Learner Lesson Access');
  
  if (!lessonId) {
    logError('No lesson ID available');
    return false;
  }

  const result = await apiRequest('GET', `/v1/api/lessons/${lessonId}`, null, learnerToken);

  if (result.success && !result.data.error) {
    logSuccess(`Lesson accessed successfully`);
    logInfo(`Lesson: ${result.data.lesson?.title}`);
    return true;
  } else {
    logError(`Lesson access failed: ${result.data?.message || result.error?.message || 'Unknown error'}`);
    return false;
  }
}

// Test 15: Lesson Completion
async function testLessonCompletion() {
  logTest('Test 15: Lesson Completion');
  
  if (!lessonId) {
    logError('No lesson ID available');
    return false;
  }

  const result = await apiRequest('POST', `/v1/api/lessons/${lessonId}/complete`, {}, learnerToken);

  if (result.success && !result.data.error) {
    logSuccess(`Lesson marked as complete`);
    return true;
  } else {
    logError(`Lesson completion failed: ${result.data?.message || result.error?.message || 'Unknown error'}`);
    return false;
  }
}

// Test 16: Progress Tracking
async function testProgressTracking() {
  logTest('Test 16: Progress Tracking');
  
  if (!programmeId) {
    logError('No programme ID available');
    return false;
  }

  const result = await apiRequest('GET', `/v1/api/progress/programme/${programmeId}`, null, learnerToken);

  if (result.success && !result.data.error) {
    logSuccess(`Progress retrieved successfully`);
    logInfo(`Completion: ${result.data.progress?.completion_percentage || 0}%`);
    logInfo(`Completed lessons: ${result.data.progress?.completed_lessons || 0}`);
    return true;
  } else {
    logError(`Progress tracking failed: ${result.data?.message || result.error?.message || 'Unknown error'}`);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  logSection('MVP AUTHENTICATION & FUNCTIONALITY DIAGNOSTIC');
  log(`API URL: ${API_URL}`, 'blue');
  log(`Frontend URL: ${FRONTEND_URL}`, 'blue');

  const results = {
    passed: 0,
    failed: 0,
    total: 0,
  };

  const tests = [
    { name: 'Learner Registration', fn: testLearnerRegistration },
    { name: 'Learner Login', fn: testLearnerLogin },
    { name: 'Learner Profile Access', fn: testLearnerProfile },
    { name: 'Learner Dashboard Access', fn: testLearnerDashboard },
    { name: 'Convener Registration', fn: testConvenerRegistration },
    { name: 'Convener Login', fn: testConvenerLogin },
    { name: 'Convener Profile Access', fn: testConvenerProfile },
    { name: 'Programme Creation', fn: testProgrammeCreation },
    { name: 'Cohort Creation', fn: testCohortCreation },
    { name: 'Week Creation', fn: testWeekCreation },
    { name: 'Lesson Creation', fn: testLessonCreation },
    { name: 'Learner Enrollment', fn: testLearnerEnrollment },
    { name: 'Learner Programme Access', fn: testLearnerProgrammeAccess },
    { name: 'Learner Lesson Access', fn: testLearnerLessonAccess },
    { name: 'Lesson Completion', fn: testLessonCompletion },
    { name: 'Progress Tracking', fn: testProgressTracking },
  ];

  logSection('RUNNING TESTS');

  for (const test of tests) {
    results.total++;
    const passed = await test.fn();
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
  }

  logSection('TEST SUMMARY');
  log(`Total Tests: ${results.total}`, 'bright');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`, 
      results.failed > 0 ? 'yellow' : 'green');

  if (results.failed > 0) {
    logSection('RECOMMENDATIONS');
    logWarning('Some tests failed. Please review the errors above.');
    logInfo('Common issues:');
    logInfo('1. Check if the API is running and accessible');
    logInfo('2. Verify database migrations are up to date');
    logInfo('3. Check role system is properly initialized');
    logInfo('4. Verify environment variables are set correctly');
  } else {
    logSection('SUCCESS');
    logSuccess('All tests passed! MVP authentication and functionality working correctly.');
  }
}

// Run the tests
runAllTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
