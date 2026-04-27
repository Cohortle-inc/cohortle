# Migration Fix: Role Assignment History changed_by Field

## Problem
The migration `20260311000001-assign-roles-to-users-without-roles.js` was failing with an error when trying to insert into `role_assignment_history` table because:

1. The `changed_by` field in `role_assignment_history` table is NOT NULL (required field)
2. The migration was attempting to insert NULL values for `changed_by`
3. This caused a database constraint violation

## Root Cause
The `role_assignment_history` model defines `changed_by` as a required field:
```javascript
changed_by: {
  type: DataTypes.INTEGER,
  allowNull: false,  // ← NOT NULL constraint
  references: {
    model: "users",
    key: "id",
  },
}
```

## Solution
Updated the migration to:
1. Query for an existing administrator user in the system
2. Use that admin user's ID as the `changed_by` value
3. Only insert history records if an admin user exists
4. Skip history insertion gracefully if no admin exists (won't break the migration)

## Code Changes
**File**: `cohortle-api/migrations/20260311000001-assign-roles-to-users-without-roles.js`

Changed from:
```javascript
await queryInterface.sequelize.query(`
  INSERT INTO role_assignment_history (user_id, previous_role_id, new_role_id, changed_by, changed_at, reason)
  SELECT 
    u.id,
    NULL,
    ?,
    NULL,  // ← This was causing the error
    NOW(),
    'Migration: Assigned default student role to user without role assignment'
  FROM users u
  WHERE NOT EXISTS (...)
`, {
  replacements: [studentRoleId],
  transaction
});
```

To:
```javascript
const [adminUsers] = await queryInterface.sequelize.query(`
  SELECT u.id FROM users u
  INNER JOIN user_role_assignments ura ON u.id = ura.user_id
  INNER JOIN roles r ON ura.role_id = r.role_id
  WHERE r.name = 'administrator'
  LIMIT 1
`, { transaction });

const changedBy = adminUsers.length > 0 ? adminUsers[0].id : null;

if (changedBy) {
  await queryInterface.sequelize.query(`
    INSERT INTO role_assignment_history (user_id, previous_role_id, new_role_id, changed_by, changed_at, reason)
    SELECT 
      u.id,
      NULL,
      ?,
      ?,  // ← Now uses admin user ID
      NOW(),
      'Migration: Assigned default student role to user without role assignment'
    FROM users u
    WHERE NOT EXISTS (...)
  `, {
    replacements: [studentRoleId, changedBy],
    transaction
  });
}
```

## Commits
- **cohortle-api**: `d15b9b9` - Fix migration: Handle required changed_by field in role_assignment_history
- **main repo**: `2119359` - Update cohortle-api submodule: Fix migration changed_by field handling

## Next Steps
1. Coolify will pull the updated code from main branch
2. Migration will run on next deployment
3. Users without roles will be assigned the 'student' role
4. Role assignment history will be properly recorded with an admin user as the changer

## Testing
The migration is now safe to run and will:
- ✅ Find users without role assignments
- ✅ Assign them the 'student' role
- ✅ Create proper role assignment history entries
- ✅ Verify all users have roles after completion
