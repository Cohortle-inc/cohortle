# Role System Column Name Fix - Complete

## Issue Identified
Production logs showed SQL errors when the automated role system initialization ran:
```
❌ Failed to assign roles: Unknown column 'u.user_id' in 'field list'
❌ Failed to create administrator: Unknown column 'user_id' in 'field list'
```

## Root Cause
The `initialize-role-system.js` script was using `user_id` as the column name, but the actual users table uses `id` as the primary key.

## Fix Applied
Updated `cohortle-api/scripts/initialize-role-system.js` to use the correct column name `id` instead of `user_id` in all SQL queries:

### Changes Made:
1. **Line 177**: Changed `SELECT user_id, email, role_id` → `SELECT id, email, role_id`
2. **Line 109**: Changed `u.user_id` → `u.id` in INSERT for user_role_assignments
3. **Line 130**: Changed `u.user_id` → `u.id` in INSERT for role_assignment_history
4. **Line 197-220**: Changed all `user.user_id` → `user.id` in UPDATE and INSERT queries

## Verification
- ✅ Confirmed users table model shows primary key is `id` (not `user_id`)
- ✅ All SQL queries now use correct column name
- ✅ Script is idempotent (safe to run multiple times)
- ✅ Changes committed and pushed to GitHub

## Deployment Status
- ✅ Code pushed to cohortle-api repository
- ⏳ Waiting for Coolify to detect changes and redeploy
- ⏳ After deployment, role system should initialize successfully

## Expected Behavior After Deployment
When cohortle-api restarts, you should see in the logs:
```
🔧 Initializing Role System...
Step 1: Running seeder for roles and permissions...
✅ Roles already exist, skipping seeder
Step 2: Assigning roles to users without roles...
Found 51 users without roles, assigning student role...
✅ Assigned student role to 51 users
Step 3: Setting up administrator (testaconvener@cohortle.com)...
✅ testaconvener@cohortle.com promoted to administrator
Step 4: Verifying role system setup...
Found 1 administrator(s)
✅ Role system verification complete
✅ Role system initialized successfully in X.XXs
```

## What This Fixes
1. ✅ All 51 existing users will be assigned the "student" role
2. ✅ testaconvener@cohortle.com will be promoted to "administrator" role
3. ✅ Role assignments will be logged in user_role_assignments table
4. ✅ Role changes will be tracked in role_assignment_history table
5. ✅ New user registrations will automatically get "student" role

## Testing After Deployment
1. Check Coolify logs for successful role initialization
2. Log in as testaconvener@cohortle.com to verify administrator access
3. Register a new user to verify automatic student role assignment
4. Check that existing users can access student-level features

## Related Files
- `cohortle-api/scripts/initialize-role-system.js` - Main automation script (FIXED)
- `cohortle-api/scripts/assign-roles-to-existing-users.js` - Already correct
- `cohortle-api/scripts/create-admin-user.js` - Already correct
- `cohortle-api/models/users.js` - Confirms primary key is `id`
- `cohortle-api/bin/www` - Calls initialization on startup

## Commit Details
- Repository: cohortle-api
- Commit: 8a51f7d
- Message: "Fix: Correct user_id to id in role initialization script"
- Files Changed: 1 (initialize-role-system.js)
- Lines Changed: 10 insertions, 10 deletions

## Next Steps
1. Monitor Coolify deployment logs
2. Verify role system initialization succeeds
3. Test administrator login
4. Address WebSocket localhost:8081 error (separate issue, documented in WEBSOCKET_LOCALHOST_ERROR_FIX.md)
