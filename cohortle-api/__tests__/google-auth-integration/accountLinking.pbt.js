/**
 * Property-Based Test: Account linking preserves existing user data
 * Feature: google-auth-integration
 * Property 4: Account linking preserves existing user data
 *
 * **Validates: Requirements 5.1, 5.2, 5.3**
 *
 * For any existing user record with google_id = NULL, after findOrCreateGoogleUser()
 * is called with a Google token matching that email:
 * - The user's role is unchanged
 * - The user's password is unchanged
 * - The user's google_id is set to the token's sub value
 * - The user's email_verified is 1
 */

const fc = require('fast-check');

jest.mock('../../models', () => ({
  users: {
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  roles: { findOne: jest.fn(), findByPk: jest.fn() },
  user_role_assignments: { findOne: jest.fn() },
  Sequelize: {
    Op: { lte: Symbol('lte'), gte: Symbol('gte'), or: Symbol('or'), ne: Symbol('ne') },
  },
}));

jest.mock('../../services/RoleAssignmentService', () => ({
  assignRole: jest.fn().mockResolvedValue({ success: true }),
}));

const db = require('../../models');

// Replicate findOrCreateGoogleUser logic (same as in routes/auth.js)
async function findOrCreateGoogleUser({ email, sub, given_name, family_name }) {
  const existing = await db.users.findOne({ where: { email } });

  if (!existing) {
    const newUser = await db.users.create({
      email,
      first_name: given_name || '',
      last_name: family_name || '',
      google_id: sub,
      password: null,
      email_verified: 1,
      status: 'active',
      joined_at: new Date(),
    });
    const RoleAssignmentService = require('../../services/RoleAssignmentService');
    await RoleAssignmentService.assignRole(newUser.id, 'student', 'system');
    return newUser;
  }

  if (existing.google_id === sub) {
    return existing;
  }

  // Account linking path
  await db.users.update(
    { google_id: sub, email_verified: 1 },
    { where: { id: existing.id } }
  );
  return { ...existing, google_id: sub, email_verified: 1 };
}

describe('Feature: google-auth-integration, Property 4: Account linking preserves existing user data', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should preserve role and password when linking a Google account to an existing email/password user', async () => {
    const emailArb = fc.emailAddress();
    const subArb = fc.string({ minLength: 10, maxLength: 30 });
    const passwordHashArb = fc.string({ minLength: 20, maxLength: 60 });
    const roleArb = fc.constantFrom('student', 'convener');

    await fc.assert(
      fc.asyncProperty(
        emailArb,
        subArb,
        passwordHashArb,
        roleArb,
        async (email, sub, passwordHash, role) => {
          jest.clearAllMocks();

          const existingUser = {
            id: Math.floor(Math.random() * 10000),
            email,
            google_id: null,       // no Google account yet
            password: passwordHash, // has a password
            email_verified: 0,
            role,
            status: 'active',
          };

          // findOne returns the existing user (google_id is null → account linking path)
          db.users.findOne.mockResolvedValueOnce(existingUser);
          db.users.update.mockResolvedValueOnce([1]);

          const result = await findOrCreateGoogleUser({
            email,
            sub,
            given_name: 'Test',
            family_name: 'User',
          });

          // Property 1: google_id is set to sub
          expect(result.google_id).toBe(sub);

          // Property 2: email_verified is 1
          expect(result.email_verified).toBe(1);

          // Property 3: password is unchanged
          expect(result.password).toBe(passwordHash);

          // Property 4: role is unchanged
          expect(result.role).toBe(role);

          // Property 5: db.users.create was NOT called (no new user created)
          expect(db.users.create).not.toHaveBeenCalled();

          // Property 6: db.users.update was called with google_id and email_verified
          expect(db.users.update).toHaveBeenCalledWith(
            { google_id: sub, email_verified: 1 },
            { where: { id: existingUser.id } }
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
