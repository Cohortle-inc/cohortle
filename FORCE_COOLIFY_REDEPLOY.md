# Force Coolify to Deploy Latest Commit

## Current Status
- ✅ Latest commit: `7c22f29` - "fix: add comprehensive dynamic rendering config to prevent static export errors"
- ✅ Pushed to GitHub: origin/main
- ✅ All fixes applied:
  - `export const dynamic = 'force-dynamic'` in all auth pages
  - `export const dynamicParams = true` to allow dynamic routes
  - `export const revalidate = 0` to disable caching
  - `import dynamicImport` renamed to avoid conflict
- ⚠️ Coolify needs to deploy this latest commit

## Problem
Coolify is stuck on commit `1e78c61` which has the profile fix but still has the naming conflict in `/programmes/[id]/page.tsx`. We need to force it to pull and deploy commit `97d0eef`.

## Solution: Force Coolify to Deploy Latest Commit

### Step 1: Access Coolify Dashboard
1. Go to your Coolify dashboard
2. Navigate to the `cohortle-web` application

### Step 2: Force Rebuild with Cache Clear
Choose ONE of these methods:

#### Method A: Force Rebuild (Recommended)
1. Click on the "Deployments" or "Deploy" section
2. Look for "Force Rebuild" or "Redeploy" button
3. **IMPORTANT**: Enable these options if available:
   - ✅ "Clear build cache"
   - ✅ "Force rebuild"
   - ✅ "Pull latest from Git"
4. Click "Deploy" or "Redeploy"

#### Method B: Manual Git Pull
1. Go to the "Source" or "Git" settings
2. Click "Pull Latest" or "Sync with Git"
3. Verify it shows commit `97d0eef`
4. Then click "Deploy"

#### Method C: Restart from Scratch
1. Go to "Settings" or "Advanced"
2. Click "Clear Build Cache" or "Reset Build"
3. Then trigger a new deployment

### Step 3: Monitor Build Logs
Watch the build logs for:
1. ✅ Correct commit hash: `7c22f29`
2. ✅ Build completes without errors
3. ✅ No "dynamic naming conflict" errors
4. ✅ No CSS file errors
5. ✅ No "Export encountered errors" messages

Expected successful output:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (X/X)
✓ Finalizing page optimization
```

### Step 4: Verify Deployment
After build completes, run:
```powershell
.\verify-production-deployment.ps1
```

Expected output:
- Commit hash: `7c22f29`
- Status: 200 OK
- No errors in logs

### Step 5: Purge Cloudflare Cache
After successful deployment:
```powershell
.\purge-cloudflare-cache.ps1
```

Or manually in Cloudflare dashboard:
1. Go to Caching → Configuration
2. Click "Purge Everything"
3. Confirm purge

## Troubleshooting

### If Coolify Still Shows Old Commit
1. Check Git configuration in Coolify:
   - Repository: `Cohortle-inc/cohortle-web`
   - Branch: `main`
   - Ensure no branch locks or pinned commits
   - Latest commit should be `7c22f29`

2. Check deployment settings:
   - Ensure "Auto Deploy" is enabled
   - Check if there's a commit hash pinned in settings

3. Try disconnecting and reconnecting the Git repository:
   - Go to Source settings
   - Disconnect GitHub
   - Reconnect and select `Cohortle-inc/cohortle-web`
   - Select `main` branch

### If Build Still Fails
1. Check the exact error in build logs
2. Verify the commit hash being built (should be `7c22f29`)
3. If it's an older commit, the Git pull didn't work
4. See [STATIC_EXPORT_FIX_COMPLETE.md](./STATIC_EXPORT_FIX_COMPLETE.md) for details on the latest fix

### If Multiple Containers Are Running
1. Go to "Containers" or "Services" section
2. Stop all old containers
3. Keep only the latest deployment running

## Verification Checklist

After deployment, verify:
- [ ] Build logs show commit `7c22f29`
- [ ] Build completes successfully (no errors)
- [ ] No "Export encountered errors" messages
- [ ] Only one container is running
- [ ] Production site loads without errors
- [ ] `/profile` page works (no CSS error, no export error)
- [ ] `/programmes/[id]` page works (no naming conflict)
- [ ] Cloudflare cache is purged
- [ ] Browser hard refresh shows new version

## Expected Timeline
- Git pull: ~10 seconds
- Build process: 3-5 minutes
- Container startup: 30 seconds
- Cache propagation: 1-2 minutes

Total: ~5-8 minutes for full deployment

## Next Steps After Successful Deployment
1. Test authentication flow
2. Test programme pages
3. Test profile page
4. Monitor error logs for any issues
5. Inform users to hard refresh if they see errors

## Emergency Rollback
If the new deployment causes issues:
1. Go to Coolify "Deployments" history
2. Find the last working deployment
3. Click "Redeploy" on that version
4. Investigate the issue before trying again

## Related Files
- `STATIC_EXPORT_FIX_COMPLETE.md` - Latest fix for export errors
- `BUILD_ERROR_FIX_COMPLETE.md` - Details on the previous fixes
- `SERVER_ACTION_MISMATCH_FIX.md` - Original issue documentation
- `verify-production-deployment.ps1` - Verification script
- `purge-cloudflare-cache.ps1` - Cache purge script
