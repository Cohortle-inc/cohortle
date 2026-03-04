# Enrollment Troubleshooting Guide

## Issue: Cannot join with enrollment code

### Common Causes

#### 1. Enrollment Code Doesn't Exist
The most common issue is that no cohort has been created with that enrollment code.

**Solution:**
- As a convener, create a cohort with an enrollment code
- Go to: Convener Dashboard → Select Programme → Create Cohort
- Set an enrollment code (e.g., `WLIMP-2026`)

#### 2. Wrong Code Format
Enrollment codes must follow the format: `PROGRAMME-YEAR` or `PROGRAMME-YEAR-SUFFIX`

**Valid Examples:**
- `WLIMP-2026`
- `PROG-2025`
- `TEST-2026-ABC`

**Invalid Examples:**
- `wlimp2026` (missing hyphen)
- `WLIMP` (missing year)
- `2026-WLIMP` (wrong order)

#### 3. Not Logged In as Learner
Enrollment requires you to be logged in with a learner account.

**Solution:**
- Ensure you're logged in
- Check your account role is "learner" (not "convener")
- If you have a convener account, create a separate learner account

#### 4. Case Sensitivity
The code is case-insensitive, but must be entered correctly.

**Example:**
- `WLIMP-2026` = `wlimp-2026` = `Wlimp-2026` (all work)

#### 5. Already Enrolled
If you're already enrolled in the cohort, you'll see an error or be redirected.

**Solution:**
- Check your dashboard to see if you're already enrolled
- Go to `/dashboard` to view your enrolled programmes

### How to Test

#### Step 1: Verify Cohort Exists
As a convener:
1. Log in to convener dashboard
2. Go to your programme
3. Check if a cohort exists with the enrollment code
4. If not, create one

#### Step 2: Test Enrollment
As a learner:
1. Log out of convener account
2. Log in with learner account (or create one)
3. Go to `/join`
4. Enter the enrollment code
5. Click "Join Programme"

#### Step 3: Check for Errors
If enrollment fails, check:
- Browser console for JavaScript errors
- Network tab for API response
- Error message displayed on screen

### API Endpoint Details

**Endpoint:** `POST /v1/api/programmes/enroll`

**Request:**
```json
{
  "code": "WLIMP-2026"
}
```

**Success Response (200):**
```json
{
  "error": false,
  "success": true,
  "programme_id": "13",
  "programme_name": "WLIMP Programme",
  "cohort_id": "11"
}
```

**Error Responses:**

**404 - Code Not Found:**
```json
{
  "error": true,
  "message": "Enrollment code not found. Please check the code and try again."
}
```

**400 - Invalid Format:**
```json
{
  "error": true,
  "message": "Invalid code format. Use format: PROGRAMME-YEAR or PROGRAMME-YEAR-SUFFIX"
}
```

**401 - Not Authenticated:**
```json
{
  "error": true,
  "message": "Authentication required"
}
```

### Quick Fix Checklist

- [ ] Cohort exists with the enrollment code
- [ ] Logged in as a learner (not convener)
- [ ] Code format is correct (PROGRAMME-YEAR)
- [ ] Not already enrolled in the cohort
- [ ] API is accessible (check network tab)
- [ ] No JavaScript errors in console

### Database Check

To verify a cohort exists with the enrollment code, run this SQL query:

```sql
SELECT 
  c.id,
  c.name,
  c.enrollment_code,
  c.start_date,
  p.name as programme_name
FROM cohorts c
JOIN programmes p ON c.programme_id = p.id
WHERE c.enrollment_code = 'WLIMP-2026';
```

If this returns no results, the cohort doesn't exist and needs to be created.

### Need More Help?

Please provide:
1. The enrollment code you're trying to use
2. The exact error message you see
3. Whether you're logged in as a learner
4. Screenshot of the error (if possible)
5. Browser console errors (F12 → Console tab)
