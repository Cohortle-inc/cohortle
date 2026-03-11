# MVP Authentication & Role System Bug Hunt - Requirements

## Overview
Comprehensive bug hunting and fixing for authentication and role system issues affecting both learner and convener roles. This spec focuses on systematic identification and resolution of persistent authentication failures, particularly the "user not authenticated" errors affecting learner role, through extensive testing of programme creation, cohort management, week/lesson access, learner viewing and participation, and progress tracking functionality.

## Problem Statement
The learner role continues to experience persistent "user not authenticated" errors despite previous fixes to database role mismatches and email verification logic. This bug hunt will conduct extensive testing across the entire MVP stack (database → backend → frontend → user experience) covering:
- Authentication verification for both learner and convener roles
- Programme creation workflow (convener)
- Cohort creation and management (convener)
- Week and lesson creation (convener)
- Learner viewing and participation capabilities
- Progress tracking and completion functionality
- All authentication touchpoints from login to feature access

## Scope
This bug hunt covers:
- **Authentication verification**: Both learner and convener registration, login, and session management
- **Programme creation workflow**: Complete convener flow from programme creation through cohort, week, and lesson setup
- **Cohort management**: Cohort creation, enrollment code generation, and learner enrollment
- **Week and lesson access**: Content creation, ordering, visibility, and access control
- **Learner viewing and participation**: Dashboard access, programme browsing, content viewing, and interaction
- **Progress tracking and completion**: Lesson completion marking, progress calculation, and dashboard display
- **Token lifecycle**: Generation, validation, refresh, and expiration handling
- **Role-based access control**: Frontend middleware and backend API authorization
- **Database integrity**: Role assignments, foreign keys, and data consistency
- **API endpoint authentication**: All protected endpoints across learner and convener features

## Out of Scope
- Email verification functionality (explicitly disabled for MVP)
- Advanced role permissions beyond basic role checks
- Multi-role support (users have single active role)
- Role switching UI
- Password reset functionality (existing implementation not modified)
- Social authentication (OAuth, etc.)
- Performance optimization
- UI/UX improvements beyond bug fixes

## Glossary

- **System**: The Cohortle learning management platform
- **Learner**: A user with student role who enrolls in and participates in programmes
- **Convener**: A user with convener role who creates and manages programmes
- **Programme**: A structured learning experience containing weeks and lessons
- **Cohort**: A group of learners enrolled in a specific instance of a programme
- **Week**: A time-based grouping of lessons within a programme
- **Lesson**: Individual learning content (video, text, PDF, link, quiz, or live session)
- **Role_Assignment**: The association between a user and their role in the user_role_assignments table
- **Auth_Token**: JWT token stored in httpOnly cookie containing user identity and role
- **Profile_Service**: Backend service responsible for retrieving user profile and role information

## Requirements

### Requirement 1: Learner Authentication Verification

**User Story:** As a learner, I want to register, login, and access my dashboard without authentication errors, so that I can participate in programmes.

#### Acceptance Criteria

1. WHEN a learner registers with email and password, THE System SHALL create a user account
2. WHEN a learner account is created, THE System SHALL assign a student role via user_role_assignments table
3. WHEN a learner logs in with valid credentials, THE System SHALL generate a JWT token containing role information
4. WHEN a learner accesses their profile, THE System SHALL retrieve role from user_role_assignments table without errors
5. WHEN a learner accesses the dashboard, THE System SHALL display content without "user not authenticated" errors
6. WHEN the Profile_Service retrieves a user, THE System SHALL query user_role_assignments table (not deprecated role_id column)

### Requirement 2: Convener Authentication Verification

**User Story:** As a convener, I want to register, login, and access my convener dashboard without authentication errors, so that I can create and manage programmes.

#### Acceptance Criteria

1. WHEN a convener registers with appropriate credentials, THE System SHALL create a user account
2. WHEN a convener account is created, THE System SHALL assign a convener role via user_role_assignments table
3. WHEN a convener logs in with valid credentials, THE System SHALL generate a JWT token containing convener role
4. WHEN a convener accesses their profile, THE System SHALL retrieve convener role from user_role_assignments table
5. WHEN a convener accesses the dashboard, THE System SHALL redirect to /convener/dashboard
6. WHEN a convener is authenticated, THE System SHALL allow access to both convener and learner features

### Requirement 3: Programme Creation Workflow Validation

**User Story:** As a convener, I want to create programmes without errors, so that I can set up learning content for learners.

#### Acceptance Criteria

1. WHEN a convener creates a new programme, THE System SHALL store programme data in the database
2. WHEN a programme is created, THE System SHALL associate it with the convener's user ID
3. WHEN a programme is saved, THE System SHALL return the programme ID for subsequent operations
4. WHEN a convener retrieves their programmes, THE System SHALL return all programmes they created
5. WHEN programme data is invalid, THE System SHALL return descriptive validation errors

### Requirement 4: Cohort Management Validation

**User Story:** As a convener, I want to create and manage cohorts within programmes, so that I can organize learners into groups.

#### Acceptance Criteria

1. WHEN a convener creates a cohort for a programme, THE System SHALL store cohort data with programme association
2. WHEN a cohort is created, THE System SHALL generate a unique enrollment code
3. WHEN a cohort is retrieved, THE System SHALL verify it belongs to the correct programme
4. WHEN a cohort enrollment code is checked, THE System SHALL validate it exists and is active
5. WHEN cohort data is invalid, THE System SHALL prevent creation and return validation errors

### Requirement 5: Week and Lesson Access Validation

**User Story:** As a convener, I want to create weeks and lessons within programmes, so that I can structure learning content.

#### Acceptance Criteria

1. WHEN a convener creates a week for a programme, THE System SHALL store week data with programme association
2. WHEN a convener creates a lesson within a week, THE System SHALL store lesson data with week association
3. WHEN lessons are retrieved, THE System SHALL return them in the correct order
4. WHEN a lesson is accessed, THE System SHALL verify the user has permission to view it
5. WHEN week or lesson data is invalid, THE System SHALL prevent creation and return validation errors

### Requirement 6: Learner Enrollment Verification

**User Story:** As a learner, I want to enroll in programmes using enrollment codes, so that I can access learning content.

#### Acceptance Criteria

1. WHEN a learner submits a valid enrollment code, THE System SHALL create an enrollment record
2. WHEN an enrollment is created, THE System SHALL associate the learner with the cohort
3. WHEN a learner accesses an enrolled programme, THE System SHALL allow access to content
4. WHEN a learner submits an invalid enrollment code, THE System SHALL reject it with a descriptive error
5. WHEN a learner attempts to enroll twice, THE System SHALL handle it idempotently

### Requirement 7: Learner Content Access Verification

**User Story:** As a learner, I want to view programme content (weeks and lessons), so that I can learn.

#### Acceptance Criteria

1. WHEN a learner accesses an enrolled programme, THE System SHALL display the programme structure
2. WHEN a learner views weeks, THE System SHALL show only weeks they have access to
3. WHEN a learner accesses a lesson, THE System SHALL display the lesson content
4. WHEN a learner attempts to access unenrolled content, THE System SHALL deny access with appropriate message
5. WHEN lesson content is rendered, THE System SHALL handle all content types (video, text, PDF, link, quiz, live session)

### Requirement 8: Progress Tracking Verification

**User Story:** As a learner, I want my lesson completion to be tracked, so that I can see my progress.

#### Acceptance Criteria

1. WHEN a learner marks a lesson as complete, THE System SHALL store the completion in lesson_completions table
2. WHEN a completion is stored, THE System SHALL associate it with the learner and lesson
3. WHEN progress is calculated, THE System SHALL compute percentage based on completed vs total lessons
4. WHEN a learner views their dashboard, THE System SHALL display accurate progress for each programme
5. WHEN a lesson is already completed, THE System SHALL handle duplicate completion requests idempotently

### Requirement 9: Role-Based Access Control Verification

**User Story:** As a system, I want to enforce role-based access control, so that users can only access features appropriate to their role.

#### Acceptance Criteria

1. WHEN a learner attempts to access convener-only features, THE System SHALL deny access
2. WHEN a convener accesses learner features, THE System SHALL allow access
3. WHEN an unauthenticated user attempts to access protected routes, THE System SHALL redirect to login
4. WHEN role checks are performed, THE System SHALL validate on both frontend middleware and backend API
5. WHEN a user's role is retrieved, THE System SHALL use the user_role_assignments table

### Requirement 10: Token Lifecycle Management Verification

**User Story:** As a system, I want to manage authentication tokens correctly, so that users remain authenticated across sessions.

#### Acceptance Criteria

1. WHEN a token is generated, THE System SHALL store it in an httpOnly cookie
2. WHEN a token is created, THE System SHALL include user ID, role, and permissions in the payload
3. WHEN a token is validated, THE System SHALL verify signature and expiration
4. WHEN a token expires, THE System SHALL handle it gracefully and prompt re-authentication
5. WHEN a token is refreshed, THE System SHALL generate a new token with updated information

### Requirement 11: Database Integrity Verification

**User Story:** As a system, I want to ensure database integrity for authentication and roles, so that all users have valid role assignments.

#### Acceptance Criteria

1. WHEN the database is queried, THE System SHALL find no users without role assignments
2. WHEN a user is created, THE System SHALL ensure a role assignment is created in the same transaction
3. WHEN role assignments are queried, THE System SHALL use the user_role_assignments table
4. WHEN the deprecated role_id column is encountered, THE System SHALL not use it for role lookups
5. WHEN database migrations run, THE System SHALL ensure all existing users have role assignments

### Requirement 12: API Endpoint Authentication Verification

**User Story:** As a system, I want to verify all API endpoints correctly authenticate requests, so that unauthorized access is prevented.

#### Acceptance Criteria

1. WHEN an API endpoint requires authentication, THE System SHALL validate the JWT token
2. WHEN a token is missing or invalid, THE System SHALL return 401 Unauthorized
3. WHEN a token is valid but lacks required permissions, THE System SHALL return 403 Forbidden
4. WHEN authentication middleware runs, THE System SHALL attach user and role to the request object
5. WHEN API responses include user data, THE System SHALL include role information from user_role_assignments

## Technical Requirements

### Database Layer
- THE System SHALL use user_role_assignments table for all role lookups
- THE System SHALL NOT use the deprecated role_id column in users table
- THE System SHALL ensure all users have at least one active role assignment
- THE System SHALL use transactions when creating users and assigning roles
- THE System SHALL maintain referential integrity between users, roles, and role assignments

### Backend API Layer
- THE System SHALL include role information in all authentication responses
- THE System SHALL validate JWT tokens on all protected endpoints
- THE System SHALL retrieve roles from user_role_assignments in ProfileService
- THE System SHALL include role and permissions in JWT token payload
- THE System SHALL return 401 for missing/invalid tokens and 403 for insufficient permissions

### Frontend Layer
- THE System SHALL store auth tokens in httpOnly cookies
- THE System SHALL validate authentication in middleware before rendering protected routes
- THE System SHALL forward authentication tokens in API proxy requests
- THE System SHALL implement role-based routing (learner → /dashboard, convener → /convener/dashboard)
- THE System SHALL handle authentication errors gracefully with user-friendly messages

### Environment Configuration
- THE System SHALL have REQUIRE_EMAIL_VERIFICATION set to false for MVP
- THE System SHALL have NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION set to false for MVP
- THE System SHALL have consistent API_URL and FRONTEND_URL across environments
- THE System SHALL validate required environment variables on startup

## Success Criteria
- All 12 requirements pass their acceptance criteria
- Zero "user not authenticated" errors for valid users
- Both learner and convener roles function correctly end-to-end
- Programme creation, cohorts, weeks, and lessons work without errors
- Learner enrollment and content access work correctly
- Progress tracking persists and displays accurately
- All automated tests pass
- Manual testing confirms all user flows work

## Out of Scope
- Email verification functionality (explicitly disabled for MVP)
- Advanced role permissions beyond basic role checks
- Multi-role support (users have single active role)
- Role switching UI
- Password reset functionality (existing implementation not modified)
- Social authentication (OAuth, etc.)

## Dependencies
- Existing role system tables (roles, user_role_assignments, role_permissions)
- Existing authentication infrastructure (JWT, bcrypt, cookies)
- Existing programme/cohort/week/lesson tables
- Existing enrollment and progress tracking tables

## Risks and Mitigation

### Risk 1: Database Inconsistencies
**Risk:** Users may exist without role assignments from previous migrations
**Mitigation:** Run diagnostic queries to identify and fix missing role assignments

### Risk 2: Cached Authentication State
**Risk:** Browser cache may contain old authentication state
**Mitigation:** Clear browser cache and test in incognito mode during verification

### Risk 3: Environment Variable Mismatches
**Risk:** Frontend and backend may have different email verification settings
**Mitigation:** Verify environment variables match across all environments

### Risk 4: Token Expiration During Testing
**Risk:** Long testing sessions may encounter token expiration
**Mitigation:** Implement token refresh or re-authenticate during testing

### Risk 5: Race Conditions in Role Assignment
**Risk:** Role assignment may fail if not wrapped in transaction
**Mitigation:** Ensure user creation and role assignment happen in same transaction
