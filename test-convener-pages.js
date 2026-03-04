/**
 * Test script to identify missing convener pages and functionality
 * Tests all the routes that should exist for the convener flow
 */

const axios = require('axios');

const WEB_BASE = process.env.WEB_BASE || 'http://localhost:3000';

// List of convener routes that should exist
const convenerRoutes = [
  '/convener/dashboard',
  '/convener/programmes/new',
  // Dynamic routes would need actual IDs to test
];

// List of expected functionality that might be missing
const expectedFeatures = [
  'Edit Programme functionality',
  'Publish Programme functionality', 
  'Programme edit page',
  'Cohort management pages',
  'Week management pages',
  'Lesson management pages'
];

async function testConvenerPages() {
  console.log('🧪 Testing Convener Pages and Functionality...\n');

  // Test static routes
  console.log('1️⃣ Testing Static Routes:');
  for (const route of convenerRoutes) {
    try {
      const response = await axios.get(`${WEB_BASE}${route}`, {
        timeout: 5000,
        validateStatus: (status) => status < 500 // Don't throw on 4xx
      });
      
      if (response.status === 200) {
        console.log(`✅ ${route} - OK`);
      } else if (response.status === 404) {
        console.log(`❌ ${route} - 404 NOT FOUND`);
      } else if (response.status === 401 || response.status === 403) {
        console.log(`🔒 ${route} - Auth required (expected)`);
      } else {
        console.log(`⚠️  ${route} - Status ${response.status}`);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`🔌 ${route} - Server not running`);
      } else {
        console.log(`❌ ${route} - Error: ${error.message}`);
      }
    }
  }

  console.log('\n2️⃣ Expected Convener Flow Pages:');
  const expectedPages = [
    '/convener/dashboard - Main convener dashboard',
    '/convener/programmes/new - Create new programme',
    '/convener/programmes/[id] - Programme detail view',
    '/convener/programmes/[id]/edit - Edit programme (MISSING?)',
    '/convener/programmes/[id]/cohorts/new - Create cohort',
    '/convener/programmes/[id]/cohorts/[cohortId] - Cohort detail (MISSING?)',
    '/convener/programmes/[id]/cohorts/[cohortId]/edit - Edit cohort (MISSING?)',
    '/convener/programmes/[id]/weeks/new - Create week',
    '/convener/programmes/[id]/weeks/[weekId] - Week detail (MISSING?)',
    '/convener/programmes/[id]/weeks/[weekId]/edit - Edit week (MISSING?)',
    '/convener/programmes/[id]/weeks/[weekId]/lessons/new - Create lesson',
    '/convener/programmes/[id]/weeks/[weekId]/lessons/[lessonId] - Lesson detail (MISSING?)',
    '/convener/programmes/[id]/weeks/[weekId]/lessons/[lessonId]/edit - Edit lesson (MISSING?)',
  ];

  expectedPages.forEach(page => {
    const [route, description] = page.split(' - ');
    const status = page.includes('MISSING') ? '❌' : '✅';
    console.log(`${status} ${route} - ${description}`);
  });

  console.log('\n3️⃣ Functionality Analysis:');
  
  console.log('✅ Working:');
  console.log('   - Programme creation');
  console.log('   - Programme detail view (with cohorts and weeks)');
  console.log('   - Cohort creation');
  console.log('   - Week creation');
  console.log('   - Lesson creation');
  console.log('   - Programme publishing (backend endpoint added)');

  console.log('\n❌ Missing/Broken:');
  console.log('   - Edit Programme page and functionality');
  console.log('   - Individual cohort detail/edit pages');
  console.log('   - Individual week detail/edit pages');
  console.log('   - Individual lesson detail/edit pages');
  console.log('   - Delete functionality for programmes/cohorts/weeks/lessons');
  console.log('   - Lesson reordering within weeks');
  console.log('   - Week reordering within programmes');
  console.log('   - Cohort enrollment management');

  console.log('\n4️⃣ Critical Missing Pages for Complete Flow:');
  console.log('   1. /convener/programmes/[id]/edit - Edit programme details');
  console.log('   2. /convener/programmes/[id]/cohorts/[cohortId] - Manage individual cohort');
  console.log('   3. /convener/programmes/[id]/weeks/[weekId] - Manage individual week');
  console.log('   4. /convener/programmes/[id]/weeks/[weekId]/lessons/[lessonId] - Manage individual lesson');

  console.log('\n📋 Recommendations:');
  console.log('   1. Add Edit Programme page with form');
  console.log('   2. Add individual resource management pages');
  console.log('   3. Add delete confirmation modals');
  console.log('   4. Add drag-and-drop reordering');
  console.log('   5. Add bulk operations (delete multiple, reorder)');
  console.log('   6. Add cohort enrollment management');
}

// Run tests if this file is executed directly
if (require.main === module) {
  testConvenerPages();
}

module.exports = { testConvenerPages };