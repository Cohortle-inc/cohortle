# Requirements Document

## Introduction

The Admin Dashboard provides a protected internal area of the Cohortle platform accessible only to users with the `administrator` role. It wraps the existing `/internal` routes (starting with `/internal/leads`) in a consistent layout that includes navigation and a logout action, and ensures all pages under `/internal` are properly protected at both the middleware and component level.

## Glossary

- **Admin_Layout**: The shared layout component wrapping all `/internal` routes, providing navigation and logout
- **Admin_User**: A platform user whose `role` field equals `"administrator"`
- **Auth_Middleware**: The Next.js middleware at `cohortle-web/src/middleware.ts` that enforces route-level access control
- **AuthContext**: The React context at `cohortle-web/src/lib/contexts/AuthContext.tsx` providing `user`, `isLoading`, and `logout`
- **Internal_Route**: Any URL path beginning with `/internal`

---

## Requirements

### Requirement 1: Protected Admin Layout

**User Story:** As an admin user, I want a consistent layout wrapping all internal pages, so that I have navigation and a logout button available on every admin page.

#### Acceptance Criteria

1. THE Admin_Layout SHALL render a navigation header containing the Cohortle brand name, an "Admin" role badge, and a logout button
2. WHEN an Admin_User visits any Internal_Route, THE Admin_Layout SHALL display the user's name in the header
3. WHILE the Auth_Middleware is loading authentication state, THE Admin_Layout SHALL display a loading spinner instead of page content
4. IF the authenticated user's role is not `"administrator"`, THEN THE Admin_Layout SHALL redirect the user to `/unauthorized`
5. IF no authenticated user session exists, THEN THE Admin_Layout SHALL redirect the user to `/login`

---

### Requirement 2: Navigation to Leads Page

**User Story:** As an admin user, I want a navigation link to the leads page, so that I can access partner lead data from anywhere in the admin area.

#### Acceptance Criteria

1. THE Admin_Layout SHALL render a navigation link labelled "Leads" that navigates to `/internal/leads`
2. WHEN the current route matches `/internal/leads`, THE Admin_Layout SHALL visually highlight the "Leads" navigation link as active

---

### Requirement 3: Logout Functionality

**User Story:** As an admin user, I want to log out from the admin area, so that I can securely end my session.

#### Acceptance Criteria

1. WHEN an Admin_User clicks the logout button, THE Admin_Layout SHALL call the `logout` function from AuthContext
2. WHEN the `logout` function resolves, THE Admin_Layout SHALL redirect the user to `/login`

---

### Requirement 4: Middleware Route Protection

**User Story:** As a platform operator, I want all `/internal` routes to be protected at the middleware level, so that unauthenticated or unauthorised requests are rejected before any page renders.

#### Acceptance Criteria

1. WHEN a request arrives for an Internal_Route without an `auth_token` cookie, THE Auth_Middleware SHALL redirect the request to `/login` with a `returnUrl` query parameter set to the original path
2. WHEN a request arrives for an Internal_Route with an `auth_token` cookie whose decoded role is not `"administrator"`, THE Auth_Middleware SHALL redirect the request to `/unauthorized`
3. WHEN a request arrives for an Internal_Route with a valid `auth_token` cookie whose decoded role is `"administrator"`, THE Auth_Middleware SHALL allow the request to proceed

---

### Requirement 5: Leads Page Integration

**User Story:** As an admin user, I want the existing leads page to be rendered inside the admin layout, so that it benefits from consistent navigation and logout without duplicating those concerns.

#### Acceptance Criteria

1. THE Admin_Layout SHALL wrap the existing `/internal/leads` page content without modifying the leads page's own data-fetching or display logic
2. WHEN the leads page performs its own role check and the user is an Admin_User, THE Admin_Layout SHALL not interfere with the leads page rendering
