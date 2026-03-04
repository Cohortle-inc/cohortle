# FRONTEND_URL Configuration

## Summary
`FRONTEND_URL` is used in **cohortle-api** for generating password reset links in emails.

---

## Where It's Used

### cohortle-api/routes/auth.js

#### Password Reset Email (Line 362):
```javascript
const link = `${process.env.FRONTEND_URL}/auth/reset?t=${token}`;
```

This generates a link like:
```
https://cohortle.com/auth/reset?t=abc123token
```

#### Email Verification (Line 116 - COMMENTED OUT):
```javascript
// const link = `${process.env.FRONTEND_URL}/auth/verify?t=${token}`;
```

This is currently commented out, so it's not being used.

---

## Configuration Required

### For cohortle-api:

```bash
FRONTEND_URL=https://cohortle.com
```

**Availability:**
- ☐ Buildtime (UNCHECKED - not needed)
- ☑ Runtime (CHECKED - needed when sending emails)

**Why Runtime Only:**
- This variable is only used when the API sends password reset emails
- It's not needed during the build process
- Only needs to be available when the application is running

---

## Complete cohortle-api Environment Variables

Here's the full list of what you need:

```bash
# Database
DB_HOSTNAME=u08gs4kgcogg8kc4k44s0ggk
DB_PORT=3306
DB_USER=<your-db-user>
DB_PASSWORD=<your-db-password>
DB_DATABASE=<actual-database-name>  # NOT "cohortle.com"

# Application
NODE_ENV=production
PORT=3001

# Security
JWT_SECRET=<your-jwt-secret>

# Frontend URL (for email links)
FRONTEND_URL=https://cohortle.com

# Email Configuration (if using email features)
MAIL_HOST=<your-mail-host>
MAIL_PORT=<your-mail-port>
MAIL_USER=<your-mail-user>
MAIL_PASS=<your-mail-password>
MAIL_FROM=<your-from-email>

# Bunny Stream (if using video)
BUNNY_STREAM_API_KEY=<your-api-key>
BUNNY_STREAM_LIBRARY_ID=<your-library-id>
```

**All variables should be:**
- ☐ Buildtime (UNCHECKED)
- ☑ Runtime (CHECKED)

---

## Why FRONTEND_URL Matters

### Without FRONTEND_URL:
When a user requests a password reset:
```javascript
const link = `${undefined}/auth/reset?t=${token}`;
// Result: "undefined/auth/reset?t=abc123"
```

The email will contain a broken link.

### With FRONTEND_URL:
```javascript
const link = `${process.env.FRONTEND_URL}/auth/reset?t=${token}`;
// Result: "https://cohortle.com/auth/reset?t=abc123"
```

The email will contain a working link that takes users to your password reset page.

---

## Quick Setup in Coolify

### For cohortle-api:

Add this variable:
```
FRONTEND_URL=https://cohortle.com
  ☐ Buildtime (UNCHECKED)
  ☑ Runtime (CHECKED)
```

---

## Summary

**FRONTEND_URL is required for cohortle-api** to generate correct password reset links in emails.

- **Service:** cohortle-api only
- **Value:** `https://cohortle.com`
- **Availability:** Runtime only
- **Purpose:** Generate email links for password reset
