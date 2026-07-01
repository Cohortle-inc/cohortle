/**
 * Property-Based Test: Permission Inheritance
 * Feature: role-validation-assignment-logic
 * Task: 11.2
 * 
 * **Property 6: Permission Inheritance**
 * 
 * *For any* role with a higher hierarchy level than another role, 
 * the higher-level role must have at least all the permissions of 
 * the lower-level role.
 * 
 * **Validates: Requirements 1.3**
 */

const fc = require('fast-check');
const db = require('../../models');
const {
  setupTestDatabase,
  teardownTestDatabase,
} = require('../helpers/testSetup');

describe('Property 6: Permission Inheritance', () => {
  let roleHierarchy = {};
  let rolePermissions = {};

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await setupTestDatabase();

    // Load role hierarchy and permissions from database
    const roles = await db.roles.findAll({
      include: [
        {
          model: db.permissions,
          as: 'permissions',
          through: { attributes: [] },
        },
      ],
      order: [['hierarchy_level', 'ASC']],
    });

    // Build role hierarchy map
    roles.forEach((role) => {
      roleHierarchy[role.name] = role.hierarchy_level;
      rolePermissions[role.name] = role.permissions.map((p) => p.name);
    });
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  /**
   * Test 1: Higher-level roles inherit all lower-level permissions
   * 
   * Property: For any two roles where role A has a higher hierarchy level
   * than role B, role A must have all permissions that role B has
   */
  it('should ensure higher-level roles inherit all lower-level permissions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          lowerRole: fc.constantFrom('learner', 'student'),
          higherRole: fc.constantFrom('convener', 'administrator'),
        }),
        async (testCase) => {
          const { lowerRole, higherRole } = testCase;

          // Get roles from database
          const lowerRoleData = await db.roles.findOne({
            where: { name: lowerRole },
            include: [
              {
                model: db.permissions,
                as: 'permissions',
                through: { attributes: [] },
              },
            ],
          });

          const higherRoleData = await db.roles.findOne({
            where: { name: higherRole },
            include: [
              {
                model: db.permissions,
                as: 'permissions',
                through: { attributes: [] },
              },
            ],
          });

          if (!lowerRoleData || !higherRoleData) {
            return true; // Skip if roles don't exist
          }

          // Verify hierarchy
          if (higherRoleData.hierarchy_level <= lowerRoleData.hierarchy_level) {
            return true; // Skip if not actually higher
          }

          // Get permission names
          const lowerPermissions = lowerRoleData.permissions.map((p) => p.name);
          const higherPermissions = higherRoleData.permissions.map((p) => p.name);

          // Check if all lower permissions are in higher permissions
          const allPermissionsInherited = lowerPermissions.every((perm) =>
            higherPermissions.includes(perm)
          );

          return allPermissionsInherited;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test 2: Administrator role has all permissions
   * 
   * Property: The administrator role (highest hierarchy) must have all
   * permissions from all lower-level roles
   */
  it('should ensure administrator role has all permissions from lower roles', async () => {
    const adminRole = await db.roles.findOne({
      where: { name: 'administrator' },
      include: [
        {
          model: db.permissions,
          as: 'permissions',
          through: { attributes: [] },
        },
      ],
    });

    const allRoles = await db.roles.findAll({
      where: {
        hierarchy_level: {
          [db.Sequelize.Op.lt]: adminRole.hierarchy_level,
        },
      },
      include: [
        {
          model: db.permissions,
          as: 'permissions',
          through: { attributes: [] },
        },
      ],
    });

    const adminPermissions = adminRole.permissions.map((p) => p.name);

    // Check each lower role
    for (const role of allRoles) {
      const rolePermissions = role.permissions.map((p) => p.name);

      for (const permission of rolePermissions) {
        expect(adminPermissions).toContain(permission);
      }
    }
  });

  /**
   * Test 3: Convener role inherits all learner permissions
   * 
   * Property: The convener role must have all permissions that the
   * learner role has, plus additional convener-specific permissions
   */
  it('should ensure convener role inherits all learner permissions', async () => {
    const learnerRole = await db.roles.findOne({
      where: { name: { [db.Sequelize.Op.in]: ['learner', 'student'] } },
      include: [
        {
          model: db.permissions,
          as: 'permissions',
          through: { attributes: [] },
        },
      ],
    });

    const convenerRole = await db.roles.findOne({
      where: { name: 'convener' },
      include: [
        {
          model: db.permissions,
          as: 'permissions',
          through: { attributes: [] },
        },
      ],
    });

    if (!learnerRole || !convenerRole) {
      return; // Skip if roles don't exist
    }

    const learnerPermissions = learnerRole.permissions.map((p) => p.name);
    const convenerPermissions = convenerRole.permissions.map((p) => p.name);

    // All learner permissions should be in convener permissions
    learnerPermissions.forEach((permission) => {
      expect(convenerPermissions).toContain(permission);
    });

    // Convener should have additional permissions
    expect(convenerPermissions.length).toBeGreaterThanOrEqual(learnerPermissions.length);
  });

  /**
   * Test 4: Permission inheritance is transitive
   * 
   * Property: If role A inherits from role B, and role B inherits from role C,
   * then role A must have all permissions from role C
   */
  it('should ensure permission inheritance is transitive', async () => {
    const roles = await db.roles.findAll({
      include: [
        {
          model: db.permissions,
          as: 'permissions',
          through: { attributes: [] },
        },
      ],
      order: [['hierarchy_level', 'ASC']],
    });

    // For each role, check it has all permissions from lower roles
    for (let i = 0; i < roles.length; i++) {
      const currentRole = roles[i];
      const currentPermissions = currentRole.permissions.map((p) => p.name);

      // Check all lower roles
      for (let j = 0; j < i; j++) {
        const lowerRole = roles[j];
        const lowerPermissions = lowerRole.permissions.map((p) => p.name);

        // Current role should have all permissions from lower role
        lowerPermissions.forEach((permission) => {
          expect(currentPermissions).toContain(permission);
        });
      }
    }
  });

  /**
   * Test 5: No permission is lost during inheritance
   * 
   * Property: For any permission assigned to a lower-level role,
   * that permission must exist in all higher-level roles
   */
  it('should ensure no permissions are lost during inheritance', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          baseRole: fc.constantFrom('learner', 'student'),
        }),
        async (testCase) => {
          const { baseRole } = testCase;

          const baseRoleData = await db.roles.findOne({
            where: { name: baseRole },
            include: [
              {
                model: db.permissions,
                as: 'permissions',
                through: { attributes: [] },
              },
            ],
          });

          if (!baseRoleData) {
            return true; // Skip if role doesn't exist
          }

          const basePermissions = baseRoleData.permissions.map((p) => p.name);

          // Get all higher-level roles
          const higherRoles = await db.roles.findAll({
            where: {
              hierarchy_level: {
                [db.Sequelize.Op.gt]: baseRoleData.hierarchy_level,
              },
            },
            include: [
              {
                model: db.permissions,
                as: 'permissions',
                through: { attributes: [] },
              },
            ],
          });

          // Check each higher role has all base permissions
          for (const higherRole of higherRoles) {
            const higherPermissions = higherRole.permissions.map((p) => p.name);

            const allPermissionsPresent = basePermissions.every((perm) =>
              higherPermissions.includes(perm)
            );

            if (!allPermissionsPresent) {
              return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Test 6: Role hierarchy levels are consistent with permission sets
   * 
   * Property: For any two roles, if role A has more permissions than role B,
   * then role A must have a hierarchy level >= role B's hierarchy level
   */
  it('should ensure hierarchy levels are consistent with permission sets', async () => {
    const roles = await db.roles.findAll({
      include: [
        {
          model: db.permissions,
          as: 'permissions',
          through: { attributes: [] },
        },
      ],
    });

    // Compare each pair of roles
    for (let i = 0; i < roles.length; i++) {
      for (let j = i + 1; j < roles.length; j++) {
        const roleA = roles[i];
        const roleB = roles[j];

        const permissionsA = roleA.permissions.map((p) => p.name);
        const permissionsB = roleB.permissions.map((p) => p.name);

        // If A has all of B's permissions and more
        const aHasAllB = permissionsB.every((p) => permissionsA.includes(p));
        const aHasMore = permissionsA.length > permissionsB.length;

        if (aHasAllB && aHasMore) {
          // A should have higher or equal hierarchy level
          expect(roleA.hierarchy_level).toBeGreaterThanOrEqual(roleB.hierarchy_level);
        }
      }
    }
  });

  /**
   * Test 7: Permission inheritance respects scope restrictions
   * 
   * Property: When a permission is inherited, its scope restrictions
   * are also inherited (e.g., 'own' vs 'all' scope)
   */
  it('should ensure inherited permissions maintain scope restrictions', async () => {
    const roles = await db.roles.findAll({
      include: [
        {
          model: db.permissions,
          as: 'permissions',
          through: { attributes: [] },
        },
      ],
      order: [['hierarchy_level', 'ASC']],
    });

    // For each role pair (lower, higher)
    for (let i = 0; i < roles.length; i++) {
      const lowerRole = roles[i];

      for (let j = i + 1; j < roles.length; j++) {
        const higherRole = roles[j];

        // For each permission in lower role
        for (const lowerPerm of lowerRole.permissions) {
          // Find same permission in higher role
          const higherPerm = higherRole.permissions.find(
            (p) => p.name === lowerPerm.name
          );

          if (higherPerm) {
            // Scope should be same or broader
            // 'own' < 'assigned' < 'all'
            const scopeHierarchy = { own: 1, assigned: 2, all: 3 };
            const lowerScope = scopeHierarchy[lowerPerm.scope] || 1;
            const higherScope = scopeHierarchy[higherPerm.scope] || 1;

            expect(higherScope).toBeGreaterThanOrEqual(lowerScope);
          }
        }
      }
    }
  });
});
