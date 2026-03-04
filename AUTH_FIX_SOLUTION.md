# 🎯 FOUND THE PROBLEM! Authentication Fix

## The Issue

Your `/v1/api/programmes/enrolled` endpoint has this middleware:

```javascript
TokenMiddleware({ role: "learner" })
```

This means **ONLY users with role="learner" can access it**.

If you logged in with a user that has:
- `role: "convener"` → 403 Forbidden ❌
- `role: "unassigned"` → 403 Forbidden ❌  
- `role: null` → 403 Forbidden ❌
- `role: "learner"` → Works ✅

---

## Quick Test

**In browser console on https://cohortle.com:**

```javascript
// Check what role your current user has
fetch('/api/auth/token')
  .then(r => r.json())
  .then(data => console.log('Your role:', data.role))
```

If it returns anything other than "learner", that's why you're getting 403.

---

## The Fix

You have 3 options:

### Option 1: Login as a Learner (Quick Test)

1. Logout
2. Signup with a NEW account
3. When asked for role, select **"Learner"**
4. Login
5. Try accessing dashboard

This should work immediately.

### Option 2: Update Your Existing User's Role (Database Fix)

If you want to keep your current account:

1. Go to phpMyAdmin or your database tool
2. Find the `users` table
3. Find your user by email
4. Update the `role` column to `"learner"`
5. Logout and login again

### Option 3: Fix the Endpoint (Code Fix)

If you want BOTH learners and conveners to access this endpoint:

**Change this line in `cohortle-api/routes/programme.js`:**

```javascript
// OLD (line 54):
[UrlMiddleware, TokenMiddleware({ role: "learner" })],

// NEW:
[UrlMiddleware, TokenMiddleware({ role: "learner|convener" })],
```

Then redeploy the backend.

---

## About Your DB_HOSTNAME

**Your value:** `u08gs4kgcogg8kc4k44s0ggk`

✅ **This is CORRECT!**

This is Coolify's internal Docker network hostname for your database. Since your health check works and returns database time, the connection is fine.

---

## About Cloudflare

Cloudflare DNS management is fine and shouldn't cause issues. However, if Cloudflare is **proxying** your traffic (orange cloud icon), it can sometimes interfere with:

- Cookies
- WebSocket connections (the localhost:8081 error you saw)
- Custom headers

**Recommended Cloudflare settings:**
- SSL/TLS mode: **Full (strict)**
- Always Use HTTPS: **On**
- Rocket Loader: **Off** (can break Next.js)
- Auto Minify: **Off** (can break JavaScript)

The WebSocket error (`ws://localhost:8081/`) is harmless - it's just Next.js hot-reload trying to connect in development mode. Ignore it in production.

---

## Summary

**Your MVP isn't working because:**
1. ✅ Backend is healthy
2. ✅ Frontend is deployed
3. ✅ Database is connected
4. ✅ Auth flow works (cookies are set)
5. ❌ **Your user's role doesn't match the endpoint requirement**

**The fix:**
- Login as a learner, OR
- Change your user's role to "learner" in the database, OR
- Update the endpoint to allow multiple roles

**Test this:**
1. Create a NEW account
2. Select "Learner" as role during signup
3. Login
4. Go to dashboard
5. It should work!

---

## Next Steps

1. **Test with a learner account** (quickest way to verify)
2. **Check Coolify logs** to see the actual error message
3. **Report back** what role your current user has

Would you like me to help you:
- Create a script to update your user's role?
- Modify the endpoint to allow both roles?
- Set up proper role-based access control?
