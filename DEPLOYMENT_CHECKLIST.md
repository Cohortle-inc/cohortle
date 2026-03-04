# Deployment Checklist - Cohort-Programme Mismatch Prevention

## Pre-Deployment

- [x] Code implementation complete
- [x] No syntax errors
- [x] Migration file created
- [x] Documentation written

## Step 1: Fix Current Issue (PROG-2026-B88GLO)

Before deploying the new code, fix the existing data issue:

1. **Access your production database** (phpMyAdmin or MySQL client)
   - Host: 107.175.94.134
   - Port: 3306
   - Database: cohortle
   - User: root

2. **Find the current programme association:**
   ```sql
   SELECT 
       c.id AS cohort_id,
       c.name AS cohort_name,
       c.enrollment_code,
       c.programme_id AS current_programme_id,
       p.name AS current_programme_name
   FROM cohorts c
   JOIN programmes p ON c.programme_id = p.id
   WHERE c.enrollment_code = 'PROG-2026-B88GLO';
   ```

3. **Identify the correct programme:**
   ```sql
   SELECT id, name, description 
   FROM programmes 
   WHERE status = 'active'
   ORDER BY name;
   ```

4. **Update the cohort** (replace `CORRECT_PROGRAMME_ID` with actual ID):
   ```sql
   UPDATE cohorts
   SET programme_id = CORRECT_PROGRAMME_ID
   WHERE enrollment_code = 'PROG-2026-B88GLO';
   ```

5. **Verify the fix:**
   ```sql
   SELECT 
       c.enrollment_code,
       c.name AS cohort_name,
       p.name AS programme_name
   FROM cohorts c
   JOIN programmes p ON c.programme_id = p.id
   WHERE c.enrollment_code = 'PROG-2026-B88GLO';
   ```

- [ ] Current programme identified
- [ ] Correct programme identified
- [ ] Cohort updated
- [ ] Fix verified

## Step 2: Deploy Frontend Changes

```bash
cd cohortle-web

# Review changes
git status
git diff

# Commit and push
git add src/components/convener/CohortForm.tsx
git add src/app/convener/programmes/[id]/cohorts/new/page.tsx
git add src/components/convener/ConfirmCohortDialog.tsx

git commit -m "feat: prevent cohort-programme mismatch

- Add programme context banner to cohort creation form
- Add confirmation dialog before creating cohort  
- Validate programme exists before allowing cohort creation
- Improve error handling and user feedback

This prevents conveners from accidentally creating cohorts
under the wrong programme by providing clear visual context
and requiring explicit confirmation."

git push origin main
```

- [ ] Changes reviewed
- [ ] Committed to git
- [ ] Pushed to GitHub
- [ ] Coolify deployment triggered
- [ ] Frontend deployment successful

## Step 3: Deploy Backend Changes

```bash
cd cohortle-api

# Review migration
cat migrations/20260302000010-add-cohort-programme-foreign-key.js

# Commit and push
git add migrations/20260302000010-add-cohort-programme-foreign-key.js

git commit -m "feat: add foreign key constraint for cohort-programme relationship

- Add FK constraint from cohorts.programme_id to programmes.id
- Prevent cohorts from referencing non-existent programmes
- Prevent deletion of programmes with cohorts
- Check for orphaned cohorts before adding constraint
- Provide detailed logging and error messages

This enforces data integrity at the database level."

git push origin main
```

- [ ] Migration reviewed
- [ ] Committed to git
- [ ] Pushed to GitHub
- [ ] Coolify deployment triggered
- [ ] Backend deployment successful

## Step 4: Run Database Migration

**Option A: Via Coolify Console**
```bash
cd /app/cohortle-api
npm run migrate
```

**Option B: Via SSH**
```bash
ssh your-server
cd /path/to/cohortle-api
npm run migrate
```

Expected output:
```
🔍 Checking for existing foreign key constraint...
✅ No orphaned cohorts found
📝 Adding foreign key constraint...
✅ Foreign key constraint added successfully
✅ Migration completed successfully
```

- [ ] Migration executed
- [ ] No errors in output
- [ ] Foreign key constraint added

## Step 5: Verify in Production

### Test 1: Programme Context Display
1. Log in as convener: https://cohortle.com/login
2. Navigate to any programme
3. Click "Create Cohort"
4. **Verify**: Blue banner shows programme name and ID

- [ ] Banner visible
- [ ] Programme name correct
- [ ] Programme ID shown

### Test 2: Confirmation Dialog
1. Fill out cohort form
2. Click "Create Cohort"
3. **Verify**: Confirmation dialog appears
4. **Verify**: Programme name shown in dialog
5. **Verify**: All cohort details displayed
6. **Verify**: Warning message visible

- [ ] Dialog appears
- [ ] Programme name correct
- [ ] Details accurate
- [ ] Warning visible

### Test 3: Cohort Creation
1. Click "Create Cohort" in confirmation dialog
2. **Verify**: Cohort created successfully
3. **Verify**: Success message shown
4. **Verify**: Enrollment code displayed

- [ ] Creation successful
- [ ] Success message shown
- [ ] Enrollment code visible

### Test 4: Database Constraint
1. Try to create cohort with invalid programme_id (via API or database)
2. **Verify**: Operation fails with foreign key constraint error

- [ ] Constraint working
- [ ] Error message clear

## Step 6: Monitor

Check for the next 24-48 hours:

- [ ] No cohort creation errors
- [ ] No foreign key constraint violations
- [ ] No user complaints about confusion
- [ ] Cohorts being created successfully

## Rollback Plan (If Needed)

### Frontend Rollback
```bash
cd cohortle-web
git revert HEAD
git push origin main
```

### Backend Rollback
```bash
cd cohortle-api

# Rollback migration
npm run migrate:undo

# Revert commit
git revert HEAD
git push origin main
```

## Success Criteria

✅ Current issue (PROG-2026-B88GLO) fixed  
✅ Frontend deployed successfully  
✅ Backend deployed successfully  
✅ Migration ran without errors  
✅ Programme context visible in UI  
✅ Confirmation dialog working  
✅ Cohorts can be created successfully  
✅ Database constraint enforced  

## Notes

- The migration is idempotent (safe to run multiple times)
- The confirmation dialog can be dismissed if needed
- The foreign key constraint only prevents invalid data, not valid operations
- All changes are backwards compatible

## Support

If issues occur:
1. Check Coolify logs for errors
2. Check database logs for constraint violations
3. Review `COHORT_PROGRAMME_MISMATCH_PREVENTION_COMPLETE.md` for details
4. Test in development environment first

## Completion

Date deployed: _______________  
Deployed by: _______________  
Verified by: _______________  

All checks passed: [ ]

