/**
 * Property-Based Test: Programme Action Access Control
 * Feature: email-verification-flow-improvement
 * Property 5: Programme Action Access Control
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 * 
 * For any user attempting to create or join a programme, the action should
 * succeed if and only if the user's email is verified.
 */

const fc = require('fast-check');
const request = require('supertest');
const app = require('../../app');
const db = require('../../models');
const JwtService = require('../../services/JwtService');
const PasswordService = require('../../services/PasswordService');
const {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestData,
  createTestCommunity,
} = require('../helpers/testSetup');

describe('Feature: email-verification-flow-improvement, Property 5: Programme Action Access Control', () => {
  let testUserIds = [];
  let testCommunityIds = [];
  let testProgrammeIds = [];
  let testCohortIds = [];

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await setupTestDatabase();
  });

  afterAll(async () => {
    // Clean up all test data
    for (const cohortId of testCohortIds) {
      await cleanupTestData('cohorts', { id: cohortId });
    }
    for (const programmeId of testProgrammeIds) {
      await cleanupTestData('programmes', { id: programmeId });
    }
    for (const communityId of testCommunityIds) {
      await cleanupTestData('communities', { id: communityId });
    }
    for (const userId of testUserIds) {
      await cleanupTestData('users', { id: userId });
    }
    
    await teardownTestDatabase();
  });

  it('should allow verified users to create programmes', async () => {
    const numUsersArb = fc.integer({ min: 2, max: 5 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          for (let i = 0; i < numUsers; i++) {
            // Create community
            const communityId = await createTestCommunity();
            testCommunityIds.push(communityId);

            // Create verified user
            const hashedPassword = await PasswordService.hashPassword('TestPassword123!');
            const [userId] = await db.users.create({
              email: `verified${Date.now()}${i}@test.com`,
              first_name: 'Verified',
              last_name: 'User',
              password: hashedPassword,
              email_verified: 1, // Verified
              community_id: communityId
            });
            testUserIds.push(userId);

            // Create JWT for verified user
            const token = JwtService.createAccessToken(
              {
                user_id: userId,
                email: `verified${Date.now()}${i}@test.com`,
                email_verified: true,
                role: 'convener'
              },
              24 * 60 * 60 * 1000,
              process.env.JWT_SECRET
            );

            // Attempt to create programme
            const response = await request(app)
              .post('/v1/api/programmes')
              .set('Authorization', `Bearer ${token}`)
              .send({
                name: `Test Programme ${i}`,
                description: 'Test programme description',
                community_id: communityId
              });

            // Property: Verified users should be able to create programmes
            expect(response.status).toBe(201);
            expect(response.body.error).toBe(false);
            expect(response.body.programme).toBeDefined();
            expect(response.body.programme.id).toBeDefined();
            
            testProgrammeIds.push(response.body.programme.id);
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should block unverified users from creating programmes', async () => {
    const numUsersArb = fc.integer({ min: 2, max: 5 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          for (let i = 0; i < numUsers; i++) {
            // Create community
            const communityId = await createTestCommunity();
            testCommunityIds.push(communityId);

            // Create unverified user
            const hashedPassword = await PasswordService.hashPassword('TestPassword123!');
            const [userId] = await db.users.create({
              email: `unverified${Date.now()}${i}@test.com`,
              first_name: 'Unverified',
              last_name: 'User',
              password: hashedPassword,
              email_verified: 0, // Unverified
              community_id: communityId
            });
            testUserIds.push(userId);

            // Create JWT for unverified user
            const token = JwtService.createAccessToken(
              {
                user_id: userId,
                email: `unverified${Date.now()}${i}@test.com`,
                email_verified: false,
                role: 'convener'
              },
              24 * 60 * 60 * 1000,
              process.env.JWT_SECRET
            );

            // Attempt to create programme
            const response = await request(app)
              .post('/v1/api/programmes')
              .set('Authorization', `Bearer ${token}`)
              .send({
                name: `Test Programme ${i}`,
                description: 'Test programme description',
                community_id: communityId
              });

            // Property: Unverified users should be blocked from creating programmes
            expect(response.status).toBe(403);
            expect(response.body.error).toBe(true);
            expect(response.body.message).toContain('verify');
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should allow verified users to join programmes', async () => {
    const numUsersArb = fc.integer({ min: 2, max: 4 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          for (let i = 0; i < numUsers; i++) {
            // Create community
            const communityId = await createTestCommunity();
            testCommunityIds.push(communityId);

            // Create programme creator (verified)
            const creatorPassword = await PasswordService.hashPassword('TestPassword123!');
            const [creatorId] = await db.users.create({
              email: `creator${Date.now()}${i}@test.com`,
              first_name: 'Creator',
              last_name: 'User',
              password: creatorPassword,
              email_verified: 1,
              community_id: communityId
            });
            testUserIds.push(creatorId);

            // Create programme
            const [programmeId] = await db.programmes.create({
              name: `Test Programme ${i}`,
              description: 'Test programme',
              community_id: communityId,
              created_by: creatorId
            });
            testProgrammeIds.push(programmeId);

            // Create cohort
            const [cohortId] = await db.cohorts.create({
              name: `Test Cohort ${i}`,
              programme_id: programmeId,
              start_date: new Date(),
              enrollment_code: `CODE${Date.now()}${i}`
            });
            testCohortIds.push(cohortId);

            // Create verified learner
            const learnerPassword = await PasswordService.hashPassword('TestPassword123!');
            const [learnerId] = await db.users.create({
              email: `learner${Date.now()}${i}@test.com`,
              first_name: 'Learner',
              last_name: 'User',
              password: learnerPassword,
              email_verified: 1, // Verified
              community_id: communityId
            });
            testUserIds.push(learnerId);

            // Create JWT for verified learner
            const token = JwtService.createAccessToken(
              {
                user_id: learnerId,
                email: `learner${Date.now()}${i}@test.com`,
                email_verified: true,
                role: 'student'
              },
              24 * 60 * 60 * 1000,
              process.env.JWT_SECRET
            );

            // Attempt to join programme
            const response = await request(app)
              .post('/v1/api/programmes/enroll')
              .set('Authorization', `Bearer ${token}`)
              .send({
                code: `CODE${Date.now()}${i}`
              });

            // Property: Verified users should be able to join programmes
            expect(response.status).toBe(201);
            expect(response.body.error).toBe(false);
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should block unverified users from joining programmes', async () => {
    const numUsersArb = fc.integer({ min: 2, max: 4 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          for (let i = 0; i < numUsers; i++) {
            // Create community
            const communityId = await createTestCommunity();
            testCommunityIds.push(communityId);

            // Create programme creator (verified)
            const creatorPassword = await PasswordService.hashPassword('TestPassword123!');
            const [creatorId] = await db.users.create({
              email: `creator${Date.now()}${i}@test.com`,
              first_name: 'Creator',
              last_name: 'User',
              password: creatorPassword,
              email_verified: 1,
              community_id: communityId
            });
            testUserIds.push(creatorId);

            // Create programme
            const [programmeId] = await db.programmes.create({
              name: `Test Programme ${i}`,
              description: 'Test programme',
              community_id: communityId,
              created_by: creatorId
            });
            testProgrammeIds.push(programmeId);

            // Create cohort
            const [cohortId] = await db.cohorts.create({
              name: `Test Cohort ${i}`,
              programme_id: programmeId,
              start_date: new Date(),
              enrollment_code: `CODE${Date.now()}${i}`
            });
            testCohortIds.push(cohortId);

            // Create unverified learner
            const learnerPassword = await PasswordService.hashPassword('TestPassword123!');
            const [learnerId] = await db.users.create({
              email: `learner${Date.now()}${i}@test.com`,
              first_name: 'Learner',
              last_name: 'User',
              password: learnerPassword,
              email_verified: 0, // Unverified
              community_id: communityId
            });
            testUserIds.push(learnerId);

            // Create JWT for unverified learner
            const token = JwtService.createAccessToken(
              {
                user_id: learnerId,
                email: `learner${Date.now()}${i}@test.com`,
                email_verified: false,
                role: 'student'
              },
              24 * 60 * 60 * 1000,
              process.env.JWT_SECRET
            );

            // Attempt to join programme
            const response = await request(app)
              .post('/v1/api/programmes/enroll')
              .set('Authorization', `Bearer ${token}`)
              .send({
                code: `CODE${Date.now()}${i}`
              });

            // Property: Unverified users should be blocked from joining programmes
            expect(response.status).toBe(403);
            expect(response.body.error).toBe(true);
            expect(response.body.message).toContain('verify');
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should enforce verification requirement consistently across all programme actions', async () => {
    const numUsersArb = fc.integer({ min: 2, max: 4 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          for (let i = 0; i < numUsers; i++) {
            // Create community
            const communityId = await createTestCommunity();
            testCommunityIds.push(communityId);

            // Create user with random verification status
            const isVerified = i % 2 === 0;
            const hashedPassword = await PasswordService.hashPassword('TestPassword123!');
            const [userId] = await db.users.create({
              email: `user${Date.now()}${i}@test.com`,
              first_name: 'Test',
              last_name: 'User',
              password: hashedPassword,
              email_verified: isVerified ? 1 : 0,
              community_id: communityId
            });
            testUserIds.push(userId);

            // Create JWT
            const token = JwtService.createAccessToken(
              {
                user_id: userId,
                email: `user${Date.now()}${i}@test.com`,
                email_verified: isVerified,
                role: 'convener'
              },
              24 * 60 * 60 * 1000,
              process.env.JWT_SECRET
            );

            // Test create programme
            const createResponse = await request(app)
              .post('/v1/api/programmes')
              .set('Authorization', `Bearer ${token}`)
              .send({
                name: `Test Programme ${i}`,
                description: 'Test programme description',
                community_id: communityId
              });

            // Property: Response should match verification status
            if (isVerified) {
              expect(createResponse.status).toBe(201);
              expect(createResponse.body.error).toBe(false);
              if (createResponse.body.programme && createResponse.body.programme.id) {
                testProgrammeIds.push(createResponse.body.programme.id);
              }
            } else {
              expect(createResponse.status).toBe(403);
              expect(createResponse.body.error).toBe(true);
            }
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should allow verified users to perform all programme actions', async () => {
    const numUsersArb = fc.integer({ min: 2, max: 3 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          for (let i = 0; i < numUsers; i++) {
            // Create community
            const communityId = await createTestCommunity();
            testCommunityIds.push(communityId);

            // Create verified user
            const hashedPassword = await PasswordService.hashPassword('TestPassword123!');
            const [userId] = await db.users.create({
              email: `verified${Date.now()}${i}@test.com`,
              first_name: 'Verified',
              last_name: 'User',
              password: hashedPassword,
              email_verified: 1,
              community_id: communityId
            });
            testUserIds.push(userId);

            // Create JWT
            const token = JwtService.createAccessToken(
              {
                user_id: userId,
                email: `verified${Date.now()}${i}@test.com`,
                email_verified: true,
                role: 'convener'
              },
              24 * 60 * 60 * 1000,
              process.env.JWT_SECRET
            );

            // Create programme
            const createResponse = await request(app)
              .post('/v1/api/programmes')
              .set('Authorization', `Bearer ${token}`)
              .send({
                name: `Test Programme ${i}`,
                description: 'Test programme description',
                community_id: communityId
              });

            expect(createResponse.status).toBe(201);
            expect(createResponse.body.error).toBe(false);
            
            if (createResponse.body.programme && createResponse.body.programme.id) {
              const programmeId = createResponse.body.programme.id;
              testProgrammeIds.push(programmeId);

              // Create cohort
              const cohortResponse = await request(app)
                .post(`/v1/api/programmes/${programmeId}/cohorts`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                  name: `Test Cohort ${i}`,
                  enrollment_code: `COHORT${Date.now()}${i}`,
                  start_date: new Date().toISOString()
                });

              // Property: Verified users can create cohorts
              expect(cohortResponse.status).toBe(201);
              expect(cohortResponse.body.error).toBe(false);
              
              if (cohortResponse.body.cohort && cohortResponse.body.cohort.id) {
                testCohortIds.push(cohortResponse.body.cohort.id);
              }
            }
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should block unverified users from all programme write actions', async () => {
    const numUsersArb = fc.integer({ min: 2, max: 3 });

    await fc.assert(
      fc.asyncProperty(
        numUsersArb,
        async (numUsers) => {
          for (let i = 0; i < numUsers; i++) {
            // Create community
            const communityId = await createTestCommunity();
            testCommunityIds.push(communityId);

            // Create unverified user
            const hashedPassword = await PasswordService.hashPassword('TestPassword123!');
            const [userId] = await db.users.create({
              email: `unverified${Date.now()}${i}@test.com`,
              first_name: 'Unverified',
              last_name: 'User',
              password: hashedPassword,
              email_verified: 0,
              community_id: communityId
            });
            testUserIds.push(userId);

            // Create JWT
            const token = JwtService.createAccessToken(
              {
                user_id: userId,
                email: `unverified${Date.now()}${i}@test.com`,
                email_verified: false,
                role: 'convener'
              },
              24 * 60 * 60 * 1000,
              process.env.JWT_SECRET
            );

            // Attempt to create programme
            const createResponse = await request(app)
              .post('/v1/api/programmes')
              .set('Authorization', `Bearer ${token}`)
              .send({
                name: `Test Programme ${i}`,
                description: 'Test programme description',
                community_id: communityId
              });

            // Property: Unverified users cannot create programmes
            expect(createResponse.status).toBe(403);
            expect(createResponse.body.error).toBe(true);

            // Create a programme with verified user for cohort test
            const verifiedPassword = await PasswordService.hashPassword('TestPassword123!');
            const [verifiedUserId] = await db.users.create({
              email: `verified${Date.now()}${i}@test.com`,
              first_name: 'Verified',
              last_name: 'User',
              password: verifiedPassword,
              email_verified: 1,
              community_id: communityId
            });
            testUserIds.push(verifiedUserId);

            const [programmeId] = await db.programmes.create({
              name: `Test Programme ${i}`,
              description: 'Test programme',
              community_id: communityId,
              created_by: verifiedUserId
            });
            testProgrammeIds.push(programmeId);

            // Attempt to create cohort as unverified user
            const cohortResponse = await request(app)
              .post(`/v1/api/programmes/${programmeId}/cohorts`)
              .set('Authorization', `Bearer ${token}`)
              .send({
                name: `Test Cohort ${i}`,
                enrollment_code: `COHORT${Date.now()}${i}`,
                start_date: new Date().toISOString()
              });

            // Property: Unverified users cannot create cohorts
            expect(cohortResponse.status).toBe(403);
            expect(cohortResponse.body.error).toBe(true);
          }
        }
      ),
      { numRuns: 10 }
    );
  });
});