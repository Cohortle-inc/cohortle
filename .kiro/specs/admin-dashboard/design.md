# Design Document: Admin Dashboard

## Overview

The Admin Dashboard adds a thin layout layer over the existing `/internal` routes. The work is almost entirely frontend — a new `AdminLayout` component (mirroring the existing `ConvenerLayout`) plus a small update to the middleware to ensure `/internal` is treated as an admin-only route.

No new API endpoints are needed. The existing `/v1/api/funnel/leads` endpoint and the existing `LeadsPage` component remain unchanged.

---

## Architecture

```mermaid
graph TD
    Browser -->|GET /internal/*| Middleware
    Middleware -->|no token| LoginPage[/login?returnUrl=...]
    Middleware -->|token, role != administrator| UnauthorizedPage[/unauthorized]
    Middleware -->|token, role = administrator| AdminLayout
    AdminLayout -->|renders| LeadsPage[/internal/leads]
    AdminLayout -->|uses| AuthContext
    AuthContext -->|logout| LoginPage
```

The middleware is the first line of defence. `AdminLayout` adds a second check at the component level (matching the pattern used by `ConvenerLayout`) so that even if middleware is bypassed (e.g. during client-side navigation), the layout redirects non-admins.

---

## Components and Interfaces

### AdminLayout (`cohortle-web/src/app/internal/layout.tsx`)

A `'use client'` component that:

- Reads `user`, `isLoading`, and `logout` from `useAuth()`
- Shows a `<LoadingSpinner>` while `isLoading` is true
- Redirects to `/login` if `!user`
- Redirects to `/unauthorized` if `user.role !== 'administrator'`
- Renders a header with: brand name, "Admin" badge, nav link to `/internal/leads`, user name, logout button
- Renders `{children}` as the main content area

```tsx
// Simplified interface
interface AdminLayoutProps {
  children: React.ReactNode;
}
```

The active nav link is determined by comparing `usePathname()` against the link's href.

### Middleware update (`cohortle-web/src/middleware.ts`)

The `/internal` path prefix is already listed in `convenerRoutes`, which means it currently allows `convener`, `instructor`, `administrator`, and `admin` roles. It needs to move to a dedicated admin-only check so only `administrator` / `admin` can access it.

Change: remove `/internal` from `convenerRoutes` and add it to `adminRoutes`.

```ts
// Before
const convenerRoutes = ['/convener', '/internal'];
const adminRoutes = ['/admin'];

// After
const convenerRoutes = ['/convener'];
const adminRoutes = ['/admin', '/internal'];
```

---

## Data Models

No new data models are introduced. The feature relies entirely on the existing `User` type from `AuthContext`:

```ts
interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  role?: 'student' | 'convener' | 'instructor' | 'administrator';
  profilePicture?: string;
  emailVerified: boolean;
}
```

The layout only reads `user.role` and `user.name`. No persistence or new state is required.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Middleware blocks unauthenticated requests to `/internal`

*For any* request to a path starting with `/internal` that carries no `auth_token` cookie, the middleware should return a redirect response pointing to `/login` (with a `returnUrl` parameter).

**Validates: Requirements 4.1**

---

### Property 2: Middleware blocks non-admin authenticated requests to `/internal`

*For any* request to a path starting with `/internal` that carries an `auth_token` whose decoded role is not `"administrator"` or `"admin"`, the middleware should return a redirect response pointing to `/unauthorized`.

**Validates: Requirements 4.2**

---

### Property 3: Middleware allows admin requests to `/internal`

*For any* request to a path starting with `/internal` that carries an `auth_token` whose decoded role is `"administrator"` or `"admin"`, the middleware should call `NextResponse.next()` (allow the request through).

**Validates: Requirements 4.3**

---

### Property 4: AdminLayout redirects non-admin users

*For any* rendered `AdminLayout` where the resolved `user.role` is not `"administrator"`, the component should trigger a navigation to `/unauthorized` rather than rendering the admin UI.

**Validates: Requirements 1.4**

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Token missing | Middleware redirects to `/login?returnUrl=<path>` |
| Token present, wrong role | Middleware redirects to `/unauthorized` |
| Token malformed (decode throws) | `getRoleFromToken` returns `null`; treated as wrong role → `/unauthorized` |
| `logout()` rejects | Error is swallowed; user stays on page (consistent with ConvenerLayout pattern) |
| API call in LeadsPage fails | LeadsPage handles its own error state; layout is unaffected |

---

## Testing Strategy

### Unit tests

- `AdminLayout` renders loading spinner when `isLoading` is true
- `AdminLayout` renders children when user is an administrator
- `AdminLayout` calls `router.push('/unauthorized')` when user role is not administrator
- `AdminLayout` calls `logout` and redirects to `/login` when logout button is clicked
- Active nav link is highlighted when pathname matches

### Property-based tests

Each property below should be implemented as a single property-based test using the project's existing PBT setup (fast-check / jest-fast-check).

**Property 1 test** — generate random paths prefixed with `/internal`, assert middleware returns a redirect to `/login` when no cookie is present.

**Property 2 test** — generate random non-admin role strings and random `/internal` paths, assert middleware returns a redirect to `/unauthorized`.

**Property 3 test** — generate random `/internal` paths with a valid admin token, assert middleware calls `next()`.

**Property 4 test** — generate random non-admin role values, render `AdminLayout` with a mock user carrying that role, assert `router.push` was called with `/unauthorized`.

Minimum 100 iterations per property test.

Tag format: `Feature: admin-dashboard, Property {N}: {property_text}`
