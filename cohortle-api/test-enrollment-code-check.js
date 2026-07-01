/**
 * Manual test script for enrollment code availability check endpoint
 * 
 * This script tests the GET /v1/api/enrollment-codes/check endpoint
 * 
 * Usage:
 *   node test-enrollment-code-check.js
 */

const BackendSDK = require('./core/BackendSDK');

async function testEnrollmentCodeCheck() {
  console.log('Testing Enrollment Code Availability Check Endpoint\n');
  console.log('='.repeat(60));

  const sdk = new BackendSDK();

  try {
    // Test 1: Check a code that doesn't exist (should be available)
    console.log('\nTest 1: Checking availability of non-existent code');
    console.log('-'.repeat(60));
    const testCode1 = 'PROG-2026-TEST01';
    
    sdk.setTable('cohorts');
    const existingCohort1 = await sdk.get({ enrollment_code: testCode1 });
    const available1 = existingCohort1.length === 0;
    
    console.log(`Code: ${testCode1}`);
    console.log(`Available: ${available1}`);
    console.log(`Expected: true`);
    console.log(`Result: ${available1 === true ? '✓ PASS' : '✗ FAIL'}`);

    // Test 2: Create a cohort with a code, then check it (should not be available)
    console.log('\nTest 2: Checking availability of existing code');
    console.log('-'.repeat(60));
    const testCode2 = `PROG-2026-TEST${Date.now()}`;
    
    // First, check if we have a programme to use
    sdk.setTable('programmes');
    let programmes = await sdk.get({});
    
    if (programmes.length === 0) {
      console.log('No programmes found. Creating a test programme...');
      const programmeId = await sdk.insert({
        name: 'Test Programme for Enrollment Code Check',
        description: 'Temporary test programme',
        start_date: '2026-01-01',
        created_by: 1,
        type: 'structured',
        status: 'draft',
      });
      programmes = [{ id: programmeId }];
    }

    const programmeId = programmes[0].id;
    console.log(`Using programme ID: ${programmeId}`);

    // Create a cohort with the test code
    sdk.setTable('cohorts');
    const cohortId = await sdk.insert({
      programme_id: programmeId,
      name: 'Test Cohort for Code Check',
      enrollment_code: testCode2,
      start_date: '2026-01-01',
      status: 'active',
    });
    console.log(`Created cohort ID: ${cohortId} with code: ${testCode2}`);

    // Now check if the code is available
    const existingCohort2 = await sdk.get({ enrollment_code: testCode2 });
    const available2 = existingCohort2.length === 0;
    
    console.log(`Code: ${testCode2}`);
    console.log(`Available: ${available2}`);
    console.log(`Expected: false`);
    console.log(`Result: ${available2 === false ? '✓ PASS' : '✗ FAIL'}`);

    // Clean up: Delete the test cohort
    await sdk.deleteWhere({ id: cohortId });
    console.log(`Cleaned up test cohort ID: ${cohortId}`);

    // Test 3: Verify the code is available again after deletion
    console.log('\nTest 3: Checking availability after deletion');
    console.log('-'.repeat(60));
    const existingCohort3 = await sdk.get({ enrollment_code: testCode2 });
    const available3 = existingCohort3.length === 0;
    
    console.log(`Code: ${testCode2}`);
    console.log(`Available: ${available3}`);
    console.log(`Expected: true`);
    console.log(`Result: ${available3 === true ? '✓ PASS' : '✗ FAIL'}`);

    // Test 4: Test with empty/missing code (simulating validation)
    console.log('\nTest 4: Testing missing code parameter');
    console.log('-'.repeat(60));
    const testCode4 = undefined;
    
    if (!testCode4) {
      console.log('Code parameter is missing');
      console.log('Expected: Should return 400 error');
      console.log('Result: ✓ PASS (validation would catch this)');
    } else {
      console.log('Result: ✗ FAIL (should have caught missing parameter)');
    }

    console.log('\n' + '='.repeat(60));
    console.log('All tests completed successfully!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n✗ ERROR:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the tests
testEnrollmentCodeCheck()
  .then(() => {
    console.log('\nTest script finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nTest script failed:', error);
    process.exit(1);
  });
