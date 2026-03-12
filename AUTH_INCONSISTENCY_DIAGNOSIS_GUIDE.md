# Authentication Inconsistency Diagnosis & Fix Guide

## Problem Summary

Some users (e.g., learner5@cohortle.com) cannot authenticate and see "user not authenticated" errors, while others (e.g., learner1@cohortle.com) login successfully.

## Root Cause

The most likely cause is **missing or inactive role assignments** in the `user_role_assignments` table. When a user has no active role assignment:

1. Login succeeds (user credentials are valid)
2. JWT token is generated with `role='unassigned'`
3. Frontend treats `role='unassigned'` as unauthenticated
4. User cannot access dashboard or profile

## How to Diagnose

### Step 1: Run Diagnostic Script

```bash
# PowerShell
.\diagnose-specific-users.ps1

# Bash
node diagnose-specific-users.js
```

This will compare the database state for both working and non-working users, showing:
- User existence in database
- Denormalized role_id in users table
- Role assignments in user_role_assignments table
- Active role status
- What the authentication system would return

### Step 2: Interpret Results

**If you see:**
```
❌ NO ROLE ASSIGNMENTS in user_role_assignments table
   This is the likely cause of authentication failure!
```

**Then the fix is needed.**

## How to Fix

### Option A: Fix Single User

```bash
node fix-specific-user.js learner5@cohortle.com
```

This will:
1. Find the user in database
2. Check for existing role assignments
3. Create a new 'student' role assignment if none exists
4. Update the denormalized role_id in users table
5. Verify the fix was successful

### Option B: Fix Multiple Users at Once

```bash
node fix-multiple-users.js learner5@cohortle.com learner6@cohortle.com learner7@cohortle.com
```

Or create a file `users-to-fix.txt` with one email per line:
```
learner5@cohortle.com
learner6@cohortle.com
learner7@cohortle.com
```

Then run:
```bash
node fix-multiple-users.js --file users-to-fix.txt
```

### Option C: Fix All Users Without Roles (Batch)

```bash
node fix-all-users-without-roles.js
```

This will:
1. Find all users without active role assignments
2. Assign them the 'student' role
3. Show a summary of fixed users

## Verification

After running the fix, verify by:

1. **Check database directly:**
```sql
SELECT u.id, u.email, u.role_id, ura.role_id as assignment_role_id, r.name as role_name
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
LEFT JOIN roles r ON ura.role_id = r.role_id
WHERE u.email = 'learner5@cohortle.com';
```

Expected result:
- `u.role_id` should NOT be NULL
- `ura.role_id` should NOT be NULL
- `r.name` should be 'student'

2. **Test login:**
- Have the user login again
- They should be able to access dashboard
- Profile should show role as 'student'

3. **Check token:**
- Open browser DevTools → Application → Cookies
- Find `auth_token` cookie
- Decode at jwt.io
- Verify `role` field is 'student' (not 'unassigned')

## Prevention

To prevent this issue in the future:

1. **Ensure migrations run on deployment:**
   - Migration `20260311000001-assign-roles-to-users-without-roles.js` should run automatically
   - Check deployment logs to confirm

2. **Add validation to registration:**
   - Verify role assignment succeeds before completing registration
   - Log failures for manual review

3. **Add monitoring:**
   - Monitor for users with `role='unassigned'` in JWT tokens
   - Alert if percentage of unassigned users exceeds threshold

## Files Created

- `diagnose-specific-users.ps1` - PowerShell wrapper for diagnosis
- `diagnose-specific-users.js` - Node.js diagnostic script
- `fix-specific-user.js` - Fix single user
- `fix-multiple-users.js` - Fix multiple users
- `fix-all-users-without-roles.js` - Batch fix all affected users

## Troubleshooting

### "User not found"
- Verify email address is correct
- Check user exists in database: `SELECT * FROM users WHERE email = 'email@example.com';`

### "User already has an active role assignment"
- User already has a valid role
- No fix needed
- If still seeing auth errors, check other issues (email verification, token expiry, etc.)

### "Student role not found"
- Role system not initialized
- Run: `node cohortle-api/scripts/initialize-role-system.js`

### Fix succeeded but user still can't login
- Clear browser cache and cookies
- Try incognito/private window
- Check if email verification is required
- Check if user status is 'active' in database

## Related Issues

This fix addresses the authentication inconsistency but may not solve:
- Email verification requirements
- User account suspension
- Password reset issues
- Token expiration
- CORS/proxy issues

If user still can't authenticate after this fix, investigate those areas.
