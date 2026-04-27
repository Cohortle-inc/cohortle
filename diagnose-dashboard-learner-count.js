/**
 * Diagnostic script to check why total learners might be showing 0
 * This script checks the database directly to see if there are enrollments
 */

const BackendSDK = require('./cohortle-api/core/BackendSDK');

async function diagnoseDashboardLearnerCount() {
  try {
    console.log('🔍 Diagnosing dashboard learner count issue...');
    
    const sdk = new BackendSDK();
    
    // 1. Check if there are any programmes
    sdk.setTable('programmes');
    const programmes = await sdk.get({});
    console.log(`📊 Found ${programmes.length} programmes in database`);
    
    if (programmes.length === 0) {
      console.log('❌ No programmes found - this explains why total learners is 0');
      return;
    }
    
    // 2. Check if there are any cohorts
    sdk.setTable('cohorts');
    const cohorts = await sdk.get({});
    console.log(`👥 Found ${cohorts.length} cohorts in database`);
    
    if (cohorts.length === 0) {
      console.log('❌ No cohorts found - this explains why total learners is 0');
      return;
    }
    
    // 3. Check if there are any enrollments
    sdk.setTable('enrollments');
    const enrollments = await sdk.get({});
    console.log(`📝 Found ${enrollments.length} enrollments in database`);
    
    if (enrollments.length === 0) {
      console.log('❌ No enrollments found - this explains why total learners is 0');
      return;
    }
    
    // 4. Check enrollment statuses
    const activeEnrollments = enrollments.filter(e => e.status === 'active');
    console.log(`✅ Found ${activeEnrollments.length} active enrollments`);
    
    if (activeEnrollments.length === 0) {
      console.log('❌ No active enrollments found - this explains why total learners is 0');
      console.log('📋 Enrollment statuses found:');
      const statusCounts = {};
      enrollments.forEach(e => {
        statusCounts[e.status] = (statusCounts[e.status] || 0) + 1;
      });
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
      return;
    }
    
    // 5. Test the exact query used by the backend
    console.log('\n🔍 Testing backend query...');
    const programmeIds = programmes.map(p => p.id);
    const idList = programmeIds.map(id => parseInt(id, 10)).join(',');
    
    const query = `
      SELECT c.programme_id,
             COUNT(DISTINCT c.id) AS cohort_cnt,
             COUNT(DISTINCT CASE WHEN e.status = 'active' THEN e.id END) AS enrolled_cnt
      FROM cohorts c
      LEFT JOIN enrollments e ON e.cohort_id = c.id
      WHERE c.programme_id IN (${idList})
      GROUP BY c.programme_id
    `;
    
    console.log('📝 Query:', query);
    
    const rows = await sdk.rawQuery(query);
    console.log(`📊 Query returned ${rows.length} rows:`);
    
    let totalLearners = 0;
    rows.forEach(row => {
      console.log(`   Programme ${row.programme_id}: ${row.enrolled_cnt} learners, ${row.cohort_cnt} cohorts`);
      totalLearners += Number(row.enrolled_cnt);
    });
    
    console.log(`\n📈 Total learners from query: ${totalLearners}`);
    
    if (totalLearners === 0) {
      console.log('\n🔍 Detailed analysis:');
      
      // Check each programme individually
      for (const programme of programmes.slice(0, 5)) { // Limit to first 5 for brevity
        console.log(`\n📚 Programme: ${programme.name} (ID: ${programme.id})`);
        
        // Get cohorts for this programme
        sdk.setTable('cohorts');
        const programmeCohorts = await sdk.get({ programme_id: programme.id });
        console.log(`   Cohorts: ${programmeCohorts.length}`);
        
        for (const cohort of programmeCohorts) {
          console.log(`   📋 Cohort: ${cohort.name} (ID: ${cohort.id})`);
          
          // Get enrollments for this cohort
          sdk.setTable('enrollments');
          const cohortEnrollments = await sdk.get({ cohort_id: cohort.id });
          const activeEnrollments = cohortEnrollments.filter(e => e.status === 'active');
          
          console.log(`      Total enrollments: ${cohortEnrollments.length}`);
          console.log(`      Active enrollments: ${activeEnrollments.length}`);
          
          if (cohortEnrollments.length > 0) {
            const statusCounts = {};
            cohortEnrollments.forEach(e => {
              statusCounts[e.status] = (statusCounts[e.status] || 0) + 1;
            });
            console.log(`      Status breakdown:`, statusCounts);
          }
        }
      }
    } else {
      console.log('✅ Total learners count is working correctly!');
    }
    
  } catch (error) {
    console.error('❌ Error diagnosing dashboard learner count:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the diagnostic
diagnoseDashboardLearnerCount();