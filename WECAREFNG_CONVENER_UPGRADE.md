# Convener Role Upgrade for wecarefng@gmail.com

## Summary

Created an automatic migration to upgrade `wecarefng@gmail.com` to convener role on deployment.

## What Was Done

### 1. Migration Created
- **File**: `cohortle-api/migrations/20260309100000-upgrade-wecarefng-to-convener.js`
- **Purpose**: Automatically upgrades wecarefng@gmail.com to convener role when migrations run
- **Behavior**: 
  - Finds user by email
  - Updates their role_id to convener
  - Creates role assignment history record
  - Idempotent (safe to run multiple times)
  - Skips if user not found or already has convener role

### 2. How It Works

The migration will run automatically when:
- Deploying to production (if auto-migrations are enabled)
- Running `npm run migrate` manually on the server
- Running migrations via the deployment process

### 3. What Happens

```
🔍 Looking up user: wecarefng@gmail.com
✅ User found: [Name] (ID: [ID])
✅ Updated user role_id to convener
✅ Created role assignment history record
✨ Successfully upgraded wecarefng@gmail.com to convener role!
```

## Deployment

### Automatic (Recommended)
The migration will run automatically on next deployment if auto-migrations are enabled in your deployment pipeline.

### Manual (If Needed)
If you need to run it manually on the production server:

```bash
cd cohortle-api
npm run migrate
```

Or using the Node.js migration runner:

```bash
cd cohortle-api
node_modules/.bin/sequelize-cli db:migrate
```

## Verification

After deployment, verify the upgrade:

1. **Check user role in database**:
   ```sql
   SELECT u.id, u.email, u.first_name, u.last_name, r.name as role
   FROM users u
   LEFT JOIN roles r ON u.role_id = r.role_id
   WHERE u.email = 'wecarefng@gmail.com';
   ```

2. **Check role assignment history**:
   ```sql
   SELECT * FROM role_assignment_history
   WHERE user_id = (SELECT id FROM users WHERE email = 'wecarefng@gmail.com')
   ORDER BY assigned_at DESC
   LIMIT 1;
   ```

3. **Test login**:
   - User should be able to log in at https://cohortle.com/login
   - After login, should be redirected to `/convener/dashboard`
   - Should have access to convener features

## Rollback

If needed, the migration can be rolled back:

```bash
cd cohortle-api
npm run migrate:undo
```

This will revert the user back to student role.

## Additional Scripts Created

For manual execution if needed (not required for automatic deployment):

1. **Node.js Script**: `cohortle-api/upgrade-user-to-convener.js`
   - Can upgrade any user by email
   - Usage: `node upgrade-user-to-convener.js <email>`

2. **PowerShell Script**: `upgrade-wecarefng-to-convener.ps1`
   - Windows server execution

3. **Bash Script**: `upgrade-wecarefng-to-convener.sh`
   - Linux server execution

## Notes

- The migration is idempotent and safe to run multiple times
- If the user doesn't exist yet, the migration will skip gracefully
- The migration creates a proper audit trail in role_assignment_history
- The user will need to log out and log back in for the role change to take effect in their JWT token

## Next Steps

1. Deploy the code (migration will run automatically)
2. Verify the user has convener role
3. Notify wecarefng@gmail.com that they now have convener access
4. User should log out and log back in to get updated permissions
