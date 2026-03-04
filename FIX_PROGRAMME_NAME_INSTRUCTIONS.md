# Fix Programme Name for Enrollment Code PROG-2026-B88GLO

## Problem
Users enrolling with code `PROG-2026-B88GLO` are seeing the wrong programme name displayed. The enrollment is working correctly, but the programme's `name` field in the database contains incorrect data.

## Impact
- All users enrolled in ANY cohort belonging to this programme will see the same incorrect name
- This is a data issue, not a code issue
- The fix requires updating the database directly

## Solution

### Step 1: Find the Programme ID

Run this SQL query to find which programme the enrollment code belongs to:

```sql
SELECT 
    c.id AS cohort_id,
    c.name AS cohort_name,
    c.enrollment_code,
    c.programme_id,
    p.name AS current_programme_name,
    p.description AS programme_description
FROM cohorts c
JOIN programmes p ON c.programme_id = p.id
WHERE c.enrollment_code = 'PROG-2026-B88GLO';
```

This will show you:
- The cohort details
- The programme ID
- The CURRENT (incorrect) programme name

### Step 2: Check Impact

Before updating, check how many cohorts and users will be affected:

```sql
-- Count cohorts for this programme
SELECT COUNT(*) AS cohort_count
FROM cohorts
WHERE programme_id = (
    SELECT programme_id 
    FROM cohorts 
    WHERE enrollment_code = 'PROG-2026-B88GLO'
);

-- Count enrolled users
SELECT COUNT(DISTINCT e.user_id) AS user_count
FROM enrollments e
JOIN cohorts c ON e.cohort_id = c.id
WHERE c.programme_id = (
    SELECT programme_id 
    FROM cohorts 
    WHERE enrollment_code = 'PROG-2026-B88GLO'
);
```

### Step 3: Update the Programme Name

Once you know the correct programme name, run this SQL command:

```sql
UPDATE programmes 
SET name = 'YOUR_CORRECT_PROGRAMME_NAME_HERE'
WHERE id = (
    SELECT programme_id 
    FROM cohorts 
    WHERE enrollment_code = 'PROG-2026-B88GLO'
);
```

**IMPORTANT:** Replace `YOUR_CORRECT_PROGRAMME_NAME_HERE` with the actual programme name.

### Step 4: Verify the Fix

After updating, verify the change:

```sql
SELECT 
    c.enrollment_code,
    p.name AS programme_name
FROM cohorts c
JOIN programmes p ON c.programme_id = p.id
WHERE c.enrollment_code = 'PROG-2026-B88GLO';
```

The programme name should now be correct.

### Step 5: Test in the App

1. Log out and log back in (to clear any cached data)
2. Go to the join page
3. Enter enrollment code: `PROG-2026-B88GLO`
4. Verify the correct programme name is displayed

## Database Access

**Host:** 107.175.94.134  
**Port:** 3306  
**Database:** cohortle  
**User:** root  
**Password:** (from your .env file)

You can use:
- phpMyAdmin (if available)
- MySQL Workbench
- Command line: `mysql -h 107.175.94.134 -u root -p cohortle`

## What You Need to Provide

Please tell me:
1. What is the CURRENT (incorrect) programme name being displayed?
2. What SHOULD the programme name be?

Once I know this, I can give you the exact SQL command with the correct name filled in.

## Why This Happened

The programme name is stored in the `programmes` table and is associated with multiple cohorts. When a cohort is created with an enrollment code, it references a programme. If the programme name was entered incorrectly during programme creation, all cohorts (and their enrollment codes) will show that incorrect name.

## Alternative: Use API to Check

If you can access the production website, you can also:
1. Go to https://cohortle.com/join
2. Enter the code `PROG-2026-B88GLO`
3. See what programme name is displayed
4. That's the incorrect name that needs to be changed

