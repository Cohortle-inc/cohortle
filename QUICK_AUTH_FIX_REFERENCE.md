# Quick Authentication Fix Reference

## TL;DR

Some users can't authenticate because they have no role assignment in the database.

### Quick Fix

```bash
# Check which users have the problem
node diagnose-specific-users.js

# Fix the user
node fix-specific-user.js learner5@cohortle.com

# Done! User can now login
```

## The Problem

- User logs in → credentials valid ✅
- JWT token created with role='unassigned' ❌
- Frontend sees role='unassigned' → treats as not authenticated ❌
- User can't access dashboard ❌

## Why It Happens

User exists in `users` table but has NO entry in `user_role_assignments` table.

This can happen if:
- User was created before role system was implemented
- Role assignment failed during registration
- Database migration didn't backfill existing users

## The Fix

Create a role assignment for the user:

```bash
node fix-specific-user.js learner5@cohortle.com
```

This:
1. Finds the user
2. Creates 'student' role assignment
3. Updates denormalized role_id
4. Verifies it worked

## Verify It Works

```bash
# Check database
node diagnose-specific-users.js

# Should now show:
# ✅ ACTIVE ROLE ASSIGNMENT: student
```

Then user can login normally.

## For Multiple Users

```bash
# Fix several users at once
node fix-multiple-users.js learner5@cohortle.com learner6@cohortle.com learner7@cohortle.com

# Or fix ALL users without roles
node fix-all-users-without-roles.js
```

## Database Check (SQL)

```sql
-- Find users without role assignments
SELECT u.id, u.email, u.first_name, u.last_name
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
WHERE ura.id IS NULL;

-- Check specific user
SELECT u.id, u.email, ura.role_id, r.name as role_name, ura.status
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
LEFT JOIN roles r ON ura.role_id = r.role_id
WHERE u.email = 'learner5@cohortle.com';
```

## Files

- `diagnose-specific-users.js` - Check user status
- `fix-specific-user.js` - Fix one user
- `fix-multiple-users.js` - Fix several users
- `fix-all-users-without-roles.js` - Fix all affected users
- `audit-all-user-roles.js` - Audit all users

## Common Issues

**User still can't login after fix?**
- Clear browser cache/cookies
- Try incognito window
- Check API logs

**Fix script fails?**
- Verify 'student' role exists: `node cohortle-api/scripts/verify-role-system.js`
- Initialize role system if needed: `node cohortle-api/scripts/initialize-role-system.js`

**Multiple role assignments?**
- Run diagnostic to see all assignments
- Fix script handles this automatically
