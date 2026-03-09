# Email Verification - Quick Reference

## Current Status: DISABLED (MVP Mode)

Email verification is currently **disabled** for seamless MVP onboarding.

## Environment Variables

| Variable | Location | Current Value | Purpose |
|----------|----------|---------------|---------|
| `REQUIRE_EMAIL_VERIFICATION` | Backend `.env` | `false` | Controls verification requirement |
| `NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION` | Frontend `.env.local` | `false` | Controls verification UI |

## Quick Toggle

### Disable Verification (MVP Mode)
```bash
# Backend
REQUIRE_EMAIL_VERIFICATION=false

# Frontend
NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION=false
```

### Enable Verification (Post-MVP)
```bash
# Backend
REQUIRE_EMAIL_VERIFICATION=true

# Frontend
NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION=true
```

## What Happens in Each Mode

### MVP Mode (Disabled)
- ✅ Users register and get immediate access
- ✅ JWT token has `email_verified: true`
- ✅ Welcome email with "Go to Dashboard" CTA
- ✅ No verification banner shown
- ✅ No 403 errors on protected routes

### Post-MVP Mode (Enabled)
- 📧 Users must verify email to access features
- 📧 JWT token has `email_verified: false`
- 📧 Welcome email with "Verify Email" button
- 📧 Verification banner shown until verified
- 📧 403 errors on protected routes until verified

## Files Changed

```
cohortle-api/
├── middleware/requireEmailVerification.js  ← Checks env var
├── routes/auth.js                          ← Conditional token generation
├── services/ResendService.js               ← Adaptive email template
└── .env                                    ← New env var

cohortle-web/
├── src/components/auth/EmailVerificationBanner.tsx  ← Checks env var
├── .env.local                                       ← New env var
└── .env.example                                     ← New env var
```

## Testing Commands

### Test Registration (MVP Mode)
```bash
curl -X POST http://localhost:3001/v1/api/auth/register-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","first_name":"Test","last_name":"User"}'

# Expected: Success, immediate access, no verification needed
```

### Test Protected Route (MVP Mode)
```bash
curl -X POST http://localhost:3001/v1/api/programmes/enroll \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"enrollment_code":"TEST123"}'

# Expected: Success (no 403 error)
```

## Deployment Checklist

- [ ] Set `REQUIRE_EMAIL_VERIFICATION=false` in production backend
- [ ] Set `NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION=false` in production frontend
- [ ] Restart backend service
- [ ] Rebuild and restart frontend
- [ ] Test registration flow
- [ ] Check welcome email format
- [ ] Verify no verification banner appears
- [ ] Confirm immediate feature access

## Rollback Plan

If issues occur, re-enable verification:

1. Set both env vars to `true`
2. Restart services
3. System returns to full verification mode

## Support

- 📖 Full documentation: `EMAIL_VERIFICATION_MVP_MODE.md`
- 📋 Summary: `EMAIL_VERIFICATION_DISABLED_FOR_MVP.md`
- 🔧 This quick reference: `QUICK_REFERENCE_EMAIL_VERIFICATION.md`

---

**Last Updated:** March 9, 2026
**Status:** ✅ Ready for MVP deployment
