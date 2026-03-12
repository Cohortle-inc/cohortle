# Deployment Status: Migration Fix for User Authentication

## Current Situation

**Problem**: Users without active role assignments (e.g., learner5@cohortle.com) cannot authenticate because they receive JWT tokens with `role: 'unassigned'`.

**Solution**: Automatic migration that assigns 'student' role to all users without active role assignments.

## Git Status

### Commits Pushed to `main` Branch
- **f24166a**: `fix: update cohortle-api with improved uuid import in migration`
- **9b0b213**: `fix: update cohortle-api submodule with automatic role assignment migration`

Both commits are now on `origin/main` and ready for deployment.

### Migration File
- **Location**: `cohortle-api/migrations/20260311000002-fix-users-without-roles.js`
- **Status**: ✅ Correct and ready
- **Logic**: 
  - Uses `NOT EXISTS` query to find users without active role assignments
  - Automatically assigns 'student' role
  - Updates denormalized `role_id` field
  - Runs on backend startup with no manual intervention

## Deployment Issue

**Last Deployment Commit**: `c6f839a` (from `master` branch)
- This was the old commit with the SQL error
- Coolify picked it up but the migration failed

**Current Status**: 
- New commits are on `main` branch (f24166a, 9b0b213)
- Coolify watches `main` branch but hasn't picked up the new commits yet
- May need manual redeploy trigger or wait for Coolify to detect the change

## Next Steps

1. **Wait for Coolify to detect the change** (may take a few minutes)
2. **Or manually trigger a redeploy** in Coolify dashboard
3. Once deployed, the migration will run automatically on backend startup
4. Users without roles will be assigned 'student' role
5. Users can then log in and receive valid JWT tokens

## What Will Happen After Deployment

When the backend restarts with the new migration:
1. Migration finds all users without active role assignments
2. Creates role assignments with 'student' role for each
3. Updates their denormalized `role_id` field
4. Users can now authenticate successfully
5. JWT tokens will contain `role: 'student'` instead of `role: 'unassigned'`

## Verification

After deployment, test with:
- Email: learner5@cohortle.com (or any user without a role)
- Should be able to log in and access dashboard
- JWT token should contain `role: 'student'`
