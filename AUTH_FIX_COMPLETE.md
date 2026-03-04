# Authentication Fix Complete

**Date:** February 21, 2026  
**Issue:** Login and signup were failing with "Invalid email or password" and "Failed to create account"

## Root Cause

The frontend was calling incorrect API endpoints that didn't match the backend:

### Frontend was calling:
- `POST /api/auth/register` ❌
- `POST /api/auth/login` ❌
- `GET /api/user/profile` ❌

### Backend actually expects:
- `POST /v1/api/auth/register-email` ✅
- `POST /v1/api/auth/login` ✅
- `GET /v1/api/profile` ✅

## Changes Made

### 1. Fixed Registration Endpoint (`src/lib/api/auth.ts`)
**Before:**
```typescript
await apiClient.post('/api/auth/register', data);
```

**After:**
```typescript
await apiClient.post('/v1/api/auth/register-email', {
  email: data.email,
  password: data.password,
  first_name: data.username.split(' ')[0] || data.username,
  last_name: data.username.split(' ')[1] || '',
});
```

**Why:** Backend expects `first_name` and `last_name` instead of `username`, and uses `/register-email` endpoint.

### 2. Fixed Login Endpoint (`src/lib/api/auth.ts`)
**Before:**
```typescript
await apiClient.post('/api/auth/login', data);
```

**After:**
```typescript
await apiClient.post('/v1/api/auth/login', data);
```

**Why:** Backend uses `/v1/api/auth/login` prefix.

### 3. Fixed Response Handling
Backend returns:
```json
{
  "error": false,
  "message": "login successfully",
  "token": "jwt_token_here",
  "user": { "id": 123, "email": "user@example.com", "role": "student" }
}
```

Frontend now checks for `error` field and extracts data correctly.

### 4. Fixed Profile Endpoint (`src/lib/contexts/AuthContext.tsx`)
**Before:**
```typescript
fetch('/api/user/profile')
```

**After:**
```typescript
fetch('/v1/api/profile')
```

### 5. Fixed Password Reset Endpoints
- Forgot password: `/v1/api/auth/forgot-password`
- Reset password: `/v1/api/auth/reset-password`

## Testing Instructions

Once Coolify redeploys (2-5 minutes), test:

### 1. Signup Flow
1. Go to https://cohortle.com/signup
2. Enter email, username, password
3. Click "Sign Up"
4. Should see success message
5. Should redirect to login page

### 2. Login Flow
1. Go to https://cohortle.com/login
2. Enter email and password from signup
3. Click "Log In"
4. Should redirect to dashboard
5. Should see your programmes

### 3. Token Persistence
1. After logging in, refresh the page
2. Should stay logged in (not redirect to login)
3. Check browser localStorage for `auth_token`

### 4. Logout
1. Click logout button (if available)
2. Should redirect to login page
3. Token should be cleared from localStorage

## Expected Behavior

### Successful Signup
- ✅ Account created in database
- ✅ Token returned
- ✅ Success message shown
- ✅ Redirect to login page

### Successful Login
- ✅ Token stored in localStorage
- ✅ User data fetched from profile endpoint
- ✅ Redirect to dashboard
- ✅ Dashboard shows user's programmes

### Token Validation
- ✅ On page load, token is validated
- ✅ If valid, user stays logged in
- ✅ If invalid, user is redirected to login

## Known Limitations

1. **Email Verification:** Backend has email verification disabled (commented out), so users can login immediately after signup.

2. **User Profile:** Backend profile endpoint returns `first_name` and `last_name`, but frontend expects `username` and `name`. We map these fields in the AuthContext.

3. **Logout Endpoint:** Backend doesn't have a logout endpoint (JWT tokens are stateless), so we just clear the local token.

## Next Steps

1. **Wait for deployment** (Coolify should auto-deploy in 2-5 minutes)
2. **Test signup and login** with the instructions above
3. **If it works:** Move on to testing the lesson viewer
4. **If it doesn't work:** Check browser console for errors and report back

## Deployment Status

- ✅ Code committed
- ✅ Code pushed to GitHub
- ⏳ Waiting for Coolify to rebuild
- ⏳ Waiting for deployment to complete

Check Coolify dashboard for deployment progress.

## Troubleshooting

### If signup still fails:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to signup
4. Look for the `/v1/api/auth/register-email` request
5. Check the response - what error message does it show?

### If login still fails:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to login
4. Look for the `/v1/api/auth/login` request
5. Check the response - what error message does it show?

### If token doesn't persist:
1. Open browser DevTools (F12)
2. Go to Application tab → Local Storage
3. Check if `auth_token` is stored
4. If not, there's an issue with token storage

## Files Changed

- `cohortle-web/src/lib/api/auth.ts` - Fixed API endpoints and response handling
- `cohortle-web/src/lib/contexts/AuthContext.tsx` - Fixed profile endpoint and user data mapping

## Commit

```
fix: correct API endpoints for authentication to match backend
```

Pushed to: `main` branch
