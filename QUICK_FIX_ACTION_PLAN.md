# Quick Fix Action Plan - MVP Authentication Issues

## 🚨 Start Here - 5 Minute Quick Check

### Step 1: Test New Registration (2 minutes)
1. Open `test-auth-in-browser.html` in your browser
2. Register a new test account
3. Check if it works

**If it works**: Problem is with existing users → Go to Step 2
**If it fails**: Problem is with registration code → Go to Step 3

### Step 2: Fix Existing Users (3 minutes)
Run this SQL query in production database:

```sql
-- Check how many users need fixing
SELECT COUNT(*) as users_without_roles
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
WHERE ura.id IS NULL;

-- If count > 0, run this fix:
INSERT INTO user_role_assignments (user_id, role_id, assigned_by, assigned_at, status)
SELECT 
  u.id,
  (SELECT role_id FROM roles WHERE name = 'student' LIMIT 1),
  1,
  NOW(),
  'active'
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
WHERE ura.id IS NULL;
```

**Done!** Test login with affected users.

### Step 3: Check Registration Code (if Step 1 failed)
Look at the error message in browser test tool:
- "Email already in use" → User exists, try logging in instead
- "Role assignment failed" → Check database connection
- "Invalid invitation code" → Only for convener registration
- Other error → Check server logs

## 📋 Detailed Action Plan

### Phase 1: Immediate Fixes (15 minutes)

#### Action 1.1: Run Browser Test
```bash
# Open in browser
test-auth-in-browser.html
```
- Register new learner
- Login
- Check profile
- Check dashboard

**Expected Result**: All tests pass

#### Action 1.2: Check Production Database
```bash
# SSH to production
ssh user@your-server

# Connect to database
mysql -u root -p cohortle

# Run diagnostic
SELECT 
  u.id,
  u.email,
  r.name as role
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
LEFT JOIN roles r ON ura.role_id = r.role_id
WHERE r.name IS NULL
LIMIT 10;
```

**Expected Result**: No users without roles

#### Action 1.3: Fix Users Without Roles
```sql
-- Run the fix query from Step 2 above
```

**Expected Result**: All users now have roles

### Phase 2: Verification (10 minutes)

#### Action 2.1: Test Existing User Login
1. Login with a user that previously had issues
2. Check dashboard access
3. Check profile shows correct role

#### Action 2.2: Test New User Registration
1. Register a brand new user
2. Verify role is assigned
3. Test dashboard access immediately

#### Action 2.3: Test Convener Flow
1. Login as convener
2. Verify redirect to /convener/dashboard
3. Test programme creation

### Phase 3: Monitoring (5 minutes)

#### Action 3.1: Check Server Logs
```bash
# Check for authentication errors
tail -f /path/to/logs/error.log | grep -i "auth\|role"
```

#### Action 3.2: Monitor User Activity
```sql
-- Check recent logins
SELECT 
  u.email,
  r.name as role,
  u.last_login
FROM users u
JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
JOIN roles r ON ura.role_id = r.role_id
ORDER BY u.last_login DESC
LIMIT 20;
```

## 🎯 Success Checklist

After completing the action plan, verify:

- [ ] Browser test tool shows all tests passing
- [ ] No users in database without role assignments
- [ ] Existing users can login and access dashboard
- [ ] New users can register and access dashboard immediately
- [ ] Conveners redirect to correct dashboard
- [ ] Profile endpoint returns correct role
- [ ] Programme creation works
- [ ] Learner enrollment works
- [ ] Progress tracking works

## 🔧 Troubleshooting

### Problem: Browser test fails on registration
**Solution**: Check server logs for error details

### Problem: Users still can't access dashboard after fix
**Solution**: 
1. Clear browser cache and cookies
2. Try incognito mode
3. Check frontend environment variables

### Problem: Conveners redirect to wrong dashboard
**Solution**: Check role assignment in database:
```sql
SELECT r.name FROM users u
JOIN user_role_assignments ura ON u.id = ura.user_id
JOIN roles r ON ura.role_id = r.role_id
WHERE u.email = 'convener@example.com';
```

### Problem: New registrations don't assign roles
**Solution**: Check RoleAssignmentService in server logs

## 📞 Need Help?

If issues persist after following this plan:

1. Check `MVP_AUTH_BUG_HUNT_FINDINGS.md` for detailed analysis
2. Review server logs for specific error messages
3. Run `diagnose-database-roles.js` for comprehensive diagnostics
4. Check all environment variables are set correctly

## 🚀 Quick Commands Reference

### Check Database
```bash
mysql -u root -p cohortle -e "SELECT COUNT(*) FROM users u LEFT JOIN user_role_assignments ura ON u.id = ura.user_id WHERE ura.id IS NULL;"
```

### Fix Database
```bash
mysql -u root -p cohortle < fix-role-assignments.sql
```

### Test API
```bash
curl -X POST https://api.cohortle.com/v1/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Check Logs
```bash
tail -f /var/log/cohortle-api/error.log
```

---

**Time Estimate**: 30 minutes total
- Immediate fixes: 15 minutes
- Verification: 10 minutes
- Monitoring: 5 minutes

**Priority**: HIGH - Affects user authentication and access
