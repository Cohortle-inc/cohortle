# Cloudflare Cache Automation Guide

## Overview

Automated cache purging ensures users always see the latest version of your application after deployments, eliminating the need for manual cache clearing.

## Solution Implemented

We've created three approaches for automating Cloudflare cache purging:

### 1. **GitHub Actions (Recommended)**
Automatically purges cache after every push to main branch.

### 2. **Manual Scripts**
Run manually when needed (bash and PowerShell versions).

### 3. **Coolify Integration** (Optional)
Can be integrated into Coolify's deployment hooks.

---

## Setup Instructions

### Option A: GitHub Actions (Automated - Recommended)

#### Step 1: Get Your Cloudflare API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click on your profile → "API Tokens"
3. Click "Create Token"
4. Use the "Edit zone DNS" template or create custom token with:
   - **Permissions**: Zone → Cache Purge → Purge
   - **Zone Resources**: Include → Specific zone → cohortle.com
5. Copy the generated token

#### Step 2: Add Token to GitHub Secrets

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `CLOUDFLARE_API_TOKEN`
5. Value: [paste your token]
6. Click "Add secret"

#### Step 3: Enable the Workflow

The workflow file is already created at `.github/workflows/purge-cache-on-deploy.yml`

**How it works:**
- Triggers on every push to `main` branch that changes `cohortle-web/**` files
- Waits 60 seconds for Coolify to deploy
- Purges Cloudflare cache
- Notifies completion

**Manual trigger:**
You can also manually trigger it from GitHub Actions tab → "Purge Cloudflare Cache on Deploy" → "Run workflow"

---

### Option B: Manual Scripts

#### Bash Script (Linux/Mac/Git Bash)

**Setup:**
```bash
# Make script executable
chmod +x purge-cloudflare-cache.sh

# Set your API token
export CLOUDFLARE_API_TOKEN="your_token_here"

# Run the script
./purge-cloudflare-cache.sh
```

**Add to your shell profile for persistence:**
```bash
# Add to ~/.bashrc or ~/.zshrc
export CLOUDFLARE_API_TOKEN="your_token_here"
```

#### PowerShell Script (Windows)

**Setup:**
```powershell
# Set your API token
$env:CLOUDFLARE_API_TOKEN = "your_token_here"

# Run the script
.\purge-cloudflare-cache.ps1
```

**Add to PowerShell profile for persistence:**
```powershell
# Edit profile
notepad $PROFILE

# Add this line:
$env:CLOUDFLARE_API_TOKEN = "your_token_here"
```

---

### Option C: Coolify Integration

You can add the cache purge script to Coolify's post-deployment hooks:

1. Go to Coolify dashboard
2. Select your `cohortle-web` application
3. Go to "Build & Deploy" settings
4. Find "Post Deployment Command" or "Deployment Hooks"
5. Add:

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/931b969b7a90e93c0eb56351db72529a/purge_cache" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

6. Add `CLOUDFLARE_API_TOKEN` to Coolify environment variables

---

## Usage

### Automatic (GitHub Actions)
Once set up, cache purges automatically after every deployment. No action needed!

### Manual (When Needed)
```bash
# Linux/Mac/Git Bash
./purge-cloudflare-cache.sh

# Windows PowerShell
.\purge-cloudflare-cache.ps1
```

---

## Verification

After purging cache, verify it worked:

1. **Check script output**: Should show "✅ Cloudflare cache purged successfully!"
2. **Test in browser**:
   - Open https://cohortle.com in incognito/private mode
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Check if changes are visible
3. **Check Cloudflare dashboard**:
   - Go to Caching → Configuration
   - Look for recent purge events

---

## Best Practices

### When to Purge Cache

**Always purge after:**
- ✅ Frontend code changes (JavaScript, CSS, HTML)
- ✅ API route changes that affect frontend
- ✅ Configuration changes
- ✅ Bug fixes that need immediate deployment

**No need to purge for:**
- ❌ Backend-only changes (API logic that doesn't affect responses)
- ❌ Database changes
- ❌ Documentation updates

### Selective vs Full Purge

**Current setup uses full purge** (`purge_everything: true`) because:
- Simple and reliable
- Ensures all users get latest version
- No risk of missing cached files

**For more granular control**, you can purge specific URLs:
```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/931b969b7a90e93c0eb56351db72529a/purge_cache" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "files": [
      "https://cohortle.com/_next/static/chunks/*",
      "https://cohortle.com/api/*"
    ]
  }'
```

---

## Troubleshooting

### "API token not set" error
**Solution:** Set the `CLOUDFLARE_API_TOKEN` environment variable

### "Failed to purge cache" error
**Possible causes:**
1. Invalid API token
2. Token doesn't have "Cache Purge" permission
3. Wrong zone ID
4. Network connectivity issues

**Check:**
```bash
# Test API token
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Cache still showing old content
**Solutions:**
1. Wait 1-2 minutes after purge
2. Clear browser cache (Ctrl+Shift+Delete)
3. Try incognito/private mode
4. Check if Cloudflare is actually caching (check response headers)

---

## Advanced: Selective Purging

For high-traffic sites, you might want to purge only specific files:

```bash
# Purge only JavaScript chunks
curl -X POST "https://api.cloudflare.com/client/v4/zones/931b969b7a90e93c0eb56351db72529a/purge_cache" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "files": [
      "https://cohortle.com/_next/static/chunks/*.js"
    ]
  }'
```

---

## Security Notes

⚠️ **Important:**
- Never commit API tokens to git
- Use environment variables or GitHub secrets
- Rotate tokens periodically
- Use tokens with minimal required permissions
- Monitor token usage in Cloudflare dashboard

---

## Summary

**Recommended Setup:**
1. ✅ Use GitHub Actions for automatic purging
2. ✅ Keep manual scripts for emergency use
3. ✅ Monitor purge success in GitHub Actions logs

**Benefits:**
- 🚀 Users always see latest version
- ⏱️ No manual intervention needed
- 🔄 Consistent deployment process
- 🐛 Faster bug fix rollouts

Your cache will now automatically purge after every deployment to main branch!