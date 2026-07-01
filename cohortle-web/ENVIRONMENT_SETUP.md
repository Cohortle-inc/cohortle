# Environment Variables Setup for Cohortle Web

## What You Need to Set in Coolify

When deploying `cohortle-web` to Coolify, you need to configure these environment variables:

### Required Environment Variables

```bash
# Node Environment
NODE_ENV=production

# Server Configuration
PORT=3000
HOST=0.0.0.0

# Disable Next.js Telemetry
NEXT_TELEMETRY_DISABLED=1

# ⭐ MOST IMPORTANT: Your Backend API URL
NEXT_PUBLIC_API_URL=https://api.cohortle.com
```

## How to Set These in Coolify

### Step 1: Log into Coolify
Go to your Coolify dashboard

### Step 2: Navigate to Your Web App
Find the `cohortle-web` application

### Step 3: Go to Environment Tab
Click on the "Environment" or "Environment Variables" tab

### Step 4: Add Each Variable
For each variable above, click "Add Variable" and enter:
- **Name**: (e.g., `NEXT_PUBLIC_API_URL`)
- **Value**: (e.g., `https://api.cohortle.com`)

### Step 5: Save and Redeploy
After adding all variables, save and redeploy the application

## What Each Variable Does

### `NODE_ENV=production`
Tells Next.js to run in production mode (optimized, no debug info)

### `PORT=3000`
The port your web app listens on inside the container

### `HOST=0.0.0.0`
Allows external connections to reach your app

### `NEXT_TELEMETRY_DISABLED=1`
Disables Next.js anonymous telemetry data collection

### `NEXT_PUBLIC_API_URL=https://api.cohortle.com` ⭐
**This is the critical one!** It tells your frontend where to find your backend API.

- Your backend API is already running at `https://api.cohortle.com`
- The frontend needs to know this URL to make API calls
- Without this, the lesson viewer won't be able to fetch lessons, comments, etc.

## How to Verify It's Working

After deployment, you can check if the environment variable is set correctly:

### Method 1: Check in Browser Console
1. Open your deployed site: `https://cohortle.com`
2. Open browser DevTools (F12)
3. Go to Console tab
4. Type: `console.log(process.env.NEXT_PUBLIC_API_URL)`
5. Should show: `https://api.cohortle.com`

### Method 2: Check Network Tab
1. Navigate to a lesson page
2. Open DevTools → Network tab
3. Look for API calls
4. They should be going to `https://api.cohortle.com/api/...`

## Troubleshooting

### Problem: API calls are failing
**Check**: Is `NEXT_PUBLIC_API_URL` set correctly?
**Solution**: Verify it's `https://api.cohortle.com` (with https, no trailing slash)

### Problem: Environment variable not showing up
**Check**: Did you redeploy after adding it?
**Solution**: Variables only take effect after redeployment

### Problem: Getting CORS errors
**Check**: Is your backend configured to allow requests from `cohortle.com`?
**Solution**: Update CORS settings in `cohortle-api`

## Quick Copy-Paste for Coolify

Here's the exact format to copy-paste into Coolify:

```
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_API_URL=https://api.cohortle.com
```

## Summary

The most important thing to remember:
- Your backend API is at: `https://api.cohortle.com`
- Your frontend needs to know this via: `NEXT_PUBLIC_API_URL=https://api.cohortle.com`
- Set this in Coolify before deploying

That's it! Once these are set, your web app will be able to communicate with your backend API.
