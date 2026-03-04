/**
 * Diagnose Cohort Creation Issue
 * This script checks the database state and API endpoints
 */

const mysql = require('mysql2/promise');

async function diagnoseCohortIssue() {
    console.log('🔍 Diagnosing Cohort Creation Issue...\n');

    try {
        // Database connection
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'cohortle_db'
        });

        console.log('✅ Database connection successful\n');

        // Check 1: Does cohorts table exist?
        console.log('1. Checking cohorts table structure...');
        try {
            const [columns] = await connection.execute('DESCRIBE cohorts');
            console.log('✅ Cohorts table exists');
            
            // Check if enrollment_code column exists
            const hasEnrollmentCode = columns.some(col => col.Field === 'enrollment_code');
            if (hasEnrollmentCode) {
                console.log('✅ enrollment_code column exists');
            } else {
                console.log('❌ enrollment_code column MISSING');
                console.log('📋 Current columns:', columns.map(col => col.Field).join(', '));
            }
        } catch (error) {
            console.log('❌ Cohorts table does not exist or cannot be accessed');
            console.log('Error:', error.message);
        }

        // Check 2: Migration status
        console.log('\n2. Checking migration status...');
        try {
            const [migrations] = await connection.execute('SELECT * FROM SequelizeMeta ORDER BY name');
            console.log('✅ SequelizeMeta table exists');
            console.log('📋 Completed migrations:');
            migrations.forEach(migration => {
                console.log(`   - ${migration.name}`);
            });

            // Check if enrollment_code migration ran
            const enrollmentMigration = migrations.find(m => m.name.includes('enrollment-code'));
            if (enrollmentMigration) {
                console.log('✅ Enrollment code migration has run');
            } else {
                console.log('❌ Enrollment code migration has NOT run');
            }
        } catch (error) {
            console.log('❌ Cannot check migration status');
            console.log('Error:', error.message);
        }

        // Check 3: Test data
        console.log('\n3. Checking existing cohorts...');
        try {
            const [cohorts] = await connection.execute('SELECT id, name, enrollment_code FROM cohorts LIMIT 5');
            console.log(`✅ Found ${cohorts.length} cohorts`);
            if (cohorts.length > 0) {
                console.log('📋 Sample cohorts:');
                cohorts.forEach(cohort => {
                    console.log(`   - ID: ${cohort.id}, Name: ${cohort.name}, Code: ${cohort.enrollment_code || 'NULL'}`);
                });
            }
        } catch (error) {
            console.log('❌ Cannot query cohorts');
            console.log('Error:', error.message);
        }

        await connection.end();

    } catch (error) {
        console.log('❌ Database connection failed');
        console.log('Error:', error.message);
        console.log('\n🔧 Check these environment variables:');
        console.log(`   DB_HOST: ${process.env.DB_HOST || 'NOT SET'}`);
        console.log(`   DB_USER: ${process.env.DB_USER || 'NOT SET'}`);
        console.log(`   DB_NAME: ${process.env.DB_NAME || 'NOT SET'}`);
        console.log(`   DB_PASSWORD: ${process.env.DB_PASSWORD ? '[SET]' : 'NOT SET'}`);
    }

    // Check 4: API endpoint test
    console.log('\n4. Testing API endpoints...');
    
    // Test enrollment code check endpoint
    console.log('Testing enrollment code check endpoint...');
    try {
        const response = await fetch('https://api.cohortle.com/v1/api/enrollment-codes/check?code=TEST-2026-ABC123', {
            headers: {
                'Authorization': 'Bearer test-token',
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Enrollment code check endpoint responding');
            console.log('Response:', JSON.stringify(data, null, 2));
        } else {
            console.log(`❌ Enrollment code check endpoint returned ${response.status}`);
            const text = await response.text();
            console.log('Response:', text);
        }
    } catch (error) {
        console.log('❌ Cannot reach enrollment code check endpoint');
        console.log('Error:', error.message);
    }

    console.log('\n🏁 Diagnosis complete!');
}

// Run diagnosis
diagnoseCohortIssue().catch(console.error);