# Pre-Deployment Checklist - Role System

**Date:** March 5, 2026  
**Feature:** Role Validation and Assignment System  
**Status:** Ready for Deployment Review

---

## Critical Pre-Deployment Checks

### 1. Database Migrations ⚠️ CRITICAL

**Status:** Must verify before deployment

#### Check Migration Status
```bash
# In cohortle-api directory
cd cohortle-api

# Check which migrations have run
npm run migrate:status

# Expected migrations for role system:
# - 20260304000000-create-roles-table.js
# - 20260304000001-create-permissions-table.js
# - 20260304000002-create-role-permissions-table.js
# - 20260304000003-create-user-role-assignments-table.js
# - 20260304000004-create-role-assignment-history-table.js
# - 20260304000005-add-role-id-to-users.js (if exists)
# - 20260305000000-add-programme-lifecycle-fields.js
```

#### Run Pending Migrations
```bash
# DEVELOPMENT FIRST - Test migrations
npm run migrate

# PRODUCTION - After testing
# Use your production migration script
node run-production-migration.js
# OR
npm run migrate:production
```

#### Verify Migration Success
```bash
# Check tables exist
# Connect to database and verify:
# - roles table
# - permissions table
# - role_permissions table
# - user_role_assignments table
# - role_assignment_history table
# - programmes table has lifecycle_status, onboarding_mode columns
```

**Action Required:**
- [ ] Run migrations on development database
- [ ] Verify all tables created successfully
- [ ] Test rollback if needed
- [ ] Backup production database before migration
- [ ] Run migrations on production database
- [ ] Verify production migration success

---

### 2. Database Seeders ⚠️ CRITICAL

**Status:** Must run to populate roles and permissions

#### Run Seeders
```bash
# In cohortle-api directory
npm run seed

# Expected seeder:
# - 20260304000000-seed-roles-and-permissions.js
```

#### Verify Seeder Success
```sql
-- Check roles exist
SELECT * FROM roles;
-- Expected: learner, convener, administrator

-- Check permissions exist
SELECT * FROM permissions;
-- Expected: Multiple permissions for each role

-- Check role_permissions mappings
SELECT r.name as role, p.name as permission
FROM roles r
JOIN role_permissions rp ON r.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.permission_id
ORDER BY r.hierarchy_level, p.name;
```

**Action Required:**
- [ ] Run seeders on development database
- [ ] Verify roles created (learner, convener, administrator)
- [ ] Verify permissions created
- [ ] Verify role-permission mappings
- [ ] Run seeders on production database
- [ ] Verify production seeder success

---

### 3. Environment Variables ⚠️ CRITICAL

**Status:** Must configure before deployment

#### Backend (cohortle-api/.env)
```bash
# JWT Configuration
JWT_SECRET=<strong-secret-256-bits-minimum>
JWT_EXPIRES_IN=24h

# Database Configuration
DB_HOST=<production-db-host>
DB_PORT=3306
DB_NAME=<production-db-name>
DB_USER=<production-db-user>
DB_PASSWORD=<production-db-password>

# API Configuration
NODE_ENV=production
PORT=3000
API_URL=https://api.cohortle.com

# CORS Configuration
FRONTEND_URL=https://cohortle.com
ALLOWED_ORIGINS=https://cohortle.com,https://www.cohortle.com

# Email Configuration (if using Resend)
RESEND_API_KEY=<your-resend-api-key>
RESEND_FROM_EMAIL=noreply@cohortle.com

# Security
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend (cohortle-web/.env.production)
```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.cohortle.com
NEXT_PUBLIC_FRONTEND_URL=https://cohortle.com

# Environment
NODE_ENV=production
```

**Action Required:**
- [ ] Generate strong JWT_SECRET (256 bits minimum)
- [ ] Configure production database credentials
- [ ] Set correct API_URL and FRONTEND_URL
- [ ] Configure CORS allowed origins
- [ ] Set secure cookie settings
- [ ] Verify all environment variables in deployment platform

---

### 4. Existing User Migration ⚠️ CRITICAL

**Status:** Must handle existing users

#### Assign Default Learner Role to Existing Users
```sql
-- Check if users exist without roles
SELECT u.user_id, u.email, u.role_id
FROM users u
WHERE u.role_id IS NULL;

-- Get learner role ID
SELECT role_id FROM roles WHERE name = 'learner';

-- Assign learner role to all users without roles
UPDATE users u
SET u.role_id = (SELECT role_id FROM roles WHERE name = 'learner')
WHERE u.role_id IS NULL;

-- Create role assignments for existing users
INSERT INTO user_role_assignments (user_id, role_id, assigned_by, assigned_at, status)
SELECT 
    u.user_id,
    (SELECT role_id FROM roles WHERE name = 'learner'),
    NULL,
    NOW(),
    'active'
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_role_assignments ura 
    WHERE ura.user_id = u.user_id AND ura.status = 'active'
);

-- Log in role assignment history
INSERT INTO role_assignment_history (user_id, previous_role_id, new_role_id, changed_by, changed_at, reason)
SELECT 
    u.user_id,
    NULL,
    (SELECT role_id FROM roles WHERE name = 'learner'),
    NULL,
    NOW(),
    'Migration: Assigned default learner role to existing user'
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM role_assignment_history rah 
    WHERE rah.user_id = u.user_id
);
```

**Action Required:**
- [ ] Backup database before user migration
- [ ] Run user migration script on development
- [ ] Verify all users have learner role
- [ ] Test user login and permissions
- [ ] Run user migration script on production
- [ ] Verify production users have roles

---

### 5. Create Initial Administrator ⚠️ CRITICAL

**Status:** Must create at least one admin before deployment

#### Option A: Via Database (Before Deployment)
```sql
-- Get your user ID
SELECT user_id, email FROM users WHERE email = 'your-admin-email@example.com';

-- Get administrator role ID
SELECT role_id FROM roles WHERE name = 'administrator';

-- Assign administrator role
UPDATE users 
SET role_id = (SELECT role_id FROM roles WHERE name = 'administrator')
WHERE email = 'your-admin-email@example.com';

-- Create role assignment
INSERT INTO user_role_assignments (user_id, role_id, assigned_by, assigned_at, status)
VALUES (
    (SELECT user_id FROM users WHERE email = 'your-admin-email@example.com'),
    (SELECT role_id FROM roles WHERE name = 'administrator'),
    NULL,
    NOW(),
    'active'
);

-- Log in history
INSERT INTO role_assignment_history (user_id, previous_role_id, new_role_id, changed_by, changed_at, reason)
VALUES (
    (SELECT user_id FROM users WHERE email = 'your-admin-email@example.com'),
    (SELECT role_id FROM roles WHERE name = 'learner'),
    (SELECT role_id FROM roles WHERE name = 'administrator'),
    NULL,
    NOW(),
    'Initial administrator setup'
);
```

#### Option B: Via API (After Deployment)
```bash
# First, manually set one user as admin via database
# Then use API to assign other admins

curl -X PUT https://api.cohortle.com/v1/api/users/{userId}/role \
  -H "Authorization: Bearer {admin-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "administrator",
    "reason": "Platform administrator"
  }'
```

**Action Required:**
- [ ] Identify initial administrator email
- [ ] Assign administrator role via database
- [ ] Verify administrator can access admin endpoints
- [ ] Document administrator credentials securely
- [ ] Create backup administrator account

---

### 6. Test Suite Execution ✅ RECOMMENDED

**Status:** Run tests before deployment

#### Backend Tests
```bash
cd cohortle-api

# Run all role system tests
npm test -- role-validation-assignment-logic

# Run specific test suites
npm test -- RoleValidationService.test.js
npm test -- RoleAssignmentService.test.js
npm test -- roleSystemIntegration.test.js
npm test -- roleSecurityTests.test.js

# Run property-based tests
npm test -- roleTransitionIntegrity.pbt.js
npm test -- accessControlEnforcement.pbt.js
npm test -- jwtTokenRoleConsistency.pbt.js
```

#### Frontend Tests
```bash
cd cohortle-web

# Run role component tests
npm test -- RoleComponents.test.tsx
npm test -- RoleGuard
npm test -- PermissionGuard
```

**Action Required:**
- [ ] Run all backend role tests
- [ ] Verify all tests pass
- [ ] Run frontend role tests
- [ ] Fix any failing tests
- [ ] Document test results

---

### 7. Security Configuration ⚠️ CRITICAL

**Status:** Must configure for production

#### JWT Security
```javascript
// Verify in cohortle-api/services/JwtService.js or config

// JWT Secret
- Minimum 256 bits (32 characters)
- Use cryptographically secure random string
- Never commit to version control

// JWT Expiration
- Access tokens: 24 hours (or less for higher security)
- Consider implementing refresh tokens for longer sessions

// Cookie Settings (Production)
{
  httpOnly: true,        // Prevents XSS attacks
  secure: true,          // HTTPS only
  sameSite: 'strict',    // Prevents CSRF attacks
  maxAge: 24 * 60 * 60 * 1000  // 24 hours
}
```

#### Password Security
```javascript
// Verify bcrypt configuration
- Rounds: 10 (minimum)
- Consider 12 rounds for higher security
```

#### Rate Limiting
```javascript
// Verify rate limiting is enabled
- Standard endpoints: 100 req/min
- Role validation: 200 req/min
- Role assignment: 20 req/min (admin only)
```

#### CORS Configuration
```javascript
// Verify CORS settings
allowedOrigins: [
  'https://cohortle.com',
  'https://www.cohortle.com'
]
// NO wildcards (*) in production
```

**Action Required:**
- [ ] Generate strong JWT secret
- [ ] Configure secure cookie settings
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Test security headers

---

### 8. API Endpoint Verification ✅ RECOMMENDED

**Status:** Test all role endpoints

#### Test Role Management Endpoints
```bash
# Get all roles (any authenticated user)
curl https://api.cohortle.com/v1/api/roles \
  -H "Authorization: Bearer {token}"

# Get user role (own role or admin)
curl https://api.cohortle.com/v1/api/users/{userId}/role \
  -H "Authorization: Bearer {token}"

# Update user role (admin only)
curl -X PUT https://api.cohortle.com/v1/api/users/{userId}/role \
  -H "Authorization: Bearer {admin-token}" \
  -H "Content-Type: application/json" \
  -d '{"role": "convener", "reason": "Test"}'

# List users by role (admin only)
curl https://api.cohortle.com/v1/api/users/with-role/learner \
  -H "Authorization: Bearer {admin-token}"

# Get role history
curl https://api.cohortle.com/v1/api/users/{userId}/role/history \
  -H "Authorization: Bearer {token}"

# Get permissions
curl https://api.cohortle.com/v1/api/permissions \
  -H "Authorization: Bearer {token}"
```

**Action Required:**
- [ ] Test all role endpoints on development
- [ ] Verify authentication required
- [ ] Verify authorization (admin-only endpoints)
- [ ] Test error responses
- [ ] Test all endpoints on production after deployment

---

### 9. Frontend Integration ✅ RECOMMENDED

**Status:** Verify frontend components

#### Test Role-Based UI
- [ ] Learner dashboard accessible to learners
- [ ] Convener dashboard accessible to conveners only
- [ ] Admin features accessible to admins only
- [ ] RoleGuard components work correctly
- [ ] PermissionGuard components work correctly
- [ ] Unauthorized page displays for insufficient permissions
- [ ] Role information displays in user profile

#### Test Role Workflows
- [ ] New user registration assigns learner role
- [ ] Learner can join cohorts with enrollment code
- [ ] Convener can create programmes
- [ ] Convener can create cohorts
- [ ] Admin can assign convener role
- [ ] Role changes reflect immediately (token refresh)

**Action Required:**
- [ ] Test all role-based UI components
- [ ] Test complete user workflows
- [ ] Test on multiple browsers
- [ ] Test on mobile devices
- [ ] Verify error messages are user-friendly

---

### 10. Database Backup ⚠️ CRITICAL

**Status:** Must backup before deployment

#### Backup Production Database
```bash
# MySQL backup
mysqldump -h {host} -u {user} -p {database} > cohortle_backup_$(date +%Y%m%d_%H%M%S).sql

# Or use your hosting provider's backup tool
```

#### Verify Backup
```bash
# Test restore on development database
mysql -h {dev-host} -u {dev-user} -p {dev-database} < cohortle_backup_*.sql
```

**Action Required:**
- [ ] Create full database backup
- [ ] Verify backup file is complete
- [ ] Store backup securely
- [ ] Test restore procedure
- [ ] Document backup location

---

### 11. Rollback Plan ⚠️ CRITICAL

**Status:** Must have rollback plan

#### Rollback Procedure
1. **If migrations fail:**
   ```bash
   # Rollback migrations
   npm run migrate:undo
   # Or restore from backup
   mysql -h {host} -u {user} -p {database} < cohortle_backup_*.sql
   ```

2. **If deployment fails:**
   - Revert to previous deployment
   - Restore database from backup
   - Clear application cache
   - Verify system is operational

3. **If role system has issues:**
   - Disable role validation temporarily (if possible)
   - Assign all users learner role
   - Investigate and fix issues
   - Redeploy with fixes

**Action Required:**
- [ ] Document rollback procedure
- [ ] Test rollback on development
- [ ] Prepare rollback scripts
- [ ] Identify rollback decision criteria
- [ ] Assign rollback responsibility

---

### 12. Monitoring and Logging ✅ RECOMMENDED

**Status:** Set up monitoring

#### What to Monitor
- Role assignment API calls
- Authentication failures
- Authorization failures (403 errors)
- Role validation errors
- JWT token issues
- Database query performance
- API response times

#### Logging
```javascript
// Ensure these are logged:
- All role assignments (who, when, why)
- All role changes (previous, new, admin)
- Failed authorization attempts
- Security events
- API errors
```

**Action Required:**
- [ ] Configure application logging
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Configure database query logging
- [ ] Set up performance monitoring
- [ ] Create monitoring dashboard
- [ ] Set up alerts for critical errors

---

### 13. Documentation ✅ RECOMMENDED

**Status:** Ensure documentation is ready

#### Documentation Checklist
- [ ] API documentation (ROLE_MANAGEMENT_API.md)
- [ ] User guide (ROLE_MANAGEMENT_USER_GUIDE.md)
- [ ] System summary (COHORTLE_SYSTEM_STATE_SUMMARY.md)
- [ ] Deployment guide (this document)
- [ ] Troubleshooting guide
- [ ] Admin procedures

#### Update Documentation
- [ ] Update API base URLs for production
- [ ] Update example requests with production URLs
- [ ] Document admin procedures
- [ ] Document common issues and solutions
- [ ] Create quick reference guides

**Action Required:**
- [ ] Review all documentation
- [ ] Update URLs for production
- [ ] Add troubleshooting section
- [ ] Share documentation with team
- [ ] Create admin training materials

---

### 14. Post-Deployment Verification ✅ REQUIRED

**Status:** Must verify after deployment

#### Immediate Checks (Within 1 hour)
- [ ] Application starts successfully
- [ ] Database connections working
- [ ] Migrations completed successfully
- [ ] Seeders ran successfully
- [ ] Admin can log in
- [ ] Admin can access admin endpoints
- [ ] New user registration works
- [ ] New users get learner role
- [ ] Learners can log in
- [ ] Learners can access learner features

#### Extended Checks (Within 24 hours)
- [ ] Monitor error logs for issues
- [ ] Check role assignment audit trail
- [ ] Verify JWT token refresh works
- [ ] Test convener role assignment
- [ ] Test convener features
- [ ] Test programme creation
- [ ] Test cohort creation
- [ ] Test enrollment workflow
- [ ] Monitor performance metrics
- [ ] Check database query performance

**Action Required:**
- [ ] Create post-deployment checklist
- [ ] Assign verification responsibilities
- [ ] Schedule verification tasks
- [ ] Document verification results
- [ ] Address any issues immediately

---

## Deployment Sequence

### Recommended Deployment Order

1. **Pre-Deployment (1-2 days before)**
   - [ ] Backup production database
   - [ ] Run all tests
   - [ ] Review security configuration
   - [ ] Prepare rollback plan
   - [ ] Notify users of maintenance window

2. **Deployment Day - Backend**
   - [ ] Put application in maintenance mode
   - [ ] Backup database again
   - [ ] Run database migrations
   - [ ] Run database seeders
   - [ ] Migrate existing users to learner role
   - [ ] Create initial administrator
   - [ ] Deploy backend code
   - [ ] Verify backend is running
   - [ ] Test API endpoints

3. **Deployment Day - Frontend**
   - [ ] Deploy frontend code
   - [ ] Clear CDN cache (if applicable)
   - [ ] Verify frontend is running
   - [ ] Test user workflows

4. **Post-Deployment**
   - [ ] Remove maintenance mode
   - [ ] Run immediate verification checks
   - [ ] Monitor logs and errors
   - [ ] Test complete user workflows
   - [ ] Notify users deployment is complete

---

## Critical Risks and Mitigation

### Risk 1: Migration Fails
**Mitigation:**
- Test migrations thoroughly on development
- Have database backup ready
- Have rollback procedure documented
- Test rollback procedure

### Risk 2: Existing Users Can't Log In
**Mitigation:**
- Ensure all users get learner role
- Test login before removing maintenance mode
- Have support team ready
- Communicate with users

### Risk 3: Admin Can't Access Admin Features
**Mitigation:**
- Create admin account before deployment
- Test admin access immediately
- Have database access ready for manual fixes
- Have backup admin account

### Risk 4: JWT Token Issues
**Mitigation:**
- Test JWT generation and validation
- Verify JWT secret is configured
- Test token refresh mechanism
- Have token debugging tools ready

### Risk 5: Performance Issues
**Mitigation:**
- Test with production-like data volume
- Monitor database query performance
- Have database indexes ready
- Monitor API response times

---

## Quick Reference Commands

### Check Migration Status
```bash
cd cohortle-api && npm run migrate:status
```

### Run Migrations
```bash
cd cohortle-api && npm run migrate
```

### Run Seeders
```bash
cd cohortle-api && npm run seed
```

### Run Tests
```bash
cd cohortle-api && npm test -- role-validation-assignment-logic
```

### Backup Database
```bash
mysqldump -h {host} -u {user} -p {database} > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Check Application Logs
```bash
# Depends on your deployment platform
# Coolify: Check logs in Coolify dashboard
# PM2: pm2 logs
# Docker: docker logs {container}
```

---

## Support Contacts

**During Deployment:**
- Technical Lead: [Contact]
- Database Admin: [Contact]
- DevOps: [Contact]

**Post-Deployment:**
- Support Email: support@cohortle.com
- Emergency Contact: [Contact]

---

## Final Checklist

Before you deploy, ensure ALL critical items are complete:

### Critical (Must Complete)
- [ ] Database backup created and verified
- [ ] Migrations tested on development
- [ ] Seeders tested on development
- [ ] Environment variables configured
- [ ] JWT secret generated (256 bits minimum)
- [ ] Initial administrator created
- [ ] Rollback plan documented
- [ ] Team notified of deployment

### Recommended (Should Complete)
- [ ] All tests passing
- [ ] API endpoints tested
- [ ] Frontend integration tested
- [ ] Security configuration reviewed
- [ ] Monitoring configured
- [ ] Documentation updated
- [ ] Post-deployment checklist prepared

### Optional (Nice to Have)
- [ ] Performance testing completed
- [ ] Load testing completed
- [ ] User training materials prepared
- [ ] Admin training completed

---

## Deployment Decision

**Ready to Deploy?**

✅ **YES** - If all critical items are complete  
⚠️ **REVIEW** - If any critical items are incomplete  
❌ **NO** - If multiple critical items are incomplete

**Deployment Approved By:** _______________  
**Date:** _______________  
**Deployment Window:** _______________

---

*Last Updated: March 5, 2026*  
*Document Version: 1.0*  
*Role System Version: Production Ready*
