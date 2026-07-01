# Coolify Deployment Guide for Cohortle Web

## Overview
This is a Next.js 14 application configured for standalone deployment with Docker.

## Current Configuration
- **Framework**: Next.js 14.2.13
- **Output**: Standalone (optimized for Docker)
- **Port**: 3000
- **Dockerfile**: ✅ Already configured

## Coolify Deployment Settings

### Repository Settings
- **Repository**: https://github.com/cohortle-inc/cohortle-web
- **Branch**: main (or your default branch)
- **Base Directory**: Leave empty (root of repo)

### Build Settings

**Build Method**: Dockerfile

**Dockerfile Path**: `Dockerfile` (already exists in root)

**Port**: `3000`

### Environment Variables
Add these in Coolify:
```
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3000
HOST=0.0.0.0
```

If you need API URL:
```
NEXT_PUBLIC_API_URL=https://api.cohortle.com
```

### Domain Settings
- **Domain**: cohortle.com
- **SSL**: Enable (Let's Encrypt)

## Why It Was Showing 404

The 404 error was likely because:
1. The deployment wasn't properly configured
2. The build failed silently
3. The port wasn't exposed correctly
4. The domain wasn't pointing to the right deployment

## Deployment Steps

### Step 1: Create New Deployment in Coolify
1. Log into Coolify
2. Click "New Resource" → "Application"
3. Select "Public Repository"
4. Enter: `https://github.com/cohortle-inc/cohortle-web`
5. Select branch: `main`

### Step 2: Configure Build
1. Build Pack: Select "Dockerfile"
2. Dockerfile Location: `Dockerfile`
3. Port: `3000`

### Step 3: Add Environment Variables
Add the variables listed above in the Environment tab.

### Step 4: Configure Domain
1. Go to Domains tab
2. Add domain: `cohortle.com`
3. Enable SSL

### Step 5: Deploy
Click "Deploy" and watch the logs.

## What to Look For in Logs

### Build Phase Should Show:
```
✓ Creating an optimized production build
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

### Runtime Phase Should Show:
```
> next start
✓ Ready on http://0.0.0.0:3000
```

## Testing the Deployment

### 1. Check Build Logs
Look for any errors during:
- npm ci (dependency installation)
- npm run build (Next.js build)
- Docker image creation

### 2. Check Runtime Logs
Should see:
```
▲ Next.js 14.2.13
- Local:        http://0.0.0.0:3000
✓ Ready in [time]
```

### 3. Test the URL
Visit https://cohortle.com - should see your landing page.

## Common Issues & Solutions

### Issue 1: Build Fails
**Symptom**: "npm ci failed" or "build failed"
**Solution**: 
- Check if package-lock.json is committed
- Ensure Node 20 is being used
- Check build logs for specific errors

### Issue 2: Port Not Accessible
**Symptom**: Build succeeds but site not accessible
**Solution**:
- Verify port 3000 is exposed in Coolify
- Check if container is running: `docker ps`
- Check container logs

### Issue 3: 404 on All Pages
**Symptom**: Homepage loads but other pages 404
**Solution**:
- This shouldn't happen with Next.js standalone
- Check if .next/standalone was created during build
- Verify Dockerfile COPY commands are correct

### Issue 4: Static Assets Not Loading
**Symptom**: Page loads but images/CSS missing
**Solution**:
- Verify .next/static is copied in Dockerfile
- Check if public folder is copied
- Ensure base path is configured correctly

## Dockerfile Explanation

The Dockerfile uses multi-stage builds:

1. **deps**: Installs dependencies
2. **builder**: Builds the Next.js app
3. **runner**: Creates minimal runtime image

This results in a small, optimized image (~150MB).

## Environment Variables

### Required
- `NODE_ENV=production` - Enables production optimizations
- `PORT=3000` - Port the app listens on
- `HOST=0.0.0.0` - Allows external connections

### Optional
- `NEXT_PUBLIC_API_URL` - API endpoint for client-side calls
- `NEXT_TELEMETRY_DISABLED=1` - Disables Next.js telemetry

## Updating the Deployment

### Method 1: Auto-Deploy (Recommended)
1. Push changes to GitHub
2. Coolify will auto-deploy (if webhook configured)

### Method 2: Manual Deploy
1. Go to Coolify dashboard
2. Click "Redeploy" on the web app
3. Watch logs for completion

## Rollback

If deployment fails:
1. Go to Coolify dashboard
2. Click "Deployments" tab
3. Select previous successful deployment
4. Click "Redeploy"

## Performance Optimization

The app is already optimized with:
- ✅ Standalone output (smaller bundle)
- ✅ Multi-stage Docker build
- ✅ Static asset optimization
- ✅ Image optimization with Sharp

## Monitoring

### Check App Health
```bash
curl https://cohortle.com
```

Should return 200 OK with HTML content.

### Check Logs
In Coolify:
1. Go to application
2. Click "Logs" tab
3. View real-time logs

## Troubleshooting Commands

If you have SSH access to the server:

```bash
# Check if container is running
docker ps | grep cohortle-web

# View container logs
docker logs <container-id>

# Check port binding
netstat -tulpn | grep 3000

# Test from inside server
curl http://localhost:3000
```

## Next Steps After Deployment

1. ✅ Verify site loads at cohortle.com
2. ✅ Test all pages and navigation
3. ✅ Check mobile responsiveness
4. ✅ Verify SSL certificate
5. ✅ Test API integration (if applicable)
6. ✅ Set up monitoring/alerts
7. ✅ Configure CDN (optional)

## Support

If issues persist:
1. Check Coolify documentation
2. Review build/runtime logs
3. Test Dockerfile locally first
4. Contact Coolify support with logs

## Local Testing

Before deploying, test the Docker build locally:

```bash
cd cohortle-web

# Build the image
docker build -t cohortle-web .

# Run the container
docker run -p 3000:3000 cohortle-web

# Visit http://localhost:3000
```

If it works locally, it should work in Coolify.
