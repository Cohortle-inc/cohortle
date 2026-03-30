# Implementation Plan: Admin Dashboard

## Overview

Thin layout layer over the existing `/internal` routes. Involves a middleware update to move `/internal` into admin-only protection, a new `AdminLayout` component, and property-based + unit tests covering middleware and layout behaviour.

## Tasks

- [x] 1. Update middleware to protect `/internal` as admin-only
  - Move `/internal` from `convenerRoutes` to `adminRoutes` in `cohortle-web/src/middleware.ts`
  - Ensure unauthenticated requests redirect to `/login?returnUrl=<path>`
  - Ensure non-admin authenticated requests redirect to `/unauthorized`
  - Ensure admin-role requests call `NextResponse.next()`
  - _Requirements: 4.1, 4.2, 4.3_

  - [x]* 1.1 Write property-based tests for middleware `/internal` protection
    - File: `cohortle-web/__tests__/middleware/adminMiddleware.pbt.ts`
    - **Property 1: Middleware blocks unauthenticated requests to `/internal`**
    - **Property 2: Middleware blocks non-admin authenticated requests to `/internal`**
    - **Property 3: Middleware allows admin requests to `/internal`**
    - Minimum 100 iterations per property; use fast-check / jest-fast-check
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [x] 2. Create AdminLayout component
  - File: `cohortle-web/src/app/internal/layout.tsx` as a `'use client'` component
  - Read `user`, `isLoading`, `logout` from `useAuth()`
  - Show `<LoadingSpinner>` while `isLoading` is true (Requirement 1.3)
  - Redirect to `/login` if `!user` (Requirement 1.5)
  - Redirect to `/unauthorized` if `user.role !== 'administrator'` (Requirement 1.4)
  - Render header with brand name, "Admin" badge, user name, logout button (Requirements 1.1, 1.2)
  - Render "Leads" nav link to `/internal/leads` with active highlight via `usePathname()` (Requirements 2.1, 2.2)
  - Logout handler calls `logout()` then `router.push('/login')` (Requirements 3.1, 3.2)
  - Render `{children}` as main content (Requirement 5.1)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 3.1, 3.2, 5.1_

  - [x]* 2.1 Write unit tests for AdminLayout
    - File: `cohortle-web/__tests__/components/AdminLayout.test.tsx`
    - Test: renders loading spinner when `isLoading` is true
    - Test: renders children and user name when user is administrator
    - Test: calls `router.push('/unauthorized')` when role is not administrator
    - Test: calls `router.push('/login')` when no user session exists
    - Test: calls `logout` and redirects to `/login` on logout button click
    - Test: "Leads" link has active styles when pathname is `/internal/leads`
    - Test: "Leads" link does not have active styles on other paths
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.2, 3.1, 3.2_

  - [ ]* 2.2 Fix type error in AdminLayout property-based test
    - File: `cohortle-web/__tests__/components/AdminLayout.pbt.tsx`
    - Add missing `AuthContextType` fields to the `mockUseAuth.mockReturnValue(...)` call: `loginWithGoogle`, `resendVerificationEmail`, `refreshVerificationStatus`
    - **Property 4: AdminLayout redirects non-admin users**
    - Minimum 100 iterations; use fast-check
    - **Validates: Requirements 1.4**

- [ ] 3. Checkpoint — ensure all tests pass
  - Run `npx jest --testPathPattern="adminMiddleware|AdminLayout" --run` and confirm all tests pass
  - Ask the user if any questions arise before proceeding
