# MVP Authentication & Role System Bug Hunt - Tasks

## Overview
Comprehensive bug hunting tasks covering authentication verification, programme creation, cohort management, week/lesson access, learner viewing and participation, and progress tracking for both learner and convener roles.

## Phase 1: Database Audit and Fixes

- [x] 1.1 Create comprehensive database diagnostic script
  - Create SQL script to check user role assignments
  - Check for users without role assignments
  - Check role distribution across all roles
  - Verify role_id foreign keys and referential integrity
  - Check for duplicate active role assignments
  - Verify recent user registrations have roles
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 1.2 Run database diagnostics and document findings
  - Execute all diagnostic queries
  - Document user count by role
  - Identify users without role assignments
  - Identify data inconsistencies
  - Create findings report
  - _Requirements: 11.1, 11.2, 11.3_

- [x] 1.3 Fix missing role assignments
  - Assign student role to users without assignments
  - Verify all users have active role assignments
  - Update any orphaned records
  - Re-run diagnostics to confirm fixes
  - _Requirements: 11.2, 11.5_

- [ ] 1.4 Verify database integrity
  - Re-run all diagnostic queries
  - Confirm zero users without roles
  - Verify role distribution is correct
  - Document final database state
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

## Phase 2: Backend API Audit and Fixes

- [ ] 2.1 Audit authentication endpoints
  - Review POST /v1/api/auth/register-email (learner and convener)
  - Review POST /v1/api/auth/login
  - Review POST /v1/api/auth/refresh-token
  - Verify role retrieval uses user_role_assignments table
  - Verify role is NOT retrieved from deprecated role_id column
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 10.1, 10.2, 12.4_

- [ ] 2.2 Audit ProfileService
  - Review GET /v1/api/profile endpoint
  - Verify role retrieval from user_role_assignments table
  - Test with learner role
  - Test with convener role
  - Verify response includes role information
  - _Requirements: 1.4, 1.6, 2.4, 12.5_

- [ ] 2.3 Audit JWT token generation
  - Review createTokenWithRole function
  - Verify role is included in token payload
  - Verify permissions are included in token payload
  - Test token decoding
  - Verify token expiration is set correctly
  - _Requirements: 1.3, 2.3, 10.1, 10.2, 10.3_

- [ ] 2.4 Test learner authentication flow
  - Test learner registration via API
  - Verify learner role assigned in database
  - Test learner login via API
  - Verify JWT token contains learner role
  - Test profile endpoint with learner token
  - Verify no "user not authenticated" errors
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2.5 Test convener authentication flow
  - Test convener registration via API
  - Verify convener role assigned in database
  - Test convener login via API
  - Verify JWT token contains convener role
  - Test profile endpoint with convener token
  - Verify convener can access both convener and learner features
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

- [~] 2.6 Audit programme creation endpoints
  - Review POST /v1/api/programmes
  - Verify authentication required
  - Verify convener role required
  - Test programme creation with valid data
  - Test programme creation with invalid data
  - Verify programme associated with convener user ID
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 12.1, 12.2, 12.3_

- [ ] 2.7 Audit cohort management endpoints
  - Review POST /v1/api/cohorts
  - Review GET /v1/api/cohorts/:id
  - Verify authentication and authorization
  - Test cohort creation with programme association
  - Verify enrollment code generation
  - Test enrollment code validation endpoint
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 2.8 Audit week and lesson endpoints
  - Review POST /v1/api/weeks
  - Review POST /v1/api/lessons
  - Review GET /v1/api/lessons/:id
  - Verify authentication and authorization
  - Test week creation with programme association
  - Test lesson creation with week association
  - Verify lesson ordering
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 2.9 Audit enrollment endpoints
  - Review POST /v1/api/enroll
  - Verify authentication required
  - Test enrollment with valid code
  - Test enrollment with invalid code
  - Verify idempotency (duplicate enrollment)
  - Verify enrollment record created
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 2.10 Audit learner content access endpoints
  - Review GET /v1/api/programmes/:id (learner view)
  - Review GET /v1/api/programmes/:id/weeks
  - Review GET /v1/api/lessons/:id (learner view)
  - Verify authentication required
  - Test access to enrolled programme
  - Test access to unenrolled programme (should deny)
  - Verify all content types render correctly
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 2.11 Audit progress tracking endpoints
  - Review POST /v1/api/lessons/:id/complete
  - Review GET /v1/api/progress
  - Verify authentication required
  - Test marking lesson as complete
  - Verify completion stored in lesson_completions table
  - Test progress calculation
  - Verify idempotency (duplicate completion)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 2.12 Fix backend issues
  - Fix any role retrieval issues found
  - Fix any token generation issues found
  - Update any queries using deprecated role_id column
  - Fix any authorization issues found
  - Test all fixes
  - _Requirements: All backend-related requirements_

## Phase 3: Frontend Audit and Fixes

- [ ] 3.1 Audit AuthContext
  - Review user state initialization
  - Review login function
  - Review signup function
  - Review logout function
  - Verify role handling in state
  - Test state updates on authentication events
  - _Requirements: 1.5, 2.5, 10.1_

- [ ] 3.2 Audit middleware
  - Review getRoleFromToken function
  - Review route protection logic
  - Review role-based routing (learner → /dashboard, convener → /convener/dashboard)
  - Test with learner role
  - Test with convener role
  - Test with unauthenticated user
  - _Requirements: 2.5, 9.1, 9.2, 9.3, 9.4_

- [ ] 3.3 Audit API proxy
  - Review token forwarding in /api/proxy
  - Review header handling
  - Test authenticated API requests
  - Verify cookies are forwarded correctly
  - _Requirements: 10.1, 12.1_

- [ ] 3.4 Test frontend authentication
  - Test token storage in httpOnly cookies
  - Verify cookie security flags (httpOnly, secure, sameSite)
  - Test AuthContext updates on login
  - Test role-based routing
  - Test API calls with authentication
  - _Requirements: 10.1, 10.2_

- [ ] 3.5 Fix frontend issues
  - Fix any token handling issues found
  - Fix any routing issues found
  - Fix any state management issues found
  - Fix any API proxy issues found
  - Test all fixes
  - _Requirements: All frontend-related requirements_

## Phase 4: Comprehensive Integration Testing

- [ ] 4.1 Test complete learner registration and authentication
  - Register new learner account via UI
  - Verify role assignment in database
  - Login with learner credentials
  - Verify redirect to /dashboard
  - Verify no "user not authenticated" errors
  - Check browser cookies for auth_token
  - Verify token contains learner role
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 4.2 Test learner dashboard and profile access
  - Access learner dashboard
  - Verify dashboard loads without errors
  - Access profile page
  - Verify profile displays learner role
  - Verify profile data loads correctly
  - Test navigation between dashboard and profile
  - _Requirements: 1.5, 1.6, 7.1_

- [ ] 4.3 Test learner programme browsing
  - Access programme catalogue/browse page
  - Verify programmes display correctly
  - View programme details
  - Verify programme structure visible
  - Test with enrolled and unenrolled programmes
  - _Requirements: 7.1, 7.2_

- [ ] 4.4 Test learner enrollment flow
  - Obtain valid enrollment code (from convener test)
  - Submit enrollment code via UI
  - Verify enrollment success message
  - Verify programme appears in "My Programmes"
  - Verify enrollment record in database
  - Test duplicate enrollment (should handle gracefully)
  - Test invalid enrollment code (should show error)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 4.5 Test learner content viewing - programme structure
  - Access enrolled programme
  - Verify programme header displays correctly
  - Verify weeks display in correct order
  - Verify lessons display within weeks
  - Verify lesson ordering is correct
  - Test navigation between weeks
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 4.6 Test learner content viewing - all lesson types
  - Access text lesson and verify content renders
  - Access video lesson and verify video embeds correctly
  - Access PDF lesson and verify PDF displays
  - Access link lesson and verify link works
  - Access quiz lesson and verify quiz displays
  - Access live session lesson and verify session info displays
  - Verify no authentication errors on any content type
  - _Requirements: 7.3, 7.5_

- [ ] 4.7 Test learner lesson completion
  - Mark a lesson as complete
  - Verify completion button updates
  - Verify completion persists on page refresh
  - Mark multiple lessons as complete
  - Verify duplicate completion handled gracefully
  - Check lesson_completions table in database
  - _Requirements: 8.1, 8.2, 8.5_

- [ ] 4.8 Test learner progress tracking
  - Complete several lessons in a programme
  - View dashboard
  - Verify progress percentage displays correctly
  - Verify progress calculation is accurate
  - Complete all lessons in a week
  - Verify week completion status
  - Test progress across multiple programmes
  - _Requirements: 8.3, 8.4_

- [ ] 4.9 Test learner session persistence
  - Refresh page while authenticated
  - Verify still authenticated
  - Navigate between pages
  - Verify authentication persists
  - Close and reopen browser
  - Verify session persists (if not expired)
  - _Requirements: 10.1, 10.3_

- [ ] 4.10 Test complete convener registration and authentication
  - Register new convener account via UI
  - Verify role assignment in database
  - Login with convener credentials
  - Verify redirect to /convener/dashboard
  - Verify no authentication errors
  - Check browser cookies for auth_token
  - Verify token contains convener role
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 4.11 Test convener dashboard and profile access
  - Access convener dashboard
  - Verify dashboard loads without errors
  - Access profile page
  - Verify profile displays convener role
  - Verify convener can also access learner dashboard
  - Test navigation between convener and learner features
  - _Requirements: 2.4, 2.5, 2.6_

- [ ] 4.12 Test convener programme creation
  - Create new programme via UI
  - Fill in programme details (name, description, etc.)
  - Submit programme creation form
  - Verify programme created successfully
  - Verify programme appears in convener's programme list
  - Check programmes table in database
  - Verify programme associated with convener user ID
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 4.13 Test convener cohort creation
  - Access created programme
  - Create new cohort
  - Fill in cohort details (name, start date, etc.)
  - Submit cohort creation form
  - Verify cohort created successfully
  - Verify enrollment code generated
  - Copy enrollment code for learner testing
  - Check cohorts table in database
  - Verify cohort associated with programme
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 4.14 Test convener week creation
  - Access programme
  - Create new week
  - Fill in week details (title, description, order)
  - Submit week creation form
  - Verify week created successfully
  - Create multiple weeks
  - Verify weeks display in correct order
  - Check weeks table in database
  - Verify weeks associated with programme
  - _Requirements: 5.1, 5.2_

- [ ] 4.15 Test convener lesson creation - all content types
  - Access week
  - Create text lesson with content
  - Create video lesson with YouTube/Vimeo URL
  - Create PDF lesson with PDF URL
  - Create link lesson with external URL
  - Create quiz lesson with quiz content
  - Create live session lesson with session details
  - Verify all lessons created successfully
  - Verify lessons display in correct order
  - Check lessons table in database
  - Verify lessons associated with week
  - _Requirements: 5.2, 5.3, 5.5_

- [ ] 4.16 Test convener content editing
  - Edit programme details
  - Verify changes saved
  - Edit cohort details
  - Verify changes saved
  - Edit week details
  - Verify changes saved
  - Edit lesson details
  - Verify changes saved
  - Test with all lesson content types
  - _Requirements: 3.1, 4.1, 5.1, 5.2_

- [ ] 4.17 Test convener lesson reordering
  - Access week with multiple lessons
  - Reorder lessons using drag-and-drop or order field
  - Verify new order saved
  - Verify new order displays correctly
  - Verify learner sees lessons in new order
  - _Requirements: 5.3_

- [ ] 4.18 Test convener session persistence
  - Refresh page while authenticated
  - Verify still authenticated
  - Navigate between convener pages
  - Verify authentication persists
  - Close and reopen browser
  - Verify session persists (if not expired)
  - _Requirements: 10.1, 10.3_

- [ ] 4.19 Test cross-role integration
  - Convener creates complete programme (cohorts, weeks, lessons)
  - Convener retrieves enrollment code
  - Switch to learner account
  - Learner enrolls using enrollment code
  - Learner views programme content
  - Learner completes lessons
  - Verify all data consistent across roles
  - _Requirements: 3.1, 4.1, 5.1, 6.1, 7.1, 8.1_

- [ ] 4.20 Test authentication edge cases
  - Test with expired token (wait for expiration or manipulate)
  - Verify redirect to login
  - Test with invalid token (manipulate cookie)
  - Verify redirect to login
  - Test with missing token (delete cookie)
  - Verify redirect to login
  - Test concurrent sessions (login on two browsers)
  - Verify both sessions work
  - _Requirements: 10.3, 10.4, 12.2_

- [ ] 4.21 Test role-based access control
  - As learner, attempt to access /convener/dashboard
  - Verify access denied or redirect
  - As learner, attempt to create programme via API
  - Verify 403 Forbidden response
  - As convener, access learner features
  - Verify access allowed
  - As unauthenticated user, access protected routes
  - Verify redirect to login
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 4.22 Test API endpoint authentication
  - Test all protected endpoints without token
  - Verify 401 Unauthorized responses
  - Test endpoints with invalid token
  - Verify 401 Unauthorized responses
  - Test endpoints with valid token but wrong role
  - Verify 403 Forbidden responses
  - Test endpoints with valid token and correct role
  - Verify successful responses
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 4.23 Document all integration test results
  - Create comprehensive test results document
  - List all tests performed
  - Document pass/fail status for each test
  - Document any errors encountered
  - Document any unexpected behavior
  - Create prioritized list of issues to fix
  - _Requirements: All requirements_

## Phase 5: Fixes and Verification

- [ ] 5.1 Implement fixes for critical issues
  - Fix any authentication blocking issues
  - Fix any role assignment issues
  - Fix any "user not authenticated" errors
  - Test each fix immediately
  - _Requirements: 1.5, 2.5, 9.3_

- [ ] 5.2 Implement fixes for programme creation issues
  - Fix any programme creation errors
  - Fix any cohort creation errors
  - Fix any week creation errors
  - Fix any lesson creation errors
  - Test each fix
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 5.1, 5.2_

- [ ] 5.3 Implement fixes for learner access issues
  - Fix any enrollment errors
  - Fix any content viewing errors
  - Fix any progress tracking errors
  - Test each fix
  - _Requirements: 6.1, 6.2, 7.1, 7.3, 8.1, 8.2_

- [ ] 5.4 Re-run critical test scenarios
  - Re-test learner registration and login
  - Re-test learner dashboard access
  - Re-test convener registration and login
  - Re-test programme creation flow
  - Re-test enrollment and content access
  - Re-test progress tracking
  - Verify all critical issues resolved
  - _Requirements: All requirements_

- [ ] 5.5 Re-run complete integration test suite
  - Re-run all tests from Phase 4
  - Verify all tests pass
  - Document any remaining issues
  - Prioritize remaining issues
  - _Requirements: All requirements_

- [ ] 5.6 Verify fixes in production environment
  - Deploy all fixes to production
  - Test with real user accounts
  - Monitor application logs for errors
  - Test learner flow in production
  - Test convener flow in production
  - Verify zero "user not authenticated" errors
  - _Requirements: All requirements_

- [ ] 5.7 Create comprehensive fix documentation
  - Document all issues found
  - Document all fixes applied
  - Document code changes made
  - Document database changes made
  - Document configuration changes made
  - Create before/after comparison
  - _Requirements: All requirements_

## Phase 6: Cleanup and Documentation

- [ ] 6.1 Clean up diagnostic scripts and test data
  - Remove temporary test accounts
  - Archive diagnostic scripts
  - Document diagnostic process
  - Clean up test programmes/cohorts/lessons
  - _Requirements: N/A_

- [ ] 6.2 Update system documentation
  - Update authentication documentation
  - Update role system documentation
  - Update API documentation
  - Update troubleshooting guide
  - Document known issues (if any)
  - _Requirements: All requirements_

- [ ] 6.3 Create comprehensive summary report
  - List all issues found (categorized by severity)
  - List all fixes applied (categorized by area)
  - Document success metrics achieved
  - Document test coverage
  - Provide recommendations for future improvements
  - Create executive summary
  - _Requirements: All requirements_

- [ ] 6.4 Conduct final verification
  - Perform final end-to-end test of learner flow
  - Perform final end-to-end test of convener flow
  - Verify zero authentication errors
  - Verify all features working correctly
  - Sign off on bug hunt completion
  - _Requirements: All requirements_

## Notes
- Each task should be completed in order within each phase
- Document findings at each step
- Test thoroughly before moving to next task
- If critical issues are found, stop and fix immediately before proceeding
- Keep stakeholders informed of progress
- Focus on reproducing the "user not authenticated" error for learner role
- Test extensively with both learner and convener roles
- Verify all programme creation, cohort, week, and lesson functionality
- Verify all learner viewing and participation functionality
- Verify all progress tracking functionality
