# Coolify Web Deployment Configuration

## Quick Fix for 404 Error

The 404 error is likely because Coolify isn't building/serving the Expo web app correctly.

## Correct Coolify Settings

### Repository Settings
- **Repository**: Your GitHub repo (same as API)
- **Branch**: main (or your default branch)
- **Base Directory**: `cohortz` (important if monorepo!)

### Build Settings

**Build Command**:
```bash
npm install && npx expo export:web
```

**Start Command** (choose one):

Option 1 - Using serve (recommended):
```bash
npx serve dist -l 3000 -s
```

Option 2 - Using http-server:
```bash
npx http-server dist -p 3000 -c-1
```

**Port**: `3000`

### Environment Variables
Add these in Coolify:
```
EXPO_PUBLIC_API_URL=https://api.cohortle.com
EXPO_PUBLIC_API_BASE_URL=https://api.cohortle.com
NODE_ENV=production
```

## Why You're Seeing Next.js Logs

This is the mystery - your codebase doesn't have Next.js. Possible reasons:

1. **Wrong repository** - Coolify might be deploying a different repo
2. **Cached deployment** - Old deployment from another project
3. **Wrong project** - Check if you have multiple projects in Coolify

**Action**: In Coolify, go to the web deployment and verify:
- The repository URL
- The branch name
- Recent deployment logs

## Testing the Fix

### Step 1: Test Locally First
```bash
cd cohortz
npm install
npx expo export:web
npx serve dist -l 3000 -s
```

Visit http://localhost:3000 - if it works, the issue is Coolify config.

### Step 2: Check Coolify Build Logs
After redeploying, check the logs for:
- "Exporting web files to dist/"
- "Export complete"
- No errors about missing files

### Step 3: Check Coolify Runtime Logs
Should see:
- "Serving dist on port 3000"
- NOT "Next.js 14.2.31" (unless you have a different app)

## Common Issues

### Issue 1: Base Directory Not Set
**Symptom**: "package.json not found"
**Fix**: Set base directory to `cohortz` in Coolify

### Issue 2: Wrong Start Command
**Symptom**: 404 on all routes
**Fix**: Ensure start command includes `-s` flag for SPA routing

### Issue 3: Port Not Exposed
**Symptom**: App builds but not accessible
**Fix**: Set port to 3000 in Coolify settings

### Issue 4: Missing Dependencies
**Symptom**: Build fails with "expo: command not found"
**Fix**: Ensure `npm install` runs before `npx expo export:web`

## Alternative: Use Dockerfile

If Coolify supports Docker, create this file in `cohortz/`:

**cohortz/Dockerfile.web**:
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

# Install serve
RUN npm install -g serve

# Expose port
EXPOSE 3000

# Start server with SPA support
CMD ["serve", "dist", "-l", "3000", "-s"]
```

Then in Coolify:
- Set Dockerfile path to: `cohortz/Dockerfile.web`
- Port: 3000

## Verification Checklist

After updating Coolify config:

1. [ ] Trigger a new deployment
2. [ ] Check build logs for "Export complete"
3. [ ] Check runtime logs for serve starting
4. [ ] Visit cohortle.com
5. [ ] Check browser console for errors
6. [ ] Test navigation (should not 404 on routes)

## If Still 404

1. **Check DNS** - Ensure cohortle.com points to Coolify
2. **Check SSL** - Ensure HTTPS is configured
3. **Check Coolify proxy** - Ensure port 3000 is proxied correctly
4. **Check firewall** - Ensure port 3000 is open
5. **Contact Coolify support** - Provide deployment logs

## Quick Deploy Script

Run this to test the build locally:
```bash
cd cohortz
BUILD_WEB.bat
```

This will build the web version and show you what to configure in Coolify.
