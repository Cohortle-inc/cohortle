# Server Action Mismatch - Action Plan

## Current Status
- ✅ Dashboard fixes pushed to both repositories
- ✅ Git commits: 
  - `cohortle-api`: fb8d0eb (live sessions endpoint fix)
  - `cohortle-web`: d4056be (dashboard error handling)
- ❌ Server action mismatch error in production
- ❌ Cloudflare cache needs purging
- ❌ Coolify deployment needed

## Immediate Actions Required

### 1. Coolify Deployment (Most Urgent)
**Action**: Redeploy `cohortle-web` in Coolify
- Go to Coolify Dashboard
- Find "cohortle-web" service
- Click "Redeploy" 
- ✅ **CRITICAL**: Enable "Force Rebuild" option
- Wait for deployment to complete (2-3 minutes)

### 2. Cloudflare Cache Purge
**Action**: Manually purge Cloudflare cache
1. Log into Cloudflare Dashboard
2. Navigate to Caching → Configuration
3. Click "Purge Everything"
4. Confirm purge

### 3. User Communication
**Action**: Notify users to hard refresh
```
Users experiencing errors should:
1. Press Ctrl+Shift+R (Cmd+Shift+R on Mac) to hard refresh
2. Or clear browser cache completely
3. Or try incognito/private browsing mode
```

### 4. Verification Steps
After deployment, verify:
1. Run `.\verify-production-deployment.ps1`
2. Check browser console for `[Dashboard]` logs
3. Test dashboard sections work
4. Verify no server action errors

## Root Cause Analysis

### Problem
Server action ID mismatch between:
- Old client code (cached in browser/CDN)
- New server code (deployed)

### Solution Chain
1. **Force rebuild** in Coolify (breaks cache)
2. **Purge CDN** (Cloudflare)
3. **User cache busting** (hard refresh)

## Step-by-Step Instructions

### For Developers:
```bash
# 1. Verify current commit
cd cohortle-web
git log --oneline -1
# Should show: d4056be (dashboard error handling)

# 2. Check if any uncommitted changes
git status

# 3. Verify both repos are up to date
git pull origin main
```

### For Deployment (Coolify):
1. **Log into Coolify** dashboard
2. Find "cohortle-web" service
3. Click "Redeploy" 
4. ✅ **CRITICAL**: Check "Force Rebuild" option
5. Wait for deployment (2-3 minutes)
6. Check logs for errors

### For Cache Clearing:
1. **Cloudflare**: Purge everything
2. **User Browsers**: Hard refresh (Ctrl+Shift+R)
3. **Mobile Users**: Clear app cache or reinstall

## Verification Checklist

After deployment, verify:

### Backend (cohortle-api)
- [ ] `GET /v1/api/dashboard/upcoming-sessions` returns 200
- [ ] `GET /v1/api/dashboard/recent-activity` returns 200
- [ ] No 500 errors in backend logs

### Frontend (cohortle-web)
- [ ] Dashboard loads without console errors
- [ ] `[Dashboard]` logs appear in console
- [ ] Live sessions section shows (empty state or data)
- [ ] Recent activity section shows (empty state or data)
- [ ] No "Failed to find Server Action" errors

### User Experience
- [ ] Users can hard refresh (Ctrl+Shift+R)
- [ ] Dashboard loads within 3 seconds
- [ ] No "Server Action" errors in console

## Rollback Plan
If issues persist after 30 minutes:
1. **Immediate**: Check Coolify logs for build errors
2. **Fallback**: Revert to previous container image
3. **Communication**: Notify users of maintenance

## Communication Template

**To Users:**
"Some users may experience dashboard errors. Please:
1. Refresh with Ctrl+Shift+R (Cmd+Shift+R on Mac)
2. If error persists, clear browser cache
3. Try incognito/private browsing mode"

**To Team:**
"Server action mismatch detected. Deploying fix. Dashboard may be temporarily unavailable."

## Monitoring
- [ ] Error rate in logs
- [ ] Dashboard load times
- [ ] User reports of "Server Action" errors
- [ ] API response times

## Success Criteria
- [ ] No "Server Action" errors in logs
- [ ] Dashboard loads < 3 seconds
- [ ] All dashboard sections render
- [ ] No console errors in browser
- [ ] Users report no issues

## Timeline
1. **Now**: Deploy with Force Rebuild
2. **+5 min**: Verify deployment
3. **+10 min**: Test dashboard
4. **+15 min**: Verify no errors
5. **+30 min**: Full verification

## Rollback Procedure
If issues persist after 30 minutes:
1. Revert to previous container tag
2. Disable new features
3. Notify users of maintenance

## Contacts
- Developer: [Name] for deployment
- DevOps: [Name] for Coolify
- Support: [Name] for user communications

---

**Status**: Awaiting deployment
**Priority**: High
**ETA to Fix**: 30 minutes post-deployment