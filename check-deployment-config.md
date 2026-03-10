# Deployment Configuration Checklist

## Why Commits Aren't Deploying

Your commits are being pushed to GitHub successfully, but they're not automatically deploying to production. Here's why:

### Issue 1: GitHub Actions Workflow Branch Mismatch ✅ FIXED
- **Problem**: Workflow was set to trigger on `main` branch
- **Your branch**: `master`
- **Fix**: Updated workflow to trigger on both `main` and `master`

### Issue 2: Coolify Auto-Deploy Not Configured
Coolify needs to be configured to automatically deploy when you push to GitHub.

## How to Fix Coolify Auto-Deploy

### Step 1: Check Coolify Settings

1. Open your Coolify dashboard
2. Navigate to `cohortle-api` application
3. Go to "Source" or "Git" settings
4. Look for these settings:
   - **Auto Deploy**: Should be ENABLED
   - **Branch**: Should be `master` (or `main`)
   - **Watch for changes**: Should be ENABLED

### Step 2: Set Up GitHub Webhook

Coolify needs a webhook to know when you push commits:

1. In Coolify, find your application
2. Look for "Webhook URL" - copy it
3. Go to GitHub repository settings
4. Navigate to Settings → Webhooks
5. Click "Add webhook"
6. Paste the Coolify webhook URL
7. Set content type to `application/json`
8. Select "Just the push event"
9. Save webhook

### Step 3: Verify Webhook Works

After setting up:
1. Make a small commit and push
2. Go to GitHub → Settings → Webhooks
3. Click on your webhook
4. Check "Recent Deliveries" tab
5. Should show successful delivery (green checkmark)

## Manual Deployment (Immediate Solution)

While you fix auto-deploy, manually deploy your changes:

### Deploy Backend
1. Open Coolify dashboard
2. Find `cohortle-api`
3. Click "Deploy" button
4. Wait 2-3 minutes
5. Check logs for "Server running on port 3000"

### Deploy Frontend
1. In Coolify dashboard
2. Find `cohortle-web`
3. Click "Deploy" button
4. Wait 3-5 minutes
5. Check logs for "Ready in XXXms"

## Verify Deployment

After deploying, verify it worked:

```powershell
# Check backend
curl -I https://api.cohortle.com/health

# Check frontend
curl -I https://cohortle.com

# Run full verification
.\verify-production-deployment.ps1
```

## Common Coolify Issues

### Issue: "Auto Deploy" option not visible
**Solution**: Your Coolify version might not support auto-deploy. Use webhooks instead.

### Issue: Webhook returns 404
**Solution**: 
- Verify webhook URL is correct
- Check Coolify is running
- Ensure application exists in Coolify

### Issue: Webhook delivers but doesn't deploy
**Solution**:
- Check Coolify logs for errors
- Verify branch name matches
- Ensure no build errors in previous deployments

## Alternative: GitHub Actions Deployment

If Coolify auto-deploy doesn't work, you can deploy via GitHub Actions:

1. Add Coolify API token to GitHub secrets
2. Update workflow to trigger Coolify deployment
3. Use Coolify API to start deployment

Would you like me to set this up?

## Next Steps

1. ✅ GitHub Actions workflow fixed (now triggers on `master`)
2. ⏳ Configure Coolify auto-deploy (follow steps above)
3. ⏳ Set up GitHub webhook (follow steps above)
4. ⏳ Test with a new commit
5. ⏳ Verify deployment works automatically

## Quick Test

After configuration:

```bash
# Make a small change
echo "# Test" >> README.md

# Commit and push
git add README.md
git commit -m "test: verify auto-deploy"
git push origin master

# Wait 2-3 minutes, then check Coolify logs
# Should see automatic deployment triggered
```

## Need Help?

If auto-deploy still doesn't work:
1. Share your Coolify version
2. Check if Coolify has access to your GitHub repo
3. Verify GitHub personal access token is valid
4. Check Coolify logs for connection errors

## Current Status

- ✅ Code is in GitHub (commits pushed successfully)
- ✅ GitHub Actions workflow fixed
- ❌ Coolify auto-deploy not configured
- ❌ Changes not deployed to production

**Action Required**: Configure Coolify auto-deploy OR manually deploy in Coolify dashboard.
