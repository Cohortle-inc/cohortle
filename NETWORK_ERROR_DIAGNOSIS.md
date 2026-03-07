# Network Error Diagnosis

## Issue
User reported: "A network error occurred"

## Current System Status

### Backend Health ✅
- API is running and responding: `https://api.cohortle.com/v1/api/health`
- Database connection is working
- Last successful operations visible in logs

### Recent Successful Operations (from logs)
1. ✅ User signup completed successfully
2. ✅ Welcome email sent via Resend
3. ✅ User added to Resend audience
4. ✅ Programme API responding (200 status)

### Potential Issues Identified

#### 1. Missing Environment Variables in `.env`
The local `.env` file was missing:
- `FRONTEND_URL` - Required for email verification links
- `RESEND_API_KEY` - Required for sending emails

**Status**: ✅ FIXED - Added to `.env` file

**Action Required**: These must also be set in Coolify production environment:
```
FRONTEND_URL=https://cohortle.com
RESEND_API_KEY=<your-actual-resend-api-key>
```

#### 2. Network Error Possibilities

The "network error" could be caused by:

**A. Frontend API Call Failures**
- CORS issues between frontend and backend
- Timeout on slow connections
- Invalid API endpoint URLs

**B. Authentication Token Issues**
- Expired or invalid JWT token
- Cookie not being sent with requests
- Token refresh failing

**C. Browser/Client Issues**
- Browser blocking cookies
- Ad blocker interfering with requests
- Network connectivity problems

## Diagnostic Steps

### Step 1: Check Production Environment Variables
```powershell
# SSH into production server or check Coolify UI
# Verify these are set:
FRONTEND_URL=https://cohortle.com
RESEND_API_KEY=<actual-key>
CONVENER_INVITATION_CODE=COHORTLE_CONVENER_2024
NEXT_PUBLIC_API_URL=https://api.cohortle.com
```

### Step 2: Test API Endpoints
```powershell
# Test backend health
Invoke-WebRequest -Uri "https://api.cohortle.com/v1/api/health" -Method GET

# Test login
$body = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://api.cohortle.com/v1/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

### Step 3: Check Browser Console
When the network error occurs:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for error messages
4. Go to Network tab
5. Check which request failed
6. Look at the request/response details

### Step 4: Check Frontend Logs
```powershell
# Check Coolify logs for cohortle-web
# Look for:
# - Failed API calls
# - CORS errors
# - Timeout errors
```

## Common Solutions

### Solution 1: Clear Browser Cache and Cookies
```
1. Open browser settings
2. Clear browsing data
3. Select "Cookies and other site data"
4. Select "Cached images and files"
5. Clear data
6. Try again
```

### Solution 2: Verify Coolify Environment Variables
```
1. Log into Coolify
2. Go to cohortle-api service
3. Check Environment Variables section
4. Ensure FRONTEND_URL and RESEND_API_KEY are set
5. Restart the service if you made changes
```

### Solution 3: Check CORS Configuration
The backend should allow requests from `https://cohortle.com`. Check `cohortle-api/app.js` for CORS settings.

### Solution 4: Test with Different Browser
Try accessing the site with:
- Chrome (incognito mode)
- Firefox (private window)
- Edge
- Safari

This helps identify if it's a browser-specific issue.

## Next Steps

1. **Immediate**: Set missing environment variables in Coolify production
2. **Diagnostic**: Get specific error details from browser console
3. **Testing**: Try the diagnostic steps above to isolate the issue

## Questions to Ask User

1. What action were you trying to perform when the network error occurred?
   - Login?
   - Signup?
   - Accessing a specific page?
   - Submitting a form?

2. What does the browser console show?
   - Any red error messages?
   - Failed network requests?
   - Status codes?

3. Does the error occur:
   - Every time?
   - Only on specific pages?
   - Only for specific actions?

4. What browser and device are you using?

## Files Updated
- `cohortle-api/.env` - Added FRONTEND_URL and RESEND_API_KEY placeholders
