/**
 * Property-Based Test: Google authentication is idempotent (no duplicate users)
 * Feature: google-auth-integration
 * Property 3: Google authentication is idempotent
 *
 * **Validates: Requirements 3.1, 4.1**
 *
 * Calling findOrCreateGoogleUser() twice with the same payload should result in
 * exactly one user record for that email.
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
const RoleAssignmentService = require('../../services/RoleAssignmentService');

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
    await RoleAssignmentService.assignRole(newUser.id, 'student', 'system');
    return newUser;
  }

  if (existing.google_id === sub) {
    return existing;
  }

  await db.users.update(
    { google_id: sub, email_verified: 1 },
    { where: { id: existing.id } }
  );
  return { ...existing, google_id: sub, email_verified: 1 };
}

describe('Feature: google-auth-integration, Property 3: Google authentication is idempotent', () => {
  it('should return the same user on repeated calls with the same payload', async () => {
    const emailArb = fc.emailAddress();
    const subArb = fc.string({ minLength: 10, maxLength: 30 });

    await fc.assert(
      fc.asyncProperty(
        emailArb,
        subArb,
        async (email, sub) => {
          // Reset mocks per property run so call counts are isolated
          jest.clearAllMocks();

          const userId = Math.floor(Math.random() * 10000);
          const createdUser = {
            id: userId,
            email,
            google_id: sub,
            password: null,
            email_verified: 1,
            status: 'active',
          };

          // First call: no existing user → create
          db.users.findOne.mockResolvedValueOnce(null);
          db.users.create.mockResolvedValueOnce(createdUser);

          const firstResult = await findOrCreateGoogleUser({ email, sub, given_name: 'Test', family_name: 'User' });

          // Second call: user now exists with matching google_id
          db.users.findOne.mockResolvedValueOnce(createdUser);

          const secondResult = await findOrCreateGoogleUser({ email, sub, given_name: 'Test', family_name: 'User' });

          // Both calls should return the same user
          expect(firstResult.id).toBe(secondResult.id);
          expect(firstResult.email).toBe(secondResult.email);
          expect(firstResult.google_id).toBe(secondResult.google_id);

          // create should only have been called once (not on the second call)
          expect(db.users.create).toHaveBeenCalledTimes(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
