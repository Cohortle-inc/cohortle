# MVP Authentication & Role System Bug Hunt - Design

## Overview
This design outlines a systematic, layer-by-layer approach to identify and fix all authentication and role-related bugs in the MVP, with particular focus on the persistent "user not authenticated" errors affecting learner role. We use a bottom-up diagnostic strategy, starting from the database layer and working up through the backend API, frontend, and user experience. Each layer is verified independently before moving to the next, ensuring issues are isolated and fixed at their source.

The design includes comprehensive testing of:
- Complete learner journey (registration → enrollment → content viewing → progress tracking)
- Complete convener journey (registration → programme creation → cohort/week/lesson setup)
- All authentication touchpoints across both roles
- Database integrity and role assignment consistency
- Token lifecycle and session management

## Diagnostic Strategy

### Layer 1: Database Verification
Verify that the database schema and data are correct:

**Objectives:**
- Confirm all users have active role assignments in user_role_assignments table
- Verify no queries use the deprecated role_id column from users table
- Check referential integrity between users, roles, and role assignments
- Identify any orphaned or duplicate role assignments

**Diagnostic Queries:**
```sql
-- Check for users without role assignments
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.created_at
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
WHERE ura.id IS NULL
ORDER BY u.created_at DESC;

-- Verify role distribution
SELECT 
  r.name as role,
  COUNT(ura.id) as user_count
FROM roles r
LEFT JOIN user_role_assignments ura ON r.role_id = ura.role_id AND ura.status = 'active'
GROUP BY r.name;

-- Check for duplicate active role assignments
SELECT 
  user_id,
  COUNT(*) as assignment_count
FROM user_role_assignments
WHERE status = 'active'
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Verify recent user registrations have roles
SELECT 
  u.id,
  u.email,
  u.created_at,
  r.name as role,
  ura.assigned_at
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
LEFT JOIN roles r ON ura.role_id = r.role_id
ORDER BY u.created_at DESC
LIMIT 20;
```

**Success Criteria:**
- Zero users without role assignments
- All roles have expected user counts
- No duplicate active role assignments
- Recent registrations have roles assigned within seconds of account creation

### Layer 2: Backend API Verification
Verify that backend APIs correctly retrieve and return role information:

**Objectives:**
- Confirm authentication endpoints return role information
- Verify ProfileService queries user_role_assignments table
- Check JWT token generation includes role and permissions
- Test middleware authentication and authorization

**Test Endpoints:**
- POST /v1/api/auth/register-email (with learner and convener roles)
- POST /v1/api/auth/login
- GET /v1/api/profile
- GET /v1/api/dashboard
- POST /v1/api/programmes (convener only)
- POST /v1/api/enroll (learner only)

**Verification Steps:**
1. Register new test users (both learner and convener)
2. Verify registration response includes role
3. Login with test users
4. Decode JWT token and verify role in payload
5. Call profile endpoint and verify role from user_role_assignments
6. Test role-based endpoints with correct and incorrect roles

**Success Criteria:**
- Registration assigns roles correctly
- Login returns tokens with role information
- Profile endpoint returns role from user_role_assignments
- Role-based endpoints enforce authorization correctly

### Layer 3: Frontend Verification
Verify that frontend correctly handles authentication:

**Objectives:**
- Confirm AuthContext initializes with correct user state
- Verify tokens are stored in httpOnly cookies
- Check API proxy forwards authentication headers
- Test middleware routing based on roles
- Verify role-based UI rendering

**Verification Steps:**
1. Open browser DevTools → Application → Cookies
2. Register and login, verify auth_token cookie is set
3. Check cookie properties (httpOnly, secure, sameSite)
4. Navigate to protected routes, verify middleware allows/denies correctly
5. Check Network tab for API calls, verify Authorization header
6. Test role-based routing (learner → /dashboard, convener → /convener/dashboard)

**Success Criteria:**
- Cookies are set with correct security flags
- Middleware correctly protects routes
- API proxy forwards authentication
- Role-based routing works correctly
- UI shows/hides features based on role

### Layer 4: Integration Testing
Test complete user flows end-to-end with comprehensive coverage:

**Objectives:**
- Verify complete learner journey works without errors
- Verify complete convener journey works without errors
- Test programme creation and enrollment workflows
- Verify progress tracking persists correctly
- Test all authentication touchpoints
- Verify role-based access control at every step

**Test Scenarios:**

1. **Learner Complete Flow:**
   - Register new learner account
   - Verify role assignment in database
   - Login and verify token generation
   - Access dashboard (verify no "user not authenticated" error)
   - View profile (verify role displayed correctly)
   - Browse available programmes
   - Enroll in programme using enrollment code
   - View enrolled programme structure (weeks and lessons)
   - Access and view lesson content (all types: video, text, PDF, link, quiz, live session)
   - Mark lesson as complete
   - Verify progress updates on dashboard
   - Navigate between lessons
   - Complete multiple lessons
   - Verify progress calculation accuracy
   - Test session persistence (refresh page, verify still authenticated)
   - Logout and re-login (verify state persists)

2. **Convener Complete Flow:**
   - Register new convener account
   - Verify role assignment in database
   - Login and verify token generation
   - Access convener dashboard (verify redirect from /dashboard)
   - View profile (verify convener role displayed)
   - Create new programme
   - Verify programme saved in database
   - Create cohort for programme
   - Verify enrollment code generated
   - Create week within programme
   - Verify week associated with programme
   - Create lesson within week (test all content types)
   - Verify lesson ordering
   - Create multiple weeks and lessons
   - View programme structure as convener
   - Edit programme details
   - Edit cohort details
   - Edit week details
   - Edit lesson details
   - View enrolled learners (if any)
   - Test session persistence
   - Logout and re-login (verify all data persists)

3. **Cross-Role Integration Flow:**
   - Convener creates programme with cohorts, weeks, and lessons
   - Convener retrieves enrollment code
   - Learner enrolls using enrollment code
   - Learner views programme content
   - Learner completes lessons
   - Convener views learner progress (if feature exists)
   - Verify data consistency across roles

4. **Authentication Edge Cases:**
   - Test expired token handling
   - Test invalid token handling
   - Test missing token handling
   - Test concurrent sessions
   - Test logout and re-login
   - Test browser refresh during authenticated session
   - Test navigation between protected routes
   - Test API calls with and without authentication

5. **Role-Based Access Control:**
   - Learner attempts to access convener-only routes (should be denied)
   - Convener accesses learner features (should be allowed)
   - Unauthenticated user attempts to access protected routes (should redirect to login)
   - Test middleware protection on all routes
   - Test API endpoint authorization

**Success Criteria:**
- All flows complete without authentication errors
- Zero "user not authenticated" errors for valid users
- Data persists correctly across steps
- Progress tracking updates in real-time
- Role-based features work as expected
- All content types render correctly
- Session management works correctly
- Token lifecycle handled properly

## Architecture

### Database Schema
```
users
├── id (INT, PK)
├── email (VARCHAR)
├── password (VARCHAR)
├── first_name (VARCHAR)
├── last_name (VARCHAR)
├── email_verified (TINYINT)
├── joined_at (DATETIME)
├── profile_image (VARCHAR)
├── bio (TEXT)
├── linkedin_username (VARCHAR)
└── role_id (UUID, FK → roles.role_id) [DEPRECATED - use user_role_assignments]

roles
├── role_id (UUID, PK)
├── name (VARCHAR) - 'student', 'convener', 'administrator'
└── description (TEXT)

user_role_assignments
├── id (INT, PK)
├── user_id (INT, FK → users.id)
├── role_id (UUID, FK → roles.role_id)
├── assigned_by (INT, FK → users.id)
├── assigned_at (DATETIME)
└── status (ENUM: 'active', 'inactive')
```

### Authentication Flow
```
1. User submits credentials
2. Backend validates credentials
3. Backend retrieves user with role from user_role_assignments
4. Backend generates JWT with role and permissions
5. Backend returns token + user data
6. Frontend stores token in httpOnly cookie
7. Frontend updates AuthContext with user data
8. Frontend redirects based on role
```

### Role Retrieval Pattern
```javascript
// CORRECT: Use user_role_assignments table
const roleAssignment = await db.user_role_assignments.findOne({
  where: { user_id: userId, status: 'active' },
  include: [{
    model: db.roles,
    as: 'role',
    attributes: ['name', 'role_id']
  }],
  order: [['assigned_at', 'DESC']]
});

const roleName = roleAssignment?.role?.name || 'unassigned';

// INCORRECT: Don't use role_id directly from users table
// const user = await db.users.findByPk(userId, {
//   include: [{ model: db.roles, as: 'role' }]
// });
```

## Diagnostic Tools

### 1. Database Diagnostic Script
```sql
-- Check users and their role assignments
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  r.name as role,
  ura.assigned_at,
  ura.status
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
LEFT JOIN roles r ON ura.role_id = r.role_id
ORDER BY u.id DESC
LIMIT 20;

-- Check for users without role assignments
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
WHERE ura.id IS NULL;

-- Check role distribution
SELECT 
  r.name as role,
  COUNT(ura.id) as user_count
FROM roles r
LEFT JOIN user_role_assignments ura ON r.role_id = ura.role_id AND ura.status = 'active'
GROUP BY r.name;
```

### 2. Backend API Test Script
Test authentication endpoints:
- POST /v1/api/auth/register-email
- POST /v1/api/auth/login
- GET /v1/api/profile
- GET /v1/api/dashboard

### 3. Frontend Integration Test
Test complete user flows in browser:
- Registration → Login → Dashboard
- Profile access
- Role-based routing

## Common Issues and Fixes

### Issue 1: Users without role assignments
**Symptom:** "user not authenticated" or role shows as "unassigned"

**Diagnosis:**
```sql
SELECT COUNT(*) FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
WHERE ura.id IS NULL;
```

**Fix:**
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
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
WHERE ura.id IS NULL;
```

### Issue 2: Backend using old role column
**Symptom:** Role not found or incorrect role returned

**Diagnosis:** Search for queries using `user.role` or `users.role`

**Fix:** Update all queries to use user_role_assignments table

### Issue 3: JWT token missing role
**Symptom:** Frontend shows user as unauthenticated despite valid token

**Diagnosis:** Decode JWT and check payload

**Fix:** Ensure createTokenWithRole includes role in payload

### Issue 4: Frontend middleware not recognizing role
**Symptom:** Redirected to login despite being authenticated

**Diagnosis:** Check middleware getRoleFromToken function

**Fix:** Ensure token is correctly stored in cookies and decoded

### Issue 5: Email verification blocking access
**Symptom:** Learners can't access dashboard

**Diagnosis:** Check REQUIRE_EMAIL_VERIFICATION environment variables

**Fix:** Ensure both backend and frontend have verification disabled

## Implementation Plan

### Phase 1: Database Audit (30 minutes)
1. Run database diagnostic queries
2. Identify users without role assignments
3. Fix missing role assignments
4. Verify role data integrity

### Phase 2: Backend API Audit (45 minutes)
1. Review all authentication endpoints
2. Verify role retrieval logic
3. Test JWT token generation
4. Test profile endpoint
5. Fix any issues found

### Phase 3: Frontend Audit (45 minutes)
1. Review AuthContext
2. Review middleware
3. Review API proxy
4. Test token storage
5. Fix any issues found

### Phase 4: Integration Testing (60 minutes)
1. Test learner registration and login
2. Test convener registration and login
3. Test programme creation flow
4. Test learner enrollment flow
5. Test progress tracking
6. Document any remaining issues

### Phase 5: Fix and Verify (60 minutes)
1. Fix all identified issues
2. Re-run all tests
3. Verify fixes in production
4. Document changes

## Testing Strategy

### Unit Tests
- Test role retrieval functions
- Test JWT token generation
- Test middleware functions

### Integration Tests
- Test complete authentication flows
- Test role-based access control
- Test programme creation and enrollment

### Manual Tests
- Test in browser with real user accounts
- Test both learner and convener roles
- Test all major user flows

## Success Metrics
- 100% of users have valid role assignments
- 0 "user not authenticated" errors for valid users
- All authentication endpoints return correct role
- All role-based routing works correctly
- All programme/cohort/week/lesson operations work
- All progress tracking works correctly

## Rollback Plan
If issues are found:
1. Document the issue
2. Revert problematic changes
3. Re-analyze the problem
4. Implement alternative fix
5. Re-test

## Deployment Strategy
1. Test all fixes in local development
2. Deploy to staging/production
3. Monitor logs for errors
4. Test with real user accounts
5. Verify all functionality works

## Monitoring
- Monitor authentication error rates
- Monitor role assignment queries
- Monitor JWT token generation
- Monitor user registration/login success rates
- Monitor dashboard access success rates
