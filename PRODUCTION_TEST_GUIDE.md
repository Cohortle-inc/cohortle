# WLIMP Production Testing Guide

## Current Status

✅ **API is accessible** at https://api.cohortle.com  
❓ **WLIMP endpoints status**: Unknown (need to test)

## Quick Test Steps

### Step 1: Check if backend is deployed

Run this command to test the API:

```powershell
.\test-production-wlimp.ps1 -Action health
```

### Step 2: Register a convener account

This will test if the auth endpoints are working:

```powershell
.\test-production-wlimp.ps1 -Action register
```

You'll be prompted for:
- Email (use any email, e.g., `convener@test.com`)
- Password (use any password, e.g., `password123`)

If successful, you'll get an authentication token saved to `convener-token.txt`.

### Step 3: Create a test programme

This will test if the WLIMP programme endpoints are working:

```powershell
.\test-production-wlimp.ps1 -Action create
```

This will create:
- A programme called "WLIMP Test Programme"
- A cohort with enrollment code `WLIMP-2026`
- 3 weeks with 1 lesson each

### Step 4: Test enrollment (as a learner)

1. Go to https://cohortle.com/join
2. Enter code: `WLIMP-2026`
3. Click "Join Programme"

If it works, you'll be enrolled and redirected to the programme page!

## What Each Test Tells You

### Health Test
- ✅ **200 OK**: API is running
- ❌ **404 Not Found**: API might not be deployed or health endpoint doesn't exist
- ❌ **Connection Error**: API is down or URL is wrong

### Register Test
- ✅ **Success + Token**: Auth endpoints are working
- ❌ **404**: Backend not deployed or auth routes missing
- ❌ **500**: Backend deployed but database issue

### Create Programme Test
- ✅ **Success**: WLIMP endpoints are fully deployed and working!
- ❌ **404**: WLIMP endpoints not deployed yet
- ❌ **401 Unauthorized**: Token is invalid
- ❌ **500**: Database tables don't exist (migrations not run)

## Troubleshooting

### If registration fails with 404
**Problem**: Backend not deployed or auth routes missing  
**Solution**: Deploy the backend in Coolify

### If programme creation fails with 404
**Problem**: WLIMP endpoints not deployed  
**Solution**: Deploy the backend in Coolify (the latest code with WLIMP)

### If programme creation fails with 500
**Problem**: Database tables don't exist  
**Solution**: Run migrations on the server:
```bash
npm run migrate
```

Or check Coolify logs to see if migrations ran automatically.

## Expected Results

If everything is deployed correctly:

1. ✅ Health check returns 200 OK
2. ✅ Registration returns a token
3. ✅ Programme creation succeeds
4. ✅ Enrollment works on the website

## Next Steps

After successful testing:

1. Share the enrollment code `WLIMP-2026` with learners
2. They can join at https://cohortle.com/join
3. Monitor the dashboard to see enrolled learners
4. Create more programmes as needed

## Manual API Testing

If you prefer to test manually with curl or Postman:

### Register
```bash
curl -X POST https://api.cohortle.com/v1/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"convener@test.com","password":"password123","role":"convener"}'
```

### Create Programme
```bash
curl -X POST https://api.cohortle.com/v1/api/programmes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Test Programme","description":"Test","start_date":"2026-03-01","type":"structured","status":"active"}'
```

### Enroll
```bash
curl -X POST https://api.cohortle.com/v1/api/programmes/enroll \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"enrollment_code":"WLIMP-2026"}'
```

## Files Created

- `test-production-wlimp.ps1` - Automated testing script
- `convener-token.txt` - Your authentication token (created after registration)
- `PRODUCTION_TEST_GUIDE.md` - This guide

## Support

If you encounter issues:

1. Check Coolify logs for both cohortle-api and cohortle-web
2. Look for error messages in the browser console (F12)
3. Verify the backend was deployed with the latest code (commit 7e027da)
4. Verify migrations ran successfully in the logs
