# 🚀 Run Migration Now - Quick Start

## ⚡ Fastest Method (RECOMMENDED)

### Via Coolify Console:

1. Open Coolify dashboard
2. Navigate to `cohortle-api` service
3. Click "Terminal" or "Console"
4. Run:
   ```bash
   cd /app/cohortle-api
   npm run migrate
   ```

**Done!** ✅

---

## 💻 Alternative: Run from Your Windows Machine

### Using PowerShell:

```powershell
.\run-migration-local.ps1
```

**That's it!** The script handles everything.

---

## ✅ What to Look For

### Success Output:
```
🔍 Checking for existing foreign key constraint...
✅ No orphaned cohorts found
📝 Adding foreign key constraint...
✅ Foreign key constraint added successfully
✅ Migration completed successfully
```

### If Already Run:
```
✅ Foreign key constraint already exists, skipping...
✅ Migration completed successfully
```

Both are good! ✅

---

## 🚨 If You See Errors

### "Orphaned cohorts found"
**Fix:** Some cohorts reference non-existent programmes
**Action:** Run this SQL to find them:
```sql
SELECT c.id, c.name, c.programme_id, c.enrollment_code
FROM cohorts c
LEFT JOIN programmes p ON c.programme_id = p.id
WHERE p.id IS NULL;
```
Then update or delete those cohorts.

### "Connection refused"
**Fix:** Database connection issue
**Action:** Use Coolify Console method instead (Option 1)

---

## 📋 After Running

1. ✅ Verify success message appears
2. ✅ Test cohort creation at https://cohortle.com
3. ✅ Check programme context banner appears
4. ✅ Verify confirmation dialog works

---

## 📁 All Available Scripts

- `run-migration-local.ps1` - Run from Windows (PowerShell)
- `run-production-migration.js` - Run from Node.js
- Via Coolify Console - Run directly on server (BEST)

---

## 🎯 Current Status

- ✅ Code deployed (commits `7fbbce7` and `d51fa63`)
- ✅ Migration file created
- ✅ Scripts ready
- ⏳ **Waiting for you to run migration**

---

## ⏱️ Time Required

- **Coolify Console:** 30 seconds
- **Local PowerShell:** 1 minute
- **Manual SQL:** 2-3 minutes

---

## 🆘 Need More Details?

See these files:
- `MIGRATION_READY_TO_RUN.md` - Complete guide
- `run-migration-on-server.md` - Detailed instructions
- `DEPLOYMENT_COMPLETE_SUMMARY.md` - Full deployment info
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist

---

**Ready to go!** Choose your method and run the migration. 🚀
