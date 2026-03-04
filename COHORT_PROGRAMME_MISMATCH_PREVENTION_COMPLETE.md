# Cohort-Programme Mismatch Prevention - Implementation Complete

## Summary

Implemented comprehensive preventive measures to stop cohort-programme mismatch issues from happening again. The system now has multiple layers of protection to ensure cohorts are always created under the correct programme.

## Changes Implemented

### 1. UI Improvements - Programme Context Display

**File:** `cohortle-web/src/components/convener/CohortForm.tsx`

Added a prominent blue banner at the top of the cohort creation form showing:
- Programme name (large, bold text)
- Programme ID (for reference)
- Clear visual indicator that this cohort belongs to this programme

This makes it impossible for conveners to miss which programme they're creating a cohort for.

### 2. Programme Details Fetching

**File:** `cohortle-web/src/app/convener/programmes/[id]/cohorts/new/page.tsx`

Added:
- Automatic fetching of programme details when the page loads
- Loading state while fetching programme information
- Error handling if programme doesn't exist or can't be loaded
- Automatic redirect to dashboard if programme is invalid

This ensures the page always has valid programme context before allowing cohort creation.

### 3. Confirmation Dialog

**File:** `cohortle-web/src/components/convener/ConfirmCohortDialog.tsx` (NEW)

Created a confirmation dialog that shows before creating a cohort:
- Displays programme name prominently
- Shows all cohort details (name, enrollment code, start date)
- Includes a warning that the association is permanent
- Requires explicit confirmation before proceeding

This gives conveners a final chance to verify they're creating the cohort under the correct programme.

### 4. Database Foreign Key Constraint

**File:** `cohortle-api/migrations/20260302000010-add-cohort-programme-foreign-key.js` (NEW)

Created a database migration that:
- Adds a foreign key constraint from `cohorts.programme_id` to `programmes.id`
- Prevents cohorts from referencing non-existent programmes
- Prevents deletion of programmes that have cohorts
- Checks for orphaned cohorts before adding the constraint
- Provides clear error messages if data integrity issues exist

This enforces data integrity at the database level, making it impossible to create invalid associations.

## How It Prevents the Issue

### Before (Problem Scenario):
1. Convener opens Programme A
2. Gets distracted, navigates to Programme B
3. Clicks "Create Cohort"
4. Creates cohort without realizing they're on Programme B
5. Cohort is created under wrong programme

### After (With Fixes):
1. Convener opens Programme A
2. Gets distracted, navigates to Programme B
3. Clicks "Create Cohort"
4. **Sees large blue banner: "Creating cohort for programme: Programme B"**
5. **Fills out form, clicks Create**
6. **Confirmation dialog appears showing: "Programme: Programme B"**
7. Convener realizes mistake, clicks Cancel
8. Returns to correct programme

### Database Level Protection:
- Even if someone tries to manually update the database
- Foreign key constraint prevents invalid `programme_id` values
- Database rejects the operation with a clear error message

## Testing the Implementation

### Test 1: Visual Confirmation
```bash
# Start the development server
cd cohortle-web
npm run dev

# Navigate to:
# http://localhost:3000/convener/programmes/[PROGRAMME_ID]/cohorts/new

# Verify:
# 1. Blue banner shows programme name
# 2. Programme ID is displayed
# 3. Form is clearly associated with the programme
```

### Test 2: Confirmation Dialog
```bash
# Fill out the cohort form
# Click "Create Cohort"

# Verify:
# 1. Confirmation dialog appears
# 2. Programme name is shown prominently
# 3. All cohort details are displayed
# 4. Warning message is visible
# 5. Can cancel or confirm
```

### Test 3: Database Constraint
```bash
# Run the migration
cd cohortle-api
npm run migrate

# Try to create a cohort with invalid programme_id
# Should fail with foreign key constraint error
```

## Migration Instructions

### Step 1: Deploy Frontend Changes
```bash
cd cohortle-web
git add .
git commit -m "feat: add cohort-programme mismatch prevention

- Add programme name display to cohort creation form
- Add confirmation dialog before creating cohort
- Fetch and validate programme details before allowing cohort creation
- Improve error handling for invalid programmes"
git push origin main
```

### Step 2: Run Database Migration
```bash
cd cohortle-api

# Test migration locally first
npm run migrate

# If successful, deploy to production
# The migration will:
# 1. Check for orphaned cohorts
# 2. Add foreign key constraint if none exist
# 3. Provide detailed logging of the process
```

### Step 3: Verify in Production
1. Log in as a convener
2. Navigate to any programme
3. Click "Create Cohort"
4. Verify the blue banner shows the correct programme name
5. Fill out the form and click "Create Cohort"
6. Verify the confirmation dialog appears
7. Confirm and verify cohort is created successfully

## Benefits

1. **Visual Clarity**: Conveners always know which programme they're working with
2. **Confirmation Step**: Extra layer of protection before committing
3. **Database Integrity**: Impossible to create invalid associations
4. **Error Prevention**: Catches mistakes before they happen
5. **Better UX**: Clear feedback and context throughout the process

## Monitoring

After deployment, monitor for:
- Cohort creation success rate
- Any foreign key constraint violations
- User feedback about the confirmation dialog
- Database integrity check results

## Future Enhancements

Consider adding:
1. Audit trail for cohort creation and modifications
2. Ability to move cohorts between programmes (with admin approval)
3. Bulk cohort creation with validation
4. Programme-cohort relationship dashboard for admins

## Related Files

- `cohortle-web/src/components/convener/CohortForm.tsx`
- `cohortle-web/src/app/convener/programmes/[id]/cohorts/new/page.tsx`
- `cohortle-web/src/components/convener/ConfirmCohortDialog.tsx`
- `cohortle-api/migrations/20260302000010-add-cohort-programme-foreign-key.js`

## Documentation

Updated documentation:
- `PREVENT_COHORT_PROGRAMME_MISMATCH.md` - Prevention strategy
- `COHORT_PROGRAMME_MISMATCH_FIX.md` - How to fix existing issues
- `FIX_PROGRAMME_NAME_INSTRUCTIONS.md` - SQL commands for data fixes

