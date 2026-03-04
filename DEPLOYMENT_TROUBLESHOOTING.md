# WLIMP Deployment Troubleshooting

## Issue: "Failed to load programmes. Please try again."

This error appears on the dashboard when trying to fetch enrolled programmes. Here's how to diagnose and fix it:

---

## Step 1: Verify Backend is Deployed

### Check Backend Status
1. Open Coolify dashboard
2. Navigate to **cohortle-api** application
3. Check deployment status:
   - ✅ **Running** - Backend is deployed
   - ❌ **Stopped/Failed** - Backend needs to be deployed

### If Backend is NOT Deployed:
```bash
# In Coolify:
1. Click "Deploy" button for cohortle-api
2. Wait 2-3 minutes for deployment
3. Check logs for "Server running on port 3000"
```

---

## Step 2: Verify Migrations Ran

### Check Migration Logs
In Coolify logs for cohortle-api, look for:

```
Running Sequelize migrations...
== 20260301000000-create-wlimp-weeks: migrated (0.XXXs)
== 20260301000001-create-wlimp-lessons: migrated (0.XXXs)
== 20260301000002-create-wlimp-enrollments: migrated (0.XXXs)
== 20260301000003-add-enrollment-code-to-cohorts: migrated (0.XXXs)
```

### If Migrations Didn't Run:
```bash
# Via Coolify terminal:
npm run migrate

# Or check migration status:
npm run migrate:status
```

---

## Step 3: Test Backend API Directly

### Test 1: Health Check
```bash
curl -I https://api.cohortle.com/health
```

**Expected**: `HTTP/1.1 200 OK`

**If fails**: Backend is not accessible

### Test 2: Enrolled Programmes Endpoint
```bash
# Replace YOUR_TOKEN with actual auth token
curl -X GET "https://api.cohortle.com/v1/api/programmes/enrolled" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response**:
```json
{
  "error": false,
  "message": "Enrolled programmes fetched successfully",
  "programmes": []
}
```

**Possible Errors**:
- `401 Unauthorized` - Token is invalid or expired
- `404 Not Found` - Route doesn't exist (backend not deployed with new code)
- `500 Internal Server Error` - Database or server error
- `Connection refused` - Backend is not running

---

## Step 4: Check Frontend Configuration

### Verify Environment Variables
In Coolify for **cohortle-web**, check:

```bash
NEXT_PUBLIC_API_URL=https://api.cohortle.com
```

**Common Issues**:
- Missing `NEXT_PUBLIC_` prefix
- Wrong URL (http instead of https)
- Trailing slash in URL
- URL points to wrong environment

### If Environment Variable is Wrong:
1. Update in Coolify environment variables
2. Redeploy frontend (click "Deploy")
3. Wait for build to complete

---

## Step 5: Check Browser Console

### Open Browser DevTools
1. Press F12 or right-click → Inspect
2. Go to **Console** tab
3. Look for errors

### Common Console Errors:

#### Error: "Failed to fetch"
**Cause**: CORS issue or backend not accessible

**Fix**:
- Verify backend CORS allows frontend domain
- Check backend is running
- Verify NEXT_PUBLIC_API_URL is correct

#### Error: "401 Unauthorized"
**Cause**: Authentication token is invalid or expired

**Fix**:
- Log out and log back in
- Clear browser cookies
- Check token middleware on backend

#### Error: "Network request failed"
**Cause**: Frontend can't reach backend

**Fix**:
- Verify NEXT_PUBLIC_API_URL is correct
- Check backend is running
- Test backend URL directly in browser

---

## Step 6: Check Backend Logs

### View Real-Time Logs in Coolify
1. Open Coolify dashboard
2. Navigate to **cohortle-api**
3. Click "Logs" tab
4. Look for errors when dashboard loads

### Common Backend Errors:

#### Error: "Cannot connect to database"
**Cause**: Database credentials are wrong or database is down

**Fix**:
- Verify DB_HOST, DB_USER, DB_PASSWORD, DB_NAME in Coolify
- Check database is running
- Test database connection

#### Error: "Table 'enrollments' doesn't exist"
**Cause**: Migrations didn't run

**Fix**:
- Run migrations manually: `npm run migrate`
- Check migration logs
- Verify database has SequelizeMeta table

#### Error: "Cannot find module './services/EnrollmentService'"
**Cause**: New code not deployed

**Fix**:
- Verify latest commit is deployed
- Check git push was successful
- Redeploy backend in Coolify

---

## Step 7: Verify Database Tables

### Connect to Database
Use your database client (MySQL Workbench, DBeaver, etc.)

### Check Tables Exist:
```sql
SHOW TABLES LIKE 'weeks';
SHOW TABLES LIKE 'lessons';
SHOW TABLES LIKE 'enrollments';

-- Check cohorts has enrollment_code column
DESCRIBE cohorts;
```

**Expected**: All tables should exist, cohorts should have `enrollment_code` column

### If Tables Don't Exist:
```bash
# Run migrations manually
npm run migrate

# Or check what migrations have run
SELECT * FROM SequelizeMeta;
```

---

## Step 8: Test with Sample Data

### Create Test Enrollment
If you have no enrollments, the dashboard will show empty state (not an error).

To test with data:

```sql
-- 1. Create test programme
INSERT INTO programmes (name, description, start_date, created_by, type, status)
VALUES ('Test Programme', 'Test description', '2026-03-01', 1, 'structured', 'active');

SET @programme_id = LAST_INSERT_ID();

-- 2. Create cohort with enrollment code
INSERT INTO cohorts (programme_id, name, enrollment_code, start_date, status)
VALUES (@programme_id, 'Test Cohort', 'TEST-2026', '2026-03-01', 'active');

SET @cohort_id = LAST_INSERT_ID();

-- 3. Enroll yourself (replace USER_ID with your user ID)
INSERT INTO enrollments (user_id, cohort_id, enrolled_at)
VALUES (YOUR_USER_ID, @cohort_id, NOW());
```

Then refresh the dashboard.

---

## Quick Diagnostic Checklist

Run through this checklist:

- [ ] Backend is deployed and running in Coolify
- [ ] Backend logs show "Server running on port 3000"
- [ ] All 4 migrations ran successfully
- [ ] Database tables exist (weeks, lessons, enrollments)
- [ ] Cohorts table has enrollment_code column
- [ ] Frontend is deployed and running in Coolify
- [ ] NEXT_PUBLIC_API_URL is set correctly
- [ ] Backend health endpoint responds (curl test)
- [ ] Enrolled programmes endpoint responds (curl test)
- [ ] Browser console shows no CORS errors
- [ ] Backend logs show no errors when dashboard loads

---

## Most Likely Causes

Based on the error message, the most likely causes are:

1. **Backend not deployed yet** (most common)
   - Solution: Deploy backend in Coolify

2. **Migrations didn't run**
   - Solution: Check logs, run `npm run migrate` manually

3. **Frontend can't reach backend**
   - Solution: Verify NEXT_PUBLIC_API_URL is correct

4. **Authentication token issue**
   - Solution: Log out and log back in

5. **Database connection issue**
   - Solution: Verify database credentials in Coolify

---

## Next Steps

1. **Start with Step 1**: Verify backend is deployed
2. **If backend is deployed**: Check Step 2 (migrations)
3. **If migrations ran**: Test Step 3 (API directly)
4. **If API works**: Check Step 4 (frontend config)
5. **If still failing**: Check Steps 5-7 (logs and database)

---

## Get Help

If you've gone through all steps and still have issues:

1. **Collect Information**:
   - Backend deployment status
   - Migration logs
   - Backend error logs
   - Frontend console errors
   - curl test results

2. **Check Documentation**:
   - `WLIMP_DEPLOYMENT_GUIDE.md`
   - `cohortle-api/AUTO_MIGRATION_SETUP.md`
   - `cohortle-web/DEPLOYMENT_CHECKLIST.md`

3. **Common Solutions**:
   - Redeploy both backend and frontend
   - Run migrations manually
   - Clear browser cache and cookies
   - Verify all environment variables

---

## Success Indicators

You'll know it's working when:

- ✅ Dashboard loads without errors
- ✅ Shows "No programmes yet" message (if no enrollments)
- ✅ Shows programme cards (if you have enrollments)
- ✅ No errors in browser console
- ✅ No errors in backend logs

---

**Remember**: The most common issue is that the backend hasn't been deployed yet. Start there!
