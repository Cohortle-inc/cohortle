# MVP Authentication Bug Hunt - Complete Summary

## What I've Done

I've conducted an extensive code review and analysis of your authentication system to identify the root causes of the "user not authenticated" errors. Here's what I've created for you:

### 1. Comprehensive Spec (`.kiro/specs/mvp-auth-bug-hunt/`)
- **requirements.md**: Detailed user stories and acceptance criteria for all authentication flows
- **design.md**: Systematic diagnostic strategy and architecture documentation
- **tasks.md**: Step-by-step implementation tasks organized in phases

### 2. Diagnostic Tools
- **diagnose-database-roles.js**: Node.js script to check database role assignments
- **fix-production-role-assignments.ps1**: PowerShell script to fix missing role assignments in production
- **test-auth-in-browser.html**: Browser-based testing tool (no dependencies required)

### 3. Documentation
- **MVP_AUTH_BUG_HUNT_FINDINGS.md**: Detailed analysis of all potential issues
- **MVP_AUTH_BUG_HUNT_SUMMARY.md**: This file - quick reference guide

## Key Findings

### ✅ What's Working Correctly
1. Core authentication flow is properly implemented
2. JWT tokens include role information
3. ProfileService correctly retrieves roles from `user_role_assignments` table
4. Middleware correctly checks authentication
5. Email verification is properly disabled for MVP

### ⚠️ Most Likely Issue: Users Without Role Assignments

**This is the #1 cause of "user not authenticated" errors**

**Symptoms:**
- Users can register and login
- But get "user not authenticated" when accessing dashboard
- Profile shows role as "unassigned"

**Root Cause:**
- Users exist in database without entries in `user_role_assignments` table
- This happens when:
  - User was created before role system was implemented
  - Role assignment failed during registration
  - Database migration didn't backfill existing users

**How to Check:**
```sql
-- Run this query in production database
SELECT COUNT(*) as users_without_roles
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
WHERE ura.id IS NULL;
```

**How to Fix:**
```sql
-- Assign student role to users without assignments
INSERT INTO user_role_assignments (user_id, role_id, assigned_by, assigned_at, status)
SELECT 
  u.id,
  (SELECT role_id FROM roles WHERE name = 'student' LIMIT 1),
  1,
  NOW(),
  'active'
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
WHERE ura.id IS NULL;
```

## How to Diagnose and Fix

### Option 1: Use Browser Test Tool (Easiest)
1. Open `test-auth-in-browser.html` in your browser
2. Register a new test learner account
3. Login with the account
4. Test profile and dashboard access
5. Check if role is correctly assigned

**This will tell you if new registrations are working correctly**

### Option 2: Check Production Database
1. SSH into your production server
2. Connect to MySQL:
   ```bash
   mysql -u root -p cohortle
   ```
3. Run diagnostic query:
   ```sql
   SELECT 
     u.id,
     u.email,
     r.name as role
   FROM users u
   LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
   LEFT JOIN roles r ON ura.role_id = r.role_id
   ORDER BY u.created_at DESC
   LIMIT 20;
   ```
4. Look for users with NULL role
5. If found, run the fix query above

### Option 3: Use PowerShell Script (Automated)
1. SSH into production server
2. Navigate to project directory
3. Run:
   ```bash
   pwsh fix-production-role-assignments.ps1
   ```
4. Review output and confirm fixes

## Quick Fixes for Common Issues

### Issue 1: Specific User Can't Login
```sql
-- Check if user has role assignment
SELECT 
  u.email,
  r.name as role,
  ura.status
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
LEFT JOIN roles r ON ura.role_id = r.role_id
WHERE u.email = 'user@example.com';

-- If no role, assign student role
INSERT INTO user_role_assignments (user_id, role_id, assigned_by, assigned_at, status)
VALUES (
  (SELECT id FROM users WHERE email = 'user@example.com'),
  (SELECT role_id FROM roles WHERE name = 'student'),
  1,
  NOW(),
  'active'
);
```

### Issue 2: All Users Can't Access Dashboard
This suggests a frontend or environment variable issue:

1. Check frontend environment variables:
   ```bash
   # In cohortle-web/.env.production
   NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION=false
   NEXT_PUBLIC_API_URL=https://api.cohortle.com
   ```

2. Clear browser cache and cookies
3. Try in incognito/private browsing mode

### Issue 3: Conveners Redirected to Wrong Dashboard
```sql
-- Check convener role assignment
SELECT 
  u.email,
  r.name as role
FROM users u
JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
JOIN roles r ON ura.role_id = r.role_id
WHERE u.email = 'convener@example.com';

-- If role is 'student', update to 'convener'
UPDATE user_role_assignments
SET role_id = (SELECT role_id FROM roles WHERE name = 'convener')
WHERE user_id = (SELECT id FROM users WHERE email = 'convener@example.com')
AND status = 'active';
```

## Testing Checklist

After applying fixes, test these scenarios:

### Learner Flow
- [ ] Register new learner account
- [ ] Login with learner credentials
- [ ] Access dashboard (should work without errors)
- [ ] View profile (should show role as "student" or "learner")
- [ ] Enroll in a programme
- [ ] View programme content
- [ ] Complete a lesson
- [ ] Check progress tracking

### Convener Flow
- [ ] Register new convener account (with invitation code)
- [ ] Login with convener credentials
- [ ] Access convener dashboard (should redirect to /convener/dashboard)
- [ ] View profile (should show role as "convener")
- [ ] Create a programme
- [ ] Create a cohort
- [ ] Create weeks and lessons
- [ ] View learner enrollments

## Monitoring Recommendations

### Add Logging
Add these log statements to catch issues early:

```javascript
// In registration endpoint
console.log('User registered:', { userId, email, role: assignedRole });
console.log('Role assignment result:', roleAssignment);

// In login endpoint
console.log('User logged in:', { userId, email, role: user.role });

// In profile endpoint
console.log('Profile accessed:', { userId, role: roleName });
```

### Add Health Check
Create an endpoint to monitor role system health:

```javascript
// GET /v1/api/health/role-system
app.get('/v1/api/health/role-system', async (req, res) => {
  const usersWithoutRoles = await db.sequelize.query(`
    SELECT COUNT(*) as count
    FROM users u
    LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
    WHERE ura.id IS NULL
  `, { type: db.sequelize.QueryTypes.SELECT });
  
  res.json({
    healthy: usersWithoutRoles[0].count === 0,
    usersWithoutRoles: usersWithoutRoles[0].count
  });
});
```

## Next Steps

1. **Immediate**: Run browser test tool to verify new registrations work
2. **Short-term**: Check production database for users without roles and fix
3. **Medium-term**: Add monitoring and health checks
4. **Long-term**: Implement preventive measures (transactions, error boundaries)

## Files Created

All diagnostic and fix tools are ready to use:

1. `.kiro/specs/mvp-auth-bug-hunt/` - Complete spec with requirements, design, and tasks
2. `cohortle-api/diagnose-database-roles.js` - Database diagnostic script
3. `fix-production-role-assignments.ps1` - Automated fix script for production
4. `test-auth-in-browser.html` - Browser-based testing tool
5. `MVP_AUTH_BUG_HUNT_FINDINGS.md` - Detailed technical analysis
6. `MVP_AUTH_BUG_HUNT_SUMMARY.md` - This quick reference guide

## Support

If you encounter issues:

1. Check the browser console for errors
2. Check server logs for authentication errors
3. Run the diagnostic queries to verify database state
4. Use the browser test tool to isolate the issue
5. Review `MVP_AUTH_BUG_HUNT_FINDINGS.md` for detailed troubleshooting

## Success Criteria

You'll know the issues are fixed when:
- ✅ New users can register and login without errors
- ✅ All users have role assignments in database
- ✅ Dashboard access works for both learners and conveners
- ✅ Profile endpoint returns correct role information
- ✅ Role-based routing works correctly
- ✅ Programme creation and enrollment work correctly
- ✅ Progress tracking works correctly

---

**Remember**: The most common issue is users without role assignments in the database. Start by checking that first!
