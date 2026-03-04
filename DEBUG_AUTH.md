# Authentication Debug Report

**Date:** February 21, 2026  
**Issue:** Login and signup still not working after API endpoint fixes

## Current Status

### Frontend (✅ Working)
- **URL:** https://cohortle.com
- **Status:** Site loads correctly
- **Deployment:** Latest changes deployed successfully

### Backend API (❓ Unknown)
- **URL:** https://api.cohortle.com
- **Status:** Responding but can't test endpoints directly
- **Health endpoint:** `/v1/api/health` exists but returns JSON (can't fetch via browser)

## Debugging Steps

### 1. Check Browser Console
**Action needed:** Open browser DevTools and check for errors

1. Go to https://cohortle.com/signup
2. Open DevTools (F12)
3. Go to Console tab
4. Try to sign up
5. Look for error messages

### 2. Check Network Tab
**Action needed:** Monitor API requests

1. Go to https://cohortle.com/signup
2. Open DevTools (F12)
3. Go to Network tab
4. Try to sign up
5. Look for the `/v1/api/auth/register-email` request
6. Check what response it returns

### 3. Test API Directly
**Action needed:** Use curl or Postman to test

```bash
# Test health endpoint
curl https://api.cohortle.com/v1/api/health

# Test signup
curl -X POST https://api.cohortle.com/v1/api/auth/register-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "first_name": "Test",
    "last_name": "User"
  }'

# Test login
curl -X POST https://api.cohortle.com/v1/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

## Possible Issues

### 1. CORS (Cross-Origin Resource Sharing)
**Symptoms:** 
- Frontend can't make requests to API
- Console shows CORS errors
- Network tab shows failed requests

**Solution:** Backend needs CORS headers for https://cohortle.com

### 2. Backend Not Running
**Symptoms:**
- All API requests fail
- Health endpoint doesn't respond
- Connection refused errors

**Solution:** Check Coolify backend deployment

### 3. Database Connection
**Symptoms:**
- API responds but returns 500 errors
- Health endpoint fails
- "Database connection" errors

**Solution:** Check database configuration

### 4. Environment Variables
**Symptoms:**
- API responds but JWT/auth fails
- Missing configuration errors
- "JWT_SECRET" or similar errors

**Solution:** Check environment variables in Coolify

### 5. Wrong API URL
**Symptoms:**
- 404 errors on all endpoints
- API not found

**Current config:** `NEXT_PUBLIC_API_URL=https://api.cohortle.com`
**Check:** Is this the correct URL?

## Next Steps

### Immediate (Do Now)
1. **Test in browser console** - See what errors appear
2. **Check network requests** - See if API calls are being made
3. **Test one API endpoint** - Use curl to test health endpoint

### If API is down
1. Check Coolify backend deployment status
2. Check backend logs in Coolify
3. Restart backend service if needed

### If API is up but auth fails
1. Check CORS configuration
2. Check environment variables
3. Check database connection
4. Test with curl to isolate frontend vs backend issues

## Expected Behavior

### Successful Signup
1. Frontend sends POST to `/v1/api/auth/register-email`
2. Backend creates user in database
3. Backend returns `{ error: false, token: "...", message: "..." }`
4. Frontend stores token and shows success

### Successful Login
1. Frontend sends POST to `/v1/api/auth/login`
2. Backend validates credentials
3. Backend returns `{ error: false, token: "...", user: {...} }`
4. Frontend stores token and redirects to dashboard

## Test Commands

```bash
# Quick health check
curl -i https://api.cohortle.com/v1/api/health

# Test signup (replace with real email)
curl -i -X POST https://api.cohortle.com/v1/api/auth/register-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"password123","first_name":"Test","last_name":"User"}'

# Test login (use same email/password from signup)
curl -i -X POST https://api.cohortle.com/v1/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"password123"}'
```

## Files to Check

If API is working but frontend isn't:
- `cohortle-web/src/lib/api/auth.ts` - API functions
- `cohortle-web/src/lib/api/client.ts` - API client config
- `cohortle-web/src/lib/contexts/AuthContext.tsx` - Auth context
- `cohortle-web/src/components/auth/LoginForm.tsx` - Login form
- `cohortle-web/src/components/auth/SignupForm.tsx` - Signup form

## Environment Variables to Check

In Coolify for cohortle-web:
- `NEXT_PUBLIC_API_URL=https://api.cohortle.com`

In Coolify for cohortle-api:
- `JWT_SECRET` - For token signing
- `DATABASE_URL` - Database connection
- `FRONTEND_URL` - For CORS (should be https://cohortle.com)