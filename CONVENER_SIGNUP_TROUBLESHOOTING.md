# Convener Signup Troubleshooting Guide

## Issue: 400 Error on Convener Signup

### Recent Changes
- ✅ Added whitespace trimming to invitation code comparison (backend)
- ✅ Added whitespace trimming to invitation code input (frontend)
- ✅ Added debug logging to see exact codes being compared

### Possible Causes

1. **Environment Variable Not Set in Coolify**
   - The `CONVENER_INVITATION_CODE` might not be set in production
   - Or it might have extra quotes/whitespace

2. **Environment Variable Format Issues**
   - Coolify might be adding quotes: `"COHORTLE_CONVENER_2024"` instead of `COHORTLE_CONVENER_2024`
   - There might be trailing whitespace

3. **User Input Issues**
   - User might be copying/pasting with extra spaces (now fixed with trim)
   - Case sensitivity (code is case-sensitive by design)

### How to Diagnose

#### Step 1: Check Coolify Environment Variables
1. Log into Coolify
2. Go to cohortle-api service
3. Check Environment Variables section
4. Verify `CONVENER_INVITATION_CODE` is set to: `COHORTLE_CONVENER_2024`
5. Make sure there are NO quotes around the value
6. Make sure there's NO trailing whitespace

#### Step 2: Check Production Logs
After the deployment completes, watch the logs when someone tries to sign up:
```
Request URL: /v1/api/auth/register-email
Invitation code validation: { input: '...', expected: '...', match: false }
```

This will show you exactly what codes are being compared.

#### Step 3: Test with the Script
Run the test script to see the exact error:
```powershell
.\test-convener-signup.ps1
```

This will show you the exact error message from the API.

### Solutions

#### Solution 1: Verify Environment Variable Format
In Coolify, the environment variable should be set as:
```
CONVENER_INVITATION_CODE=COHORTLE_CONVENER_2024
```

NOT:
```
CONVENER_INVITATION_CODE="COHORTLE_CONVENER_2024"  # ❌ No quotes
CONVENER_INVITATION_CODE=COHORTLE_CONVENER_2024    # ❌ No trailing space
```

#### Solution 2: Check for Quotes in Environment Variable
If Coolify is adding quotes, the backend will see `"COHORTLE_CONVENER_2024"` instead of `COHORTLE_CONVENER_2024`.

To fix this, we can update the backend to strip quotes:
```javascript
const convenerInvitationCode = (process.env.CONVENER_INVITATION_CODE || 'COHORTLE_CONVENER_2024')
  .trim()
  .replace(/^["']|["']$/g, ''); // Remove leading/trailing quotes
```

#### Solution 3: Use Default Value
The code already has a fallback to `COHORTLE_CONVENER_2024` if the env variable isn't set. So even without setting it in Coolify, it should work.

### Testing After Fix

1. **Wait for deployment to complete** (both API and web)
2. **Try signing up as convener** at https://cohortle.com/signup
3. **Check the logs** in Coolify for the debug output
4. **Look for the validation log**:
   ```
   Invitation code validation: { input: 'COHORTLE_CONVENER_2024', expected: 'COHORTLE_CONVENER_2024', match: true }
   ```

### Expected Behavior

#### Successful Convener Signup
- User selects "Create and manage courses"
- User enters invitation code: `COHORTLE_CONVENER_2024`
- User submits form
- Account is created with convener role
- User receives verification email
- User is redirected to dashboard

#### Failed Convener Signup (Wrong Code)
- User enters wrong invitation code
- API returns 400 error with message: "Invalid invitation code. For convener access, please contact an administrator..."
- User sees error message on form

#### Successful Student Signup (No Code Needed)
- User selects "Join and learn from courses"
- User does NOT see invitation code field
- User submits form
- Account is created with student role
- User receives verification email
- User is redirected to dashboard

### Current Status

✅ Code deployed to production
⏳ Waiting for Coolify to rebuild and restart services
⏳ Need to verify environment variable is set correctly
⏳ Need to test actual signup

### Next Steps

1. Verify `CONVENER_INVITATION_CODE` is set in Coolify (no quotes, no whitespace)
2. Wait for deployment to complete
3. Run `.\test-convener-signup.ps1` to test
4. Check production logs for debug output
5. Try actual signup at https://cohortle.com/signup
6. If still failing, check the debug logs to see what codes are being compared

### Debug Logs to Look For

```
Invitation code validation: {
  input: 'COHORTLE_CONVENER_2024',
  expected: 'COHORTLE_CONVENER_2024',
  match: true
}
```

If `match: false`, the log will show you exactly what's different between the input and expected values.

### Contact

If the issue persists after checking all of the above, the debug logs will tell us exactly what's wrong.
