// Test script to diagnose weeks query issue
const path = require('path');
process.env.NODE_ENV = 'production';

// Load environment from cohortle-api/.env
const fs = require('fs');
const envPath = path.join(__dirname, 'cohortle-api', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
});

const db = require('./cohortle-api/models');
const { weeks, lessons, programmes } = db;

async function testWeeksQuery() {
  try {
    console.log('Testing weeks query for programme 10...\n');
    
    // Test 1: Check if programme 10 exists
    console.log('1. Checking if programme 10 exists...');
    const programme = await programmes.findByPk(10);
    if (!programme) {
      console.log('❌ Programme 10 not found!');
      return;
    }
    console.log('✅ Programme 10 exists:', programme.name);
    
    // Test 2: Query weeks for programme 10
    console.log('\n2. Querying weeks for programme 10...');
    const programmeWeeks = await weeks.findAll({
      where: {
        programme_id: 10,
      },
      include: [
        {
          model: lessons,
          as: 'lessons',
          attributes: ['id', 'title', 'description', 'content_type', 'content_url', 'order_index'],
          required: false,
        },
      ],
      order: [
        ['week_number', 'ASC'],
        [{ model: lessons, as: 'lessons' }, 'order_index', 'ASC'],
      ],
    });
    
    console.log(`✅ Found ${programmeWeeks.length} weeks`);
    programmeWeeks.forEach(week => {
      console.log(`  - Week ${week.week_number}: ${week.title} (${week.lessons.length} lessons)`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await db.sequelize.close();
  }
}

testWeeksQuery();
