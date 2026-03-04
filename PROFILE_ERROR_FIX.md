# Profile Page Error - Diagnostic & Fix Guide

## Quick Diagnosis

Run this command to diagnose the issue:

```bash
node diagnose-profile-error.js
```

## Common Issues & Solutions

### Issue 1: Missing Database Tables

**Symptoms:**
- Error mentions "doesn't exist" or "no such table"
- Profile page shows 500 error

**Solution:**
Run the migrations:

```bash
cd cohortle-api
npm run migrate
```

Or manually:

```bash
cd cohortle-api
npx sequelize-cli db:migrate
```

### Issue 2: Missing Associations

**Symptoms:**
- Error mentions "is not associated with"
- Profile data loads but achievements/goals fail

**Solution:**
Restart the API server to reload models:

```bash
cd cohortle-api
npm restart
```

### Issue 3: Authentication Issues

**Symptoms:**
- Profile page redirects to login
- "User not found" error

**Solution:**
Check if the user is properly authenticated:

1. Clear browser cookies
2. Log in again
3. Check that JWT token is valid

### Issue 4: Frontend API Client Issues

**Symptoms:**
- Network errors in browser console
- CORS errors
- 404 errors for API endpoints

**Solution:**
Check the API proxy configuration in `cohortle-web/src/app/api/proxy/[...path]/route.ts`

## Manual Testing

### Test Backend Directly

```bash
# Get a user token first
cd cohortle-api
node -e "const jwt = require('jsonwebtoken'); console.log(jwt.sign({ user_id: 1 }, process.env.JWT_SECRET || 'your-secret'));"

# Test profile endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/v1/api/profile
```

### Test Frontend

1. Open browser DevTools (F12)
2. Go to Network tab
3. Navigate to `/profile/settings`
4. Check for failed requests
5. Look at Console tab for JavaScript errors

## Specific Error Messages

### "lesson_completions doesn't exist"

The ProfileService has fallback handling for this. If you see this warning but the page still loads, it's working as intended. To fix permanently:

```bash
cd cohortle-api
npx sequelize-cli db:migrate
```

### "user_preferences doesn't exist"

Run migration:

```bash
cd cohortle-api
npx sequelize-cli db:migrate --name 20260302000005-create-user-preferences.js
```

### "learning_goals doesn't exist"

Run migration:

```bash
cd cohortle-api
npx sequelize-cli db:migrate --name 20260302000006-create-learning-goals.js
```

### "achievements doesn't exist"

Run migration:

```bash
cd cohortle-api
npx sequelize-cli db:migrate --name 20260302000007-create-achievements.js
```

## Production Deployment

If this is happening in production:

1. SSH into the server
2. Navigate to the API directory
3. Run migrations:

```bash
cd /path/to/cohortle-api
NODE_ENV=production npx sequelize-cli db:migrate
```

4. Restart the API service

## Files Involved

### Backend
- `cohortle-api/routes/profile.js` - API endpoints
- `cohortle-api/services/ProfileService.js` - Business logic
- `cohortle-api/models/user_preferences.js` - Preferences model
- `cohortle-api/models/learning_goals.js` - Goals model
- `cohortle-api/models/user_achievements.js` - Achievements model

### Frontend
- `cohortle-web/src/app/profile/settings/page.tsx` - Settings page
- `cohortle-web/src/components/profile/LearnerProfile.tsx` - Profile component
- `cohortle-web/src/lib/api/profile.ts` - API client
- `cohortle-web/src/lib/contexts/AuthContext.tsx` - Authentication

## Next Steps

1. Run the diagnostic script: `node diagnose-profile-error.js`
2. Check the output for specific errors
3. Apply the appropriate solution from above
4. Test the profile page again

If the issue persists, please provide:
- The exact error message
- Browser console logs
- API server logs
- Output from the diagnostic script
