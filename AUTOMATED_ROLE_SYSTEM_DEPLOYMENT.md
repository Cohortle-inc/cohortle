# Automated Role System Deployment

**Date:** March 5, 2026  
**Status:** Production Ready - Automated

---

## Overview

The role system is now **fully automated** and will initialize automatically on every production deployment. No manual intervention required!

---

## What Happens Automatically

When you deploy to production (or restart the server), the system automatically:

1. ✅ **Runs the seeder** - Populates roles and permissions (if not already done)
2. ✅ **Assigns roles to users** - All users without roles get the `student` role
3. ✅ **Creates administrator** - `teamcohortle@gmail.com` is promoted to administrator
4. ✅ **Verifies setup** - Checks that everything is configured correctly

All of this happens in the background during server startup. The process is:
- **Idempotent** - Safe to run multiple times
- **Non-blocking** - Server starts even if role init has issues
- **Silent in production** - Minimal logging to avoid noise

---

## How It Works

### Automatic Initialization

The role system initialization is integrated into the server startup process (`bin/www`):

```javascript
if (process.env.NODE_ENV === 'production') {
  initializeRoleSystem().catch(error => {
    console.error("⚠️  Role system initialization failed:", error.message);
    console.error("   Server will continue, but role system may not be fully configured.");
  });
}
```

This runs automatically when:
- You deploy to production
- You restart the production server
- The application starts in production mode

### Administrator Account

The system automatically assigns `teamcohortle@gmail.com` as the platform administrator:
- If the user exists, they're promoted to administrator
- If the user doesn't exist yet, they'll be assigned admin role when they register
- This happens on every deployment (idempotent - won't duplicate)

---

## Manual Commands (Optional)

While the system runs automatically, you can also run these commands manually if needed:

### Initialize Role System
```bash
npm run roles:init
```
Runs the complete initialization (seeder + role assignment + admin creation)

### Verify Role System
```bash
npm run roles:verify
```
Checks that the role system is properly configured

### Assign Roles to Users
```bash
npm run roles:assign
```
Assigns student role to users without roles

### Create Administrator
```bash
npm run roles:admin teamcohortle@gmail.com
```
Promotes a specific user to administrator

---

## Environment Variables

### Optional Configuration

You can control the role system initialization with these environment variables:

```bash
# Disable automatic role initialization (not recommended)
ROLE_INIT_DISABLED=true

# Enable silent mode (less logging)
ROLE_INIT_SILENT=true
```

Add these to your `.env` file or deployment platform if needed.

---

## Deployment Checklist

When deploying to production:

- [x] Migrations run automatically (already configured)
- [x] Role system initializes automatically (now configured)
- [x] Administrator account created automatically (teamcohortle@gmail.com)
- [ ] Verify deployment was successful (check logs)

That's it! Everything else is automatic.

---

## Verification After Deployment

### Check Server Logs

After deployment, check the logs for:

```
🔧 Initializing Role System...

✅ Step 1: Running seeder for roles and permissions...
✅ Step 2: Assigning roles to users without roles...
✅ Step 3: Setting up administrator (teamcohortle@gmail.com)...
✅ Step 4: Verifying role system setup...

✅ Role system initialized successfully in 2.34s
```

### Test Administrator Access

1. Log in as `teamcohortle@gmail.com`
2. Verify you can access admin endpoints:
   ```bash
   curl https://api.cohortle.com/v1/api/roles \
     -H "Authorization: Bearer {your-token}"
   ```
3. You should see all roles and have full access

### Test New User Registration

1. Register a new user
2. Verify they automatically get `student` role
3. Verify they can access student features

---

## What If Something Goes Wrong?

### Scenario 1: Role initialization fails

**What happens:**
- Server logs an error but continues to start
- Role system may not be fully configured

**Solution:**
```bash
# SSH into production server
cd cohortle-api

# Run initialization manually
npm run roles:init

# Verify it worked
npm run roles:verify
```

### Scenario 2: Administrator not created

**What happens:**
- `teamcohortle@gmail.com` user doesn't exist yet
- System logs a warning but continues

**Solution:**
- User will be assigned admin role when they register
- Or run manually after user registers:
  ```bash
  npm run roles:admin teamcohortle@gmail.com
  ```

### Scenario 3: Users don't have roles

**What happens:**
- Some users might not have roles assigned

**Solution:**
```bash
# Assign roles to all users without roles
npm run roles:assign
```

---

## Technical Details

### Files Created

**Automated initialization:**
- `cohortle-api/scripts/initialize-role-system.js` - Main initialization script
- `cohortle-api/bin/www` - Updated to run initialization on startup

**Manual scripts (optional):**
- `cohortle-api/scripts/assign-roles-to-existing-users.js`
- `cohortle-api/scripts/create-admin-user.js`
- `cohortle-api/scripts/verify-role-system.js`

**Helper scripts:**
- `cohortle-api/seed-roles-production.sh` / `.ps1`
- `cohortle-api/assign-roles-production.sh` / `.ps1`
- `cohortle-api/create-admin-production.sh` / `.ps1`

### NPM Scripts Added

```json
{
  "scripts": {
    "roles:init": "node scripts/initialize-role-system.js",
    "roles:verify": "node scripts/verify-role-system.js",
    "roles:assign": "node scripts/assign-roles-to-existing-users.js",
    "roles:admin": "node scripts/create-admin-user.js"
  }
}
```

### Startup Sequence

1. Environment validation (`validateAndFailFast`)
2. **Role system initialization** (production only, async)
3. Server starts listening on port
4. Application ready to accept requests

The role initialization runs asynchronously and doesn't block server startup.

---

## Security Notes

### Administrator Email

The administrator email (`teamcohortle@gmail.com`) is hardcoded in:
- `cohortle-api/scripts/initialize-role-system.js`

To change it:
1. Edit the `ADMIN_EMAIL` constant in the script
2. Redeploy

### Multiple Administrators

To create additional administrators:

```bash
# On production server
npm run roles:admin another-admin@example.com

# Or via API (as existing admin)
curl -X PUT https://api.cohortle.com/v1/api/users/{userId}/role \
  -H "Authorization: Bearer {admin-token}" \
  -H "Content-Type: application/json" \
  -d '{"role": "administrator", "reason": "Additional platform admin"}'
```

---

## Monitoring

### What to Monitor

After deployment, monitor:
- Server startup logs for role initialization messages
- Error logs for any role-related failures
- User login success rates
- Administrator access to admin endpoints

### Success Indicators

✅ Server starts successfully  
✅ Role initialization completes in logs  
✅ `teamcohortle@gmail.com` can access admin features  
✅ New users get `student` role automatically  
✅ No authentication/authorization errors in logs

---

## Rollback

If you need to rollback the role system:

### Disable Automatic Initialization

Add to `.env`:
```bash
ROLE_INIT_DISABLED=true
```

### Rollback Database

```bash
# Restore from backup
mysql -h {host} -u {user} -p {database} < backup_file.sql
```

---

## Summary

🎉 **The role system is now fully automated!**

- ✅ No manual steps required
- ✅ Runs on every deployment
- ✅ `teamcohortle@gmail.com` automatically becomes administrator
- ✅ All users automatically get roles
- ✅ Safe to run multiple times (idempotent)

Just deploy and it works!

---

## Next Steps

After successful deployment:

1. ✅ Log in as `teamcohortle@gmail.com` to verify admin access
2. ✅ Test creating a new user to verify they get student role
3. ✅ Promote additional users to convener/admin as needed
4. ✅ Monitor logs for any issues

---

*Last Updated: March 5, 2026*  
*Document Version: 1.0*  
*Automation Status: Fully Automated*
