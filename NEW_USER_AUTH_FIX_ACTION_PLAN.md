# New User Auth Fix - Immediate Action Plan

## What's Wrong

New users get "user not authenticated" after signup because the role lookup during login fails. The system can't find their role in the database, so it defaults to `'unassigned'`, which the frontend treats as unauthenticated.

## What's Fixed

The `getUserWithRole()` function in `cohortle-api/routes/auth.js` now:
1. Checks the denormalized `role_id` field (fast path)
2. Falls back to querying the roles table directly
3. Falls back to checking `user_role_assignments` table (source of truth)
4. Auto-repairs the `role_id` field when found

## Deploy Now

### 1. Push Code Changes

```bash
git add cohortle-api/routes/auth.js
git commit -m "Fix: Improve role retrieval for new users - check user_role_assignments as fallback"
git push
```

The changes are in `cohortle-api/routes/auth.js` - the `getUserWithRole()` function and signup error handling.

### 2. Test Immediately

1. Create a new test account
2. Verify welcome email arrives
3. Log out
4. Log back in with the new account
5. Verify dashboard loads (not "user not authenticated")

### 3. Fix Existing Affected Users (Optional)

If you have users created before this fix who are stuck:

```bash
cd cohortle-api
node ../fix-new-user-roles.js
```

This will:
- Find users created in last 24 hours
- Check their role assignments
- Fix any missing or mismatched roles
- Report what was fixed

### 4. Diagnose Issues (If Needed)

To see the current state of user roles:

```bash
cd cohortle-api
node ../diagnose-new-user-auth.js
```

This shows:
- Recent users and their role status
- Any mismatches between role_id and user_role_assignments
- Users with NULL roles

## What Changed

### File: `cohortle-api/routes/auth.js`

**Function: `getUserWithRole()`**
- Added multi-level fallback for role lookup
- Now checks `user_role_assignments` table as source of truth
- Auto-repairs denormalized `role_id` field

**Function: Signup endpoint**
- Added fallback if `RoleAssignmentService.assignRole()` fails
- Ensures `role_id` is set even if full assignment fails

## Why This Works

The issue was that new users' roles weren't being found during login because:
1. The `role_id` field might not be set
2. The LEFT JOIN with roles table would fail
3. The system defaulted to `'unassigned'`

Now the system:
1. Tries the fast path (denormalized field)
2. Falls back to checking the actual role assignments
3. Auto-repairs the denormalized field for future queries
4. Never defaults to `'unassigned'` if an actual assignment exists

## Rollback (If Needed)

If something goes wrong:

```bash
git revert <commit-hash>
git push
```

## Monitoring

Watch the logs for:
- `"Failed to assign role during registration"` - indicates role assignment issues
- `"Fallback: Manually set role_id"` - indicates the fallback was needed
- `"Error getting user with role"` - indicates lookup failures

## Questions?

Check `NEW_USER_AUTH_FIX_COMPLETE.md` for detailed technical information.
