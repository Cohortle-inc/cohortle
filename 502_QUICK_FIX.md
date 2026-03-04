# 502 Bad Gateway - Quick Fix Guide

## TL;DR - Do This First

1. **Check API logs in Coolify** - This tells you exactly what's wrong
2. **Verify DB_HOSTNAME** - Most common issue after credential changes
3. **Restart API service** - After fixing credentials

---

## 5-Minute Fix

### Step 1: Get MySQL Internal Hostname (30 seconds)
In Coolify:
- Go to MySQL service
- Copy the "Internal Domain" or "Service Name"
- Example: `mysql-abc123` or `cohortle-mysql`

### Step 2: Update API Environment (2 minutes)
In Coolify, go to `cohortle-api` → Environment Variables:

```bash
DB_HOSTNAME=<paste-internal-hostname-here>
DB_PORT=3306
DB_USER=<your-mysql-username>
DB_PASSWORD=<your-mysql-password>
DB_DATABASE=cohortle
NODE_ENV=production
```

**Critical:** 
- DB_HOSTNAME must be the internal hostname, NOT "localhost"
- DB_DATABASE must be "cohortle", NOT "cohortle.com"

### Step 3: Restart API (1 minute)
- Click "Restart" button on API service
- Wait 30-60 seconds

### Step 4: Test (1 minute)
```powershell
curl https://api.cohortle.com/v1/api/health
```

Should return:
```json
{"error":false,"message":"Ping successful","db_time":"..."}
```

---

## If That Didn't Work

### Check API Logs
In Coolify → `cohortle-api` → Logs

**Look for:**
- `ECONNREFUSED` → Wrong hostname or MySQL not running
- `ER_ACCESS_DENIED_ERROR` → Wrong username/password
- `ETIMEDOUT` → Can't reach MySQL (network issue)
- `Unknown database` → Wrong database name

### Common Fixes

**Error: ECONNREFUSED**
```bash
# Fix: Use internal hostname, not localhost
DB_HOSTNAME=mysql-service-name  # NOT localhost
```

**Error: ER_ACCESS_DENIED_ERROR**
```bash
# Fix: Check credentials match MySQL service
DB_USER=correct_username
DB_PASSWORD=correct_password
```

**Error: Unknown database 'cohortle.com'**
```bash
# Fix: Use correct database name
DB_DATABASE=cohortle  # NOT cohortle.com
```

---

## Still Broken?

Run the diagnostic script:
```powershell
.\diagnose-502-production.ps1
```

Then check:
1. `PRODUCTION_502_DIAGNOSIS.md` - Full troubleshooting guide
2. `PRODUCTION_CREDENTIALS_CHECKLIST.md` - Step-by-step verification

---

## What NOT to Do

❌ Don't set DB_HOSTNAME to "localhost" or "127.0.0.1"
❌ Don't add database credentials to cohortle-web
❌ Don't set NODE_ENV to "development" in production
❌ Don't forget to restart after changing environment variables

## What TO Do

✅ Use MySQL internal hostname for DB_HOSTNAME
✅ Only set database credentials in cohortle-api
✅ Set NODE_ENV to "production"
✅ Always restart after changing environment variables
✅ Check logs after every change
