# Authentication Inconsistency Resolution Guide

## Problem Summary

Some users (e.g., learner5@cohortle.com) cannot authenticate and see "user not authenticated" errors, while others (e.g., learner1@cohortle.com) login successfully.

## Root Cause

The most likely cause is **missing or inactive role assignments** in the `user_role_assignments` table. When a user has no active role assignment:

1. Login succeeds (user credentials are valid)
2. JWT token is generated with `role: 'unassigned'`
3. Frontend treats `role: 'unassigned'` as unauthenticated
4. User cannot access dashboard or profile

## Diagnostic Steps

### Step 1: Run Diagnostic Script

```bash
# PowerShell
.\diagnose-specific-users.ps1

# Or directly with Node.js
node diagnose-specific-users.js
```

This will show:
- User database records
- Denormalized role_id in users table
- All role assignments in user_role_assignments table
- Whether assignments are active and valid
- What role the system would assign to each user

### Step 2: Interpret Results

**For learner1@cohortle.com (WORKING):**
```
✅ USER FOUND
✅ DENORMALIZED ROLE: student
✅ ROLE ASSIGNMENTS FOUND (1 total)
   - Status: active ✅
   - Effective From: [date] ✅
   - Effective Until: NULL (permanent) ✅
   - VALID: ✅ YES
✅ ACTIVE ROLE ASSIGNMENT: student
```

**For learner5@cohortle.com (NOT WORKING):**
```
✅ USER FOUND
⚠️  NO DENORMALIZED ROLE (users.role_id is NULL)
❌ NO ROLE ASSIGNMENTS in user_role_assignments table
   This is the likely cause of authentication failure!
```

## Fix: Assign Role to User

### Option 1: Fix Single User

```bash
node fix-specific-user.js learner5@cohortle.com
```

This script will:
1. Find the user
2. Check for existing role assignments
3. Get the 'student' role from database
4. Create a new active role assignment
5. Update the denormalized role_id in users table
6. Verify the fix was successful

### Option 2: Fix Multiple Users

```bash
node fix-multiple-users.js learner5@cohortle.com learner6@cohortle.com learner7@cohortle.com
```

### Option 3: Fix All Users Without Roles

```bash
node fix-all-users-without-roles.js
```

This will:
1. Find all users without active role assignments
2. Assign 'student' role to each
3. Show summary of fixes applied

## Verification

After running the fix script, verify the user can now authenticate:

1. **Check database:**
   ```bash
   node diagnose-specific-users.js
   ```
   Should now show active role assignment

2. **Test login:**
   - Go to login page
   - Enter user credentials
   - Should redirect to dashboard
   - Profile should show role as 'student'

3. **Check browser console:**
   - No authentication errors
   - Token should be set in cookies
   - Profile fetch should succeed

## Prevention: Ensure Role Assignment During Registration

The registration flow should automatically assign roles. Check that:

1. **Role determination works:**
   - Users without invitation code get 'student' role
   - Users with convener code get 'convener' role

2. **Role assignment doesn't fail silently:**
   - Check API logs for role assignment errors
   - Verify `RoleAssignmentService.assignRole()` returns success

3. **Denormalized role_id is updated:**
   - After role assignment, users.role_id should be set
   - This is used for quick lookups

## Database Schema Reference

### users table
```sql
- id (PRIMARY KEY)
- email
- role_id (denormalized, references roles.role_id)
- email_verified
- status
- joined_at
```

### user_role_assignments table
```sql
- assignment_id (PRIMARY KEY, UUID)
- user_id (FOREIGN KEY → users.id)
- role_id (FOREIGN KEY → roles.role_id)
- status (active/inactive)
- assigned_at (when assignment was created)
- effective_from (when role becomes active)
- effective_until (when role expires, NULL = permanent)
```

### roles table
```sql
- role_id (PRIMARY KEY, UUID)
- name (student, convener, administrator)
- hierarchy_level
```

## Authentication Flow

1. **Login Request:**
   - User submits email + password
   - API validates credentials
   - Calls `getUserWithRole()` which does LEFT JOIN with roles table
   - If no role assignment exists, role = 'unassigned'

2. **Token Generation:**
   - JWT token created with role from database
   - Token includes: user_id, email, role, permissions, email_verified

3. **Frontend Validation:**
   - Middleware checks for auth_token cookie
   - Decodes token to extract role
   - If role is 'unassigned', treats as unauthenticated
   - Redirects to login

4. **Profile Fetch:**
   - Frontend calls `/api/proxy/v1/api/profile`
   - Backend retrieves role from user_role_assignments table
   - If no active assignment, returns role = 'unassigned'
   - Frontend may reject response if role is 'unassigned'

## Troubleshooting

### Issue: User still can't authenticate after fix

**Check:**
1. Did the fix script complete successfully?
2. Is the user's browser cache cleared?
3. Is the auth_token cookie being set?
4. Check browser DevTools → Application → Cookies

**Solution:**
- Clear browser cache and cookies
- Try incognito/private window
- Check API logs for errors

### Issue: Role assignment fails during registration

**Check:**
1. Is the 'student' role in the database?
2. Are there database errors in logs?
3. Is the role assignment service working?

**Solution:**
```bash
# Verify role system is initialized
node cohortle-api/scripts/verify-role-system.js

# Initialize if needed
node cohortle-api/scripts/initialize-role-system.js
```

### Issue: Multiple role assignments for same user

**Check:**
```bash
node diagnose-specific-users.js
```

If user has multiple assignments, only one should be active.

**Solution:**
- Manually deactivate old assignments
- Or run fix script which handles this

## Files Created

- `diagnose-specific-users.ps1` - PowerShell wrapper for diagnostic
- `diagnose-specific-users.js` - Diagnostic script
- `fix-specific-user.js` - Fix single user
- `fix-multiple-users.js` - Fix multiple users
- `fix-all-users-without-roles.js` - Fix all users without roles
- `audit-all-user-roles.js` - Audit all users' role status

## Quick Reference

```bash
# Diagnose issue
node diagnose-specific-users.js

# Fix single user
node fix-specific-user.js learner5@cohortle.com

# Fix multiple users
node fix-multiple-users.js learner5@cohortle.com learner6@cohortle.com

# Fix all users without roles
node fix-all-users-without-roles.js

# Audit all users
node audit-all-user-roles.js
```

## Next Steps

1. Run diagnostic to identify affected users
2. Apply fix to affected users
3. Verify users can now authenticate
4. Check registration flow to prevent future issues
5. Monitor for similar issues in production
