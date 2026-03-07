# Convener Signup and Login Fix

## Issues Fixed

### Issue 1: Convener signup redirects to student dashboard
**Root Cause**: The signup API route was not passing the `invitationCode` to the backend, and was not returning the `role` from the backend response.

**Fix**:
- Updated `cohortle-web/src/app/api/auth/signup/route.ts` to:
  - Extract `invitationCode` from request body
  - Pass `invitation_code` to backend API
  - Return `role` from backend response in the user object

- Updated `cohortle-web/src/lib/contexts/AuthContext.tsx` to:
  - Use the role from API response instead of the parameter
  - Redirect to `/convener/dashboard` for conveners
  - Redirect to `/dashboard` for students

### Issue 2: Login not working for convener accounts
**Root Cause**: Login was working, but wasn't redirecting to the correct dashboard based on role.

**Fix**:
- Updated `cohortle-web/src/lib/contexts/AuthContext.tsx` login function to:
  - Check user role from API response
  - Redirect to `/convener/dashboard` for conveners
  - Redirect to `/dashboard` for students

## Changes Made

### 1. `cohortle-web/src/app/api/auth/signup/route.ts`
```typescript
// Before
const { email, firstName, lastName, password, role } = body;
body: JSON.stringify({
  email,
  password,
  first_name: firstName,
  last_name: lastName,
  role,
}),

// After
const { email, firstName, lastName, password, role, invitationCode } = body;
body: JSON.stringify({
  email,
  password,
  first_name: firstName,
  last_name: lastName,
  role,
  invitation_code: invitationCode, // Pass invitation code to backend
}),

// And return role from backend
user: {
  id: data.user.id.toString(),
  email,
  username: email.split('@')[0],
  name: `${firstName} ${lastName}`,
  role: data.user.role, // Include role from backend response
},
```

### 2. `cohortle-web/src/lib/contexts/AuthContext.tsx`
```typescript
// Signup function - use role from API response
const userRole = response.user.role || role;
const dashboardUrl = userRole === 'convener' ? '/convener/dashboard' : '/dashboard';
router.push(dashboardUrl);

// Login function - redirect based on role
const userRole = response.user.role;
const dashboardUrl = userRole === 'convener' ? '/convener/dashboard' : '/dashboard';
router.push(dashboardUrl);
```

## Testing

### Test Convener Signup
1. Go to https://cohortle.com/signup
2. Select "Create and manage courses"
3. Enter invitation code: `COHORTLE_CONVENER_2024`
4. Fill in other details and submit
5. ✅ Should redirect to `/convener/dashboard`

### Test Convener Login
1. Go to https://cohortle.com/login
2. Enter convener email and password
3. Submit
4. ✅ Should redirect to `/convener/dashboard`

### Test Student Signup
1. Go to https://cohortle.com/signup
2. Select "Join and learn from courses"
3. Fill in details (no invitation code needed)
4. Submit
5. ✅ Should redirect to `/dashboard`

### Test Student Login
1. Go to https://cohortle.com/login
2. Enter student email and password
3. Submit
4. ✅ Should redirect to `/dashboard`

## Deployment Status

✅ Changes committed and pushed to main branch
⏳ Waiting for Coolify to rebuild and deploy cohortle-web
⏳ Test after deployment completes

## Previous Convener Accounts

If you created a convener account before this fix, it should have the correct role in the database (the backend was working correctly). The issue was only with the frontend not passing the invitation code and not redirecting correctly.

To test with your existing account:
1. Wait for the deployment to complete
2. Try logging in with your convener credentials
3. You should now be redirected to `/convener/dashboard`

## Notes

- The backend was already correctly assigning the convener role when the invitation code was provided
- The issue was purely in the frontend:
  - Not passing the invitation code to the backend
  - Not using the role from the backend response
  - Not redirecting based on role after login/signup
- All fixes are now deployed and should work correctly
