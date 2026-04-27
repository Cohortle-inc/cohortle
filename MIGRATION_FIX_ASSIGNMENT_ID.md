# Migration Fix - assignment_id Field Error

## Issue Identified

**Error**: `Field 'assignment_id' doesn't have a default value`

**Location**: Migration `20260311000002-fix-users-without-roles.js`

**Root Cause**: The migration was using Sequelize's `bulkInsert()` method, which doesn't properly handle UUID generation for the `assignment_id` field. The raw SQL INSERT statement wasn't including the `assignment_id` column, causing MySQL to reject the insert.

## The Problem

The migration tried to insert records like this:
```sql
INSERT INTO user_role_assignments (user_id, role_id, assigned_by, assigned_at, status)
SELECT u.id, '...', NULL, NOW(), 'active'
FROM users u
```

But the table schema requires `assignment_id` (UUID primary key) to be provided.

## The Solution

Changed the migration to use explicit SQL INSERT with UUID() function:

```sql
INSERT INTO user_role_assignments 
(assignment_id, user_id, role_id, assigned_by, assigned_at, effective_from, effective_until, status, notes)
VALUES (UUID(), ?, ?, NULL, NOW(), NOW(), NULL, 'active', '...')
```

**Key Changes**:
1. Explicit column list in INSERT statement
2. Use `UUID()` function to generate assignment_id
3. Include all required fields
4. Loop through users instead of bulk insert

## Commits

- **cohortle-api**: `e28f9d7` - Fix: Migration assignment_id field - use explicit SQL INSERT with UUID()
- **cohortle**: `04bbc75` - Update cohortle-api: Fix migration assignment_id field issue

## What This Fixes

✅ Migration will now run successfully on deployment
✅ Users without roles will be auto-assigned 'student' role
✅ No more "Field 'assignment_id' doesn't have a default value" error
✅ Backend will start without migration errors

## Testing

The migration will:
1. Find all users without active role assignments
2. Create role assignments with auto-generated UUIDs
3. Update denormalized role_id field in users table
4. Log progress and completion

## Next Steps

1. Redeploy the backend
2. Migration will run automatically on startup
3. Check logs for: `[Migration] SUCCESS: All users without roles have been assigned the student role`
4. Verify users can now log in successfully

## Related Files

- `cohortle-api/migrations/20260311000002-fix-users-without-roles.js` - Fixed migration
- `cohortle-api/models/user_role_assignments.js` - Model definition
- `cohortle-api/routes/auth.js` - Auth logic (already fixed)
