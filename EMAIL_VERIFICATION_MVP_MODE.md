# Email Verification MVP Mode

## Overview

For the MVP launch, email verification has been made optional to enable seamless registration and onboarding. The email verification system remains fully intact and can be re-enabled at any time without code changes.

## Current Configuration (MVP Mode)

Email verification is **DISABLED** by default for MVP. Users can register and immediately access all features without verifying their email.

## How It Works

### Environment Variables

**Backend (cohortle-api/.env):**
```bash
# Set to 'false' to disable email verification (MVP mode)
# Set to 'true' or remove to enable email verification
REQUIRE_EMAIL_VERIFICATION=false
```

**Frontend (cohortle-web/.env.local):**
```bash
# Set to 'false' to hide verification banner (MVP mode)
# Set to 'true' or remove to show verification banner
NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION=false
```

### What Changes in MVP Mode

1. **Registration Flow:**
   - Users register with email and password
   - JWT token is created with `email_verified: true` (instead of false)
   - No verification token is generated
   - Welcome email is sent WITHOUT verification button

2. **Welcome Email:**
   - Personalized greeting with user's first name
   - Welcome message to Cohortle
   - Actionable CTA: "Go to Your Dashboard" button
   - No verification link or instructions

3. **Protected Routes:**
   - `requireEmailVerification` middleware allows all authenticated users
   - No 403 errors for unverified emails
   - All features immediately accessible

4. **UI Changes:**
   - Email verification banner is hidden
   - No "verify email" prompts or warnings
   - Seamless user experience

## Re-enabling Email Verification (Post-MVP)

When ready to require email verification:

### Step 1: Update Environment Variables

**Backend:**
```bash
REQUIRE_EMAIL_VERIFICATION=true
```

**Frontend:**
```bash
NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION=true
```

### Step 2: Restart Services

```bash
# Backend
cd cohortle-api
npm restart

# Frontend
cd cohortle-web
npm run build
```

### Step 3: Deploy Changes

Push the environment variable changes to your production environment (Coolify, etc.)

### What Happens After Re-enabling

1. **New Users:**
   - Must verify email before accessing protected features
   - Receive welcome email with verification button
   - See verification banner until verified

2. **Existing Users (from MVP):**
   - Already have `email_verified: true` in database
   - No action required - they remain verified
   - Continue accessing all features

3. **Protected Routes:**
   - Enforce email verification requirement
   - Return 403 for unverified users
   - Show clear error messages with resend option

## Code Locations

### Backend Files Modified

1. **cohortle-api/middleware/requireEmailVerification.js**
   - Checks `REQUIRE_EMAIL_VERIFICATION` env var
   - Bypasses verification check when disabled

2. **cohortle-api/routes/auth.js**
   - Conditionally generates verification tokens
   - Sets `email_verified` based on mode
   - Adjusts success messages

3. **cohortle-api/services/ResendService.js**
   - Welcome email template adapts to mode
   - Shows verification button OR dashboard CTA

### Frontend Files Modified

1. **cohortle-web/src/components/auth/EmailVerificationBanner.tsx**
   - Checks `NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION` env var
   - Hides banner when verification disabled

## Testing

### Test MVP Mode (Verification Disabled)

```bash
# Set environment variables
REQUIRE_EMAIL_VERIFICATION=false
NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION=false

# Test registration
curl -X POST http://localhost:3001/v1/api/auth/register-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "first_name": "Test",
    "last_name": "User"
  }'

# Expected: Success response with token, no verification required
# Check email: Should have "Go to Your Dashboard" button, no verification link
```

### Test Post-MVP Mode (Verification Enabled)

```bash
# Set environment variables
REQUIRE_EMAIL_VERIFICATION=true
NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION=true

# Test registration
curl -X POST http://localhost:3001/v1/api/auth/register-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "Test123!",
    "first_name": "Test",
    "last_name": "User"
  }'

# Expected: Success response with token, verification required
# Check email: Should have "Verify Your Email" button with verification link

# Test protected route without verification
curl -X POST http://localhost:3001/v1/api/programmes/enroll \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"enrollment_code": "TEST123"}'

# Expected: 403 Forbidden with EMAIL_VERIFICATION_REQUIRED error
```

## Benefits of This Approach

1. **Zero Code Changes:** Toggle between modes with environment variables only
2. **Preserved Functionality:** All verification code remains intact and tested
3. **Seamless MVP:** Users get immediate access without friction
4. **Easy Transition:** Re-enable verification anytime without deployment
5. **Backward Compatible:** Existing verified users unaffected when re-enabling

## Deployment Checklist

### For MVP Launch (Verification Disabled)

- [ ] Set `REQUIRE_EMAIL_VERIFICATION=false` in backend .env
- [ ] Set `NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION=false` in frontend .env
- [ ] Deploy backend with new environment variable
- [ ] Deploy frontend with new environment variable
- [ ] Test registration flow
- [ ] Verify welcome email has dashboard CTA (no verification button)
- [ ] Confirm no verification banner appears
- [ ] Test that all features are immediately accessible

### For Post-MVP (Re-enabling Verification)

- [ ] Set `REQUIRE_EMAIL_VERIFICATION=true` in backend .env
- [ ] Set `NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION=true` in frontend .env
- [ ] Deploy backend with updated environment variable
- [ ] Deploy frontend with updated environment variable
- [ ] Test registration flow
- [ ] Verify welcome email has verification button
- [ ] Confirm verification banner appears for unverified users
- [ ] Test that protected routes require verification
- [ ] Verify existing users (from MVP) remain verified

## Support

If you encounter issues:

1. Check environment variables are set correctly
2. Restart services after changing env vars
3. Clear browser cache and cookies
4. Check server logs for verification-related errors
5. Verify email service (Resend) is configured correctly

## Notes

- The verification system is fully functional and tested
- This is a configuration change, not a code removal
- All tests remain valid and will pass in both modes
- Database schema unchanged - `email_verified` field still exists
- Verification endpoints (`/verify-email`, `/resend-verification`) still work
