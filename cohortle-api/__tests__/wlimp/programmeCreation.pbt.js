/**
 * Property-Based Test: Programme Creation Round Trip
 * Feature: wlimp-programme-rollout
 * Property 1: Programme Creation Round Trip
 * 
 * **Validates: Requirements 1.1**
 * 
 * For any valid programme data (name, description, start date), creating a programme
 * and then retrieving it should return an equivalent programme with all fields preserved.
 */

const fc = require('fast-check');
const BackendSDK = require('../../core/BackendSDK');
const {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestData,
  createTestCommunity,
  createTestUser,
} = require('../helpers/testSetup');

describe('Feature: wlimp-programme-rollout, Property 1: Programme Creation Round Trip', () => {
  let testUserId;
  let testCommunityId;

  beforeAll(async () => {
    // Set NODE_ENV to test to use test database configuration
    process.env.NODE_ENV = 'test';
    
    await setupTestDatabase();
    testUserId = await createTestUser();
    testCommunityId = await createTestCommunity(testUserId);
  });

  afterAll(async () => {
    // Clean up test community and user
    await cleanupTestData('communities', { id: testCommunityId });
    await cleanupTestData('users', { id: testUserId });
    
    await teardownTestDatabase();
  });

  it('should preserve all programme fields after creation and retrieval', async () => {
    // Custom arbitraries for programme data
    const programmeNameArb = fc.string({ minLength: 1, maxLength: 255 });
    const programmeDescriptionArb = fc.option(fc.string({ maxLength: 1000 }), { nil: null });
    const programmeDateArb = fc.option(
      fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
      { nil: null }
    );
    const programmeTypeArb = fc.constantFrom('scheduled', 'structured', 'self_paced');

    const programmeDataArb = fc.record({
      name: programmeNameArb,
      description: programmeDescriptionArb,
      start_date: programmeDateArb,
      end_date: programmeDateArb,
      type: programmeTypeArb,
    });

    const createdProgrammeIds = [];

    await fc.assert(
      fc.asyncProperty(programmeDataArb, async (programmeData) => {
        const sdk = new BackendSDK();
        sdk.setTable('programmes');

        // Create programme
        const programmeId = await sdk.insert({
          community_id: testCommunityId,
          name: programmeData.name,
          description: programmeData.description,
          start_date: programmeData.start_date,
          end_date: programmeData.end_date,
          type: programmeData.type,
          created_by: testUserId,
          status: 'draft',
        });

        // Track for cleanup
        createdProgrammeIds.push(programmeId);

        // Retrieve programme
        const retrieved = await sdk.get({ id: programmeId });

        // Verify programme was retrieved
        expect(retrieved).toBeDefined();
        expect(retrieved.length).toBe(1);

        const retrievedProgramme = retrieved[0];

        // Verify all fields are preserved
        expect(retrievedProgramme.id).toBe(programmeId);
        expect(retrievedProgramme.community_id).toBe(testCommunityId);
        expect(retrievedProgramme.name).toBe(programmeData.name);
        expect(retrievedProgramme.created_by).toBe(testUserId);
        expect(retrievedProgramme.status).toBe('draft');
        expect(retrievedProgramme.type).toBe(programmeData.type);

        // Handle nullable fields
        if (programmeData.description === null) {
          expect(retrievedProgramme.description).toBeNull();
        } else {
          expect(retrievedProgramme.description).toBe(programmeData.description);
        }

        // Handle date fields - compare as ISO strings or both null
        if (programmeData.start_date === null) {
          expect(retrievedProgramme.start_date).toBeNull();
        } else {
          const expectedDate = new Date(programmeData.start_date);
          const retrievedDate = new Date(retrievedProgramme.start_date);
          // Compare dates by converting to ISO date strings (YYYY-MM-DD)
          expect(retrievedDate.toISOString().split('T')[0]).toBe(
            expectedDate.toISOString().split('T')[0]
          );
        }

        if (programmeData.end_date === null) {
          expect(retrievedProgramme.end_date).toBeNull();
        } else {
          const expectedDate = new Date(programmeData.end_date);
          const retrievedDate = new Date(retrievedProgramme.end_date);
          // Compare dates by converting to ISO date strings (YYYY-MM-DD)
          expect(retrievedDate.toISOString().split('T')[0]).toBe(
            expectedDate.toISOString().split('T')[0]
          );
        }

        // Verify timestamps exist
        expect(retrievedProgramme.created_at).toBeDefined();
        expect(retrievedProgramme.updated_at).toBeDefined();
      }),
      { numRuns: 20 }
    );

    // Clean up all created programmes after all property runs
    for (const programmeId of createdProgrammeIds) {
      await cleanupTestData('programmes', { id: programmeId });
    }
  });
});
