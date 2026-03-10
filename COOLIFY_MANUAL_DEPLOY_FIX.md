# Coolify Manual Deploy Not Picking Up New Commits

## Problem
You're manually deploying in Coolify, but it keeps deploying the old commit (`96bc30d`) instead of your latest commits.

## Root Cause
Coolify has cached the repository or isn't pulling the latest changes from GitHub.

## Solutions (Try in Order)

### Solution 1: Force Pull Latest Code (Fastest)

In Coolify dashboard:

1. Go to your application (cohortle-api or cohortle-web)
2. Click "Settings" or "Source"
3. Look for "Force Pull" or "Clear Cache" button
4. Click it to force Coolify to pull latest from GitHub
5. Then click "Deploy"

### Solution 2: Restart the Application

Sometimes Coolify needs a restart:

1. In Coolify, go to your application
2. Click "Stop" (wait for it to stop)
3. Click "Start" (wait for it to start)
4. Then click "Deploy"

### Solution 3: Check Git Configuration

Verify Coolify is pointing to the right branch:

1. Go to application settings
2. Check "Branch" field - should be `master` (not `main`)
3. Check "Repository URL" - should be `https://github.com/Cohortle-inc/cohortle.git`
4. Save if you made changes
5. Click "Deploy"

### Solution 4: Clear Build Cache

Coolify might be using cached builds:

1. In application settings, look for "Build Cache" or "Docker Cache"
2. Click "Clear Cache" or "Rebuild from scratch"
3. Then click "Deploy"

### Solution 5: Redeploy with Specific Commit

Force Coolify to use a specific commit:

1. Get your latest commit hash: `git rev-parse HEAD`
2. In Coolify, look for "Deploy specific commit" or "Commit SHA" field
3. Paste your latest commit hash
4. Click "Deploy"

### Solution 6: Delete and Reconnect Repository

If nothing else works:

1. In Coolify, go to application settings
2. Disconnect the GitHub repository
3. Reconnect it (you may need to re-authenticate)
4. Ensure branch is set to `master`
5. Click "Deploy"

## Verify Latest Commit is Available

Before deploying, check what Coolify sees:

1. In Coolify, go to your application
2. Look for "Commits" or "Git" tab
3. Check if your latest commits are listed
4. If not, Coolify hasn't pulled from GitHub yet

## Check Your Latest Commits

Your recent commits that should be deployed:

```bash
git log --oneline -10
```

Latest commits:
- 539fdaa - fix: update GitHub Actions to trigger on master branch
- bc36fe0 - CRITICAL FIX: Update ProfileService to use new role system
- 651e206 - Fix learner authentication: disable email verification by default
- e5e0db4 - docs: Add WebSocket production fix documentation
- (and more...)

## Verify Deployment Worked

After deploying, check the logs:

1. In Coolify, go to "Logs" tab
2. Look for the commit hash in the startup logs
3. Should show your latest commit (539fdaa or newer)
4. If it shows 96bc30d, the deployment didn't pull new code

## Alternative: SSH and Pull Manually

If Coolify is completely stuck:

1. SSH into your server
2. Navigate to the deployment directory
3. Pull latest code manually:
   ```bash
   cd /path/to/cohortle-api
   git fetch origin
   git reset --hard origin/master
   npm install
   npm run migrate
   pm2 restart cohortle-api
   ```

## Common Coolify Issues

### Issue: "Already up to date" but using old code
**Cause**: Coolify's git cache is stale
**Fix**: Use Solution 1 (Force Pull) or Solution 4 (Clear Cache)

### Issue: Deploy succeeds but no changes visible
**Cause**: Coolify deployed but didn't restart the application
**Fix**: Manually restart the application after deployment

### Issue: Deployment shows old commit hash
**Cause**: Coolify isn't fetching from GitHub
**Fix**: Check GitHub connection, try Solution 6 (Reconnect)

## Quick Diagnostic

Run this to see what commit is currently deployed:

```powershell
# Check what's in production
curl -s https://api.cohortle.com/v1/api/deployment/verify | ConvertFrom-Json

# Should show commit hash - compare with your local:
git rev-parse HEAD
```

If they don't match, Coolify hasn't deployed your latest code.

## Prevention

To avoid this in the future:

1. Set up auto-deploy in Coolify (see check-deployment-config.md)
2. Set up GitHub webhook to notify Coolify of new commits
3. Enable "Auto Pull" in Coolify settings
4. Consider using deployment markers to track what's deployed

## Need More Help?

If none of these work:

1. Check Coolify logs for errors during deployment
2. Verify GitHub repository is accessible from Coolify
3. Check if there are any failed builds blocking new deployments
4. Try deploying to a test environment first

## Current Status

- ✅ Code pushed to GitHub (latest: 539fdaa)
- ❌ Coolify deploying old code (96bc30d)
- ⏳ Need to force Coolify to pull latest commits

**Next Action**: Try Solution 1 (Force Pull) in Coolify dashboard.
