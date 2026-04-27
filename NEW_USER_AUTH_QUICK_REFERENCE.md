# New User Auth Fix - Quick Reference Card

## The Problem
```
New User Signup Flow:
✅ Account created
✅ Welcome email sent
❌ Login fails → "user not authenticated"
❌ Old accounts work fine
```

## The Root Cause
```
Login Flow:
1. User enters credentials
2. System looks up role from users.role_id field
3. If role_id is NULL or mismatched → role defaults to 'unassigned'
4. JWT token created with role: 'unassigned'
5. Frontend treats 'unassigned' as unauthenticated
6. User sees "user not authenticated" error
```

## The Solution
```
Enhanced Login Flow:
1. User enters credentials
2. System tries to get role from users.role_id (fast path)
3. If that fails, checks user_role_assignments table (source of truth)
4. Auto-repairs role_id field if found
5. JWT token created with correct role (e.g., 'student')
6. Frontend recognizes user as authenticated
7. User can access dashboard
```

## Deploy Checklist

- [ ] Pull latest code
- [ ] Review changes in `cohortle-api/routes/auth.js`
- [ ] Deploy to production
- [ ] Test with new signup
- [ ] Verify login works
- [ ] Monitor logs for errors
- [ ] Run fix script if needed: `node fix-new-user-roles.js`

## Test Checklist

- [ ] Create new account
- [ ] Receive welcome email
- [ ] Log out
- [ ] Log back in
- [ ] Dashboard loads (not "user not authenticated")
- [ ] Old accounts still work
- [ ] Invalid credentials still fail

## Diagnostic Commands

```bash
# Check current state of user roles
node diagnose-new-user-auth.js

# Fix users with missing role assignments
node fix-new-user-roles.js

# Check specific user
SELECT * FROM users WHERE email = 'user@example.com';
SELECT * FROM user_role_assignments WHERE user_id = 123;
```

## Key Files

| File | Purpose |
|------|---------|
| `cohortle-api/routes/auth.js` | Main auth endpoints (MODIFIED) |
| `diagnose-new-user-auth.js` | Diagnostic tool (NEW) |
| `fix-new-user-roles.js` | Repair tool (NEW) |
| `NEW_USER_AUTH_FIX_COMPLETE.md` | Detailed docs (NEW) |
| `TEST_NEW_USER_AUTH_FIX.md` | Testing guide (NEW) |

## What Changed

### In `cohortle-api/routes/auth.js`:

**Function: `getUserWithRole()`**
- Added fallback to check `user_role_assignments` table
- Auto-repairs `role_id` field
- Never defaults to 'unassigned' if assignment exists

**Function: Signup endpoint**
- Added fallback if role assignment fails
- Ensures `role_id` is always set

## Expected Results

### ✅ Success
- New users can log in
- Dashboard loads
- JWT token has correct role
- Welcome emails still work
- Old accounts unaffected

### ❌ Failure
- New users still get "user not authenticated"
- Login fails
- JWT token has role: 'unassigned'

## Troubleshooting

| Problem | Solution |
|---------|----------|
| New user still gets "user not authenticated" | Run `fix-new-user-roles.js` |
| Login returns "invalid email and password" | Check credentials, verify user exists |
| JWT token has role: 'unassigned' | Run diagnostic, check role_id field |
| Old accounts broken | Rollback: `git revert <commit>` |

## Rollback

```bash
git revert <commit-hash>
git push
```

## Monitoring

Watch logs for:
- `"Failed to assign role during registration"` ⚠️
- `"Fallback: Manually set role_id"` ⚠️
- `"Error getting user with role"` ❌

## Performance Impact

- **Minimal**: Fallback queries only run if needed
- **Normal case**: Same performance as before
- **Fallback case**: 1-2 extra queries (rare)

## Backward Compatibility

✅ No breaking changes
✅ No database schema changes
✅ Old accounts unaffected
✅ Existing APIs unchanged

## Support

1. Check `NEW_USER_AUTH_FIX_COMPLETE.md` for details
2. Run `diagnose-new-user-auth.js` to identify issues
3. Run `fix-new-user-roles.js` to repair
4. Check logs for error messages

---

**Status**: ✅ READY TO DEPLOY

**Deployment Time**: < 5 minutes

**Testing Time**: 5-15 minutes

**Risk Level**: LOW (backward compatible, fallback logic only)
