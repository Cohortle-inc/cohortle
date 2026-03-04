# PRODUCTION FIX - FOUND THE ISSUES!

## Error from Logs
```
ERROR: getaddrinfo ENOTFOUND mysql-database
```

## Current Configuration (WRONG)
```
DB_HOSTNAME: mysql-database
DB_PORT: 3036  ← TYPO! Should be 3306
DB_USER: mysql
DB_DATABASE: cohortle
```

## Two Problems:

### Problem 1: Wrong Port Number
**Current**: `DB_PORT=3036`  
**Correct**: `DB_PORT=3306`

You have a typo - MySQL uses port **3306**, not 3036.

### Problem 2: Wrong Hostname
**Current**: `DB_HOSTNAME=mysql-database`  
**Issue**: This hostname doesn't exist or can't be resolved

The hostname `mysql-database` is not being found by DNS lookup.

---

## Fix in Coolify RIGHT NOW

### Step 1: Find Correct MySQL Hostname

1. Go to Coolify dashboard
2. Find your MySQL service
3. Look for one of these:
   - **Internal Domain** (preferred)
   - **Service Name**
   - **Container Name**

It might be something like:
- `mysql-database-abc123`
- `cohortle-mysql`
- `mysql.coolify.internal`
- Or a UUID like `c8d9e7f6-1234-5678-9abc-def012345678`

### Step 2: Update API Environment Variables

Go to `cohortle-api` → Environment Variables and fix these:

```bash
DB_HOSTNAME=<paste-correct-hostname-from-step-1>
DB_PORT=3306
DB_USER=mysql
DB_PASSWORD=<your-password>
DB_DATABASE=cohortle
NODE_ENV=production
PORT=3000
JWT_SECRET=<your-jwt-secret>
```

**Critical Changes:**
1. Fix `DB_PORT` from `3036` to `3306`
2. Fix `DB_HOSTNAME` to the correct internal hostname

### Step 3: Restart API Service

1. Click "Restart" button
2. Wait 30-60 seconds
3. Check logs

### Step 4: Verify Fix

Run:
```powershell
.\diagnose-502-production.ps1
```

Should show success.

---

## How to Find the Correct Hostname

In Coolify, your MySQL service should show:

**Option A: Internal Domain**
```
Internal Domain: mysql-database-abc123.coolify.internal
```
Use this full domain.

**Option B: Service Name**
```
Service Name: cohortle-mysql
```
Use this name.

**Option C: Container Name**
```
Container: mysql-database-c8d9e7f6
```
Use this name.

---

## Why This Happened

1. **Port Typo**: Someone typed `3036` instead of `3306`
2. **Hostname**: The hostname `mysql-database` is either:
   - Incomplete (missing suffix)
   - Wrong service name
   - Not the internal domain Coolify uses

---

## Quick Test After Fix

```powershell
# Test API health
curl https://api.cohortle.com/v1/api/health

# Should return:
# {"error":false,"message":"Ping successful","db_time":"..."}
```

---

## If MySQL Service Doesn't Exist

If you can't find a MySQL service in Coolify, you need to:

1. Create a new MySQL service in Coolify
2. Note its internal hostname
3. Create the `cohortle` database
4. Update API environment variables with the new hostname
5. Restart API

---

## Summary

**Fix these two things:**
1. Change `DB_PORT=3036` to `DB_PORT=3306`
2. Change `DB_HOSTNAME=mysql-database` to the correct internal hostname from Coolify

Then restart the API service.
