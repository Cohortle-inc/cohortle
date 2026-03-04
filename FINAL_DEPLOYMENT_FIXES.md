# Final Deployment Configuration Fixes

## Summary
Based on our investigation, here are ALL the environment variable changes needed to fix your production deployment.

---

## ✅ CONFIRMED: Database Name is "cohortle"

Your database admin confirmed:
- Database exists: `cohortle` (on db.cohortle.com)
- Has `programmes` table with 9 rows
- This is your production database

---

## 🔧 REQUIRED FIXES

### Fix 1: cohortle-api - Change DB_DATABASE

**Current (WRONG):**
```
DB_DATABASE=cohortle.com
```

**Change to:**
```
DB_DATABASE=cohortle
```

**Why:** Database names cannot contain dots. The API is trying to connect to a database called "cohortle.com" which doesn't exist. This is causing all your 400 errors.

---

### Fix 2: cohortle-api - Change NODE_ENV

**Current (WRONG):**
```
NODE_ENV=development
```

**Change to:**
```
NODE_ENV=production
```

**Availability:** Runtime ONLY (uncheck Buildtime)

**Why:** Running in development mode in production causes performance issues and unexpected behavior.

---

### Fix 3: cohortle-web - Make NEXT_PUBLIC_API_URL Available at Build Time

**Current (WRONG):**
```
NEXT_PUBLIC_API_URL=https://api.cohortle.com
  Availability: Runtime only
```

**Change to:**
```
NEXT_PUBLIC_API_URL=https://api.cohortle.com
  Availability: Build Time AND Runtime
```

**Why:** Next.js needs this at build time to embed the API URL into the JavaScript bundle. Without it, the app doesn't know where to send API requests.

---

### Fix 4: cohortle-api - Add FRONTEND_URL (if not already set)

**Add:**
```
FRONTEND_URL=https://cohortle.com
```

**Availability:** Runtime only

**Why:** Used for generating password reset links in emails.

---

## 📋 COMPLETE CONFIGURATION

### cohortle-api Environment Variables:

```bash
# Database Configuration
DB_HOSTNAME=u08gs4kgcogg8kc4k44s0ggk
DB_PORT=3306
DB_USER=<your-db-user>
DB_PASSWORD=<your-db-password>
DB_DATABASE=cohortle  # ← FIX THIS

# Application
NODE_ENV=production  # ← FIX THIS (Runtime only)
PORT=3001  # Optional - Coolify usually sets this

# Security
JWT_SECRET=<your-jwt-secret>

# Frontend URL
FRONTEND_URL=https://cohortle.com  # ← ADD THIS if missing

# Email Configuration (if using email)
MAIL_HOST=<your-mail-host>
MAIL_PORT=<your-mail-port>
MAIL_USER=<your-mail-user>
MAIL_PASS=<your-mail-password>
MAIL_FROM=<your-from-email>

# Bunny Stream (if using video)
BUNNY_STREAM_API_KEY=<your-api-key>
BUNNY_STREAM_LIBRARY_ID=<your-library-id>
```

**All variables:**
- ☐ Buildtime (UNCHECKED)
- ☑ Runtime (CHECKED)

---

### cohortle-web Environment Variables:

```bash
NEXT_PUBLIC_API_URL=https://api.cohortle.com  # ← FIX AVAILABILITY
```

**Availability:**
- ☑ Buildtime (CHECKED)  # ← FIX THIS
- ☑ Runtime (CHECKED)

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Update cohortle-api Configuration

1. Go to Coolify → cohortle-api → Environment Variables
2. Change `DB_DATABASE` from `cohortle.com` to `cohortle`
3. Change `NODE_ENV` from `development` to `production`
4. For `NODE_ENV`: Uncheck "Buildtime", keep "Runtime" checked
5. Add `FRONTEND_URL=https://cohortle.com` if not present
6. Save changes

### Step 2: Update cohortle-web Configuration

1. Go to Coolify → cohortle-web → Environment Variables
2. Find `NEXT_PUBLIC_API_URL`
3. Check BOTH "Buildtime" AND "Runtime"
4. Save changes

### Step 3: Redeploy Both Services

1. **Clear build cache** for both services (if option available)
2. **Redeploy cohortle-api** first
   - Wait for deployment to complete
   - Check logs for any errors
3. **Redeploy cohortle-web** second
   - Wait for deployment to complete
   - Check logs for any errors

### Step 4: Test the Application

1. **Hard refresh browser:** Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Test login:** Should work
3. **Test dashboard:** Should load programmes without 400 errors
4. **Test programme page:** Should show Continue Learning button
5. **Check browser console:** Should have no errors

---

## ✅ EXPECTED RESULTS AFTER FIX

Once you make these changes and redeploy:

✅ API connects to correct database (`cohortle`)  
✅ No more 400 errors when loading programmes  
✅ Programmes load correctly on dashboard  
✅ Continue Learning button appears on programme pages  
✅ Role detection works correctly  
✅ All links work properly  
✅ Create programme functionality works  
✅ App runs in production mode with proper optimizations  

---

## 🔍 IF ISSUES PERSIST

If you still see problems after making these changes:

1. **Check deployment logs** for both services
2. **Run the browser test:** Open https://cohortle.com, press F12, paste contents of `test-production-browser.js` in console
3. **Check Network tab:** Look for failed API requests and their error messages
4. **Verify environment variables:** Double-check they were saved correctly in Coolify

---

## 📝 SUMMARY OF CHANGES

| Service | Variable | Current Value | New Value | Availability |
|---------|----------|---------------|-----------|--------------|
| cohortle-api | DB_DATABASE | cohortle.com | cohortle | Runtime only |
| cohortle-api | NODE_ENV | development | production | Runtime only |
| cohortle-api | FRONTEND_URL | (missing?) | https://cohortle.com | Runtime only |
| cohortle-web | NEXT_PUBLIC_API_URL | (value OK) | (value OK) | Build + Runtime |

---

## 🎯 PRIORITY

**Critical (Fix Now):**
1. DB_DATABASE → `cohortle`
2. NODE_ENV → `production`
3. NEXT_PUBLIC_API_URL → Available at build time

**Important (Add if missing):**
4. FRONTEND_URL → `https://cohortle.com`

These four changes will fix all your deployment issues.
