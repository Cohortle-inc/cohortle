# Cohort-Programme Mismatch Fix

## Problem Description

The cohort with enrollment code `PROG-2026-B88GLO` is associated with the WRONG programme in the database. This means:
- The cohort's `programme_id` field points to Programme A
- But it SHOULD point to Programme B
- Users enrolling with this code get enrolled in the correct cohort, but see the wrong programme name

## Root Cause

This is a **data integrity issue**, not a code bug. The cohort record in the database has an incorrect `programme_id` value.

## How It Happens

When a convener creates a cohort, they select which programme it belongs to. If:
1. The wrong programme was selected during cohort creation, OR
2. The cohort was manually moved/reassigned in the database incorrectly

Then the cohort will be associated with the wrong programme.

## Impact

- Users enrolling with `PROG-2026-B88GLO` will:
  - Be enrolled in the correct cohort
  - See the WRONG programme name everywhere in the app
  - Access content from the WRONG programme
  - This affects ALL users enrolled via this code

## Diagnosis Steps

### Step 1: Find Current Programme Association

Run this SQL query to see which programme the cohort is currently linked to:

```sql
SELECT 
    c.id AS cohort_id,
    c.name AS cohort_name,
    c.enrollment_code,
    c.programme_id AS current_programme_id,
    p.name AS current_programme_name,
    c.start_date,
    c.end_date
FROM cohorts c
LEFT JOIN programmes p ON c.programme_id = p.id
WHERE c.enrollment_code = 'PROG-2026-B88GLO';
```

This will show you:
- **current_programme_id**: The programme ID the cohort is currently linked to
- **current_programme_name**: The (incorrect) programme name being displayed

### Step 2: Find the Correct Programme

You need to identify which programme this cohort SHOULD belong to. Run this to see all available programmes:

```sql
SELECT 
    id AS programme_id,
    name AS programme_name,
    description,
    status
FROM programmes
WHERE status = 'active'
ORDER BY name;
```

Identify the CORRECT programme ID from this list.

### Step 3: Check Impact

Before fixing, see how many users will be affected:

```sql
-- Count users enrolled in this cohort
SELECT COUNT(*) AS affected_users
FROM enrollments
WHERE cohort_id = (
    SELECT id 
    FROM cohorts 
    WHERE enrollment_code = 'PROG-2026-B88GLO'
);
```

## Fix Solution

### Option 1: Update the Cohort's Programme Association (RECOMMENDED)

This fixes the root cause by updating the cohort to point to the correct programme:

```sql
-- Replace CORRECT_PROGRAMME_ID with the actual programme ID
UPDATE cohorts
SET programme_id = CORRECT_PROGRAMME_ID
WHERE enrollment_code = 'PROG-2026-B88GLO';
```

**Example:**
```sql
-- If the correct programme ID is 5
UPDATE cohorts
SET programme_id = 5
WHERE enrollment_code = 'PROG-2026-B88GLO';
```

### Option 2: Move Users to a Different Cohort (If cohort is wrong)

If the entire cohort is wrong and users should be in a different cohort:

```sql
-- First, find the correct cohort ID
SELECT id, name, enrollment_code, programme_id
FROM cohorts
WHERE programme_id = CORRECT_PROGRAMME_ID;

-- Then move all enrollments to the correct cohort
UPDATE enrollments
SET cohort_id = CORRECT_COHORT_ID
WHERE cohort_id = (
    SELECT id 
    FROM cohorts 
    WHERE enrollment_code = 'PROG-2026-B88GLO'
);
```

## Verification Steps

### 1. Verify Database Change

```sql
SELECT 
    c.enrollment_code,
    c.name AS cohort_name,
    p.id AS programme_id,
    p.name AS programme_name
FROM cohorts c
JOIN programmes p ON c.programme_id = p.id
WHERE c.enrollment_code = 'PROG-2026-B88GLO';
```

The programme_name should now be correct.

### 2. Test in Application

1. Log out of the application
2. Log back in (to clear any cached data)
3. Go to Dashboard
4. The programme name should now be correct
5. Try enrolling with the code again (should be idempotent)
6. Verify the correct programme name is shown

### 3. Check Existing Users

Existing enrolled users should automatically see the correct programme name on their next login/page refresh.

## Prevention

To prevent this in the future:

1. **Convener Training**: Ensure conveners select the correct programme when creating cohorts
2. **Validation**: Add a confirmation step in the UI showing which programme a cohort will belong to
3. **Audit Trail**: Log cohort creation with programme associations
4. **Regular Audits**: Periodically check for orphaned or misassociated cohorts

## Database Access

**Host:** 107.175.94.134  
**Port:** 3306  
**Database:** cohortle  
**User:** root  
**Password:** (from .env file)

Access via:
- phpMyAdmin
- MySQL Workbench  
- Command line: `mysql -h 107.175.94.134 -u root -p cohortle`

## What I Need From You

To provide the exact fix command, please tell me:

1. **Current Programme Name**: What programme name is being displayed now (the wrong one)?
2. **Correct Programme Name**: What programme name SHOULD be displayed?

Once I have this information, I can give you the exact SQL UPDATE command to run.

## Technical Details

### Database Schema

```
cohorts table:
- id (primary key)
- programme_id (foreign key -> programmes.id)
- name
- enrollment_code (unique)
- start_date
- end_date

programmes table:
- id (primary key)
- name
- description
- status

enrollments table:
- id (primary key)
- user_id (foreign key -> users.id)
- cohort_id (foreign key -> cohorts.id)
- enrolled_at
```

### Code Flow

1. User enters enrollment code `PROG-2026-B88GLO`
2. `EnrollmentService.validateCode()` finds the cohort
3. Includes the programme via JOIN: `cohort.programme`
4. Returns `programme_name: cohort.programme.name`
5. This name comes from the programme that `cohort.programme_id` points to

The code is working correctly - it's the data that's wrong.

