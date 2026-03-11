# MVP Authentication Bug Hunt - Findings and Recommendations

## Executive Summary
Based on extensive code review and analysis of the authentication system, I've identified several potential issues and created a comprehensive diagnostic and fix plan. The system appears to be correctly implemented in most areas, but there are specific scenarios that could cause "user not authenticated" errors.

## Key Findings

### 1. Authentication Flow is Correctly Implemented ✓
The core authentication flow is properly implemented:
- JWT tokens are generated with role information
- Tokens are stored in httpOnly cookies
- Profile endpoint retrieves roles from `user_role_assignments` table
- Middleware correctly checks authentication

### 2. Potential Issues Identified

#### Issue A: Users Without Role Assignments
**Severity:** HIGH
**Symptom:** "user not authenticated" or role shows as "unassigned"

**Root Cause:**
- Users may exist in the database without entries in `user_role_assignments` table
- This can happen if:
  - User was created before role system was implemented
  - Role assignment failed during registration
  - Database migration didn't backfill existing users

**Impact:**
- Users cannot access dashboard
- Profile endpoint returns "unassigned" role
- Frontend may treat user as unauthenticated

**Fix:**
```sql
-- Check for users without role assignments
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
WHERE ura.id IS NULL;

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

#### Issue B: Token Cookie Not Being Set
**Severity:** MEDIUM
**Symptom:** User logs in successfully but is immediately logged out

**Root Cause:**
- Frontend API routes may not be setting the cookie correctly
- Cookie domain/path settings may be incorrect
- SameSite cookie attribute may be blocking cookie

**Check:**
1. Verify `/api/auth/login` route sets cookie:
```typescript
// Should be in cohortle-web/src/app/api/auth/login/route.ts
cookies().set('auth_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24, // 24 hours
  path: '/',
});
```

2. Check browser DevTools → Application → Cookies to verify cookie is set

#### Issue C: Middleware Token Decoding Failure
**Severity:** MEDIUM
**Symptom:** Authenticated users are redirected to login

**Root Cause:**
- Token decoding in middleware may fail silently
- Token format may be incorrect
- Token may be expired

**Check:**
```typescript
// In cohortle-web/src/middleware.ts
function getRoleFromToken(token: string | undefined): string | null {
  try {
    if (!token || typeof token !== 'string') {
      console.log('Token missing or invalid type');
      return null;
    }
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('Token format invalid');
      return null;
    }
    
    const payload = JSON.parse(atob(parts[1]));
    console.log('Token payload:', payload); // Add logging
    return payload.role || null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}
```

#### Issue D: Email Verification Logic Inconsistency
**Severity:** LOW (Already fixed in previous updates)
**Status:** FIXED ✓

The email verification logic was updated to default to disabled:
```javascript
// CORRECT (current implementation)
const requireVerification = process.env.NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION === 'true';

// INCORRECT (old implementation)
const requireVerification = process.env.NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION !== 'false';
```

#### Issue E: Profile Service Role Retrieval
**Severity:** LOW
**Status:** CORRECT ✓

ProfileService correctly retrieves roles from `user_role_assignments`:
```javascript
const roleAssignment = await db.user_role_assignments.findOne({
  where: { user_id: userId, status: 'active' },
  include: [{
    model: db.roles,
    as: 'role',
    attributes: ['name', 'role_id']
  }],
  order: [['assigned_at', 'DESC']]
});
```

## Recommended Actions

### Immediate Actions (Production)

1. **Check Database for Users Without Roles**
   ```bash
   # SSH into production server
   # Run SQL query to check for users without role assignments
   mysql -u root -p cohortle
   ```
   ```sql
   SELECT COUNT(*) as users_without_roles
   FROM users u
   LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
   WHERE ura.id IS NULL;
   ```

2. **Assign Roles to Users Without Assignments**
   If the count is > 0, run the fix query above

3. **Check Recent User Registrations**
   ```sql
   SELECT 
     u.id,
     u.email,
     u.created_at,
     r.name as role
   FROM users u
   LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
   LEFT JOIN roles r ON ura.role_id = r.role_id
   ORDER BY u.created_at DESC
   LIMIT 20;
   ```

4. **Test Authentication Flow**
   - Create a new test learner account
   - Verify role is assigned during registration
   - Test login and dashboard access
   - Check browser cookies for auth_token

### Monitoring Actions

1. **Add Logging to Critical Points**
   - Log when users register (with role assignment result)
   - Log when users login (with role from database)
   - Log when profile endpoint is called (with role retrieval result)
   - Log when middleware checks authentication (with token decode result)

2. **Monitor Error Rates**
   - Track "user not authenticated" errors
   - Track role assignment failures
   - Track token generation failures

### Preventive Actions

1. **Add Database Constraint**
   Ensure all new users get role assignments:
   ```javascript
   // In registration endpoint, wrap in transaction
   const transaction = await db.sequelize.transaction();
   try {
     const newUserId = await sdk.insert({ /* user data */ });
     const roleAssignment = await RoleAssignmentService.assignRole(
       newUserId,
       assignedRole,
       null,
       { notes: roleAssignmentReason },
       { transaction }
     );
     
     if (!roleAssignment.success) {
       throw new Error('Role assignment failed');
     }
     
     await transaction.commit();
   } catch (error) {
     await transaction.rollback();
     throw error;
   }
   ```

2. **Add Health Check Endpoint**
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

3. **Add Frontend Error Boundary**
   ```typescript
   // Catch authentication errors and provide helpful message
   if (error.message.includes('not authenticated')) {
     // Clear invalid token
     await fetch('/api/auth/logout', { method: 'POST' });
     // Redirect to login with message
     router.push('/login?error=session_expired');
   }
   ```

## Testing Checklist

### Database Tests
- [ ] Check for users without role assignments
- [ ] Verify all roles exist in roles table
- [ ] Check for duplicate active role assignments
- [ ] Verify role_id foreign keys are correct

### Backend API Tests
- [ ] Test learner registration → verify role assigned
- [ ] Test convener registration → verify role assigned
- [ ] Test login → verify token includes role
- [ ] Test profile endpoint → verify role returned
- [ ] Test with user without role → verify error handling

### Frontend Tests
- [ ] Test registration → verify cookie set
- [ ] Test login → verify cookie set
- [ ] Test dashboard access → verify middleware allows
- [ ] Test role-based routing → verify correct redirects
- [ ] Test logout → verify cookie cleared

### Integration Tests
- [ ] Complete learner flow: register → login → dashboard → profile
- [ ] Complete convener flow: register → login → dashboard → create programme
- [ ] Test enrollment flow: learner enrolls → accesses content → completes lesson
- [ ] Test progress tracking: complete lesson → verify progress updates

## Files to Review/Modify

### Backend Files
1. `cohortle-api/routes/auth.js` - Registration and login endpoints
2. `cohortle-api/services/ProfileService.js` - Profile retrieval
3. `cohortle-api/services/RoleAssignmentService.js` - Role assignment logic
4. `cohortle-api/models/user_role_assignments.js` - Role assignment model

### Frontend Files
1. `cohortle-web/src/lib/contexts/AuthContext.tsx` - Authentication state
2. `cohortle-web/src/middleware.ts` - Route protection
3. `cohortle-web/src/app/api/auth/login/route.ts` - Login API route
4. `cohortle-web/src/app/api/proxy/[...path]/route.ts` - API proxy

### Database
1. Check `users` table
2. Check `user_role_assignments` table
3. Check `roles` table
4. Run diagnostic queries

## Success Criteria
- ✓ All users have active role assignments
- ✓ New registrations automatically get role assignments
- ✓ Login returns correct role information
- ✓ Profile endpoint returns correct role
- ✓ Dashboard access works for all roles
- ✓ No "user not authenticated" errors for valid users
- ✓ Role-based routing works correctly
- ✓ Programme creation and enrollment work correctly
- ✓ Progress tracking works correctly

## Next Steps

1. **Run Database Diagnostics** (requires production database access)
   - SSH into production server
   - Run diagnostic queries
   - Fix any users without role assignments

2. **Test Authentication Flow** (can be done in browser)
   - Create new test accounts
   - Verify registration assigns roles
   - Test login and dashboard access
   - Check browser DevTools for cookies and errors

3. **Add Monitoring** (requires code deployment)
   - Add logging to critical points
   - Add health check endpoint
   - Monitor error rates

4. **Implement Preventive Measures** (requires code deployment)
   - Add transaction to registration
   - Add error boundaries
   - Add better error messages

## Conclusion

The authentication system is fundamentally sound, but there are specific scenarios (primarily users without role assignments) that can cause "user not authenticated" errors. The recommended fixes are straightforward and can be implemented quickly.

The most likely cause of the current issues is users in the database without entries in the `user_role_assignments` table. Running the diagnostic queries and fix scripts should resolve most issues.

For ongoing reliability, implementing the monitoring and preventive measures will help catch and prevent similar issues in the future.
