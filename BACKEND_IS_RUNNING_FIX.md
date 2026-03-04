# Backend Is Running - Here's What's Wrong

## Good News! 🎉

Your backend IS running! The response "Cannot GET /health" means the server is alive and responding.

## The Issue

All your API endpoints are prefixed with `/v1/api/`, not just `/api/`.

**Wrong:** `https://api.cohortle.com/health`  
**Correct:** `https://api.cohortle.com/v1/api/health`

## Quick Test

Try this command:

```bash
curl https://api.cohortle.com/v1/api/health
```

You should get:
```json
{
  "error": false,
  "message": "Ping successful",
  "db_time": "2026-02-25T..."
}
```

## Why Your Web App Isn't Working

Your frontend is probably making requests to the wrong URLs.

### Check Your Frontend API Client

The frontend needs to call:
- ❌ `https://api.cohortle.com/api/auth/login`
- ✅ `https://api.cohortle.com/v1/api/auth/login`

### All Backend Endpoints Use `/v1/api/` Prefix

Looking at your routes, ALL endpoints follow this pattern:
- `/v1/api/health` - Health check
- `/v1/api/auth/login` - Login
- `/v1/api/auth/register` - Register
- `/v1/api/programmes/enrolled` - Get enrolled programmes
- `/v1/api/cohorts/:id` - Get cohort details
- etc.

## Quick Fix Options

### Option 1: Update Frontend API Base URL (Recommended)

In your frontend code, the API client should use:

```javascript
// cohortle-web/src/lib/api/client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// When making requests, use:
axios.get(`${API_BASE_URL}/v1/api/programmes/enrolled`)
```

Check if your frontend is already doing this correctly.

### Option 2: Add a Redirect in Backend (Quick Workaround)

Add this to `cohortle-api/app.js` before the error handling:

```javascript
// Redirect /api/* to /v1/api/*
app.use('/api/*', (req, res) => {
  const newPath = req.originalUrl.replace('/api/', '/v1/api/');
  res.redirect(308, newPath);
});
```

## Verify Your Frontend API Client

Let me check your frontend API client configuration...

### Check These Files:

1. **cohortle-web/src/lib/api/client.ts** - Base API configuration
2. **cohortle-web/src/lib/api/auth.ts** - Auth endpoints
3. **cohortle-web/src/lib/api/programmes.ts** - Programme endpoints

Make sure all API calls include the `/v1/api/` prefix.

## Test Each Endpoint

Once you know the correct URL pattern, test:

```bash
# Health check
curl https://api.cohortle.com/v1/api/health

# Login (should return error about missing credentials, but endpoint exists)
curl -X POST https://api.cohortle.com/v1/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'

# Enrolled programmes (should return 401 without token)
curl https://api.cohortle.com/v1/api/programmes/enrolled
```

## Next Steps

1. **Verify the health endpoint works:**
   ```bash
   curl https://api.cohortle.com/v1/api/health
   ```

2. **Check your frontend API client** to see if it's using `/v1/api/` prefix

3. **If frontend is wrong**, we need to update the API client configuration

4. **If frontend is correct**, there might be another issue (CORS, auth, etc.)

Let me know what the health check returns, and I'll help you fix the frontend configuration.
