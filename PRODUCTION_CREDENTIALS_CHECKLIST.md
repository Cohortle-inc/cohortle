# Production Credentials Verification Checklist

## The Problem
After updating MySQL credentials, you're getting 502 Bad Gateway. This usually means the API can't connect to the database.

## Critical: Credential Consistency

You mentioned using "the same credentials across prod mysql env, api prod env, and web prod env". 

**IMPORTANT**: The web environment should NOT have database credentials. Only the API needs them.

---

## Step-by-Step Verification

### 1. MySQL Service in Coolify

Go to your MySQL service in Coolify and note:

```
Service Name: ___________________
Internal Hostname: ___________________
Port: 3306
Database Name: cohortle
Username: ___________________
Password: ___________________
```

**How to find Internal Hostname:**
- In Coolify, go to MySQL service
- Look for "Internal Domain" or "Service Name"
- It's usually something like: `mysql-abc123` or the service name

### 2. API Environment Variables in Coolify

Go to `cohortle-api` service → Environment Variables

Verify these EXACT values:

```bash
# Database Connection (MUST match MySQL service above)
DB_HOSTNAME=<internal-hostname-from-step-1>
DB_PORT=3306
DB_USER=<username-from-step-1>
DB_PASSWORD=<password-from-step-1>
DB_DATABASE=cohortle

# Application Settings
NODE_ENV=production
PORT=3000
JWT_SECRET=<your-jwt-secret>

# Optional
BUNNY_STREAM_API_KEY=<if-you-use-bunny>
BUNNY_STREAM_LIBRARY_ID=<if-you-use-bunny>
```

**Common Mistakes:**
- [ ] DB_HOSTNAME is "localhost" (WRONG - use internal hostname)
- [ ] DB_HOSTNAME is "127.0.0.1" (WRONG - use internal hostname)
- [ ] DB_DATABASE is "cohortle.com" (WRONG - should be "cohortle")
- [ ] NODE_ENV is "development" (WRONG - should be "production")
- [ ] Password has spaces or special characters not properly set
- [ ] Variables have trailing spaces

### 3. Web Environment Variables in Coolify

Go to `cohortle-web` service → Environment Variables

Should ONLY have:

```bash
# API Connection
NEXT_PUBLIC_API_URL=https://api.cohortle.com

# NO DATABASE VARIABLES NEEDED
# The web app connects to API, not directly to database
```

**Remove these if present:**
- ❌ DB_HOSTNAME
- ❌ DB_USER
- ❌ DB_PASSWORD
- ❌ DB_DATABASE

---

## Verification Tests

### Test 1: Check API Container Logs

In Coolify:
1. Go to `cohortle-api` service
2. Click "Logs" tab
3. Look for these patterns:

**Good Signs:**
```
Server listening on port 3000
Database connected successfully
Migrations completed
```

**Bad Signs:**
```
ECONNREFUSED - Can't connect to database
ER_ACCESS_DENIED_ERROR - Wrong credentials
ETIMEDOUT - Database not reachable
Error: connect ENOTFOUND - Wrong hostname
```

### Test 2: Check MySQL Container Logs

In Coolify:
1. Go to MySQL service
2. Click "Logs" tab
3. Verify it's running and accepting connections

**Good Signs:**
```
mysqld: ready for connections
```

**Bad Signs:**
```
Access denied
Can't start server
Port already in use
```

### Test 3: Test API Health Endpoint

Run the diagnostic script:
```powershell
.\diagnose-502-production.ps1
```

Or manually test:
```powershell
curl https://api.cohortle.com/v1/api/health
```

**Expected Response:**
```json
{
  "error": false,
  "message": "Ping successful",
  "db_time": "2026-02-27T12:34:56.000Z"
}
```

**If you get 502:**
- API container is not running or crashed
- Check API logs immediately

**If you get {"error": true}:**
- API is running but can't connect to database
- Check database credentials and hostname

---

## Common Issues & Fixes

### Issue 1: Wrong Internal Hostname

**Symptom:** API logs show `ENOTFOUND` or `ETIMEDOUT`

**Fix:**
1. In Coolify, go to MySQL service
2. Find the correct internal hostname (usually shown as "Internal Domain")
3. Update `DB_HOSTNAME` in API environment variables
4. Restart API service

### Issue 2: Wrong Credentials

**Symptom:** API logs show `ER_ACCESS_DENIED_ERROR`

**Fix:**
1. Verify MySQL username and password
2. Update `DB_USER` and `DB_PASSWORD` in API environment variables
3. Ensure no extra spaces or special characters
4. Restart API service

### Issue 3: Wrong Database Name

**Symptom:** API logs show `Unknown database`

**Fix:**
1. Verify database name is `cohortle` (not `cohortle.com`)
2. Update `DB_DATABASE=cohortle` in API environment variables
3. Restart API service

### Issue 4: Environment Variables Not Applied

**Symptom:** API still using old credentials

**Fix:**
1. After updating environment variables in Coolify
2. Click "Restart" button on API service
3. Wait for container to fully restart
4. Check logs to verify new credentials are being used

---

## Step-by-Step Recovery Process

1. **Stop and verify MySQL service:**
   - [ ] MySQL service is running in Coolify
   - [ ] Note the internal hostname
   - [ ] Note the credentials

2. **Update API environment variables:**
   - [ ] Set DB_HOSTNAME to MySQL internal hostname
   - [ ] Set DB_USER to MySQL username
   - [ ] Set DB_PASSWORD to MySQL password
   - [ ] Set DB_DATABASE to `cohortle`
   - [ ] Set NODE_ENV to `production`
   - [ ] Set PORT to `3000`
   - [ ] Set JWT_SECRET to a secure value

3. **Restart API service:**
   - [ ] Click "Restart" in Coolify
   - [ ] Wait 30-60 seconds for startup

4. **Check API logs:**
   - [ ] Look for "Server listening on port 3000"
   - [ ] Look for successful database connection
   - [ ] No error messages

5. **Test health endpoint:**
   - [ ] Run: `curl https://api.cohortle.com/v1/api/health`
   - [ ] Should return success with db_time

6. **Test login page:**
   - [ ] Visit https://cohortle.com/login
   - [ ] Should load without 502 error
   - [ ] Try logging in

---

## If Still Not Working

Provide these details for further diagnosis:

1. **API Container Logs** (last 50 lines):
   ```
   [Paste logs here]
   ```

2. **MySQL Container Status:**
   - Running? Yes/No
   - Internal hostname: ___________

3. **API Environment Variables** (redact password):
   ```
   DB_HOSTNAME=___________
   DB_USER=___________
   DB_DATABASE=___________
   NODE_ENV=___________
   ```

4. **Error from browser console** (F12 → Console):
   ```
   [Paste error here]
   ```

5. **Health endpoint response:**
   ```
   [Paste response here]
   ```
