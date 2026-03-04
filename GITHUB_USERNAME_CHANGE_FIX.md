# GitHub Username Change - Deployment Fix Guide

## Problem
After changing GitHub username from `cohortle-inc` to `Cohortle-inc`, deployments are experiencing:
- Server Action errors ("Failed to find Server Action 'x'")
- Build cache mismatches
- Stale deployment references

## Root Cause
1. **Git remote URLs** still point to old username (lowercase)
2. **Coolify configuration** may reference old repository URL
3. **Docker build cache** contains layers from old repository reference
4. **Next.js build cache** has stale Server Action manifests

## Complete Fix Process

### Step 1: Update Local Git Remotes

```powershell
# Navigate to cohortle-web
cd cohortle-web
git remote set-url origin https://github.com/Cohortle-inc/cohortle-web.git
git remote -v  # Verify the change

# Navigate to cohortle-api
cd ../cohortle-api
git remote set-url origin https://github.com/Cohortle-inc/cohortle-api.git
git remote -v  # Verify the change
```

### Step 2: Update Coolify Configuration

1. **Log into Coolify Dashboard**

2. **Update cohortle-web Service**:
   - Go to Resources → cohortle-web
   - Click "Configuration" or "Source"
   - Update Git Repository URL to: `https://github.com/Cohortle-inc/cohortle-web.git`
   - Save changes

3. **Update cohortle-api Service**:
   - Go to Resources → cohortle-api
   - Click "Configuration" or "Source"
   - Update Git Repository URL to: `https://github.com/Cohortle-inc/cohortle-api.git`
   - Save changes

### Step 3: Clean Coolify Build Cache

For **cohortle-web**:
1. Go to cohortle-web service in Coolify
2. Click "Redeploy"
3. **Enable "Force rebuild without cache"** option
4. Click "Deploy"

For **cohortle-api**:
1. Go to cohortle-api service in Coolify
2. Click "Redeploy"
3. **Enable "Force rebuild without cache"** option
4. Click "Deploy"

### Step 4: Clear Application Caches

After successful deployment, SSH into containers and clear caches:

```bash
# For cohortle-web (if needed)
docker exec -it <cohortle-web-container-id> sh
rm -rf /app/.next/cache/*
exit

# Restart the container
docker restart <cohortle-web-container-id>
```

### Step 5: Clear CDN Cache

```powershell
# Run from workspace root
.\purge-cloudflare-cache.ps1
```

Or manually in Cloudflare:
1. Go to Cloudflare Dashboard
2. Select your domain
3. Caching → Configuration
4. Click "Purge Everything"

### Step 6: Update GitHub Webhooks (if using)

If Coolify uses webhooks for auto-deployment:

1. Go to GitHub → Settings → Webhooks
2. Check if webhook URLs reference old username
3. Update or recreate webhooks if needed

### Step 7: Verify Deployment

```powershell
# Test the deployment
.\verify-production-deployment.ps1
```

Check:
- [ ] No Server Action errors in browser console
- [ ] All pages load correctly
- [ ] API endpoints respond properly
- [ ] No 404s for static assets

## Prevention for Future

### Always Update All References When Changing GitHub Username:

1. **Local Git Remotes**
   ```bash
   git remote set-url origin <new-url>
   ```

2. **CI/CD Configurations**
   - Coolify
   - GitHub Actions
   - Any other deployment tools

3. **Documentation**
   - README files
   - Deployment guides
   - Environment setup docs

4. **Clear All Caches**
   - Force rebuild without cache
   - Clear CDN cache
   - Clear browser cache

## Quick Commands Reference

```powershell
# Update git remotes
cd cohortle-web
git remote set-url origin https://github.com/Cohortle-inc/cohortle-web.git

cd ../cohortle-api
git remote set-url origin https://github.com/Cohortle-inc/cohortle-api.git

# Verify changes
git remote -v

# Push to verify connection
git push

# Clear Cloudflare cache
.\purge-cloudflare-cache.ps1
```

## Troubleshooting

### If Server Action Error Persists:
1. Hard refresh browser: `Ctrl + Shift + R`
2. Clear browser cache completely
3. Test in incognito/private window
4. Check Coolify logs for build errors

### If Deployment Fails:
1. Check Coolify logs for specific errors
2. Verify GitHub repository is accessible
3. Check if GitHub redirects are working
4. Ensure deploy keys/tokens are still valid

### If API Calls Fail:
1. Verify backend is running: `.\test-backend-health.ps1`
2. Check environment variables in Coolify
3. Verify database connection
4. Check API logs for errors

## Related Files
- `cohortle-web/next.config.mjs` - Build configuration
- `DEPLOYMENT_CACHE_FIX.md` - Cache-specific fixes
- `purge-cloudflare-cache.ps1` - CDN cache clearing
- `verify-production-deployment.ps1` - Deployment verification
