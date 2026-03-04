# Authentication Debugging Guide

## Your Auth Flow (How It Should Work)

1. User submits login form → `/api/auth/login` (Next.js API route)
2. Next.js calls backend → `api.cohortle.com/v1/api/auth/login`
3. Backend validates credentials → returns JWT token
4. Next.js sets httpOnly cookie → `auth_token`
5. User makes API call → `/api/proxy/v1/api/programmes/enrolled`
6. Proxy reads cookie → adds `Authorization: Bearer {token}` header
7. Backend validates token → returns data

## Current Problem

**403 Forbidden** on step 7 - Backend is rejecting the token

---

## About Your DB_HOSTNAME

**Your current value:** `u08gs4kgcogg8kc4k44s0ggk`

This looks like a **Coolify-generated internal hostname** for your database service. This is CORRECT if:
- Your database is running in Coolify
- This is the internal Docker network hostname

**It's WRONG if:**
- You're using an external database (like a managed MySQL service)
- The database is on a different server

**To verify it's correct:**
1. Check Coolify logs for cohortle-api
2. Look for "Database connected" message
3. If you see connection errors, the hostname is wrong

Since your health check returned database time successfully, **your DB_HOSTNAME is CORRECT**.

---

## Debugging Steps

### Step 1: Check if Cookie is Being Set

After logging in at https://cohortle.com/login:

1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Cookies** → https://cohortle.com
4. Look for `auth_token`

**What to check:**
- ✅ Cookie exists
- ✅ Has a long string value (JWT token)
- ✅ HttpOnly = true
- ✅ Secure = true (in production)
- ✅ Path = /
- ✅ SameSite = Lax

**If cookie is missing:**
- Login API route isn't setting it
- Check Coolify logs for cohortle-web
- Look for errors in `/api/auth/login`

**If cookie exists:** Go to Step 2

---

### Step 2: Check if Proxy is Reading the Cookie

In browser console on https://cohortle.com/dashboard:

```javascript
// Check if cookie exists
document.cookie.split(';').find(c => c.trim().startsWith('auth_token'))

// Try to make an API call and see the headers
fetch('/api/proxy/v1/api/health', {
  method: 'GET',
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

**Expected result:**
```json
{"error":false,"message":"Ping successful","db_time":"..."}
```

**If this works:** The proxy CAN read cookies and forward requests. Go to Step 3.

**If this fails:** The proxy route has an issue. Check the proxy code.

---

### Step 3: Check Backend Token Validation

The 403 error means the backend is rejecting the token. Possible causes:

#### Cause 1: JWT_SECRET Mismatch
**Problem:** Frontend and backend using different JWT secrets

**Check in Coolify:**
- Go to cohortle-api environment variables
- Find `JWT_SECRET`
- Make sure it's set and not empty

**If JWT_SECRET is missing or wrong:**
- Backend can't validate tokens created by... wait, the backend creates the tokens!
- So this shouldn't be the issue unless JWT_SECRET changed between login and API call

#### Cause 2: Token Middleware Issue
**Problem:** Backend's token middleware is rejecting valid tokens

**Check backend logs in Coolify:**
Look for errors like:
- "Invalid token"
- "Token expired"
- "Unauthorized"
- JWT verification errors

#### Cause 3: Cloudflare Interference
**Problem:** Cloudflare is stripping headers or cookies

**Cloudflare can cause issues with:**
- Cookies (if "Always Use HTTPS" redirects)
- Headers (if security settings are too strict)
- WebSocket connections (the localhost:8081 error you saw)

**To test if Cloudflare is the issue:**
1. Temporarily set Cloudflare to "DNS Only" (bypass proxy)
2. Test if auth works
3. If it works, Cloudflare was interfering

**Common Cloudflare fixes:**
- Disable "Always Use HTTPS" redirect (use Coolify's SSL instead)
- Check SSL/TLS mode is "Full" or "Full (strict)"
- Disable "Rocket Loader" (can break JavaScript)
- Check Page Rules aren't interfering

---

### Step 4: Manual Token Test

Let's test if the backend accepts tokens at all:

1. **Get a token manually:**
   ```bash
   curl -X POST https://api.cohortle.com/v1/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"YOUR_EMAIL","password":"YOUR_PASSWORD"}'
   ```

2. **Copy the token from the response**

3. **Test the programmes endpoint:**
   ```bash
   curl https://api.cohortle.com/v1/api/programmes/enrolled \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

**Expected result:**
```json
{"error":false,"message":"...","programmes":[]}
```

**If you get 403:**
- The backend's token middleware is broken
- Or the endpoint requires additional permissions

**If it works:**
- The backend is fine
- The problem is in how the frontend sends the token

---

### Step 5: Check Token Middleware

Let me check if there's a token middleware that validates requests:

