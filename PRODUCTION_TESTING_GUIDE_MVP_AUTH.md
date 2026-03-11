# Production Testing Guide: MVP Authentication Bug Hunt

## Overview

This guide outlines what to test on your live production environment after running the database diagnostic and fix scripts from Tasks 1.1-1.3 of the MVP Authentication Bug Hunt spec.

## Prerequisites

Before testing, you should have:
- ✅ Run the database diagnostic script on production
- ✅ Run the role assignment fix script (if users without roles were found)
- ✅ Verified all users now have role assignments

## Production Testing Checklist

### Phase 1: Database Verification (5 minutes)

**Goal:** Confirm database is healthy and all users have roles

#### Test 1.1: Check Users Have Roles

```sql
-- Should return 0
SELECT COUNT(*) as users_without_roles
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
WHERE ura.id IS NULL;
```

**Expected:** `0` users without roles

#### Test 1.2: Verify Role Distribution

```sql
SELECT 
  r.name as role,
  COUNT(ura.id) as user_count
FROM roles r
LEFT JOIN user_role_assignments ura ON r.role_id = ura.role_id AND ura.status = 'active'
GROUP BY r.name
ORDER BY user_count DESC;
```

**Expected:** Reasonable distribution (mostly students, few conveners)

#### Test 1.3: Check Recent Users

```sql
SELECT 
  u.email,
  r.name as role,
  u.created_at,
  ura.assigned_at
FROM users u
INNER JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
INNER JOIN roles r ON ura.role_id = r.role_id
ORDER BY u.created_at DESC
LIMIT 10;
```

**Expected:** All recent users have roles assigned

---

### Phase 2: Learner Authentication Testing (10 minutes)

**Goal:** Verify learners can register, login, and access dashboard without errors

#### Test 2.1: Learner Registration

1. Open your production site in **incognito/private window**
2. Navigate to signup page
3. Register a new learner account:
   - Email: `test-learner-[timestamp]@example.com`
   - Password: Strong password
   - Role: Student/Learner

**Expected Results:**
- ✅ Registration succeeds
- ✅ No errors displayed
- ✅ Redirected to appropriate page

**Check in Database:**
```sql
SELECT u.email, r.name as role, ura.assigned_at
FROM users u
INNER JOIN user_role_assignments ura ON u.id = ura.user_id
INNER JOIN roles r ON ura.role_id = r.role_id
WHERE u.email = 'test-learner-[timestamp]@example.com';
```

**Expected:** User has 'student' role assigned

#### Test 2.2: Learner Login

1. Logout (if logged in)
2. Navigate to login page
3. Login with the test learner credentials

**Expected Results:**
- ✅ Login succeeds
- ✅ Redirected to `/dashboard`
- ✅ No "user not authenticated" errors
- ✅ No console errors in browser DevTools

**Check Browser:**
- Open DevTools → Application → Cookies
- Verify `auth_token` cookie exists
- Verify cookie has `HttpOnly` flag

#### Test 2.3: Learner Dashboard Access

1. While logged in as learner, access `/dashboard`
2. Refresh the page multiple times
3. Navigate away and back to dashboard

**Expected Results:**
- ✅ Dashboard loads without errors
- ✅ No "user not authenticated" errors
- ✅ User information displays correctly
- ✅ Session persists across page refreshes

**Critical Check:**
- Look for any "user not authenticated" errors in:
  - Browser console (F12 → Console)
  - Network tab (F12 → Network)
  - Page content

#### Test 2.4: Learner Profile Access

1. Navigate to profile page
2. Check profile information

**Expected Results:**
- ✅ Profile page loads
- ✅ Role displays as "Student" or "Learner"
- ✅ User information is correct
- ✅ No authentication errors

---

### Phase 3: Convener Authentication Testing (10 minutes)

**Goal:** Verify conveners can register, login, and access convener dashboard

#### Test 3.1: Convener Registration

1. Open new incognito/private window
2. Navigate to convener signup page
3. Register a new convener account:
   - Email: `test-convener-[timestamp]@example.com`
   - Password: Strong password
   - Role: Convener

**Expected Results:**
- ✅ Registration succeeds
- ✅ No errors displayed

**Check in Database:**
```sql
SELECT u.email, r.name as role, ura.assigned_at
FROM users u
INNER JOIN user_role_assignments ura ON u.id = ura.user_id
INNER JOIN roles r ON ura.role_id = r.role_id
WHERE u.email = 'test-convener-[timestamp]@example.com';
```

**Expected:** User has 'convener' role assigned

#### Test 3.2: Convener Login

1. Login with convener credentials

**Expected Results:**
- ✅ Login succeeds
- ✅ Redirected to `/convener/dashboard`
- ✅ No authentication errors

#### Test 3.3: Convener Dashboard Access

1. Access convener dashboard
2. Verify convener features are accessible

**Expected Results:**
- ✅ Convener dashboard loads
- ✅ Can access convener-specific features
- ✅ No authentication errors

#### Test 3.4: Convener Can Access Learner Features

1. While logged in as convener, navigate to `/dashboard`

**Expected Results:**
- ✅ Can access learner dashboard
- ✅ Conveners have access to both convener and learner features

---

### Phase 4: Existing User Testing (10 minutes)

**Goal:** Verify existing users (who may have been fixed) can still login

#### Test 4.1: Test Existing Learner Account

1. Pick an existing learner email from database
2. Login with their credentials (if you have them)
3. Access dashboard

**Expected Results:**
- ✅ Login succeeds
- ✅ Dashboard accessible
- ✅ No authentication errors

#### Test 4.2: Test Existing Convener Account

1. Pick an existing convener email
2. Login with their credentials
3. Access convener dashboard

**Expected Results:**
- ✅ Login succeeds
- ✅ Convener dashboard accessible
- ✅ No authentication errors

---

### Phase 5: Role-Based Access Control (5 minutes)

**Goal:** Verify role-based routing and access control works

#### Test 5.1: Learner Cannot Access Convener Routes

1. Login as learner
2. Try to access `/convener/dashboard` directly

**Expected Results:**
- ✅ Access denied or redirected
- ✅ Appropriate error message shown

#### Test 5.2: Unauthenticated User Redirected

1. Logout completely
2. Try to access `/dashboard` directly

**Expected Results:**
- ✅ Redirected to login page
- ✅ Cannot access protected routes

---

### Phase 6: Session Persistence (5 minutes)

**Goal:** Verify authentication persists across sessions

#### Test 6.1: Page Refresh

1. Login as learner
2. Refresh page multiple times

**Expected Results:**
- ✅ Remains authenticated
- ✅ No re-login required

#### Test 6.2: Navigation

1. Navigate between different pages
2. Return to dashboard

**Expected Results:**
- ✅ Authentication persists
- ✅ No authentication errors

#### Test 6.3: Browser Reopen (Optional)

1. Close browser completely
2. Reopen and navigate to site

**Expected Results:**
- ✅ Session persists (if not expired)
- OR redirected to login (if session expired - this is OK)

---

### Phase 7: API Endpoint Testing (5 minutes)

**Goal:** Verify API endpoints return correct role information

#### Test 7.1: Profile Endpoint

**Using Browser DevTools:**
1. Login as learner
2. Open DevTools → Network tab
3. Navigate to profile page
4. Find the profile API call
5. Check response

**Expected Response:**
```json
{
  "id": 123,
  "email": "user@example.com",
  "role": "student",  // or "convener"
  "firstName": "...",
  "lastName": "..."
}
```

**Critical:** Role field must be present and correct

#### Test 7.2: Dashboard Endpoint

1. Check dashboard API calls in Network tab
2. Verify responses include user data with role

**Expected:** All API responses include role information

---

## Critical Issues to Watch For

### 🚨 STOP and Report If You See:

1. **"user not authenticated" errors**
   - In browser console
   - On any page
   - For any valid user

2. **Users without roles in database**
   - Query returns > 0 users without roles

3. **Login failures for valid credentials**
   - Users cannot login
   - Redirected back to login page

4. **Dashboard access failures**
   - Blank pages
   - Error messages
   - Infinite redirects

5. **Role information missing**
   - API responses don't include role
   - Profile shows "unassigned" or no role

---

## Success Criteria

✅ **All tests pass if:**

- Zero users without role assignments in database
- Learners can register, login, and access dashboard
- Conveners can register, login, and access convener dashboard
- No "user not authenticated" errors anywhere
- Role-based routing works correctly
- Sessions persist across page refreshes
- API endpoints return role information
- Existing users can still login and access features

---

## What to Document

After testing, document:

1. **Test Results:**
   - Which tests passed
   - Which tests failed (if any)
   - Screenshots of any errors

2. **Database State:**
   - Total users: [number]
   - Users with roles: [number]
   - Users without roles: [number]
   - Role distribution

3. **Issues Found:**
   - Description of any issues
   - Steps to reproduce
   - Error messages
   - Screenshots

4. **User Feedback:**
   - Any reports from real users
   - Authentication errors they experienced
   - Features that don't work

---

## Quick Reference Commands

### Check Database Health
```sql
-- Users without roles (should be 0)
SELECT COUNT(*) FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
WHERE ura.id IS NULL;

-- Role distribution
SELECT r.name, COUNT(ura.id) as count
FROM roles r
LEFT JOIN user_role_assignments ura ON r.role_id = ura.role_id AND ura.status = 'active'
GROUP BY r.name;
```

### Check Specific User
```sql
SELECT u.email, r.name as role, ura.assigned_at, ura.status
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
LEFT JOIN roles r ON ura.role_id = r.role_id
WHERE u.email = 'user@example.com';
```

---

## Troubleshooting

### If Tests Fail:

1. **Re-run diagnostics:**
   ```bash
   node cohortle-api/diagnose-database-roles.js
   ```

2. **Check for users without roles:**
   - If found, re-run fix script

3. **Clear browser cache:**
   - Old cached data may cause issues
   - Test in incognito mode

4. **Check application logs:**
   - Look for authentication errors
   - Check for database connection issues

5. **Verify environment variables:**
   - `REQUIRE_EMAIL_VERIFICATION=false`
   - Database credentials correct

---

## Next Steps After Testing

### If All Tests Pass:
- ✅ Mark Phase 1 complete
- ✅ Document success
- ➡️ Proceed to Phase 2: Backend API Audit (Tasks 2.1-2.12)

### If Tests Fail:
- ⚠️ Document failures
- ⚠️ Review diagnostic output
- ⚠️ Check application logs
- ⚠️ Re-run fix scripts if needed
- ⚠️ Investigate root cause

---

## Time Estimate

- **Database Verification:** 5 minutes
- **Learner Testing:** 10 minutes
- **Convener Testing:** 10 minutes
- **Existing User Testing:** 10 minutes
- **Access Control Testing:** 5 minutes
- **Session Testing:** 5 minutes
- **API Testing:** 5 minutes

**Total:** ~50 minutes for comprehensive testing

---

## Contact

If you encounter issues during testing:
1. Document the issue with screenshots
2. Save error messages from console
3. Note which test failed
4. Check the troubleshooting section
5. Review diagnostic output from Task 1.2

---

**Spec:** MVP Authentication & Role System Bug Hunt  
**Phase:** 1 - Database Audit and Fixes  
**Tasks Covered:** 1.1, 1.2, 1.3  
**Next Phase:** 2 - Backend API Audit and Fixes
