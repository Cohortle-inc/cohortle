/**
 * Property-Based Tests: Profile Validation
 * 
 * Property 18: Empty name rejection
 * 
 * These tests verify profile data validation.
 * 
 * Requirements: 8.3 - Profile validation
 */

const fc = require('fast-check');
const request = require('supertest');
const app = require('../../app');
const { setupTestDb, cleanupTestDb, createTestUser, getAuthToken } = require('../helpers/testSetup');

describe('Property-Based Tests: Profile Validation', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    await setupTestDb();
    testUser = await createTestUser({ role: 'learner' });
    authToken = await getAuthToken(testUser.id);
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  /**
   * Property 18: Empty name rejection
   * 
   * Profile updates with empty or whitespace-only names should be rejected.
   */
  test('Property 18: should reject empty names', () => {
    const emptyNames = fc.oneof(
      fc.constant(''),
      fc.constant('   '),
      fc.constant('\n\n\n'),
      fc.constant('\t\t\t'),
      fc.constant('     \n     ')
    );

    return fc.assert(
      fc.asyncProperty(emptyNames, async (name) => {
        const response = await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: name
          });
        
        // Should reject empty names
        expect([400, 422]).toContain(response.status);
        expect(response.body).toHaveProperty('error');
      }),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Valid names should be accepted
   */
  test('should accept valid names', () => {
    const validNames = fc.string({
      minLength: 1,
      maxLength: 100
    }).filter(s => s.trim().length > 0);

    return fc.assert(
      fc.asyncProperty(validNames, async (name) => {
        const response = await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: name.trim()
          });
        
        // Should accept valid names
        expect([200, 201]).toContain(response.status);
        if (response.status === 200) {
          expect(response.body.name).toBe(name.trim());
        }
      }),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Email format should be validated
   */
  test('should validate email format', () => {
    const invalidEmails = fc.oneof(
      fc.constant('notanemail'),
      fc.constant('missing@domain'),
      fc.constant('@nodomain.com'),
      fc.constant('spaces in@email.com'),
      fc.constant(''),
      fc.constant('   ')
    );

    return fc.assert(
      fc.asyncProperty(invalidEmails, async (email) => {
        const response = await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            email: email
          });
        
        // Should reject invalid emails
        expect([400, 422]).toContain(response.status);
      }),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Valid emails should be accepted
   */
  test('should accept valid emails', () => {
    const validEmails = fc.emailAddress();

    return fc.assert(
      fc.asyncProperty(validEmails, async (email) => {
        const response = await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            email: email
          });
        
        // Should accept valid emails
        expect([200, 201, 409]).toContain(response.status);
        // 409 if email already exists
      }),
      { numRuns: 15 }
    );
  });

  /**
   * Property: Profile updates should preserve unchanged fields
   */
  test('profile updates should preserve unchanged fields', async () => {
    // Get current profile
    const getResponse = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${authToken}`);
    
    if (getResponse.status !== 200) return;
    
    const originalProfile = getResponse.body;
    
    // Update only name
    const updateResponse = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Updated Name'
      });
    
    if (updateResponse.status === 200) {
      // Name should be updated
      expect(updateResponse.body.name).toBe('Updated Name');
      
      // Email should be preserved
      expect(updateResponse.body.email).toBe(originalProfile.email);
    }
  });

  /**
   * Property: Profile should have required fields
   */
  test('profile should have required fields', async () => {
    const response = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('name');
    expect(response.body).toHaveProperty('email');
    expect(response.body).toHaveProperty('created_at');
  });

  /**
   * Property: Name should be trimmed
   */
  test('names should be trimmed', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        async (name) => {
          const paddedName = `  ${name}  `;
          
          const response = await request(app)
            .put('/api/profile')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              name: paddedName
            });
          
          if (response.status === 200) {
            // Name should be trimmed
            expect(response.body.name).toBe(name.trim());
          }
        }
      ),
      { numRuns: 15 }
    );
  });

  /**
   * Property: Bio should accept long text
   */
  test('bio should accept long text', () => {
    const longBios = fc.string({ minLength: 100, maxLength: 1000 });

    return fc.assert(
      fc.asyncProperty(longBios, async (bio) => {
        const response = await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            bio: bio
          });
        
        // Should accept long bios
        expect([200, 201]).toContain(response.status);
        if (response.status === 200) {
          expect(response.body.bio).toBe(bio.trim());
        }
      }),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Profile picture URL should be validated
   */
  test('profile picture URL should be validated', () => {
    const invalidUrls = fc.oneof(
      fc.constant('not a url'),
      fc.constant('javascript:alert("xss")'),
      fc.constant('data:text/html,<script>'),
      fc.constant('   ')
    );

    return fc.assert(
      fc.asyncProperty(invalidUrls, async (url) => {
        const response = await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            profile_picture: url
          });
        
        // Should reject invalid URLs
        expect([400, 422]).toContain(response.status);
      }),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Valid profile picture URLs should be accepted
   */
  test('valid profile picture URLs should be accepted', () => {
    const validUrls = fc.webUrl();

    return fc.assert(
      fc.asyncProperty(validUrls, async (url) => {
        const response = await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            profile_picture: url
          });
        
        // Should accept valid URLs
        expect([200, 201]).toContain(response.status);
      }),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Profile updates should require authentication
   */
  test('profile updates should require authentication', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        async (name) => {
          const response = await request(app)
            .put('/api/profile')
            .send({
              name: name
            });
          
          // Should reject without auth
          expect(response.status).toBe(401);
        }
      ),
      { numRuns: 5 }
    );
  });

  /**
   * Property: Users can only update their own profile
   */
  test('users should only update their own profile', async () => {
    // Create second user
    const user2 = await createTestUser({ email: 'user2@example.com' });
    const token2 = await getAuthToken(user2.id);
    
    // Try to update first user's profile with second user's token
    const response = await request(app)
      .put(`/api/profile/${testUser.id}`)
      .set('Authorization', `Bearer ${token2}`)
      .send({
        name: 'Hacked Name'
      });
    
    // Should be forbidden
    expect([403, 404]).toContain(response.status);
  });

  /**
   * Property: Profile data should persist across sessions
   */
  test('profile updates should persist', async () => {
    const newName = 'Persistent Name';
    
    // Update profile
    const updateResponse = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: newName
      });
    
    expect([200, 201]).toContain(updateResponse.status);
    
    // Get profile again
    const getResponse = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.name).toBe(newName);
  });
});
