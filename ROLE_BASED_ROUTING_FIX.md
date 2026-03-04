# Role-Based Routing Fix - COMPLETE

## Problem Identified
Conveners were getting 403 Forbidden errors because they were being routed to the learner dashboard (`/dashboard`) which calls learner-only API endpoints like `/v1/api/programmes/enrolled`.

## Root Cause
**Incorrect routing after login/signup:**
1. All users (both learners and conveners) were redirected to `/dashboard` after authentication
2. The `/dashboard` page calls `useEnrolledProgrammes()` which hits `/v1/api/programmes/enrolled`
3. This endpoint has `TokenMiddleware({ role: "learner" })` - correctly restricted to learners only
4. Conveners got 403 Forbidden because they don't have the learner role

## Design Clarification
Based on user requirements:
- **Conveners CANNOT be learners** - roles are strictly separated
- Conveners are organizations/institutions, not individuals
- Conveners create and manage programmes but CANNOT enroll in any programmes
- Conveners can preview/test their programmes through Preview Mode (not enrollment)
- Only learners can enroll in programmes

## Solution Implemented

### 1. Reverted Incorrect Role Changes
**Files reverted to learner-only:**
- `cohortle-api/routes/programme.js`:
  - `/v1/api/programmes/enrolled` (GET) - learner only ✓
  - `/v1/api/programmes/enroll` (POST) - learner only ✓
- `cohortle-api/routes/cohort.js`:
  - `/v1/api/cohorts/:cohort_id/join` (POST) - learner only ✓
- `cohortle-api/routes/lesson.js`:
  - `/v1/api/lessons/:lesson_id/complete` (POST) - learner only ✓

### 2. Implemented Role-Based Routing

#### A. Signup Redirect (`cohortle-web/src/lib/contexts/AuthContext.tsx`)
```typescript
// Before: All users → /dashboard
router.push('/dashboard');

// After: Role-based routing
const dashboardUrl = role === 'convener' ? '/convener/dashboard' : '/dashboard';
router.push(dashboardUrl);
```

#### B. Dashboard Role Check (`cohortle-web/src/app/dashboard/page.tsx`)
Added client-side redirect for conveners:
```typescript
useEffect(() => {
  if (!authLoading && user?.role === 'convener') {
    router.replace('/convener/dashboard');
  }
}, [user, authLoading, router]);
```

This ensures:
- Learners access `/dashboard` (calls learner endpoints)
- Conveners are redirected to `/convener/dashboard` (calls convener endpoints)
- No 403 errors because each role accesses their appropriate endpoints

## API Endpoint Role Matrix

### Learner-Only Endpoints (Correctly Restricted)
| Endpoint | Method | Role | Purpose |
|----------|--------|------|---------|
| `/v1/api/programmes/enrolled` | GET | learner | Get enrolled programmes |
| `/v1/api/programmes/enroll` | POST | learner | Enroll in programme |
| `/v1/api/cohorts/:id/join` | POST | learner | Join cohort |
| `/v1/api/lessons/:id/complete` | POST | learner | Mark lesson complete |

### Convener-Only Endpoints
| Endpoint | Method | Role | Purpose |
|----------|--------|------|---------|
| `/v1/api/programmes` | POST | convener | Create programme |
| `/v1/api/programmes/my` | GET | convener | Get my programmes |
| `/v1/api/programmes/:id/cohorts` | POST | convener | Create cohort |
| `/v1/api/programmes/:id/weeks` | POST | convener | Create week |
| `/v1/api/weeks/:id/lessons` | POST | convener | Create lesson |
| `/v1/api/programmes/:id/publish` | POST | convener | Publish programme |

### Shared Endpoints (Both Roles)
| Endpoint | Method | Role | Purpose |
|----------|--------|------|---------|
| `/v1/api/programmes/:id` | GET | learner\|convener | View programme details |
| `/v1/api/programmes/:id/weeks` | GET | learner\|convener | View programme weeks |
| `/v1/api/lessons/:id` | GET | learner\|convener | View lesson details |

## Frontend Routing Structure

```
/
├── /login → redirects to role-based dashboard after auth
├── /signup → redirects to role-based dashboard after auth
│
├── /dashboard (LEARNER ONLY)
│   ├── Calls: /v1/api/programmes/enrolled
│   └── Shows: Enrolled programmes
│
├── /convener/dashboard (CONVENER ONLY)
│   ├── Calls: /v1/api/programmes/my
│   └── Shows: Created programmes
│
├── /programmes/:id (BOTH ROLES)
│   └── View programme content
│
└── /lessons/:id (BOTH ROLES)
    └── View lesson content
```

## Testing

### Test Case 1: Learner Login
1. Login as learner
2. Should redirect to `/dashboard`
3. Should see enrolled programmes
4. No 403 errors

### Test Case 2: Convener Login
1. Login as convener
2. Should redirect to `/convener/dashboard`
3. Should see created programmes
4. No 403 errors

### Test Case 3: Convener Tries to Access Learner Dashboard
1. Login as convener
2. Manually navigate to `/dashboard`
3. Should auto-redirect to `/convener/dashboard`
4. No 403 errors

### Test Case 4: Convener Tries to Enroll (Should Fail)
1. Login as convener
2. Try to POST `/v1/api/programmes/enroll`
3. Should get 403 Forbidden (correct behavior)
4. Conveners cannot enroll - by design

## Deployment

The fix is ready to deploy:

```bash
# Backend changes (reverted incorrect role permissions)
cd cohortle-api
git add routes/programme.js routes/cohort.js routes/lesson.js
git commit -m "fix: maintain strict role separation - learner-only enrollment endpoints"
git push origin main

# Frontend changes (role-based routing)
cd cohortle-web
git add src/lib/contexts/AuthContext.tsx src/app/dashboard/page.tsx src/components/auth/LoginForm.tsx
git commit -m "fix: implement role-based dashboard routing for learners and conveners"
git push origin main
```

Coolify will auto-deploy both services.

## Preview Mode for Conveners

Conveners can test their programmes through Preview Mode (already implemented):
- Navigate to `/convener/programmes/:id`
- Click "Preview" button
- View programme as learners would see it
- NO enrollment created
- NO completion tracking
- Pure read-only preview

---
**Status**: ✅ COMPLETE - Proper role separation maintained
**Date**: 2026-02-25
**Design**: Conveners and learners are strictly separated roles
