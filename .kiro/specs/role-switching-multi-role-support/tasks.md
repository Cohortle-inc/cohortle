# Implementation Plan: Role Switching and Multi-Role Support

## Overview

This implementation plan converts the dual-role system design into actionable coding tasks. The plan follows a phased approach: database schema updates, backend services, frontend components, integration, testing, and migration. Each task builds incrementally to enable early validation of core functionality.

## Tasks

- [ ] 1. Database Schema Updates and Migration Script
  - Create migration for new tables and columns
  - Add `role_context_switches` table for tracking role switches
  - Add `active_role_id` and `default_role_id` columns to `users` table
  - Add `is_default` column to `user_role_assignments` table
  - Remove unique constraint on `user_id` in `user_role_assignments` to allow multiple active roles
  - Add unique index for `(user_id, role_id)` to prevent duplicate role assignments
  - Create indexes for performance optimization
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ]* 1.1 Write property test for dual role assignment integrity
  - **Property 1: Dual Role Assignment Integrity**
  - **Validates: Requirements 1.1, 1.2, 1.3, 5.1, 5.2, 5.3, 5.5**

- [ ]* 1.2 Write property test for role assignment constraints
  - **Property 2: Role Assignment Constraints**
  - **Validates: Requirements 1.4, 1.5**

- [ ] 2. Implement Role Context Service (Backend)
  - [ ] 2.1 Create `RoleContextService.js` in `cohortle-api/services/`
    - Implement `getActiveRole(userId)` method
    - Implement `switchActiveRole(userId, newActiveRole)` method
    - Implement `getUserRoles(userId)` method to get all assigned roles
    - Implement `setDefaultActiveRole(userId, roleName)` method
    - Implement `validateRoleSwitch(userId, targetRole)` method
    - _Requirements: 2.4, 2.5, 12.1, 12.5_

  - [ ]* 2.2 Write unit tests for Role Context Service
    - Test `getActiveRole` with various user configurations
    - Test `switchActiveRole` with valid and invalid role switches
    - Test `getUserRoles` returns all assigned roles
    - Test `setDefaultActiveRole` updates preference correctly
    - Test `validateRoleSwitch` rejects invalid switches
    - _Requirements: 2.4, 2.5_

  - [ ]* 2.3 Write property test for role switch and redirect consistency
    - **Property 4: Role Switch and Redirect Consistency**
    - **Validates: Requirements 2.4, 2.5, 9.1, 9.2, 9.3**

- [ ] 3. Extend Role Assignment Service for Dual-Role Support (Backend)
  - [ ] 3.1 Update `RoleAssignmentService.js` in `cohortle-api/services/`
    - Implement `addRole(userId, roleName, assignedBy, options)` method for adding additional roles
    - Implement `getActiveAssignments(userId)` method to get all active role assignments
    - Implement `upgradeToConvener(userId, upgradedBy, options)` method that adds convener role while preserving learner role
    - Implement `hasRole(userId, roleName)` method to check if user has specific role
    - Update existing methods to support multiple active roles per user
    - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2, 5.3_

  - [ ]* 3.2 Write unit tests for extended Role Assignment Service
    - Test `addRole` adds role without removing existing roles
    - Test `upgradeToConvener` preserves learner role and data
    - Test `getActiveAssignments` returns all active roles
    - Test `hasRole` correctly identifies assigned roles
    - Test duplicate role assignment is rejected
    - _Requirements: 1.1, 1.2, 1.4_

  - [ ]* 3.3 Write property test for learner identity persistence
    - **Property 5: Learner Identity Persistence**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

- [ ] 4. Update JWT Service for Active Role Support (Backend)
  - [ ] 4.1 Update `JwtService.js` or JWT generation logic in `cohortle-api/routes/auth.js`
    - Update `generateToken` to include `active_role` and `assigned_roles` in JWT payload
    - Update `verifyToken` to validate active role against assigned roles
    - Implement `refreshTokenWithRole(oldToken, newActiveRole)` method for role switch
    - Ensure token includes permissions for active role only
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

  - [ ]* 4.2 Write unit tests for JWT Service updates
    - Test token generation includes active role and assigned roles
    - Test token validation verifies active role is in assigned roles
    - Test token refresh updates active role correctly
    - Test token with invalid active role is rejected
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 4.3 Write property test for JWT token role consistency
    - **Property 7: JWT Token Role Consistency**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.5**

  - [ ]* 4.4 Write property test for token invalidation on role change
    - **Property 8: Token Invalidation on Role Change**
    - **Validates: Requirements 8.4**

- [ ] 5. Implement Role Context API Endpoints (Backend)
  - [ ] 5.1 Create `cohortle-api/routes/role-context.js`
    - Implement `GET /api/users/me/roles` - Get user's assigned roles and active role
    - Implement `POST /api/users/me/switch-role` - Switch active role
    - Implement `PUT /api/users/me/default-role` - Set default active role
    - Implement `GET /api/users/:id/roles` - Get user's roles (admin only)
    - Implement `POST /api/users/:id/add-role` - Add role to user (admin only)
    - Implement `POST /api/users/:id/upgrade-convener` - Upgrade learner to convener (admin only)
    - Implement `GET /api/users/:id/role-switches` - Get role switch history
    - Add authentication and authorization middleware to all endpoints
    - _Requirements: 2.4, 2.5, 10.1, 10.2, 10.5_

  - [ ]* 5.2 Write unit tests for role context API endpoints
    - Test each endpoint with valid and invalid inputs
    - Test authentication and authorization
    - Test error responses for invalid role switches
    - Test admin-only endpoints reject non-admin users
    - _Requirements: 2.4, 2.5_

- [ ] 6. Checkpoint - Backend Core Functionality
  - Ensure all backend tests pass
  - Verify database schema is correctly updated
  - Test role switching flow via API endpoints
  - Ask the user if questions arise

- [ ] 7. Update Role Context Provider (Frontend)
  - [ ] 7.1 Update `cohortle-web/src/lib/contexts/RoleContext.tsx`
    - Add `activeRole` state to track current active role
    - Add `assignedRoles` state to track all assigned roles
    - Add `isSwitching` state for loading indicator
    - Implement `loadUserRoles()` method to fetch roles from API
    - Implement `switchRole(newRole)` method to switch active role
    - Implement `hasActiveRole(role)` method to check active role
    - Update `useEffect` to load roles on mount
    - Ensure backward compatibility with existing `userRole` property
    - _Requirements: 2.1, 2.2, 2.4, 2.5_

  - [ ]* 7.2 Write unit tests for updated Role Context Provider
    - Test role loading on mount
    - Test role switching updates state and redirects
    - Test `hasActiveRole` correctly identifies active role
    - Test loading states during role switch
    - Test error handling for failed role switches
    - _Requirements: 2.1, 2.4, 2.5_

- [ ] 8. Implement Role Switcher Component (Frontend)
  - [ ] 8.1 Create `cohortle-web/src/components/navigation/RoleSwitcher.tsx`
    - Implement dropdown component showing current active role
    - Display all assigned roles as selectable options
    - Highlight currently active role
    - Show loading state during role switch
    - Hide component if user has only one role
    - Add icons for each role (learner, convener, admin)
    - Style component to match existing navigation design
    - _Requirements: 2.2, 2.3, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 8.2 Write unit tests for Role Switcher Component
    - Test component renders for dual-role users
    - Test component hidden for single-role users
    - Test dropdown shows all assigned roles
    - Test active role is highlighted
    - Test clicking role triggers switch
    - Test loading state during switch
    - _Requirements: 2.2, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 8.3 Write property test for role switcher visibility
    - **Property 9: Role Switcher Visibility**
    - **Validates: Requirements 2.2, 7.2**

- [ ] 9. Implement Role Mode Indicator Component (Frontend)
  - [ ] 9.1 Create `cohortle-web/src/components/navigation/RoleModeIndicator.tsx`
    - Display current role mode with icon and label
    - Use distinct colors for each mode (blue for learner, purple for convener, red for admin)
    - Add subtle animation on role switch
    - Make component responsive for mobile devices
    - _Requirements: 3.4, 4.4_

  - [ ]* 9.2 Write unit tests for Role Mode Indicator Component
    - Test component displays correct mode
    - Test correct icon and color for each role
    - Test component updates on role switch
    - _Requirements: 3.4, 4.4_

- [ ] 10. Update Navigation Components (Frontend)
  - [ ] 10.1 Update `cohortle-web/src/components/navigation/LearnerNavBar.tsx`
    - Add Role Switcher component to navigation bar
    - Add Role Mode Indicator component
    - Ensure components are positioned appropriately
    - Test responsive behavior on mobile devices
    - _Requirements: 2.2, 7.1_

  - [ ] 10.2 Create or update convener navigation component
    - Add Role Switcher component to convener navigation
    - Add Role Mode Indicator component
    - Ensure consistent placement with learner navigation
    - _Requirements: 2.2, 7.1_

- [ ] 11. Update Authentication Flow (Frontend)
  - [ ] 11.1 Update `cohortle-web/src/lib/contexts/AuthContext.tsx`
    - Update login flow to fetch and store active role
    - Update signup flow to set default active role
    - Update logout flow to clear role context
    - Ensure JWT token includes active role information
    - _Requirements: 2.1, 8.1, 10.10_

  - [ ]* 11.2 Write unit tests for updated authentication flow
    - Test login sets active role correctly
    - Test signup assigns default role
    - Test logout clears role context
    - Test JWT token contains active role
    - _Requirements: 2.1, 8.1_

  - [ ]* 11.3 Write property test for default active role selection
    - **Property 10: Default Active Role Selection**
    - **Validates: Requirements 2.1, 12.2, 12.4**

- [ ] 12. Implement Role-Aware Routing and Access Control (Frontend)
  - [ ] 12.1 Update `cohortle-web/src/middleware.ts`
    - Add active role validation to middleware
    - Implement redirect logic based on active role
    - Deny access to convener routes when in learner mode
    - Allow access to learner routes when in convener mode
    - Provide clear error messages for denied access
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 13.2, 13.3, 13.5_

  - [ ]* 12.2 Write unit tests for role-aware middleware
    - Test convener routes blocked in learner mode
    - Test learner routes accessible in convener mode
    - Test redirect to appropriate dashboard on login
    - Test error messages for denied access
    - _Requirements: 9.4, 9.5, 13.2, 13.3_

  - [ ]* 12.3 Write property test for active role context enforcement
    - **Property 3: Active Role Context Enforcement**
    - **Validates: Requirements 3.2, 3.3, 4.2, 4.3, 9.4, 9.5, 13.1, 13.2, 13.3, 13.4**

  - [ ]* 12.4 Write property test for route protection middleware
    - **Property 15: Route Protection Middleware**
    - **Validates: Requirements 13.5**

- [ ] 13. Update Dashboard Components (Frontend)
  - [ ] 13.1 Update learner dashboard to show role switcher
    - Ensure learner dashboard displays enrolled programmes
    - Verify learner features are accessible
    - Verify convener features are hidden
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [ ] 13.2 Update convener dashboard to show role switcher
    - Ensure convener dashboard displays created programmes
    - Verify convener features are accessible
    - Verify learner-specific features are hidden (but learner routes are accessible)
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 13.3 Write unit tests for updated dashboards
    - Test learner dashboard shows correct content
    - Test convener dashboard shows correct content
    - Test role switcher appears on both dashboards
    - Test feature visibility based on active role
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_

- [ ] 14. Checkpoint - Frontend Core Functionality
  - Ensure all frontend tests pass
  - Test role switching flow in browser
  - Verify UI components render correctly
  - Test responsive behavior on mobile devices
  - Ask the user if questions arise

- [ ] 15. Implement Convener-as-Learner Participation Features
  - [ ] 15.1 Update enrollment logic to support conveners joining as learners
    - Ensure conveners can join cohorts using enrollment codes when in learner mode
    - Verify conveners are enrolled with learner permissions only
    - Ensure conveners don't get elevated permissions for programmes they're enrolled in
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 15.2 Update programme view logic for enrolled conveners
    - Display learner interface for programmes where convener is enrolled as learner
    - Display convener interface for programmes where user is the convener
    - Ensure clear visual distinction between owned and enrolled programmes
    - _Requirements: 6.4_

  - [ ]* 15.3 Write unit tests for convener-as-learner participation
    - Test conveners can join cohorts in learner mode
    - Test conveners get learner permissions only
    - Test correct interface is displayed based on relationship to programme
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 15.4 Write property test for convener as learner participation
    - **Property 6: Convener as Learner Participation**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

- [ ] 16. Implement Role Switch Audit Logging
  - [ ] 16.1 Create audit logging for role switches
    - Log all role switch operations to `role_context_switches` table
    - Include timestamp, user ID, from role, to role, session ID, IP address
    - Implement API endpoint to retrieve role switch history
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ]* 16.2 Write unit tests for audit logging
    - Test role switches are logged correctly
    - Test log entries include all required fields
    - Test history retrieval API endpoint
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ]* 16.3 Write property test for role switch audit trail
    - **Property 11: Role Switch Audit Trail**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**

- [ ] 17. Implement Active Role Preference Persistence
  - [ ] 17.1 Update role switch logic to persist preference
    - Store active role preference in database when user switches roles
    - Load preference on login and set as active role
    - Implement fallback logic if no preference exists
    - Allow users to explicitly set default role preference
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ]* 17.2 Write unit tests for preference persistence
    - Test preference is stored on role switch
    - Test preference is loaded on login
    - Test fallback logic when no preference exists
    - Test explicit preference setting
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ]* 17.3 Write property test for active role preference persistence
    - **Property 13: Active Role Preference Persistence**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.5**

- [ ] 18. Implement Administrator Full Access
  - [ ] 18.1 Update access control logic for administrators
    - Grant administrators access to all features without role switching
    - Hide role switcher for administrators
    - Implement admin preview mode for testing learner/convener experiences
    - _Requirements: 15.1, 15.3, 15.4, 15.5_

  - [ ]* 18.2 Write unit tests for administrator access
    - Test administrators can access all features
    - Test role switcher is hidden for administrators
    - Test admin preview mode works correctly
    - _Requirements: 15.1, 15.3, 15.4, 15.5_

  - [ ]* 18.3 Write property test for administrator full access
    - **Property 14: Administrator Full Access**
    - **Validates: Requirements 15.1, 15.3, 15.5**

- [ ] 19. Implement User Communication and Onboarding
  - [ ] 19.1 Create welcome message for upgraded conveners
    - Display modal or banner explaining dual-role system
    - Provide link to help documentation
    - Allow users to dismiss message
    - _Requirements: 14.1_

  - [ ] 19.2 Add tooltips and help text for role switcher
    - Add tooltip on first view of role switcher
    - Add confirmation message on first role switch
    - Provide contextual help for confused users
    - _Requirements: 14.2, 14.3_

  - [ ] 19.3 Create help documentation
    - Write documentation explaining learner mode vs convener mode
    - Provide examples of when to use each mode
    - Include FAQ section
    - _Requirements: 14.4_

- [ ] 20. Create Migration Script
  - [ ] 20.1 Create `cohortle-api/migrations/YYYYMMDD-dual-role-migration.js`
    - Backfill `active_role_id` and `default_role_id` from existing `role_id`
    - Add learner role assignment to all existing convener users
    - Set `is_default` flag for existing role assignments
    - Validate all users have at least one active role assignment
    - Ensure script is idempotent (can be run multiple times safely)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ]* 20.2 Write unit tests for migration script
    - Test learner-only users are migrated correctly
    - Test convener users get both roles
    - Test convener is set as default for conveners
    - Test all users have at least one role after migration
    - Test idempotency (running twice produces same result)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ]* 20.3 Write property test for migration idempotency and correctness
    - **Property 12: Migration Idempotency and Correctness**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**

- [ ] 21. Integration Testing
  - [ ]* 21.1 Write end-to-end tests for complete role switching flow
    - Test user login with multiple roles
    - Test role switching from learner to convener and back
    - Test dashboard redirect after role switch
    - Test feature access in each mode
    - Test JWT token updates on role switch
    - _Requirements: 2.1, 2.4, 2.5, 9.1, 9.2, 9.3_

  - [ ]* 21.2 Write integration tests for convener upgrade flow
    - Test learner upgrade to convener
    - Test learner data preservation
    - Test both roles are active after upgrade
    - Test default role is set correctly
    - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2, 5.3_

  - [ ]* 21.3 Write integration tests for convener-as-learner participation
    - Test convener joining cohort in learner mode
    - Test permissions are scoped correctly
    - Test programme history accumulation
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 22. Performance Testing and Optimization
  - [ ]* 22.1 Test role switch performance
    - Measure time to complete role switch operation
    - Optimize to complete in <500ms
    - Test with various network conditions
    - _Performance requirement_

  - [ ]* 22.2 Test database query performance
    - Measure query time for fetching user roles
    - Verify indexes are being used
    - Optimize slow queries
    - _Performance requirement_

  - [ ]* 22.3 Test JWT token size
    - Measure token size with active role and assigned roles
    - Ensure token size is reasonable (<2KB)
    - Optimize payload if needed
    - _Performance requirement_

- [ ] 23. Security Testing
  - [ ]* 23.1 Test token validation security
    - Test tokens with invalid active roles are rejected
    - Test tokens are invalidated when role assignments change
    - Test token tampering is detected
    - _Requirements: 8.3, 8.4_

  - [ ]* 23.2 Test access control security
    - Test users cannot access features outside their active role
    - Test conveners enrolled as learners don't get elevated permissions
    - Test role switch requires valid authentication
    - _Requirements: 3.3, 4.3, 6.3, 13.2, 13.3_

  - [ ]* 23.3 Test audit logging security
    - Test all role switches are logged
    - Test logs cannot be tampered with
    - Test sensitive information is not logged
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 24. Final Checkpoint - Pre-Deployment Validation
  - Run all unit tests and property tests
  - Run integration tests
  - Run performance tests
  - Run security tests
  - Verify migration script works on staging data
  - Test complete user flows in staging environment
  - Ask the user if questions arise

- [ ] 25. Deployment and Monitoring
  - [ ] 25.1 Deploy database schema updates to production
    - Run migration script to add new tables and columns
    - Verify schema updates are successful
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ] 25.2 Deploy backend services to production
    - Deploy updated Role Assignment Service
    - Deploy new Role Context Service
    - Deploy updated JWT Service
    - Deploy new API endpoints
    - _Requirements: 2.4, 2.5, 8.1, 8.2_

  - [ ] 25.3 Deploy frontend components to production
    - Deploy updated Role Context Provider
    - Deploy Role Switcher Component
    - Deploy Role Mode Indicator Component
    - Deploy updated navigation components
    - Deploy updated middleware
    - _Requirements: 2.2, 7.1, 7.2, 7.3, 9.1, 9.2_

  - [ ] 25.4 Run migration script to upgrade existing users
    - Execute dual-role migration script
    - Validate migration results
    - Monitor for errors
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ] 25.5 Monitor production for issues
    - Monitor error logs for role-related errors
    - Monitor performance metrics
    - Monitor user feedback
    - Be prepared to rollback if critical issues arise
    - _Deployment requirement_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows a phased approach: database → backend → frontend → integration → deployment
- Migration script is idempotent and can be run multiple times safely
- Security and performance testing are critical before production deployment
