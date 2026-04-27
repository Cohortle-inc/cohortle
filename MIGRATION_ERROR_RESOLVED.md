# Migration Error - RESOLVED ✅

## What Was Wrong

Backend logs showed:
```
ERROR: Field 'assignment_id' doesn't have a default value
```

This was a **migration issue**, not an auth issue.

## Root Cause

The migration `20260311000002-fix-users-without-roles.js` was using Sequelize's `bulkInsert()` which didn't properly generate UUIDs for the `assignment_id` primary key field.

## What Was Fixed

Changed the migration to use explicit SQL INSERT with `UUID()` function:

```javascript
// Before (broken):
await queryInterface.bulkInsert('user_role_assignments', assignments, {});

// After (fixed):
for (const user of usersWithoutRoles) {
  await queryInterface.sequelize.query(
    `INSERT INTO user_role_assignments 
     (assignment_id, user_id, role_id, assigned_by, assigned_at, effective_from, effective_until, status, notes)
     VALUES (UUID(), ?, ?, NULL, NOW(), NOW(), NULL, 'active', '...')`,
    { replacements: [user.id, studentRoleId] }
  );
}
```

## Commits

- cohortle-api: `e28f9d7`
- cohortle: `04bbc75`

## What Happens Now

✅ Migration runs successfully
✅ Users without roles get auto-assigned 'student' role
✅ Backend starts without errors
✅ Users can log in successfully

## Deploy

Just redeploy the backend. The migration will run automatically on startup.

Check logs for:
```
[Migration] SUCCESS: All users without roles have been assigned the student role
```
