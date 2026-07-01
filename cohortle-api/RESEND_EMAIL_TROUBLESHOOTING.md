# Resend Email Troubleshooting Guide

## Issue
The forgot-password endpoint returns 200 success, but users don't receive the password reset email.

## Root Cause
The production environment is missing the `RESEND_API_KEY` environment variable, or the key is invalid. The previous implementation didn't check if email sending failed, so it returned 200 success even when emails weren't sent.

## Fix Applied
1. Added error handling in `/v1/api/auth/forgot-password` route to check if email sending fails
2. Now returns 500 error if email fails to send (instead of 200 success)
3. Added detailed logging to track email sending process
4. Created diagnostic script to verify Resend configuration

## Steps to Fix Production

### 1. Verify RESEND_API_KEY in Coolify

1. Go to your Coolify dashboard
2. Navigate to the `cohortle-api` service
3. Go to Environment Variables section
4. Check if `RESEND_API_KEY` exists and has a valid value

**Expected format:** `re_xxxxxxxxxxxxxxxxxxxxxxxxxx`

If missing or invalid:
- Get your API key from [Resend Dashboard](https://resend.com/api-keys)
- Add/update the `RESEND_API_KEY` environment variable in Coolify
- Restart the `cohortle-api` service

### 2. Run Diagnostic Script (Optional)

SSH into your production server and run:

```bash
cd /path/to/cohortle-api
node diagnose-resend.js
```

This will check:
- ✓ RESEND_API_KEY is set
- ✓ Resend client initializes correctly
- ✓ ResendService is available
- ✓ Sender email configuration

### 3. Test Email Sending

After deploying the fix and setting RESEND_API_KEY:

```bash
curl -X POST https://api.cohortle.com/v1/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@example.com"}'
```

**Expected responses:**

✓ **Success (email sent):**
```json
{
  "error": false,
  "message": "password reset requested",
  "link": "https://cohortle.com/auth/reset?t=..."
}
```

✗ **Failure (RESEND_API_KEY missing):**
```json
{
  "error": true,
  "message": "Failed to send password reset email. Please try again later."
}
```

### 4. Check Production Logs

Look for these log messages in Coolify logs:

**Success:**
```
[ResendService] Attempting to send email: { to: '...', type: 'password_reset', ... }
[ResendService] Email sent successfully: { to: '...', messageId: '...' }
```

**Failure (missing API key):**
```
[ResendService] CRITICAL: Email service is not configured. RESEND_API_KEY is missing.
[ResendService] Email sending failed: { error: '...', ... }
Failed to send password reset email: Email service is not configured
```

## Resend Domain Configuration

Make sure your sending domain is verified in Resend:

1. Go to [Resend Dashboard > Domains](https://resend.com/domains)
2. Verify that `mail.cohortle.com` is added and verified
3. Check DNS records are properly configured:
   - SPF record
   - DKIM record
   - DMARC record (optional but recommended)

## Email Templates

The implementation uses code-based templates (HTML generated in `ResendService.js`). Available templates:

- `welcome` - Welcome email with optional verification link
- `password_reset` - Password reset email with reset link
- `enrollment_confirmation` - Enrollment confirmation with programme details
- `notification` - Generic notification email

## Testing Locally

To test locally, add to `cohortle-api/.env`:

```env
RESEND_API_KEY=re_your_test_api_key_here
```

Then test the forgot-password endpoint:

```bash
npm start
# In another terminal:
curl -X POST http://localhost:3000/v1/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## Next Steps

1. ✓ Deploy the fix to production (push to main branch)
2. ⚠ Verify RESEND_API_KEY is set in Coolify
3. ⚠ Test forgot-password endpoint
4. ⚠ Check production logs for email sending confirmation
5. ⚠ Verify email delivery to a test email address

## Support

If emails still don't send after following these steps:

1. Check Resend dashboard for API usage and errors
2. Verify domain DNS records are correct
3. Check Resend API key permissions
4. Review production logs for detailed error messages
