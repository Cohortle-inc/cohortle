# Production 502 Bad Gateway - Diagnosis Guide

## Issue Summary
- **Error**: 502 Bad Gateway on login page
- **When**: After updating MySQL credentials across prod environments
- **Affected**: API, MySQL, and Web environments on Coolify

## 502 Bad Gateway Causes

A 502 error means the reverse proxy (Coolify/nginx) cannot reach the upstream API server. Possible causes:

### 1. API Server Not Running
- Container crashed during startup
- Application failed to start
- Port binding issues

### 2. Database Connection Failure
- Wrong credentials in API environment
- Database server not accessible
- Firewall blocking connection
- MySQL service not running

### 3. Environment Variable Issues
- Missing required variables
- Incorrect variable names
- Variables not applied after update

### 4. Network/Proxy Issues
- Internal network misconfiguration
- Port mapping problems
- Health check failures

---

## Immediate Diagnostic Steps

### Step 1: Check API Container Status in Coolify

1. Go to Coolify dashboard
2. Navigate to `cohortle-api` service
3. Check container status:
   - Is it running?
   - Is it restarting repeatedly?
   - Check the "Logs" tab

### Step 2: Check API Logs

Look for these error patterns in API logs:

```
# Database connection errors
ECONNREFUSED
ER_ACCESS_DENIED_ERROR
ETIMEDOUT
Can't connect to MySQL server

# Application startup errors
Error: Cannot find module
Port 3000 is already in use
Unhandled rejection

# Environment variable errors
DB_HOSTNAME is not defined
Missing required environment variable
```

### Step 3: Verify Environment Variables

In Coolify, check that these are set for `cohortle-api`:

**Required Variables:**
```bash
DB_HOSTNAME=<your-mysql-hostname>
DB_PORT=3306
DB_USER=<your-mysql-user>
DB_PASSWORD=<your-mysql-password>
DB_DATABASE=cohortle
NODE_ENV=production
JWT_SECRET=<your-jwt-secret>
PORT=3000
```

**Common Mistakes:**
- ❌ DB_HOSTNAME set to "localhost" (won't work in containers)
- ❌ DB_DATABASE set to "cohortle.com" (should be "cohortle")
- ❌ NODE_ENV set to "development" (should be "production")
- ❌ Credentials have spaces or special characters not escaped

### Step 4: Test Database Connectivity

From Coolify, try to access the API container terminal and test:

```bash
# Test if MySQL is reachable
nc -zv <DB_HOSTNAME> 3306

# Or try MySQL client
mysql -h <DB_HOSTNAME> -u <DB_USER> -p<DB_PASSWORD> -e "SELECT 1"
```

### Step 5: Check MySQL Service

Verify MySQL container/service is running:
- Check MySQL container status in Coolify
- Check MySQL logs for errors
- Verify MySQL is accepting connections on port 3306

---

## Quick Fixes to Try

### Fix 1: Restart API Service
Sometimes environment variables don't apply until restart:
1. In Coolify, go to `cohortle-api`
2. Click "Restart" button
3. Wait for container to fully start
4. Check logs for errors

### Fix 2: Verify Credentials Match

Ensure the SAME credentials are used everywhere:

**MySQL Service** (what you created):
- Username: `<user>`
- Password: `<password>`
- Database: `cohortle`
- Hostname: `<internal-hostname>`

**API Environment Variables** (must match):
```bash
DB_USER=<same-user>
DB_PASSWORD=<same-password>
DB_DATABASE=cohortle
DB_HOSTNAME=<same-internal-hostname>
```

**Web Environment Variables** (for proxy):
```bash
NEXT_PUBLIC_API_URL=https://api.cohortle.com
# NO database variables needed in web
```

### Fix 3: Check Internal Hostname

In Coolify, MySQL services have an internal hostname like:
- `mysql-service-name` (not an IP)
- Or the service UUID

Make sure `DB_HOSTNAME` in API uses this internal name, NOT:
- ❌ localhost
- ❌ 127.0.0.1
- ❌ External IP address

### Fix 4: Test Health Endpoint

Once API is running, test the health endpoint:

```bash
# From your local machine
curl https://api.cohortle.com/v1/api/health

# Should return:
{
  "error": false,
  "message": "Ping successful",
  "db_time": "2026-02-27T..."
}

# If you get 502, API is not responding
# If you get {"error": true}, API is running but DB connection failed
```

---

## Common Scenarios & Solutions

### Scenario 1: API Logs Show "ECONNREFUSED"
**Cause**: Can't connect to MySQL
**Solution**: 
- Verify DB_HOSTNAME is correct internal hostname
- Check MySQL service is running
- Verify network connectivity between containers

### Scenario 2: API Logs Show "ER_ACCESS_DENIED_ERROR"
**Cause**: Wrong username/password
**Solution**:
- Double-check DB_USER and DB_PASSWORD match MySQL user
- Ensure no extra spaces in credentials
- Verify MySQL user has proper permissions

### Scenario 3: API Container Keeps Restarting
**Cause**: Application crashes on startup
**Solution**:
- Check API logs for the crash reason
- Verify all required environment variables are set
- Check for missing dependencies or build issues

### Scenario 4: No Logs Appearing
**Cause**: Container not starting at all
**Solution**:
- Check Coolify build logs
- Verify Dockerfile is correct
- Check for resource limits (memory/CPU)

---

## Verification Checklist

After making changes, verify:

- [ ] MySQL service is running in Coolify
- [ ] API service is running (not restarting)
- [ ] API logs show successful database connection
- [ ] Health endpoint returns success: `curl https://api.cohortle.com/v1/api/health`
- [ ] Login page loads without 502 error
- [ ] Can successfully log in

---

## What to Check in Coolify Right Now

1. **MySQL Service**:
   - Status: Running?
   - Logs: Any errors?
   - Internal hostname: What is it?

2. **API Service**:
   - Status: Running or restarting?
   - Logs: What's the last error message?
   - Environment variables: Are they all set correctly?

3. **Web Service**:
   - Status: Running?
   - Environment: NEXT_PUBLIC_API_URL correct?

---

## Next Steps

1. **Check API logs first** - This will tell you exactly what's failing
2. **Verify database credentials** - Most common cause of 502 after credential changes
3. **Test database connectivity** - Ensure API can reach MySQL
4. **Restart services** - After fixing credentials

## Need More Help?

Provide these details:
1. API container logs (last 50 lines)
2. MySQL container status
3. Environment variables set in API (redact passwords)
4. Error message from browser console (if any)
