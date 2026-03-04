# Resend Email Integration - Deployment Guide

## Quick Start

### 1. Configure Resend Dashboard

#### Create Audience
1. Log in to [Resend Dashboard](https://resend.com/audiences)
2. Click "Create Audience"
3. Name: **"New signups"**
4. Copy the Audience ID (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### 2. Configure Coolify Environment Variables

Add the following environment variable to your Coolify production environment:

```bash
RESEND_AUDIENCE_ID=your-audience-id-here
```

**Note**: `RESEND_API_KEY` should already be configured from previous setup.

### 3. Deploy

Push your changes to production:

```bash
git add .
git commit -m "feat: add welcome email and audience management for new signups"
git push origin main
```

Coolify will automatically deploy the changes.

### 4. Verify Deployment

#### Test New User Registration

```powershell
# Test registration endpoint
$body = @{
    email = "test@example.com"
    password = "TestPassword123"
    first_name = "Test"
    last_name = "User"
    role = "learner"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.cohortle.com/v1/api/auth/register-email" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

#### Check Results

1. **Email Delivery**: Check test@example.com inbox for welcome email
2. **Audience Membership**: Check Resend dashboard → Audiences → "New signups"
3. **Logs**: Check Coolify logs for any errors

### 5. Monitor

#### Check Logs for Errors

In Coolify, monitor logs for:
- `[ResendService] Email sent successfully` - Email delivery success
- `[ResendService] Contact added to audience successfully` - Audience addition success
- `Failed to send welcome email` - Email delivery failure (doesn't block registration)
- `Failed to add user to audience` - Audience addition failure (doesn't block registration)

#### Resend Dashboard Metrics

Monitor in Resend dashboard:
- Email delivery rate
- Bounce rate
- Audience growth
- Failed deliveries

## Features Enabled

### Welcome Email on Registration
- Sent automatically when user registers
- Contains personalized greeting with first name
- Includes verification link
- Professional HTML template

### Audience Management
- New users automatically added to "New signups" audience
- Stores: email, first name, last name
- Handles duplicates gracefully
- Optional feature (skips if RESEND_AUDIENCE_ID not set)

### Password Reset Email
- Already working from previous implementation
- Uses Resend for delivery
- Professional HTML template with security warnings

## Troubleshooting

### Welcome Email Not Received

1. **Check Spam Folder**: Welcome emails may be filtered
2. **Check Logs**: Look for `Failed to send welcome email` in Coolify logs
3. **Verify API Key**: Ensure RESEND_API_KEY is set correctly
4. **Check Resend Dashboard**: Look for failed deliveries

### User Not Added to Audience

1. **Check RESEND_AUDIENCE_ID**: Ensure environment variable is set
2. **Check Logs**: Look for `Failed to add user to audience` in Coolify logs
3. **Verify Audience Exists**: Check Resend dashboard for audience
4. **Check Audience ID**: Ensure ID matches the one in Coolify

### Registration Still Works

Even if email sending or audience addition fails:
- User registration completes successfully
- User receives token in API response
- User can still verify email via token
- Errors are logged for monitoring

## Environment Variables Summary

| Variable | Required | Purpose | Example |
|----------|----------|---------|---------|
| RESEND_API_KEY | Yes | Resend API authentication | `re_xxxxx` |
| RESEND_AUDIENCE_ID | Optional | Audience for new signups | `xxxxxxxx-xxxx-xxxx` |
| FRONTEND_URL | Yes | Base URL for verification links | `https://cohortle.com` |

## API Endpoints

### Register New User
```
POST /v1/api/auth/register-email
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "first_name": "John",
  "last_name": "Doe",
  "role": "learner"
}
```

**Response**:
```json
{
  "error": false,
  "message": "User registered successfully. Verification email sent.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Side Effects**:
1. User account created
2. Welcome email sent with verification link
3. User added to "New signups" audience in Resend

## Testing Checklist

- [ ] RESEND_AUDIENCE_ID configured in Coolify
- [ ] "New signups" audience created in Resend
- [ ] Register test user via API
- [ ] Welcome email received in inbox
- [ ] Verification link works
- [ ] User appears in Resend audience
- [ ] Check logs for errors
- [ ] Test with invalid email (should fail gracefully)
- [ ] Test with duplicate email (should reject)

## Rollback Plan

If issues arise:

1. **Remove RESEND_AUDIENCE_ID**: Audience management will be skipped
2. **Revert Code**: Previous version still works without welcome emails
3. **No Data Loss**: User registration continues to work

## Support

For issues:
1. Check Coolify logs
2. Check Resend dashboard
3. Review `RESEND_EMAIL_TROUBLESHOOTING.md`
4. Contact development team

## Related Documentation

- `RESEND_WELCOME_EMAIL_COMPLETE.md` - Implementation details
- `RESEND_EMAIL_TROUBLESHOOTING.md` - Troubleshooting guide
- `.kiro/specs/resend-email-integration/design.md` - Full design spec
