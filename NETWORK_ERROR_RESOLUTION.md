# Network Error Resolution Guide

## Current System Status: ✅ ALL SYSTEMS OPERATIONAL

I've tested all critical endpoints and everything is working correctly:
- ✅ Backend API is healthy and responding
- ✅ Frontend is accessible
- ✅ Login endpoint is working
- ✅ Authentication is functioning
- ✅ CORS is properly configured
- ✅ Database connection is active

## What Was Fixed

### 1. Environment Variables Added to `.env`
Added missing environment variables to `cohortle-api/.env`:
- `FRONTEND_URL=https://cohortle.com` - Required for email verification links
- `RESEND_API_KEY=your-resend-api-key-here` - Required for sending emails

**⚠️ IMPORTANT**: These must also be set in Coolify production environment!

## Action Required: Update Coolify Environment Variables

### Step 1: Set Backend Environment Variables in Coolify

1. Log into Coolify
2. Navigate to `cohortle-api` service
3. Go to "Environment Variables" section
4. Add/verify these variables:

```bash
FRONTEND_URL=https://cohortle.com
RESEND_API_KEY=<your-actual-resend-api-key-from-resend.com>
CONVENER_INVITATION_CODE=COHORTLE_CONVENER_2024
```

5. Click "Save"
6. Restart the `cohortle-api` service

### Step 2: Set Frontend Environment Variables in Coolify

1. Navigate to `cohortle-web` service
2. Go to "Environment Variables" section
3. Verify this variable:

```bash
NEXT_PUBLIC_API_URL=https://api.cohortle.com
```

4. Click "Save"
5. Restart the `cohortle-web` service if you made changes

## Troubleshooting Network Errors

If you're still experiencing network errors after setting the environment variables, follow these steps:

### Step 1: Identify the Specific Error

1. Open the browser where you're experiencing the error
2. Press F12 to open Developer Tools
3. Go to the "Console" tab
4. Try to reproduce the error
5. Look for red error messages
6. Take a screenshot or copy the error message

### Step 2: Check Network Tab

1. In Developer Tools, go to "Network" tab
2. Try to reproduce the error
3. Look for failed requests (shown in red)
4. Click on the failed request
5. Check:
   - Request URL
   - Status Code
   - Response (if any)
   - Headers

### Step 3: Common Network Error Causes

#### A. CORS Error
**Symptoms**: Console shows "CORS policy" error
**Solution**: Backend CORS is already configured correctly. This shouldn't be the issue.

#### B. 401 Unauthorized
**Symptoms**: Requests return 401 status
**Solution**: 
- Clear browser cookies
- Log out and log back in
- Token may have expired

#### C. 500 Internal Server Error
**Symptoms**: Requests return 500 status
**Solution**:
- Check Coolify logs for backend errors
- Verify environment variables are set
- Check database connection

#### D. Network Timeout
**Symptoms**: Request takes too long and fails
**Solution**:
- Check internet connection
- Try from different network
- Check if Coolify server is under heavy load

#### E. 404 Not Found
**Symptoms**: Requests return 404 status
**Solution**:
- Verify the API endpoint URL is correct
- Check if the route exists in backend

### Step 4: Browser-Specific Issues

Try these steps:
1. Clear browser cache and cookies
2. Try in incognito/private mode
3. Try a different browser
4. Disable browser extensions (especially ad blockers)

### Step 5: Check Coolify Logs

1. Log into Coolify
2. Go to `cohortle-api` service
3. Click "Logs"
4. Look for error messages around the time of the network error
5. Do the same for `cohortle-web` service

## Testing Scripts

### Test Production Status
Run this PowerShell script to verify all endpoints:
```powershell
./test-production-status.ps1
```

### Test Specific Functionality

#### Test Login
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

#### Test Signup
```powershell
$body = @{
    email = "newuser@example.com"
    password = "password123"
    first_name = "Test"
    last_name = "User"
    role = "student"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://api.cohortle.com/v1/api/auth/register-email" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

## What to Report

If the network error persists, please provide:

1. **Exact error message** from browser console
2. **What action** you were trying to perform
3. **Browser and device** you're using
4. **Screenshot** of the error (if possible)
5. **Network tab** details of the failed request
6. **When** the error started occurring

## Quick Fixes Checklist

- [ ] Set `FRONTEND_URL` in Coolify for cohortle-api
- [ ] Set `RESEND_API_KEY` in Coolify for cohortle-api
- [ ] Restart cohortle-api service in Coolify
- [ ] Clear browser cache and cookies
- [ ] Try in incognito/private mode
- [ ] Check browser console for specific errors
- [ ] Check Coolify logs for backend errors

## System Architecture

```
Browser (cohortle.com)
    ↓
Frontend (Next.js on Coolify)
    ↓
API Proxy (/api/proxy/*)
    ↓
Backend API (api.cohortle.com)
    ↓
MySQL Database (Docker container)
```

Network errors can occur at any point in this chain. The diagnostic steps above will help identify where the issue is.

## Contact Information

If you need further assistance:
1. Provide the information listed in "What to Report" section
2. Include results from running `test-production-status.ps1`
3. Include any relevant Coolify logs

## Files Created/Updated

- ✅ `cohortle-api/.env` - Added FRONTEND_URL and RESEND_API_KEY
- ✅ `test-production-status.ps1` - Production testing script
- ✅ `NETWORK_ERROR_DIAGNOSIS.md` - Detailed diagnostic guide
- ✅ `NETWORK_ERROR_RESOLUTION.md` - This file
