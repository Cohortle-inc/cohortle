# Production Issues Summary - 3 Critical Bugs Found

## Status: Ready to Fix

Based on the latest production logs, here are the 3 critical issues preventing the platform from working:

---

## Issue 1: Database Authentication Failure ❌

**Error in logs:**
```
ERROR: Access denied for user 'mysql'@'10.0.1.11' (using password: YES)
```

**Root Cause:**
The MySQL credentials in Coolify are incorrect. The API is trying to connect with:
- `DB_USER=mysql`
- But the actual MySQL user is likely `root` or a different username

**Impact:**
- Database connection fails
- Migrations cannot run
- All API endpoints return 500 errors

**Fix Required:**
1. Go to Coolify → MySQL service
2. Find the correct `MYSQL_USER` (check environment variables)
3. Find the correct `MYSQL_PASSWORD`
4. Update `cohortle-api` environment variables:
   ```
   DB_USER=<correct-username-from-mysql-service>
   DB_PASSWORD=<correct-password-from-mysql-service>
   ```
5. Restart API service

**Note:** Port and hostname are now correct (`DB_PORT=3306`, `DB_HOSTNAME=u08gs4kgcogg8kc4k44s0ggk`)

---

## Issue 2: Missing enrollment_code Column ❌

**Error in logs:**
```
Unknown column 'enrollment_code' in 'field list'
Unknown column 'enrollment_code' in 'where clause'
```

**Root Cause:**
The WLIMP migrations haven't run successfully because database authentication is failing. The migration `20260301000003-add-enrollment-code-to-cohorts.js` needs to run to add the `enrollment_code` column to the `cohorts` table.

**Impact:**
- Cohort creation fails with 400 Bad Request
- Enrollment code availability check returns 500 errors
- Cannot create cohorts for programmes

**Fix Required:**
1. Fix Issue 1 first (database authentication)
2. Restart API service (migrations run automatically on startup)
3. Check logs to confirm these migrations completed:
   - `20260301000000-create-wlimp-weeks.js`
   - `20260301000001-create-wlimp-lessons.js`
   - `20260301000002-create-wlimp-enrollments.js`
   - `20260301000003-add-enrollment-code-to-cohorts.js`

**Dependencies:** Requires Issue 1 to be fixed first

---

## Issue 3: Programme Publish SQL Syntax Error 🐛

**Error in logs:**
```
Error: You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '[object Object]' at line 1
SQL: UPDATE cohortle.programmes SET status = 'published' , updated_at = '2026-02-27 02:33:05' WHERE id = [object Object]
Location: cohortle-api/routes/programme.js:2108
```

**Root Cause:**
The publish endpoint is calling `sdk.update()` incorrectly:

**Current code (WRONG):**
```javascript
await sdk.update(
    { status: "published" },
    { id: programme_id }  // ❌ Passing object
);
```

**Expected signature:**
```javascript
async update(payload, id) {
    // id should be a primitive value (number/string), not an object
    sql += " WHERE id = " + id;
}
```

**Impact:**
- Cannot publish programmes
- SQL syntax error when trying to publish

**Fix Required:**
Change line ~2108 in `cohortle-api/routes/programme.js`:

```javascript
// BEFORE (wrong):
await sdk.update(
    { status: "published" },
    { id: programme_id }
);

// AFTER (correct):
await sdk.update(
    { status: "published" },
    programme_id  // Pass the ID directly, not as an object
);
```

**Dependencies:** None - can be fixed independently

---

## Fix Priority Order

1. **Fix Issue 3 first** (code bug - independent fix)
2. **Fix Issue 1 next** (database credentials - blocks migrations)
3. **Issue 2 will auto-fix** (migrations run automatically after Issue 1 is fixed)

---

## Testing After Fixes

### Test 1: Database Connection
```bash
curl https://api.cohortle.com/v1/api/health
# Should return: {"error":false,"message":"Ping successful","db_time":"..."}
```

### Test 2: Cohort Creation
1. Go to: https://cohortle.com/convener/programmes/10/cohorts/new
2. Fill in cohort form
3. Should create successfully (no 400 error)

### Test 3: Programme Publish
1. Go to programme detail page
2. Click "Publish" button
3. Should publish successfully (no 500 error)

---

## Files to Fix

1. `cohortle-api/routes/programme.js` (line ~2108) - Fix Issue 3
2. Coolify environment variables for `cohortle-api` - Fix Issue 1
3. No code changes needed for Issue 2 (migrations auto-run)
