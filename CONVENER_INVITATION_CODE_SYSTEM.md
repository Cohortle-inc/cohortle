# Convener Invitation Code System

## Overview
Implemented a secure invitation code system for convener signup to control who can create and manage courses on the platform.

## Implementation Details

### Backend Changes (cohortle-api)

1. **Environment Variable** (`.env`)
   - Added `CONVENER_INVITATION_CODE=COHORTLE_CONVENER_2024`
   - This is a shared secret that must be provided during convener signup
   - Can be changed anytime to revoke old codes and issue new ones

2. **Auth Route Logic** (`routes/auth.js`)
   - Updated `determineRoleFromContext()` function to check invitation codes
   - Convener invitation code is validated against `CONVENER_INVITATION_CODE` env variable
   - Cohort enrollment codes still work for student enrollment
   - Clear error messages guide users when codes are invalid

### Frontend Changes (cohortle-web)

1. **SignupForm Component** (`src/components/auth/SignupForm.tsx`)
   - Added `invitationCode` state
   - Conditional invitation code field appears when "Convener" role is selected
   - Validation ensures invitation code is required for convener signup
   - Helper text guides users to contact administrator if they don't have a code

2. **AuthContext** (`src/lib/contexts/AuthContext.tsx`)
   - Updated `signup` function signature to accept optional `invitationCode` parameter
   - Passes invitation code to API during registration

3. **Auth API** (`src/lib/api/auth.ts`)
   - Updated `RegisterData` interface to include optional `invitationCode`
   - Sends invitation code to backend during registration

## How to Get the Invitation Code

### Current Code
The current convener invitation code is: **`COHORTLE_CONVENER_2024`**

### For Production
1. Set the `CONVENER_INVITATION_CODE` environment variable in Coolify
2. Share this code securely with users who should be able to sign up as conveners
3. The code can be changed anytime by updating the environment variable and restarting the API

### To Change the Code
1. Update `CONVENER_INVITATION_CODE` in `.env` (local) or Coolify (production)
2. Restart the API server
3. Share the new code with authorized users
4. Old codes will immediately stop working

## Usage

### For Conveners
1. Go to https://cohortle.com/signup
2. Fill in your details
3. Select "Create and manage courses" (Convener role)
4. Enter the invitation code: `COHORTLE_CONVENER_2024`
5. Complete signup

### For Students
- No invitation code needed
- Simply select "Join and learn from courses" and sign up

## Security Considerations

1. **Shared Secret**: The invitation code is a shared secret, not per-user
2. **Easy to Rotate**: Can be changed instantly by updating environment variable
3. **No Database Required**: Simple implementation without additional tables
4. **Clear Separation**: Students don't need codes, only conveners do

## Future Enhancements

If needed, this system can be upgraded to:
1. Per-user invitation codes with expiration dates
2. Usage tracking (how many times a code was used)
3. Multiple codes for different organizations
4. Admin dashboard to manage invitation codes

## Testing

### Local Testing
1. Ensure `.env` has `CONVENER_INVITATION_CODE=COHORTLE_CONVENER_2024`
2. Start the API: `cd cohortle-api && npm start`
3. Start the web app: `cd cohortle-web && npm run dev`
4. Try signing up as convener with and without the code

### Production Testing
1. Ensure Coolify has the environment variable set
2. Try signing up at https://cohortle.com
3. Verify error message when wrong code is used
4. Verify successful signup with correct code

## Deployment Checklist

- [ ] Set `CONVENER_INVITATION_CODE` in Coolify environment variables
- [ ] Push backend changes to trigger deployment
- [ ] Push frontend changes to trigger deployment
- [ ] Test convener signup with correct code
- [ ] Test convener signup with wrong code (should fail)
- [ ] Test student signup (should work without code)
- [ ] Share invitation code with authorized users securely

## Files Modified

### Backend
- `cohortle-api/routes/auth.js` - Updated invitation code validation logic
- `cohortle-api/.env` - Added CONVENER_INVITATION_CODE

### Frontend
- `cohortle-web/src/components/auth/SignupForm.tsx` - Added invitation code field
- `cohortle-web/src/lib/contexts/AuthContext.tsx` - Updated signup function
- `cohortle-web/src/lib/api/auth.ts` - Updated register function

## Current Status

✅ Backend logic implemented
✅ Frontend UI implemented
✅ Local environment configured
⏳ Pending: Production environment variable setup
⏳ Pending: Deployment and testing

## Next Steps

1. Commit and push changes
2. Set `CONVENER_INVITATION_CODE` in Coolify
3. Deploy to production
4. Test convener signup
5. Share invitation code with first conveners
