# Role Name Mismatch Fix - Complete

## Issue Summary
After deploying the role-based access control (RBAC) system, users were experiencing authentication failures and 403 errors due to two critical issues:

1. **Sequelize Query Error**: The `getUserWithRole()` function was trying to SELECT `createdAt` and `updatedAt` columns that don't exist in the users table
2. **Role Name Mismatch**: The RBAC system assigns users the "student" role, but all API endpoints were checking for "learner" role

## Fixes Applied

### Backend Fixes

#### Fix 1: Explicit Attribute Selection (Commit 917828d)
**File**: `cohortle-api/routes/auth.js`

**Problem**: Even though the users model had `timestamps: false`, Sequelize's `include` was still trying to SELECT `createdAt` and `updatedAt` columns.

**Solution**: Explicitly specified which attributes to select from the users table:

```javascript
const user = await db.users.findOne({
  where,
  attributes: ['id', 'first_name', 'last_name', 'location', 'joined_at', 'socials', 'status', 'profile_image', 'role_id'],
  include: [{
    model: db.roles,
    as: 'role',
    attributes: ['name', 'role_id'],
    required: false
  }]
});
```

#### Fix 2: Role Name Standardization (Commit 159d824)
**Files Modified**:
- `cohortle-api/routes/programme.js` (4 endpoints)
- `cohortle-api/routes/lesson.js` (3 endpoints)
- `cohortle-api/routes/dashboard.js` (3 endpoints)
- `cohortle-api/routes/cohort.js` (1 endpoint)

**Problem**: The RBAC seeder creates a "student" role, but all endpoints were checking for "learner" role, causing 403 Forbidden errors.

**Solution**: Replaced all instances of `TokenMiddleware({ role: "learner" })` with `TokenMiddleware({ role: "student" })`.

**Affected Endpoints**:
- GET `/v1/api/programmes/enrolled`
- POST `/v1/api/programmes/enroll`
- GET `/v1/api/programmes/:programme_id/progress`
- GET `/v1/api/programmes/:programme_id/lifecycle/state`
- POST `/v1/api/lessons/:lesson_id/complete`
- DELETE `/v1/api/lessons/:lesson_id/complete`
- GET `/v1/api/lessons/:lesson_id/navigation`
- GET `/v1/api/dashboard/upcoming-sessions`
- GET `/v1/api/dashboard/recent-activity`
- GET `/v1/api/dashboard/next-lesson`
- POST `/v1/api/cohorts/:cohort_id/join`

### Frontend Fixes

#### Fix 3: TypeScript Type Updates (Commit 966e6cc)
**Files Modified**:
- `cohortle-web/src/lib/contexts/AuthContext.tsx`
- `cohortle-web/src/lib/api/auth.ts`
- `cohortle-web/src/lib/utils/analytics.ts`
- `cohortle-web/src/components/dashboard/DashboardNav.tsx`
- `cohortle-web/src/components/dashboard/EmptyState.tsx`
- `cohortle-web/src/components/dashboard/EnhancedEmptyState.tsx`

**Changes**:
1. Updated User interface to include 'student' as a valid role
2. Changed signup function to accept 'student' instead of 'learner'
3. Updated RegisterData interface to use 'student' role
4. Updated AuthResponse interface to include all role types
5. Updated analytics functions to track 'student' role
6. Updated dashboard components to use 'student' role
7. Changed default role from 'learner' to 'student'

**Backward Compatibility**: The RoleContext already supported both 'learner' and 'student' at the same hierarchy level (level 1), so existing code continues to work during the transition.

## Database Schema Reference

### Users Table Columns
The users table has these columns (NO createdAt/updatedAt):
- `id` (primary key)
- `first_name`
- `last_name`
- `location`
- `joined_at` (timestamp for when user joined)
- `socials`
- `status`
- `profile_image`
- `role_id` (foreign key to roles table)

### Roles Created by Seeder
1. **student** (hierarchy_level: 1) - Learners enrolled in programmes
2. **convener** (hierarchy_level: 2) - Programme creators and managers
3. **administrator** (hierarchy_level: 3) - System administrators

## Deployment Status

**Backend Commits Pushed**: 
- `917828d` - Fix: Explicitly specify user attributes to avoid createdAt/updatedAt query errors
- `159d824` - Fix: Replace 'learner' role with 'student' role across all endpoints

**Frontend Commits Pushed**:
- `966e6cc` - Fix: Update frontend to use 'student' role instead of 'learner'

**Deployment**: Waiting for Coolify to deploy both services (5-10 minutes each)

## Testing After Deployment

1. **Login Test**: Try logging in as a student user
   - Should successfully authenticate
   - Should receive JWT token with `role: "student"`

2. **Profile Page Test**: Navigate to student profile page
   - Should load enrolled programmes without 403 error
   - Endpoint `/api/proxy/v1/api/programmes/enrolled` should return 200

3. **Dashboard Test**: Check student dashboard
   - Should load upcoming sessions
   - Should load recent activity
   - Should load next lesson

4. **Signup Test**: Create a new account
   - Should automatically be assigned "student" role
   - Should be able to access student features immediately

5. **Frontend Role Display**: Check that UI correctly displays "student" role
   - Dashboard navigation should work for student role
   - Empty states should show correct messaging for students

## Next Steps

1. Monitor Coolify deployment logs for successful deployment of both services
2. Test login with existing user credentials
3. Verify profile page loads without 403 errors
4. Test new user signup and automatic role assignment
5. Verify admin user (testaconvener@cohortle.com) has administrator role
6. Test that frontend correctly handles 'student' role in all components

## Related Documentation
- `AUTHENTICATION_FIX_COMPLETE.md` - Previous authentication fixes
- `USERS_MODEL_TIMESTAMP_FIX.md` - Timestamp fix documentation
- `AUTOMATED_ROLE_SYSTEM_DEPLOYMENT.md` - Role system deployment guide
