# ✅ Migration Script Ready - How to Run

## Summary

The migration script is ready to run on your production server. You have three options:

## 🎯 RECOMMENDED: Option 1 - Run via Coolify Console

This is the **easiest and safest** method:

### Steps:

1. **Wait for Coolify to finish deploying** (if not already done)
   - Check Coolify dashboard
   - Ensure `cohortle-api` service is running
   - Verify latest commit (`d51fa63`) is deployed

2. **Open Coolify Console:**
   - Go to your Coolify dashboard
   - Navigate to `cohortle-api` service
   - Click "Terminal" or "Console" button

3. **Run the migration:**
   ```bash
   cd /app/cohortle-api
   npm run migrate
   ```

4. **Verify success:**
   - Look for: `✅ Migration completed successfully`
   - Check for: `✅ Foreign key constraint added successfully`

### Why this method?
- ✅ Runs directly on the server (no network issues)
- ✅ Uses correct database connection automatically
- ✅ No need to expose database externally
- ✅ Matches deployment environment exactly

---

## 💻 Option 2 - Run from Your Local Machine

If you prefer to run from your local Windows machine:

### Steps:

1. **Run the PowerShell script:**
   ```powershell
   .\run-migration-local.ps1
   ```

2. **The script will:**
   - Connect to production database (107.175.94.134)
   - Wait 5 seconds (press Ctrl+C to cancel)
   - Run the migration
   - Show success/error messages

### Requirements:
- Your local machine must be able to connect to 107.175.94.134:3306
- Firewall must allow MySQL connections from your IP
- Node.js and npm must be installed locally

---

## 🔧 Option 3 - Manual Migration (Advanced)

If you have direct database access:

1. **Connect to database:**
   ```bash
   mysql -h 107.175.94.134 -P 3306 -u root -p cohortle
   ```

2. **Check for orphaned cohorts:**
   ```sql
   SELECT c.id, c.name, c.programme_id, c.enrollment_code
   FROM cohorts c
   LEFT JOIN programmes p ON c.programme_id = p.id
   WHERE p.id IS NULL;
   ```

3. **Add foreign key constraint:**
   ```sql
   ALTER TABLE cohorts
   ADD CONSTRAINT fk_cohorts_programme
   FOREIGN KEY (programme_id) REFERENCES programmes(id)
   ON DELETE RESTRICT
   ON UPDATE CASCADE;
   ```

---

## 📋 What the Migration Does

The migration file: `cohortle-api/migrations/20260302000010-add-cohort-programme-foreign-key.js`

**Actions:**
1. ✅ Checks if constraint already exists (safe to run multiple times)
2. ✅ Checks for orphaned cohorts (cohorts with invalid programme_id)
3. ✅ Adds foreign key constraint: `cohorts.programme_id` → `programmes.id`
4. ✅ Provides detailed logging and error messages

**Benefits:**
- Prevents creating cohorts with non-existent programme_id
- Prevents deleting programmes that have cohorts
- Enforces data integrity at database level
- Prevents the PROG-2026-B88GLO issue from happening again

---

## ⚠️ Before Running Migration

### IMPORTANT: Fix Current Data Issue First

Before running the migration, you should fix the existing PROG-2026-B88GLO issue:

1. **Access production database** (phpMyAdmin or MySQL client)

2. **Find current programme:**
   ```sql
   SELECT c.id, c.name, c.enrollment_code, c.programme_id, p.name AS current_programme_name
   FROM cohorts c
   JOIN programmes p ON c.programme_id = p.id
   WHERE c.enrollment_code = 'PROG-2026-B88GLO';
   ```

3. **Find correct programme:**
   ```sql
   SELECT id, name, description 
   FROM programmes 
   WHERE status = 'active'
   ORDER BY name;
   ```

4. **Update cohort:**
   ```sql
   UPDATE cohorts
   SET programme_id = CORRECT_PROGRAMME_ID
   WHERE enrollment_code = 'PROG-2026-B88GLO';
   ```

---

## 🎯 Expected Output

When migration runs successfully:

```
🔍 Checking for existing foreign key constraint...
✅ No orphaned cohorts found
📝 Adding foreign key constraint...
✅ Foreign key constraint added successfully

Benefits:
  - Cohorts can only reference existing programmes
  - Programmes with cohorts cannot be deleted
  - Database enforces data integrity automatically

✅ Migration completed successfully
```

---

## 🚨 Troubleshooting

### Error: "Orphaned cohorts found"

**Cause:** Some cohorts reference non-existent programmes

**Solution:**
1. Run the SQL query to find orphaned cohorts (see above)
2. Either update them to valid programme_id or delete them
3. Run migration again

### Error: "Constraint already exists"

**Cause:** Migration already ran successfully

**Solution:** This is fine! The migration is idempotent and will skip if already applied.

### Error: "Connection refused"

**Cause:** Cannot connect to database

**Solution:**
- Check database is running
- Check firewall allows connections
- Verify credentials are correct
- Use Option 1 (Coolify Console) instead

---

## ✅ After Migration

1. **Verify in production:**
   - Log in as convener: https://cohortle.com/login
   - Navigate to any programme
   - Click "Create Cohort"
   - Verify blue banner shows programme name
   - Verify confirmation dialog appears

2. **Test cohort creation:**
   - Fill out form
   - Confirm in dialog
   - Verify cohort is created successfully

3. **Monitor for 24-48 hours:**
   - Check for any cohort creation errors
   - Check for foreign key constraint violations
   - Verify no user complaints

---

## 📁 Files Created

- ✅ `run-production-migration.js` - Node.js script (works with current .env)
- ✅ `run-migration-local.ps1` - PowerShell script (connects to production DB)
- ✅ `run-migration-on-server.md` - Detailed instructions
- ✅ `MIGRATION_READY_TO_RUN.md` - This file (quick reference)

---

## 🎯 Recommendation

**Use Option 1 (Coolify Console)** for the smoothest experience:

1. Open Coolify dashboard
2. Go to `cohortle-api` service
3. Click "Terminal"
4. Run: `cd /app/cohortle-api && npm run migrate`
5. Done! ✅

---

## 📞 Need Help?

If you encounter issues:
1. Check the error message carefully
2. Review `DEPLOYMENT_COMPLETE_SUMMARY.md` for details
3. Check database logs for constraint violations
4. Verify Coolify deployment completed successfully

---

**Created:** March 2, 2026  
**Status:** Ready to run  
**Commits deployed:** `7fbbce7` (frontend), `d51fa63` (backend)
