# Password Reset Issue Fix Guide

## Problem Summary

The password reset functionality is failing with a 401 Unauthorized error. The issue is a **JWT_SECRET mismatch** between the token creation and verification.

### What's Happening:

1. ✅ **Forgot password works** - Creates token and sends email successfully
2. ❌ **Reset password fails** - Returns 401 Unauthorized when trying to verify the token
3. 🔍 **Root cause** - The token was created with a different JWT_SECRET than what's currently configured

## Analysis

From the logs:
- Token created successfully: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Token contains valid data: user_id=3, email=teamcohortle@gmail.com, role=student
- Token is not expired (expires at 1773351549, current time is earlier)
- But token verification fails with "invalid signature"

## Immediate Fix (Working Reset Link)

I've generated a new working reset password link with the current JWT_SECRET:

```
https://cohortle.com/reset-password?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJlbWFpbCI6InRlYW1jb2hvcnRsZUBnbWFpbC5jb20iLCJyb2xlIjoic3R1ZGVudCIsInBlcm1pc3Npb25zIjpbInZpZXdfZGFzaGJvYXJkIiwiZW5yb2xsX3Byb2dyYW1tZSIsInZpZXdfbGVzc29ucyIsImNvbXBsZXRlX2xlc3NvbnMiLCJwYXJ0aWNpcGF0ZV9jb21tdW5pdHkiXSwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJpYXQiOjE3NzMzNTA3NTksImV4cCI6MTc3MzM1NDM1OX0.K5YqQC9aH5zw6_ki0V4RbvyVNOSxc3nnR78A4YrclEo
```

**Use this link immediately** - it expires in 1 hour from generation.

## Permanent Fix

The current JWT_SECRET is set to the default value: `your-secret-key-change-in-production`

### Option 1: Update JWT_SECRET in Production (Recommended)

1. **Generate a secure JWT secret:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Update the JWT_SECRET in your production environment** (Coolify/Docker):
   - Go to your deployment environment
   - Update the `JWT_SECRET` environment variable
   - Restart the application

3. **Important:** This will invalidate all existing tokens, so users will need to log in again.

### Option 2: Keep Current Secret (Quick Fix)

If you want to avoid invalidating existing user sessions, ensure the JWT_SECRET in production matches what was used to create the original tokens.

## Testing the Fix

After implementing either option, test with:

```bash
# Test forgot password
curl -X POST "https://cohortle.com/v1/api/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email": "teamcohortle@gmail.com"}'

# Then use the reset link from the email
```

## Prevention

1. **Set a proper JWT_SECRET in production** - Never use default values
2. **Use environment-specific secrets** - Different secrets for dev/staging/production
3. **Document secret changes** - Keep track of when JWT_SECRET is updated
4. **Monitor token verification errors** - Set up alerts for 401 errors on auth endpoints

## Files Modified

- `cohortle-api/fix-reset-password-token.js` - Script to generate working tokens
- `cohortle-api/.env` - Contains the current JWT_SECRET configuration

## Next Steps

1. ✅ Use the immediate fix link above to reset the password
2. 🔧 Implement the permanent fix by updating JWT_SECRET
3. 🧪 Test the complete forgot/reset password flow
4. 📝 Update deployment documentation with proper JWT_SECRET setup