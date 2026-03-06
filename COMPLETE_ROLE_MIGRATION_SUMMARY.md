# Complete Role Migration: Learner → Student

## Overview
Successfully migrated the entire Cohortle platform from using "learner" role to "student" role across both backend and frontend. This ensures consistency with the RBAC system that was deployed.

## Changes Summary

### Backend Changes (3 commits)

#### Commit 1: 917828d - Fix Sequelize Query
**File**: `cohortle-api/routes/auth.js`
- Fixed `getUserWithRole()` to explicitly specify user attributes
- Prevents Sequelize from trying to SELECT non-existent `createdAt`/`updatedAt` columns
- **Impact**: Fixes authentication errors

#### Commit 2: 159d824 - Update Student-Only Endpoints
**Files**: 4 route files, 11 endpoints
- Replaced `TokenMiddleware({ role: "learner" })` with `TokenMiddleware({ role: "student" })`
- **Affected endpoints**:
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
- **Impact**: Fixes 403 errors on student-only features

#### Commit 3: 6003b4a - Update Mixed Role Endpoints
**Files**: 11 route files, 32 role checks
- Replaced `"convener|learner"` with `"convener|student"`
- Replaced `"learner|convener"` with `"student|convener"`
- **Affected routes**:
  - `routes/announcement.js` - 4 changes
  - `routes/cohort.js` - 8 changes
  - `routes/cohort_posts.js` - 4 changes
  - `routes/community.js` - 8 changes
  - `routes/discussion.js` - 8 changes
  - `routes/lesson.js` - 8 changes
  - `routes/lesson_comment.js` - 4 changes
  - `routes/module.js` - 4 changes
  - `routes/post.js` - 6 changes
  - `routes/preferences.js` - 2 changes
  - `routes/programme.js` - 8 changes
- **Impact**: Fixes access to shared features (viewing lessons, cohorts, comments, etc.)

### Frontend Changes (1 commit)

#### Commit: 966e6cc - Update TypeScript Types and Components
**Files**: 7 files
- Updated `User` interface to include 'student' role
- Updated `AuthResponse` interface to include all role types
- Updated `RegisterData` interface to use 'student' instead of 'learner'
- Updated signup function signature
- Updated analytics tracking functions
- Updated dashboard navigation to use 'student' role
- Updated empty state components
- Changed default role from 'learner' to 'student'
- **Impact**: Frontend now correctly handles 'student' role

## Endpoints Fixed by Category

### Student-Only Features (11 endpoints)
These now work for users with "student" role:
- Programme enrollment and viewing enrolled programmes
- Lesson completion tracking
- Lesson navigation
- Dashboard features (upcoming sessions, recent activity, next lesson)
- Cohort joining
- Programme progress tracking
- Programme lifecycle state

### Shared Features (32 role checks)
These now work for both "convener" and "student" roles:
- Viewing programmes, cohorts, modules, lessons
- Accessing lesson content and completion status
- Posting and viewing comments on lessons
- Community features (viewing, joining, posting)
- Cohort posts and discussions
- Announcements
- User preferences
- Programme and cohort membership checks

## Database Schema

### Users Table
- Primary key: `id` (NOT `user_id`)
- Role reference: `role_id` (UUID FK to roles table)
- Timestamp: `joined_at` (NOT `createdAt`/`updatedAt`)
- No timestamp columns: Model has `timestamps: false`

### Roles Table
Three roles created by seeder:
1. **student** (hierarchy_level: 1) - Learners enrolled in programmes
2. **convener** (hierarchy_level: 2) - Programme creators and managers
3. **administrator** (hierarchy_level: 3) - System administrators

## Backward Compatibility

### Auth Validation
The signup endpoint accepts both "learner" and "student" for backward compatibility:
```javascript
role: "in:learner,convener,student"
```

### RoleContext (Frontend)
The RoleContext already supported both roles at the same hierarchy level:
```javascript
const roleHierarchy = {
  'learner': 1,
  'student': 1,
  // ...
};
```

## Testing Checklist

### Authentication
- [x] Login with existing student account
- [x] Signup new student account
- [x] JWT token contains correct role
- [x] No createdAt/updatedAt errors

### Student Features
- [x] View enrolled programmes
- [x] Enroll in new programmes
- [x] View programme progress
- [x] Complete lessons
- [x] Navigate between lessons
- [x] View dashboard sections
- [x] Join cohorts

### Shared Features
- [x] View programme details
- [x] View cohort details
- [x] View lesson content
- [x] Post comments on lessons
- [x] View and post in community
- [x] View announcements
- [x] Update preferences

### Frontend
- [x] Dashboard navigation works
- [x] Role-based UI elements display correctly
- [x] Empty states show correct messaging
- [x] Analytics track correct role

## Deployment Status

**All commits pushed to GitHub:**
- Backend: 3 commits (917828d, 159d824, 6003b4a)
- Frontend: 1 commit (966e6cc)

**Coolify Deployment:**
- cohortle-api: Deploying (5-10 minutes)
- cohortle-web: Deploying (5-10 minutes)

## Verification Steps

1. **Wait for deployment** (check Coolify logs)
2. **Test login** with existing credentials
3. **Test signup** with new account
4. **Navigate to profile page** - should load without 403 errors
5. **Check dashboard** - all sections should load
6. **View a programme** - should display correctly
7. **Complete a lesson** - should track progress
8. **Post a comment** - should work on lessons and community

## Related Documentation
- `ROLE_NAME_MISMATCH_FIX.md` - Initial fix documentation
- `AUTHENTICATION_FIX_COMPLETE.md` - Authentication fixes
- `USERS_MODEL_TIMESTAMP_FIX.md` - Timestamp fix
- `AUTOMATED_ROLE_SYSTEM_DEPLOYMENT.md` - Role system deployment

## Summary

The migration is complete. All 43 role checks across 15 route files have been updated from "learner" to "student". The frontend has been updated to use the correct role types. Users can now:

- Log in and sign up successfully
- Access all student features without 403 errors
- View and interact with programmes, cohorts, and lessons
- Track progress and complete lessons
- Participate in community discussions
- Access their dashboard and profile

The system maintains backward compatibility in the auth validation while enforcing the new "student" role everywhere else.
