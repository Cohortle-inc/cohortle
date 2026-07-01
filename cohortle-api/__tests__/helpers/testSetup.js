/**
 * Test setup helpers for WLIMP property-based tests
 * Provides database connection, transaction management, and cleanup utilities
 */

const { sequelize } = require('../../models');
const BackendSDK = require('../../core/BackendSDK');

let testTransaction = null;

/**
 * Setup test database connection
 */
async function setupTestDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Test database connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to the test database:', error);
    throw error;
  }
}

/**
 * Cleanup test database after tests
 */
async function teardownTestDatabase() {
  try {
    await sequelize.close();
    console.log('Test database connection closed.');
  } catch (error) {
    console.error('Error closing test database connection:', error);
    throw error;
  }
}

/**
 * Begin a transaction for test isolation
 * Each test should run in its own transaction that gets rolled back
 */
async function beginTestTransaction() {
  testTransaction = await sequelize.transaction();
  return testTransaction;
}

/**
 * Rollback the current test transaction
 * This cleans up all data created during the test
 */
async function rollbackTestTransaction() {
  if (testTransaction) {
    await testTransaction.rollback();
    testTransaction = null;
  }
}

/**
 * Clean up test data for a specific table
 * @param {string} tableName - Name of the table to clean
 * @param {object} where - Conditions for deletion
 */
async function cleanupTestData(tableName, where = {}) {
  const sdk = new BackendSDK();
  sdk.setTable(tableName);
  
  try {
    if (Object.keys(where).length > 0) {
      await sdk.deleteWhere(where);
    }
  } catch (error) {
    // Ignore errors if no data to delete
    if (!error.message.includes('not found')) {
      console.error(`Error cleaning up ${tableName}:`, error);
    }
  }
}

/**
 * Create a test community for programme tests
 * @param {number} userId - User ID to associate with the community
 * @returns {Promise<number>} Community ID
 */
async function createTestCommunity(userId) {
  const sdk = new BackendSDK();
  sdk.setTable('communities');
  
  const communityId = await sdk.insert({
    name: `Test Community ${Date.now()}`,
    owner_id: userId,
    status: 'active',
    type: 'learning',
  });
  
  return communityId;
}

/**
 * Create a test user for programme tests
 * @returns {Promise<number>} User ID
 */
async function createTestUser() {
  const sdk = new BackendSDK();
  sdk.setTable('users');
  
  const userId = await sdk.insert({
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'test_password_hash',
    role: 'convener',
  });
  
  return userId;
}

module.exports = {
  setupTestDatabase,
  teardownTestDatabase,
  beginTestTransaction,
  rollbackTestTransaction,
  cleanupTestData,
  createTestCommunity,
  createTestUser,
};
