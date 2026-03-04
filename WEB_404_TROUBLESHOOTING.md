# Web 404 Error Troubleshooting Guide

## Problem
cohortle.com is showing a 404 error, but logs show Next.js 14.2.31 running on port 3000.

## Key Observations
1. **Logs show Next.js** - But this codebase doesn't have a Next.js app
2. **cohortz app has web export** - Configured with Expo Router and static output
3. **Separate Coolify deployment** - Web and API are deployed separately

## Possible Issues

### Issue 1: Wrong Repository/Branch Deployed
**Symptom**: Seeing Next.js logs but codebase doesn't have Next.js

**Solution**: Check Coolify deployment settings
1. Log into Coolify
2. Go to the Web deployment (cohortle.com)
3. Verify:
   - Correct GitHub repository is connected
   - Correct branch is selected (probably `main` or `master`)
   - Repository URL should point to the cohortz app

### Issue 2: Build Output Directory Not Configured
**Symptom**: 404 errors even though app is running

**For Expo Web (Static Export)**:
The build output goes to `dist/` directory after running `npx expo export:web`

**Coolify Configuration Needed**:
```
Build Command: npm install && npx expo export:web
Start Command: npx serve dist -l 3000
Port: 3000
```

Or for static hosting:
```
Build Command: npm install && npx expo export:web
Publish Directory: dist
```

### Issue 3: Missing Web Build
**Symptom**: Deployment succeeds but shows 404

**Solution**: Ensure web build is generated
1. In Coolify, check the build logs
2. Look for: "Exporting web files to dist/"
3. If missing, the build command isn't running correctly

### Issue 4: Port Configuration
**Symptom**: App runs but not accessible

**Solution**: 
- Coolify needs port 3000 exposed
- Check if the container is listening on 0.0.0.0:3000 (not localhost:3000)

## Quick Fix Steps

### Step 1: Verify Coolify Configuration
Check these settings in Coolify for the web deployment:

**General Tab**:
- Repository: Your GitHub repo with cohortz app
- Branch: main (or your default branch)
- Base Directory: `cohortz` (if in monorepo)

**Build Tab**:
```bash
# Install dependencies
npm install

# Export web build
npx expo export:web
```

**Deployment Tab**:
```bash
# Serve the static files
npx serve dist -l 3000
```

**Port**: 3000

### Step 2: Check if Static or Dynamic Hosting

**Option A: Static Hosting (Recommended for Expo)**
If Coolify supports static hosting:
- Build Command: `npm install && npx expo export:web`
- Publish Directory: `dist`
- No start command needed

**Option B: Dynamic Hosting (Using serve)**
- Build Command: `npm install && npx expo export:web`
- Start Command: `npx serve dist -l 3000 -s`
- Port: 3000
- Note: Add `-s` flag for SPA routing

### Step 3: Environment Variables
Ensure these are set in Coolify:
```
EXPO_PUBLIC_API_URL=https://api.cohortle.com
EXPO_PUBLIC_API_BASE_URL=https://api.cohortle.com
NODE_ENV=production
```

### Step 4: Dockerfile (If Using Docker)
If Coolify is using Docker, you might need a Dockerfile:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app files
COPY . .

# Build web export
RUN npx expo export:web

# Install serve globally
RUN npm install -g serve

# Expose port
EXPOSE 3000

# Start server
CMD ["serve", "dist", "-l", "3000", "-s"]
```

## Mystery: Next.js Logs

The fact that you're seeing Next.js logs is strange since this codebase uses Expo. Possible explanations:

1. **Wrong repository deployed** - Check if Coolify is pointing to a different repo
2. **Cached deployment** - Old deployment from a different project
3. **Different project** - cohortle.com might be pointing to a different Coolify project

**Action**: In Coolify, verify the deployment is actually using the cohortz repository.

## Testing Locally

Before deploying, test the web build locally:

```bash
cd cohortz

# Install dependencies
npm install

# Export web build
npx expo export:web

# Serve locally
npx serve dist -l 3000 -s

# Visit http://localhost:3000
```

If this works locally, the issue is in the Coolify configuration.

## Common Coolify Issues

### Issue: Build succeeds but 404
**Cause**: Wrong publish directory
**Fix**: Set publish directory to `dist` or ensure start command serves from `dist`

### Issue: "Cannot GET /"
**Cause**: SPA routing not configured
**Fix**: Add `-s` flag to serve command: `serve dist -l 3000 -s`

### Issue: Assets not loading
**Cause**: Base path not configured
**Fix**: In app.config.js, ensure web.bundler is set to 'metro'

## Next Steps

1. **Check Coolify logs** - Look for actual build output
2. **Verify repository** - Ensure correct repo is connected
3. **Test build command** - Run `npx expo export:web` locally first
4. **Check Coolify docs** - See if static hosting is supported
5. **Contact Coolify support** - If configuration looks correct but still 404

## Quick Checklist

- [ ] Correct GitHub repository connected in Coolify
- [ ] Correct branch selected
- [ ] Base directory set to `cohortz` (if monorepo)
- [ ] Build command includes `npx expo export:web`
- [ ] Start command serves from `dist` directory
- [ ] Port 3000 is exposed
- [ ] Environment variables are set
- [ ] Build logs show successful export
- [ ] No errors in deployment logs

## If All Else Fails

Consider deploying to Vercel or Netlify instead:
- Both have excellent Expo web support
- Automatic builds from GitHub
- Free tier available
- Better documentation for static sites

**Vercel**:
```bash
cd cohortz
npm install -g vercel
npx expo export:web
vercel --prod
```

**Netlify**:
```bash
cd cohortz
npx expo export:web
# Then drag-and-drop the dist/ folder to Netlify
```
