# Deployment Monitoring Guide

## What to Watch For

### 1. Coolify Deployment Detection
Coolify should automatically detect the new commit and start deploying:
- Repository: `Cohortle-inc/cohortle-api`
- Branch: `main`
- Commit: `8a51f7d` - "Fix: Correct user_id to id in role initialization script"

### 2. Build Phase
Watch for:
```
✓ Installing dependencies
✓ Running migrations
✓ Building application
```

### 3. Startup Phase
**CRITICAL**: Watch for role system initialization in the logs:

#### Success Indicators:
```
🔧 Initializing Role System...
Step 1: Running seeder for roles and permissions...
✅ Roles already exist, skipping seeder
Step 2: Assigning roles to users without roles...
Found 51 users without roles, assigning student role...
✅ Assigned student role to 51 users
Step 3: Setting up administrator (testaconvener@cohortle.com)...
✅ testaconvener@cohortle.com promoted to administrator
Step 4: Verifying role system setup...
Found 1 administrator(s)
✅ Role system verification complete
✅ Role system initialized successfully in X.XXs
```

#### Failure Indicators (Should NOT See):
```
❌ Failed to assign roles: Unknown column 'u.user_id' in 'field list'
❌ Failed to create administrator: Unknown column 'user_id' in 'field list'
```

### 4. Application Health
After startup, verify:
```
Listening on port: 3000
✅ Environment validation passed
```

## Testing Steps

### Step 1: Verify Role Initialization (Immediate)
1. Open Coolify dashboard
2. Navigate to cohortle-api application
3. Click on "Logs" tab
4. Look for the role initialization messages
5. Confirm all steps show ✅ success

### Step 2: Test Administrator Login (5 minutes after deployment)
1. Open production site: https://cohortle.com
2. Log in with: testaconvener@cohortle.com
3. Verify you see administrator-level features
4. Check that role is displayed correctly

### Step 3: Test New User Registration (Optional)
1. Register a new test user
2. Log in with the new account
3. Verify the user has "student" role
4. Check that student-level features are accessible

### Step 4: Verify Existing Users (Optional)
1. Log in with an existing user account
2. Verify they can access their enrolled programmes
3. Check that role-based permissions work correctly

## Troubleshooting

### If Role Initialization Fails

#### Check 1: Database Connection
```bash
# On production server
mysql -h $DB_HOSTNAME -u $DB_USER -p$DB_PASSWORD $DB_DATABASE -e "SELECT COUNT(*) FROM users;"
```

#### Check 2: Roles Table
```bash
mysql -h $DB_HOSTNAME -u $DB_USER -p$DB_PASSWORD $DB_DATABASE -e "SELECT * FROM roles;"
```

Should show 5 roles:
- administrator (level 1)
- convener (level 2)
- learner (level 3)
- student (level 4)
- guest (level 5)

#### Check 3: Users Table Schema
```bash
mysql -h $DB_HOSTNAME -u $DB_USER -p$DB_PASSWORD $DB_DATABASE -e "DESCRIBE users;"
```

Verify primary key is `id` (not `user_id`)

#### Check 4: Manual Role Assignment
If automatic initialization fails, run manually:
```bash
cd /path/to/cohortle-api
npm run roles:init
```

### If WebSocket Error Persists

#### Check 1: Environment Variables
In Coolify, verify:
```
NODE_ENV=production
```

#### Check 2: Build Command
Should be:
```
npm run build
```

NOT:
```
npm run dev
```

#### Check 3: Start Command
Should be:
```
npm start
```

#### Check 4: Force Clean Build
In Coolify:
1. Go to cohortle-web application
2. Click "Redeploy"
3. Enable "Force rebuild" option
4. Deploy

## Success Metrics

### Immediate (Within 5 minutes):
- ✅ Deployment completes successfully
- ✅ Role initialization shows all green checkmarks
- ✅ Application starts and listens on port 3000
- ✅ No SQL errors in logs

### Short-term (Within 1 hour):
- ✅ Administrator can log in successfully
- ✅ Administrator sees admin-level features
- ✅ Existing users can access their content
- ✅ New users get student role automatically

### Long-term (Within 24 hours):
- ✅ No role-related errors in logs
- ✅ Role-based access control works correctly
- ✅ User experience is smooth
- ✅ No performance issues

## Rollback Plan

If critical issues occur:

### Option 1: Revert Commit
```bash
cd cohortle-api
git revert 8a51f7d
git push
```

### Option 2: Manual Role Assignment
Use the backup scripts:
```bash
cd cohortle-api
./assign-roles-production.sh
./create-admin-production.sh testaconvener@cohortle.com
```

### Option 3: Database Rollback
If needed, restore from backup:
```bash
# Restore from latest backup
mysql -h $DB_HOSTNAME -u $DB_USER -p$DB_PASSWORD $DB_DATABASE < backup.sql
```

## Communication

### If Everything Works:
✅ "Role system deployed successfully. All 51 users assigned roles. Administrator account active."

### If Issues Occur:
⚠️ "Role system deployment encountered issues. Investigating. Users can still access the platform."

### If Rollback Needed:
🔄 "Rolled back role system changes. Platform stable. Will redeploy after fixing issues."

## Monitoring Commands

### Check Role Distribution
```bash
mysql -h $DB_HOSTNAME -u $DB_USER -p$DB_PASSWORD $DB_DATABASE -e "
SELECT r.name, COUNT(u.id) as user_count 
FROM roles r 
LEFT JOIN users u ON r.role_id = u.role_id 
GROUP BY r.role_id, r.name 
ORDER BY r.hierarchy_level;"
```

### Check Administrator
```bash
mysql -h $DB_HOSTNAME -u $DB_USER -p$DB_PASSWORD $DB_DATABASE -e "
SELECT u.email, r.name as role 
FROM users u 
JOIN roles r ON u.role_id = r.role_id 
WHERE r.name = 'administrator';"
```

### Check Users Without Roles
```bash
mysql -h $DB_HOSTNAME -u $DB_USER -p$DB_PASSWORD $DB_DATABASE -e "
SELECT COUNT(*) as users_without_roles 
FROM users 
WHERE role_id IS NULL;"
```

Should return 0 after successful initialization.

## Next Steps After Successful Deployment

1. ✅ Mark deployment as successful
2. ✅ Update project documentation
3. ✅ Close related issues/tickets
4. ✅ Monitor for 24 hours
5. ✅ Plan next feature deployment

## Contact Information

- **Deployment Platform**: Coolify
- **Repository**: github.com/Cohortle-inc/cohortle-api
- **Production URL**: https://cohortle.com
- **API URL**: https://api.cohortle.com

---

**Last Updated**: March 6, 2026
**Deployment Version**: Role System v1.0 with Column Fix
**Risk Level**: Low
**Estimated Downtime**: None (rolling deployment)
