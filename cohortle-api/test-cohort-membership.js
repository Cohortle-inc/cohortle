/**
 * Test file for cohort membership check endpoint
 * Usage: node test-cohort-membership.js
 * 
 * This tests the following endpoint:
 * POST /v1/api/programmes/{programme_id}/check-cohort-membership
 * 
 * This endpoint checks if a user is a member of ANY cohort within a programme
 */

const http = require('http');

// Test configurations
const TEST_CONFIG = {
  hostname: 'localhost',
  port: 3000, // Adjust if your app runs on a different port
  baseUrl: 'http://localhost:3000/v1/api',
};

console.log('='.repeat(60));
console.log('Cohort Membership Check Endpoint Test Suite');
console.log('='.repeat(60));
console.log(`Testing against: ${TEST_CONFIG.baseUrl}`);
console.log('');

console.log('NOTE: The endpoint requires a valid Bearer token for authentication.');
console.log('      You can test using a tool like Postman or cURL.');
console.log('');
console.log('Example cURL command:');
console.log('curl -X POST \\');
console.log('  http://localhost:3000/v1/api/programmes/1/check-cohort-membership \\');
console.log('  -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"user_id": 1}\'');
console.log('');
console.log('='.repeat(60));
console.log('Expected Response Format (when user is a member of any cohort):');
console.log('='.repeat(60));
console.log(JSON.stringify({
  error: false,
  message: "User is a member of 2 cohort(s) in this programme",
  is_member: true,
  cohorts: [
    {
      cohort_id: 1,
      cohort_name: "Cohort A",
      status: "active",
      joined_at: "2024-01-15T10:30:00.000Z"
    },
    {
      cohort_id: 2,
      cohort_name: "Cohort B",
      status: "active",
      joined_at: "2024-01-16T14:22:00.000Z"
    }
  ]
}, null, 2));
console.log('');
console.log('='.repeat(60));
console.log('Expected Response Format (when user is NOT a member of any cohort):');
console.log('='.repeat(60));
console.log(JSON.stringify({
  error: false,
  message: "User is not a member of any cohort in this programme",
  is_member: false,
  cohorts: []
}, null, 2));
console.log('');

// Endpoint documentation
console.log('='.repeat(60));
console.log('Endpoint Documentation');
console.log('='.repeat(60));
console.log('');
console.log('Endpoint: POST /v1/api/programmes/{programme_id}/check-cohort-membership');
console.log('');
console.log('Description:');
console.log('  Checks if a user is a member of ANY cohort within a programme');
console.log('');
console.log('Path Parameters:');
console.log('  - programme_id (integer, required): The ID of the programme');
console.log('');
console.log('Request Body:');
console.log('  - user_id (integer, required): The ID of the user to check');
console.log('');
console.log('Response:');
console.log('  - error (boolean): Whether an error occurred');
console.log('  - message (string): Descriptive message');
console.log('  - is_member (boolean): Whether the user is a member of any cohort');
console.log('  - cohorts (array): List of cohorts the user is a member of');
console.log('    - cohort_id (integer)');
console.log('    - cohort_name (string)');
console.log('    - status (string): Member status');
console.log('    - joined_at (string): ISO timestamp of when user joined');
console.log('');
console.log('Permission Requirements:');
console.log('  - Conveners can check any user in the programme');
console.log('  - Learners can only check themselves');
console.log('  - Token: Bearer token required (convener or learner role)');
console.log('');
console.log('Status Codes:');
console.log('  - 200: Request successful (member or not)');
console.log('  - 400: Invalid input parameters (missing user_id, etc.)');
console.log('  - 403: Unauthorized access (learner checking another user)');
console.log('  - 404: Programme not found');
console.log('  - 500: Server error');
console.log('');
console.log('='.repeat(60));
