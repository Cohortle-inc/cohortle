# Login & Signup Troubleshooting Guide

## Current Status
All fixes have been deployed:
- ✅ Token validation fix (middleware checks for undefined token)
- ✅ Password field fix (login includes password in query)
- ✅ Invitation code system (convener signup requires code)
- ✅ Role-based redirect (conveners → /convener/dashboard, students → /dashboard)
- ✅ Signup passes invitation code and returns role

## Most Likely Issues

### 1. Browser Cache (MOST COMMON)
The browser may have cached the old broken code.

**Solution:**
1. Open DevTools (F12)
2. Go to Application tab → Storage → Clear site data
3. Or try Incognito/Private mode
4. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### 2. Deployment Still in Progress
Coolify may still be deploying the middleware fix.

**Check:**
1. Go to Coolify dashboard
2. Check cohortle-web deployment status
3. Look for "Running" status (not "Building" or "Deploying")
4. Wait 2-5 minutes after last commit

### 3. Specific Error Not Identified
Need to see the actual error from browser console.

**Get Error Details:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Clear console
4. Try to login/signup
5. Copy ALL error messages (especially red ones)
6. Share the error messages

## Step-by-Step Debugging

### For Login Issues:

1. **Clear Browser Data**
   ```
   - Open DevTools (F12)
   - Application → Storage → Clear site data
   - Close and reopen browser
   ```

2. **Test in Incognito Mode**
   ```
   - Open new incognito/private window
   - Go to https://cohortle.com/login
   - Try logging in
   ```

3. **Check Console for Errors**
   ```
   - F12 → Console tab
   - Look for red error messages
   - Common errors:
     * "Failed to fetch" → Network issue
     * "Cannot read properties of undefined" → Token validation issue
     * "401 Unauthorized" → Wrong credentials
     * "Network error" → CORS or backend down
   ```

4. **Check Network Tab**
   ```
   - F12 → Network tab
   - Try logging in
   - Look for /api/auth/login request
   - Check:
     * Status code (should be 200 for success, 401 for wrong password)
     * Response body (shows error message)
     * Request payload (verify email/password sent)
   ```

5. **Check Cookies**
   ```
   - F12 → Application → Cookies → https://cohortle.com
   - After login, should see "auth_token" cookie
   - If missing, cookie is not being set
   ```

### For Signup Issues:

1. **Student Signup (No Invitation Code)**
   ```
   - Should work without any code
   - Automatically assigned "student" role
   - Redirects to /dashboard
   ```

2. **Convener Signup (Requires Invitation Code)**
   ```
   - Must provide invitation code
   - Current code: COHORTLE_CONVENER_2024
   - Redirects to /convener/dashboard
   ```

3. **Common Signup Errors**
   ```
   - "Email already in use" → Account exists, try login
   - "Invalid invitation code" → Wrong convener code
   - "Invitation code required" → Convener selected but no code
   ```

## Testing Commands

### Test Backend Login Endpoint
```powershell
$body = @{
    email = "your-email@example.com"
    password = "your-password"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://api.cohortle.com/v1/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

### Test Backend Signup Endpoint
```powershell
$body = @{
    email = "test@example.com"
    password = "TestPassword123"
    first_name = "Test"
    last_name = "User"
    role = "student"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://api.cohortle.com/v1/api/auth/register-email" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

## What to Check in Coolify

1. **Frontend (cohortle-web) Logs**
   ```
   - Look for middleware errors
   - Check for "Failed to validate token" messages
   - Verify deployment completed successfully
   ```

2. **Backend (cohortle-api) Logs**
   ```
   - Look for login/signup requests
   - Check for bcrypt errors
   - Verify database connection
   ```

3. **Environment Variables**
   ```
   Frontend (cohortle-web):
   - NEXT_PUBLIC_API_URL=https://api.cohortle.com
   
   Backend (cohortle-api):
   - FRONTEND_URL=https://cohortle.com
   - JWT_SECRET=(should be set)
   - CONVENER_INVITATION_CODE=COHORTLE_CONVENER_2024
   - RESEND_API_KEY=(should be set)
   ```

## Expected Behavior

### Successful Login Flow:
1. User enters email/password
2. Frontend calls /api/auth/login
3. Frontend calls backend /v1/api/auth/login
4. Backend validates credentials
5. Backend returns token + user data (including role)
6. Frontend sets auth_token cookie
7. Frontend redirects based on role:
   - student → /dashboard
   - convener → /convener/dashboard

### Successful Signup Flow:
1. User enters details + selects role
2. If convener, enters invitation code
3. Frontend calls /api/auth/signup
4. Frontend calls backend /v1/api/auth/register-email
5. Backend validates invitation code (if convener)
6. Backend creates user with role
7. Backend returns token + user data (including role)
8. Frontend sets auth_token cookie
9. Frontend redirects based on role

## Next Steps

If issue persists after trying above:

1. **Provide Browser Console Errors**
   - Copy all red error messages
   - Include full error stack trace

2. **Check Coolify Deployment Status**
   - Verify cohortle-web is "Running"
   - Check deployment timestamp

3. **Test with curl/PowerShell**
   - Verify backend endpoints work directly
   - Isolate if issue is frontend or backend

4. **Check for Specific Error Patterns**
   - Token validation errors → Middleware issue
   - 401 errors → Credentials or backend issue
   - Network errors → CORS or connectivity issue
   - Cookie not set → Frontend API route issue
