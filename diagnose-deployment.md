# Deployment Diagnosis - Multiple Issues Detected

## Issues Reported
1. ❌ Role detection broken (learner dashboard shows instead of convener)
2. ❌ Invalid links throughout the app
3. ❌ Create programme button routing incorrectly
4. ❌ Create programme form not working
5. ❌ API error: "Failed to load programmes - Request failed with status code 400"
6. ❌ Continue Learning button not visible (original issue)

## Root Cause Analysis

These symptoms suggest **the deployment didn't properly rebuild or the build is serving stale code**. The 400 error indicates a potential API mismatch or authentication issue.

## Immediate Actions Required

### 1. Check Deployment Logs
In your deployment platform (Coolify/Vercel/etc):
- Check if the build completed successfully
- Look for any build errors or warnings
- Verify the deployment is using commit `068c709`

### 2. Verify Environment Variables
The 400 error and routing issues suggest environment variables might be missing or incorrect:

**Required Environment Variables for cohortle-web:**
```
NEXT_PUBLIC_API_URL=https://api.cohortle.com
NEXT_PUBLIC_APP_URL=https://cohortle.com
```

**Check in your deployment platform:**
- Are these variables set correctly?
- Did they get cleared during the force deploy?

### 3. Clear All Caches
**Browser:**
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Or open in incognito mode

**CDN/Platform Cache:**
- If using Cloudflare or similar, purge the cache
- In Coolify, there might be a "Clear Cache" option

### 4. Check API Health
Visit: `https://api.cohortle.com/health` or `https://api.cohortle.com/v1/api/health`

Expected response:
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

If this fails, the API deployment has issues.

### 5. Rebuild from Scratch

**Option A: Trigger Clean Build in Deployment Platform**
1. Go to your deployment dashboard
2. Find "Rebuild" or "Redeploy" option
3. Enable "Clear build cache" if available
4. Deploy

**Option B: Manual Verification**
```bash
# In cohortle-web directory
git pull origin main
npm install
npm run build

# Check for build errors
# If successful, the build should complete without errors
```

## Specific Fixes for Each Issue

### Issue 1: Role Detection
**File:** `cohortle-web/src/middleware.ts`
**Check:** Authentication middleware should detect user role correctly

### Issue 2 & 3: Invalid Links / Routing
**Possible causes:**
- Base URL environment variable incorrect
- Next.js routing not properly built
- Missing pages in build output

### Issue 4: Create Programme Form
**File:** `cohortle-web/src/components/convener/ProgrammeForm.tsx`
**Check:** Form submission endpoint and validation

### Issue 5: API 400 Error
**Possible causes:**
- Authentication token invalid/expired
- API expecting different request format
- CORS issues
- API not deployed or crashed

**Debug steps:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to load programmes
4. Click on the failed request
5. Check:
   - Request URL
   - Request headers (especially Authorization)
   - Response body (error message)

## Quick Test Scripts

### Option 1: PowerShell Script (Comprehensive)
Run this from your project root:
```powershell
.\verify-production-status.ps1
```

This will test:
- API health endpoints
- Web application pages
- Git commit status
- Local code verification
- Environment variables

### Option 2: Browser Console Test (Quick)
1. Open https://cohortle.com in your browser
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Copy the contents of `test-production-browser.js`
5. Paste and press Enter

This will test:
- API connectivity
- Authentication status
- Programmes API
- Continue Learning button presence
- Next.js build info

## Expected vs Actual

### Expected After Deployment:
✅ Convener sees convener dashboard immediately
✅ All links work correctly
✅ Create programme button opens form
✅ Form submits successfully
✅ Programmes load without errors
✅ Continue Learning button visible on programme pages

### Actual (Current State):
❌ Shows learner dashboard first
❌ Links are invalid
❌ Create programme button goes wrong place
❌ Form doesn't work
❌ 400 error loading programmes
❌ No Continue Learning button

## Next Steps

1. **Check deployment logs** - Look for build errors
2. **Verify environment variables** - Especially API_URL
3. **Check API health** - Make sure backend is running
4. **Clear all caches** - Browser + CDN
5. **Trigger clean rebuild** - With cache clearing

## If Nothing Works

The nuclear option:
1. Delete the deployment
2. Create fresh deployment from scratch
3. Set all environment variables
4. Deploy clean

Would you like me to help with any specific step?
