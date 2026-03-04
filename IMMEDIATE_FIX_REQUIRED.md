# IMMEDIATE FIX REQUIRED - Database Connection Failure

## Diagnosis Results

Your API is returning **500 Internal Server Error**, which means:
- ✅ API container IS running
- ✅ Coolify CAN reach the API
- ❌ API CANNOT connect to the database
- ❌ Every request crashes when trying to query MySQL

## The Problem

The health endpoint tries to run `SELECT NOW()` against the database and fails, returning:
```json
{"error":true,"message":"something went wrong"}
```

This is the generic error from your health check when database connection fails.

## Fix This NOW in Coolify

### Step 1: Go to MySQL Service
1. Open Coolify dashboard
2. Find your MySQL service
3. Copy the **Internal Domain** or **Service Name**
   - Example: `mysql-abc123` or `cohortle-mysql-prod`

### Step 2: Go to API Service Environment Variables
1. Open `cohortle-api` service in Coolify
2. Go to Environment Variables tab
3. Update these variables:

```bash
DB_HOSTNAME=<paste-the-internal-domain-here>
DB_PORT=3306
DB_USER=<your-mysql-username>
DB_PASSWORD=<your-mysql-password>
DB_DATABASE=cohortle
NODE_ENV=production
PORT=3000
JWT_SECRET=<your-jwt-secret>
```

### Step 3: Critical Checks

**DB_HOSTNAME must be:**
- ❌ NOT "localhost"
- ❌ NOT "127.0.0.1"
- ❌ NOT "u08gs4kgcogg8kc4k44s0ggk" (unless that's the actual internal hostname)
- ✅ The MySQL service's internal domain from Coolify

**DB_DATABASE must be:**
- ❌ NOT "cohortle.com"
- ✅ "cohortle"

**NODE_ENV must be:**
- ❌ NOT "development"
- ✅ "production"

### Step 4: Restart API Service
1. Click "Restart" button on API service
2. Wait 30-60 seconds for startup
3. Check logs for errors

### Step 5: Verify Fix
Run this command:
```powershell
curl https://api.cohortle.com/v1/api/health
```

Should return:
```json
{
  "error": false,
  "message": "Ping successful",
  "db_time": "2026-02-27T..."
}
```

---

## Most Likely Issue

Based on your `.env` file showing `DB_HOSTNAME=u08gs4kgcogg8kc4k44s0ggk`, this looks like a production hostname that might not be correct or accessible.

**Check in Coolify:**
1. Is this the actual internal hostname of your MySQL service?
2. Or did you copy this from somewhere else?

**If it's wrong:**
- Get the correct internal hostname from MySQL service in Coolify
- Update DB_HOSTNAME in API environment variables
- Restart API service

---

## Why This Happened

After updating MySQL credentials, the API needs:
1. The correct internal hostname (not localhost)
2. The correct username and password
3. The correct database name

If any of these are wrong, the API crashes on every request that touches the database.

---

## Check API Logs NOW

In Coolify, go to `cohortle-api` → Logs

Look for:
```
ECONNREFUSED - Can't connect to database
ER_ACCESS_DENIED_ERROR - Wrong credentials
ETIMEDOUT - Database not reachable
Error: connect ENOTFOUND - Wrong hostname
```

This will tell you exactly what's wrong.

---

## Quick Test

After fixing, test immediately:
```powershell
.\diagnose-502-production.ps1
```

Should show:
- ✅ Test 1: API health check passes
- ✅ Test 3: Web frontend loads

---

## If Still Broken

Provide:
1. API container logs (last 50 lines)
2. MySQL service internal hostname from Coolify
3. Current DB_HOSTNAME value in API environment variables
