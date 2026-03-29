# Implementation Plan: Admin Dashboard

## Overview

Two focused changes: move `/internal` from `convenerRoutes` to `adminRoutes` in middleware, then create `AdminLayout` at `cohortle-web/src/app/internal/layout.tsx` following the same pattern as `ConvenerLayout`.

## Tasks

- [x] 1. Update middleware to protect `/internal` as admin-only
  - In `cohortle-web/src/middleware.ts`, remove `/internal` from `convenerRoutes` and add it to `adminRoutes`
  - Verify the existing `isAdminRoute` branch already checks for `"administrator"` and `"admin"` roles and redirects unauthenticated users to `/login?returnUrl=<path>` and unauthorised users to `/unauthorized`
  - _Requirements: 4.1, 4.2, 4.3_

  - [x] 1.1 Write property tests for middleware `/internal` protection
    - **Property 1: Middleware blocks unauthenticated requests to `/internal`**
    - **Property 2: Middleware blocks non-admin authenticated requests to `/internal`**
    - **Property 3: Middleware allows admin requests to `/internal`**
    - **Validates: Requirements 4.1, 4.2, 4.3**
    - Place tests in `cohortle-web/__tests__/middleware/adminMiddleware.pbt.ts`
    - Use fast-check to generate random `/internal/*` paths and role strings
    - Minimum 100 iterations per property
    - Tag: `Feature: admin-dashboard, Property 1/2/3`

- [x] 2. Create AdminLayout component
  - Create `cohortle-web/src/app/internal/layout.tsx` as a `'use client'` component
  - Use `useAuth()` to get `user`, `isLoading`, `logout`
  - Use `usePathname()` to determine the active nav link
  - Render `<LoadingSpinner>` while `isLoading` is true
  - Redirect to `/login` if `!user`, redirect to `/unauthorized` if `user.role !== 'administrator'`
  - Header: Cohortle brand button (links to `/internal/leads`), "Admin" badge, "Leads" nav link, user name, logout button
  - Logout handler: call `await logout()` then `router.push('/login')`
  - Render `<main>{children}</main>` for page content
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 3.1, 3.2, 5.1, 5.2_

  - [x]* 2.1 Write unit tests for AdminLayout
    - Test: renders loading spinner when `isLoading` is true
    - Test: renders children and user name when user is administrator
    - Test: calls `router.push('/unauthorized')` when user role is not administrator
    - Test: calls `logout` and `router.push('/login')` when logout button is clicked
    - Test: "Leads" nav link has active styles when pathname is `/internal/leads`
    - Place tests in `cohortle-web/__tests__/components/AdminLayout.test.tsx`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.2, 3.1, 3.2_

  - [x]* 2.2 Write property test for AdminLayout non-admin redirect
    - **Property 4: AdminLayout redirects non-admin users**
    - **Validates: Requirements 1.4**
    - Generate random role strings excluding `"administrator"`, render `AdminLayout`, assert `router.push('/unauthorized')` is called
    - Place in `cohortle-web/__tests__/components/AdminLayout.pbt.tsx`
    - Minimum 100 iterations
    - Tag: `Feature: admin-dashboard, Property 4`

- [x] 3. Checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- The existing `LeadsPage` at `cohortle-web/src/app/internal/leads/page.tsx` requires no changes — Next.js will automatically apply the new layout
- The leads page has its own role check; the layout's check is a belt-and-braces guard for client-side navigation
