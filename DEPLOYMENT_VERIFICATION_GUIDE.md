# Deployment Verification System

This guide explains how to use the deployment verification system to ensure code changes are actually deployed to production.

## Overview

The deployment verification system consists of:

1. **Deployment Markers**: Unique comments in code files that identify the build version
2. **Verification Endpoints**: API endpoints that return deployment information
3. **Verification Scripts**: Scripts to check if deployed code matches expected version
4. **Automated Cache Purging**: GitHub Actions workflow that purges Cloudflare cache on deployment

## Components

### 1. Deployment Markers

Deployment markers are comments added to key files that identify the build version:

```javascript
// DEPLOYMENT_MARKER: 2025-01-BUILD
```

**Backend files with markers:**
- `cohortle-api/app.js`
- `cohortle-api/routes/programme.js`

**Frontend files with markers:**
- `cohortle-web/src/app/layout.tsx`
- `cohortle-web/src/app/dashboard/page.tsx`

### 2. Verification Endpoints

**Backend Endpoint:**
```
GET https://api.cohortle.com/v1/api/deployment/verify
```

Returns:
```json
{
  "deployed": true,
  "buildTimestamp": "2025-01-15T12:00:00.000Z",
  "version": "1.0.0",
  "environment": "production",
  "codeMarkers": [
    {
      "file": "app.js",
      "marker": "2025-01-BUILD"
    },
    {
      "file": "routes/programme.js",
      "marker": "2025-01-BUILD"
    }
  ]
}
```

**Frontend Endpoint:**
```
GET https://cohortle.com/api/deployment
```

Returns:
```json
{
  "deployed": true,
  "buildTimestamp": "2025-01-15T12:00:00.000Z",
  "version": "1.0.0",
  "environment": "production",
  "apiUrl": "https://api.cohortle.com",
  "codeMarkers": [
    {
      "file": "src/app/layout.tsx",
      "marker": "2025-01-BUILD"
    },
    {
      "file": "src/app/dashboard/page.tsx",
      "marker": "2025-01-BUILD"
    }
  ]
}
```

### 3. Verification Scripts

**PowerShell (Windows):**
```powershell
.\verify-deployment.ps1 -ExpectedMarker "2025-01-BUILD"
```

**Bash (Linux/Mac):**
```bash
./verify-deployment.sh 2025-01-BUILD
```

The scripts check:
- ✓ Backend deployment endpoint is accessible
- ✓ Frontend deployment endpoint is accessible
- ✓ Code markers match expected version
- ✓ Cloudflare API token is configured

### 4. Automated Cache Purging

GitHub Actions workflow (`.github/workflows/purge-cache-on-deploy.yml`) automatically:
1. Waits 90 seconds for Coolify deployment to complete
2. Purges Cloudflare cache
3. Verifies deployment endpoints are accessible

**Triggers:**
- Push to `main` branch with changes to `cohortle-web/**` or `cohortle-api/**`
- Manual workflow dispatch

## Usage Workflow

### Before Deployment

1. **Update deployment markers** (optional - for tracking specific builds):

   ```powershell
   # PowerShell
   .\update-deployment-markers.ps1 -Marker "2025-01-FEATURE-X"
   ```

   ```bash
   # Bash
   ./update-deployment-markers.sh "2025-01-FEATURE-X"
   ```

   This updates all deployment markers and deployment-info.json files.

2. **Commit and push changes**:

   ```bash
   git add .
   git commit -m "feat: add deployment verification system"
   git push origin main
   ```

### After Deployment

3. **Wait for deployment** (2-3 minutes for Coolify + 90 seconds for GitHub Actions)

4. **Verify deployment**:

   ```powershell
   # PowerShell
   .\verify-deployment.ps1 -ExpectedMarker "2025-01-FEATURE-X"
   ```

   ```bash
   # Bash
   ./verify-deployment.sh "2025-01-FEATURE-X"
   ```

5. **If verification fails**:

   - Check Coolify deployment logs
   - Verify GitHub Actions workflow ran successfully
   - Manually purge Cloudflare cache:
     ```powershell
     .\purge-cloudflare-cache.ps1
     ```

## Troubleshooting

### Issue: Verification script shows old markers

**Cause:** Cloudflare cache not purged

**Solution:**
1. Manually purge cache:
   ```powershell
   .\purge-cloudflare-cache.ps1
   ```
2. Wait 30 seconds
3. Run verification script again

### Issue: Backend/Frontend endpoint not accessible

**Cause:** Deployment failed or still in progress

**Solution:**
1. Check Coolify deployment logs
2. Verify services are running
3. Check environment variables are set correctly

### Issue: Code markers don't match

**Cause:** Deployment markers not updated before deployment

**Solution:**
1. Update markers:
   ```powershell
   .\update-deployment-markers.ps1
   ```
2. Commit and push changes
3. Wait for deployment
4. Verify again

## Environment Variables

### Required for Cache Purging

**CLOUDFLARE_API_TOKEN**: Cloudflare API token with cache purge permissions

Set in:
- GitHub repository secrets (for GitHub Actions)
- Local environment (for manual cache purging)

```powershell
# PowerShell
$env:CLOUDFLARE_API_TOKEN = "your_token_here"
```

```bash
# Bash
export CLOUDFLARE_API_TOKEN="your_token_here"
```

## Files Reference

### Scripts
- `update-deployment-markers.ps1` / `.sh` - Update deployment markers before deployment
- `verify-deployment.ps1` / `.sh` - Verify deployment after deployment
- `purge-cloudflare-cache.ps1` / `.sh` - Manually purge Cloudflare cache

### Endpoints
- `cohortle-api/routes/deployment.js` - Backend deployment verification endpoint
- `cohortle-web/src/app/api/deployment/route.ts` - Frontend deployment verification endpoint

### Configuration
- `cohortle-api/deployment-info.json` - Backend deployment information
- `cohortle-web/deployment-info.json` - Frontend deployment information
- `.github/workflows/purge-cache-on-deploy.yml` - Automated cache purging workflow

## Best Practices

1. **Update markers for major deployments**: Use descriptive markers like "2025-01-FEATURE-X" for tracking
2. **Verify after every deployment**: Always run verification script after deployment
3. **Monitor GitHub Actions**: Check workflow runs to ensure cache purging succeeds
4. **Keep markers in sync**: Use update script to ensure all files have the same marker
5. **Document deployment issues**: If verification fails, document the issue and solution

## Integration with CI/CD

The system is designed to work with:
- **Coolify**: Automatic deployment on push to main
- **GitHub Actions**: Automatic cache purging and verification
- **Cloudflare**: CDN and caching layer

The workflow:
1. Developer pushes to main branch
2. Coolify detects changes and deploys
3. GitHub Actions waits 90 seconds
4. GitHub Actions purges Cloudflare cache
5. GitHub Actions verifies deployment endpoints
6. Developer runs local verification script

## Future Enhancements

Potential improvements:
- Add deployment notifications (Slack, email)
- Store deployment history in database
- Add rollback capability
- Integrate with monitoring tools
- Add performance metrics to verification
