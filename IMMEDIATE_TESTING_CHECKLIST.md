# Immediate Testing Checklist - New User Auth Fix

## ✅ Deployment Complete

Code has been successfully deployed to production.

**Commits**:
- cohortle-api: `ad6b310`
- cohortle: `b930cd4`

---

## 🧪 Test Now (5 minutes)

### Step 1: Create New Account
```
1. Go to signup page
2. Email: test-[timestamp]@example.com
3. First Name: Test
4. Last Name: User
5. Password: TestPassword123!
6. Role: Student
7. Click Sign Up
```

**Expected**: Signup completes, welcome email sent

### Step 2: Verify Welcome Email
```
1. Check email inbox
2. Look for welcome email from Cohortle
3. Should arrive within 30 seconds
```

**Expected**: Email received with welcome message

### Step 3: Test Login
```
1. Log out (or open incognito window)
2. Go to login page
3. Enter email and password from Step 1
4. Click Login
```

**Expected**: Login succeeds, redirects to dashboard

### Step 4: Verify Dashboard Access
```
1. After login, check dashboard
2. Should see welcome message
3. Should see programme list or empty state
4. Should see navigation menu
```

**Expected**: Dashboard loads normally, NOT "user not authenticated"

### Step 5: Verify Token
```
1. Open browser DevTools (F12)
2. Go to Application → Cookies
3. Find auth_token cookie
4. Copy the token value
5. Go to jwt.io
6. Paste token
7. Check payload
```

**Expected**: Token contains `"role": "student"` (NOT `"unassigned"`)

---

## 📊 Quick Diagnostics

### Check Database State
```bash
cd cohortle-api
node ../diagnose-new-user-auth.js
```

**Expected Output**:
```
Found X users created in the last 24 hours

User ID: 123
Email: test-user@example.com
Status: INACTIVE
Created: 2026-03-12T...
role_id field: 2
role via JOIN: student
✅ Role assignments found: 1
   - Role: student, Status: active
```

### Fix Existing Users (If Needed)
```bash
cd cohortle-api
node ../fix-new-user-roles.js
```

**Expected Output**:
```
🔧 Fixing new user role assignments...

Found X users created in the last 24 hours

✅ User test@example.com: Already has correct role assignment
...

📊 Summary:
   Fixed: X
   Skipped: Y
   Total: Z
```

---

## ✅ Success Criteria

All of these should be true:

- [ ] New user signup completes
- [ ] Welcome email received
- [ ] Login works with new account
- [ ] Dashboard loads (not "user not authenticated")
- [ ] JWT token contains `"role": "student"`
- [ ] Old accounts still work
- [ ] Invalid credentials still fail
- [ ] Diagnostic script shows correct role assignments

---

## ⚠️ If Something Goes Wrong

### Issue: New user still gets "user not authenticated"

**Solution**:
1. Run diagnostic: `node diagnose-new-user-auth.js`
2. Check if user has role assignment
3. Run fix: `node fix-new-user-roles.js`
4. Have user log in again

### Issue: Login returns "invalid email and password"

**Solution**:
1. Verify credentials are correct
2. Check if user exists in database
3. Run diagnostic to check role status
4. Check logs for errors

### Issue: JWT token has role: "unassigned"

**Solution**:
1. Run diagnostic to check role_id field
2. Verify user_role_assignments has active entry
3. Run fix script to repair
4. Have user log in again

### Issue: Old accounts broken

**Solution**:
1. Rollback immediately:
   ```bash
   cd cohortle-api
   git revert ad6b310
   git push
   cd ..
   git add cohortle-api
   git commit -m "Revert: New user auth fix"
   git push
   ```

---

## 📝 Monitoring

### Watch Logs For

**Good signs**:
- Successful logins
- Users accessing dashboard
- No auth errors

**Warning signs**:
- `"Failed to assign role during registration"`
- `"Fallback: Manually set role_id"`
- Multiple login failures

**Error signs**:
- `"Error getting user with role"`
- `"user not authenticated"` errors
- 401 responses on protected routes

---

## 📋 Test Results

### Test Date: _______________

### New User Signup
- [ ] Signup completes
- [ ] Welcome email received
- [ ] User can log in
- [ ] Dashboard loads
- [ ] Token has correct role

### Old User Login
- [ ] Old account still works
- [ ] Dashboard loads
- [ ] Token has correct role

### Error Cases
- [ ] Invalid credentials fail
- [ ] Non-existent user fails
- [ ] Expired token fails

### Database State
- [ ] Diagnostic shows correct roles
- [ ] No users with NULL role_id
- [ ] All users have active assignments

### Notes
```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

---

## 🎯 Next Steps

1. ✅ Run the 5-minute test above
2. ✅ Document results in this checklist
3. ✅ Monitor logs for 24 hours
4. ✅ Run fix script if needed for existing users
5. ✅ Verify login success rate improves

---

**Status**: Ready for testing

**Deployment Time**: March 12, 2026

**Tester**: _______________

**Date Tested**: _______________

**Result**: ✅ PASS / ❌ FAIL
