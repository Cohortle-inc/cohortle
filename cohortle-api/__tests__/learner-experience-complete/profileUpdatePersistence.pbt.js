/**
 * Property-Based Test: Profile Update Persistence
 * Feature: learner-experience-complete
 * Property 11: Profile update persistence
 * 
 * **Validates: Requirements 8.4**
 * 
 * For any valid profile update, the changes should be immediately retrievable from the database
 */

const fc = require('fast-check');
const ProfileService = require('../../services/ProfileService');
const {
  setupTestDatabase,
  teardownTestDatabase,
} = require('../helpers/testSetup');
const db = require('../../models');

describe('Feature: learner-experience-complete, Property 11: Profile update persistence', () => {
  let testUsers = [];

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await setupTestDatabase();
  });

  afterAll(async () => {
    // Clean up all test users
    for (const user of testUsers) {
      await db.users.destroy({ where: { id: user.id } });
    }
    await teardownTestDatabase();
  });

  afterEach(async () => {
    // Clean up users created in each test
    for (const user of testUsers) {
      await db.users.destroy({ where: { id: user.id } });
    }
    testUsers = [];
  });

  it('should immediately persist and retrieve profile name updates', async () => {
    // Generator for valid names (non-empty strings with 1-100 characters)
    const validNameArb = fc.string({ minLength: 1, maxLength: 100 }).filter(
      (name) => name.trim().length > 0
    );

    await fc.assert(
      fc.asyncProperty(
        validNameArb,
        validNameArb,
        async (initialName, updatedName) => {
          // Create a test user with initial name
          const user = await db.users.create({
            name: initialName.trim(),
            email: `test_${Date.now()}_${Math.random()}@example.com`,
            password: 'hashedpassword',
            role: 'learner',
          });
          testUsers.push(user);

          // Verify initial profile state
          const initialProfile = await ProfileService.getUserProfile(user.id);
          if (initialProfile.user.name !== initialName.trim()) {
            throw new Error(
              `Initial profile name mismatch: expected "${initialName.trim()}", got "${initialProfile.user.name}"`
            );
          }

          // Update profile with new name
          const updateResult = await ProfileService.updateProfile(user.id, {
            name: updatedName,
          });

          // Verify update result contains new name
          if (updateResult.name !== updatedName.trim()) {
            throw new Error(
              `Update result name mismatch: expected "${updatedName.trim()}", got "${updateResult.name}"`
            );
          }

          // Immediately retrieve profile to verify persistence
          const retrievedProfile = await ProfileService.getUserProfile(user.id);

          // Verify the property: updated name is immediately retrievable
          if (retrievedProfile.user.name !== updatedName.trim()) {
            throw new Error(
              `Retrieved profile name does not match update: expected "${updatedName.trim()}", got "${retrievedProfile.user.name}"`
            );
          }

          // Verify persistence by querying database directly
          const userFromDb = await db.users.findByPk(user.id);
          if (userFromDb.name !== updatedName.trim()) {
            throw new Error(
              `Database name does not match update: expected "${updatedName.trim()}", got "${userFromDb.name}"`
            );
          }

          return true;
        }
      ),
      {
        numRuns: 100,
        timeout: 30000,
      }
    );
  });

  it('should persist profile updates across multiple sequential updates', async () => {
    // Generator for a sequence of name updates (2-5 updates)
    const nameSequenceArb = fc.array(
      fc.string({ minLength: 1, maxLength: 50 }).filter(
        (name) => name.trim().length > 0
      ),
      { minLength: 2, maxLength: 5 }
    );

    await fc.assert(
      fc.asyncProperty(
        nameSequenceArb,
        async (nameSequence) => {
          // Create a test user
          const user = await db.users.create({
            name: 'Initial Name',
            email: `test_${Date.now()}_${Math.random()}@example.com`,
            password: 'hashedpassword',
            role: 'learner',
          });
          testUsers.push(user);

          // Apply each name update sequentially
          for (let i = 0; i < nameSequence.length; i++) {
            const newName = nameSequence[i];

            // Update profile
            await ProfileService.updateProfile(user.id, { name: newName });

            // Immediately verify persistence
            const profile = await ProfileService.getUserProfile(user.id);

            if (profile.user.name !== newName.trim()) {
              throw new Error(
                `After update ${i + 1}, profile name should be "${newName.trim()}", got "${profile.user.name}"`
              );
            }

            // Verify in database
            const userFromDb = await db.users.findByPk(user.id);
            if (userFromDb.name !== newName.trim()) {
              throw new Error(
                `After update ${i + 1}, database name should be "${newName.trim()}", got "${userFromDb.name}"`
              );
            }
          }

          // Verify final state matches last update
          const finalProfile = await ProfileService.getUserProfile(user.id);
          const expectedFinalName = nameSequence[nameSequence.length - 1].trim();

          if (finalProfile.user.name !== expectedFinalName) {
            throw new Error(
              `Final profile name should be "${expectedFinalName}", got "${finalProfile.user.name}"`
            );
          }

          return true;
        }
      ),
      {
        numRuns: 100,
        timeout: 30000,
      }
    );
  });

  it('should reject empty or whitespace-only name updates', async () => {
    // Generator for invalid names (empty or whitespace-only)
    const invalidNameArb = fc.oneof(
      fc.constant(''),
      fc.constant('   '),
      fc.constant('\t'),
      fc.constant('\n'),
      fc.string({ minLength: 1, maxLength: 20 })
        .filter((s) => s.trim().length === 0)
    );

    await fc.assert(
      fc.asyncProperty(
        invalidNameArb,
        async (invalidName) => {
          // Create a test user
          const user = await db.users.create({
            name: 'Valid Name',
            email: `test_${Date.now()}_${Math.random()}@example.com`,
            password: 'hashedpassword',
            role: 'learner',
          });
          testUsers.push(user);

          // Get initial profile
          const initialProfile = await ProfileService.getUserProfile(user.id);
          const originalName = initialProfile.user.name;

          // Attempt to update with invalid name
          let errorThrown = false;
          try {
            await ProfileService.updateProfile(user.id, { name: invalidName });
          } catch (error) {
            errorThrown = true;
            if (!error.message.includes('empty')) {
              throw new Error(
                `Expected error message to mention 'empty', got: ${error.message}`
              );
            }
          }

          // Verify error was thrown
          if (!errorThrown) {
            throw new Error(
              `Update with invalid name "${invalidName}" should have thrown an error`
            );
          }

          // Verify original name is preserved
          const profileAfterFailedUpdate = await ProfileService.getUserProfile(user.id);
          if (profileAfterFailedUpdate.user.name !== originalName) {
            throw new Error(
              `Name should remain "${originalName}" after failed update, got "${profileAfterFailedUpdate.user.name}"`
            );
          }

          return true;
        }
      ),
      {
        numRuns: 100,
        timeout: 30000,
      }
    );
  });

  it('should persist profile updates independently for different users', async () => {
    // Generator for multiple user scenarios
    const multiUserScenarioArb = fc.record({
      userCount: fc.integer({ min: 2, max: 5 }),
      names: fc.array(
        fc.string({ minLength: 1, maxLength: 50 }).filter(
          (name) => name.trim().length > 0
        ),
        { minLength: 2, maxLength: 5 }
      ),
    });

    await fc.assert(
      fc.asyncProperty(
        multiUserScenarioArb,
        async ({ userCount, names }) => {
          // Ensure we have enough names for all users
          fc.pre(names.length >= userCount);

          // Create multiple test users
          const users = [];
          for (let i = 0; i < userCount; i++) {
            const user = await db.users.create({
              name: `User ${i}`,
              email: `test_${Date.now()}_${i}_${Math.random()}@example.com`,
              password: 'hashedpassword',
              role: 'learner',
            });
            users.push(user);
            testUsers.push(user);
          }

          // Update each user with a unique name
          const expectedNames = [];
          for (let i = 0; i < userCount; i++) {
            const newName = names[i];
            expectedNames.push(newName.trim());

            await ProfileService.updateProfile(users[i].id, { name: newName });
          }

          // Verify each user has their correct updated name
          for (let i = 0; i < userCount; i++) {
            const profile = await ProfileService.getUserProfile(users[i].id);

            if (profile.user.name !== expectedNames[i]) {
              throw new Error(
                `User ${i} should have name "${expectedNames[i]}", got "${profile.user.name}"`
              );
            }

            // Verify no cross-contamination with other users
            for (let j = 0; j < userCount; j++) {
              if (i !== j) {
                const otherProfile = await ProfileService.getUserProfile(users[j].id);
                if (otherProfile.user.name === expectedNames[i] && i !== j) {
                  // Only error if names are different but got mixed up
                  if (expectedNames[i] !== expectedNames[j]) {
                    throw new Error(
                      `User ${j} incorrectly has name "${expectedNames[i]}" which belongs to user ${i}`
                    );
                  }
                }
              }
            }
          }

          return true;
        }
      ),
      {
        numRuns: 50,
        timeout: 30000,
      }
    );
  });

  it('should handle concurrent profile updates correctly', async () => {
    // Generator for concurrent update scenarios
    const concurrentUpdateArb = fc.record({
      updateCount: fc.integer({ min: 2, max: 5 }),
      names: fc.array(
        fc.string({ minLength: 1, maxLength: 50 }).filter(
          (name) => name.trim().length > 0
        ),
        { minLength: 2, maxLength: 5 }
      ),
    });

    await fc.assert(
      fc.asyncProperty(
        concurrentUpdateArb,
        async ({ updateCount, names }) => {
          // Ensure we have enough names
          fc.pre(names.length >= updateCount);

          // Create a test user
          const user = await db.users.create({
            name: 'Initial Name',
            email: `test_${Date.now()}_${Math.random()}@example.com`,
            password: 'hashedpassword',
            role: 'learner',
          });
          testUsers.push(user);

          // Perform concurrent updates
          const updatePromises = [];
          for (let i = 0; i < updateCount; i++) {
            updatePromises.push(
              ProfileService.updateProfile(user.id, { name: names[i] })
            );
          }

          // Wait for all updates to complete
          await Promise.all(updatePromises);

          // Verify final state is one of the updated names
          const finalProfile = await ProfileService.getUserProfile(user.id);
          const trimmedNames = names.slice(0, updateCount).map((n) => n.trim());

          if (!trimmedNames.includes(finalProfile.user.name)) {
            throw new Error(
              `Final name "${finalProfile.user.name}" should be one of the updated names: ${trimmedNames.join(', ')}`
            );
          }

          // Verify database consistency
          const userFromDb = await db.users.findByPk(user.id);
          if (userFromDb.name !== finalProfile.user.name) {
            throw new Error(
              `Database name "${userFromDb.name}" does not match profile name "${finalProfile.user.name}"`
            );
          }

          return true;
        }
      ),
      {
        numRuns: 50,
        timeout: 30000,
      }
    );
  });

  it('should preserve other profile fields when updating name', async () => {
    // Generator for name updates
    const nameArb = fc.string({ minLength: 1, maxLength: 50 }).filter(
      (name) => name.trim().length > 0
    );

    await fc.assert(
      fc.asyncProperty(
        nameArb,
        async (newName) => {
          // Create a test user with specific email
          const originalEmail = `test_${Date.now()}_${Math.random()}@example.com`;
          const user = await db.users.create({
            name: 'Original Name',
            email: originalEmail,
            password: 'hashedpassword',
            role: 'learner',
          });
          testUsers.push(user);

          // Get initial profile
          const initialProfile = await ProfileService.getUserProfile(user.id);
          const originalJoinedAt = initialProfile.user.joinedAt;

          // Update only the name
          await ProfileService.updateProfile(user.id, { name: newName });

          // Retrieve updated profile
          const updatedProfile = await ProfileService.getUserProfile(user.id);

          // Verify name was updated
          if (updatedProfile.user.name !== newName.trim()) {
            throw new Error(
              `Name should be updated to "${newName.trim()}", got "${updatedProfile.user.name}"`
            );
          }

          // Verify email was preserved
          if (updatedProfile.user.email !== originalEmail) {
            throw new Error(
              `Email should be preserved as "${originalEmail}", got "${updatedProfile.user.email}"`
            );
          }

          // Verify joinedAt was preserved
          if (updatedProfile.user.joinedAt !== originalJoinedAt) {
            throw new Error(
              `JoinedAt should be preserved as "${originalJoinedAt}", got "${updatedProfile.user.joinedAt}"`
            );
          }

          // Verify user ID was preserved
          if (updatedProfile.user.id !== user.id) {
            throw new Error(
              `User ID should be preserved as ${user.id}, got ${updatedProfile.user.id}`
            );
          }

          return true;
        }
      ),
      {
        numRuns: 100,
        timeout: 30000,
      }
    );
  });

  it('should handle special characters in profile names correctly', async () => {
    // Generator for names with special characters
    const specialCharNameArb = fc.oneof(
      fc.constant("O'Brien"),
      fc.constant('José García'),
      fc.constant('李明'),
      fc.constant('Müller'),
      fc.constant('François'),
      fc.constant('Владимир'),
      fc.constant('محمد'),
      fc.constant('Name-With-Hyphens'),
      fc.constant('Name.With.Dots'),
      fc.constant('Name (With Parentheses)'),
      fc.string({ minLength: 1, maxLength: 50 }).filter(
        (name) => name.trim().length > 0 && /[^\w\s]/.test(name)
      )
    );

    await fc.assert(
      fc.asyncProperty(
        specialCharNameArb,
        async (specialName) => {
          // Create a test user
          const user = await db.users.create({
            name: 'Regular Name',
            email: `test_${Date.now()}_${Math.random()}@example.com`,
            password: 'hashedpassword',
            role: 'learner',
          });
          testUsers.push(user);

          // Update with special character name
          await ProfileService.updateProfile(user.id, { name: specialName });

          // Retrieve and verify
          const profile = await ProfileService.getUserProfile(user.id);

          if (profile.user.name !== specialName.trim()) {
            throw new Error(
              `Special character name should be "${specialName.trim()}", got "${profile.user.name}"`
            );
          }

          // Verify in database
          const userFromDb = await db.users.findByPk(user.id);
          if (userFromDb.name !== specialName.trim()) {
            throw new Error(
              `Database should store special character name "${specialName.trim()}", got "${userFromDb.name}"`
            );
          }

          return true;
        }
      ),
      {
        numRuns: 100,
        timeout: 30000,
      }
    );
  });

  it('should handle very long valid names correctly', async () => {
    // Generator for long names (50-100 characters)
    const longNameArb = fc.string({ minLength: 50, maxLength: 100 }).filter(
      (name) => name.trim().length >= 50
    );

    await fc.assert(
      fc.asyncProperty(
        longNameArb,
        async (longName) => {
          // Create a test user
          const user = await db.users.create({
            name: 'Short Name',
            email: `test_${Date.now()}_${Math.random()}@example.com`,
            password: 'hashedpassword',
            role: 'learner',
          });
          testUsers.push(user);

          // Update with long name
          await ProfileService.updateProfile(user.id, { name: longName });

          // Retrieve and verify
          const profile = await ProfileService.getUserProfile(user.id);

          if (profile.user.name !== longName.trim()) {
            throw new Error(
              `Long name should be persisted correctly. Expected length ${longName.trim().length}, got length ${profile.user.name.length}`
            );
          }

          // Verify full content matches
          if (profile.user.name !== longName.trim()) {
            throw new Error(
              `Long name content mismatch. Expected "${longName.trim()}", got "${profile.user.name}"`
            );
          }

          return true;
        }
      ),
      {
        numRuns: 50,
        timeout: 30000,
      }
    );
  });
});
