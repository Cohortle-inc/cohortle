# Coolify NODE_ENV Configuration Explained

## The Warning Message

When you mark `NODE_ENV` as "Available at Buildtime" in Coolify, you see:

> Skips devDependencies installation which are often required for building (webpack, typescript, etc.)
> Recommendation: Uncheck "Available at Buildtime" or use "development" during build

## What This Means

### The Issue
- When `NODE_ENV=production` during build, npm/yarn skips installing `devDependencies`
- But build tools (TypeScript, webpack, etc.) are usually in `devDependencies`
- This can cause the build to fail

### Coolify's Solution
Coolify has two options for handling this:

#### Option 1: NODE_ENV Only at Runtime (Recommended)
- **Buildtime**: `NODE_ENV` is NOT set (or defaults to development)
- **Runtime**: `NODE_ENV=production`
- **Result**: devDependencies are installed during build, but app runs in production mode

#### Option 2: NODE_ENV at Both Build and Runtime
- **Buildtime**: `NODE_ENV=production` 
- **Runtime**: `NODE_ENV=production`
- **Risk**: Build might fail if devDependencies are needed
- **Only works if**: All build tools are in `dependencies` (not `devDependencies`)

---

## What You Should Do

### For cohortle-api:

Check your `package.json` to see where your build tools are:

```json
{
  "devDependencies": {
    "nodemon": "^2.0.0",  // Development only
    "jest": "^29.0.0"      // Testing only
  },
  "dependencies": {
    "express": "^4.18.0",  // Runtime dependency
    "mysql2": "^3.0.0"     // Runtime dependency
  }
}
```

**If cohortle-api doesn't have a build step** (no TypeScript compilation, no webpack):
- ✅ **Set NODE_ENV to Runtime ONLY**
- This is the safest option

**If cohortle-api has a build step** (TypeScript, babel, etc.):
- ✅ **Set NODE_ENV to Runtime ONLY**
- Coolify will use development mode during build, production mode at runtime

---

## Correct Configuration for cohortle-api

### NODE_ENV
- **Value**: `production`
- **Availability**: ✅ **Runtime ONLY** (uncheck Buildtime)
- **Why**: Prevents devDependencies installation issues

### Other Variables (DB_*, JWT_SECRET, etc.)
- **Availability**: ✅ **Both Buildtime AND Runtime** (or just Runtime)
- **Why**: These don't affect npm install behavior

---

## Summary

The warning is specifically about `NODE_ENV` and how it affects `npm install`:

```bash
# During build with NODE_ENV=production
npm install --production  # Skips devDependencies ❌

# During build without NODE_ENV (or NODE_ENV=development)  
npm install  # Installs everything including devDependencies ✅
```

**Recommendation for cohortle-api:**
1. Set `NODE_ENV=production` 
2. Make it available at **Runtime ONLY** (uncheck Buildtime)
3. Set all other variables (DB_*, JWT_SECRET, etc.) to **Runtime ONLY** or **Both**

This way:
- Build works correctly (devDependencies are installed)
- App runs in production mode (NODE_ENV=production at runtime)
- Database credentials are available when the app starts

---

## Quick Fix

In Coolify for cohortle-api:

1. **NODE_ENV**:
   - Value: `production`
   - ☐ Buildtime (UNCHECKED)
   - ☑ Runtime (CHECKED)

2. **DB_HOSTNAME, DB_DATABASE, DB_USER, DB_PASSWORD, etc.**:
   - ☐ Buildtime (UNCHECKED - not needed)
   - ☑ Runtime (CHECKED)

3. **Save and redeploy**

This configuration will work correctly!
