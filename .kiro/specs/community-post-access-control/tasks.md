# Implementation Plan: Community Post Access Control

## Overview

This implementation plan addresses the critical security vulnerability where posts are visible to all users regardless of community or cohort membership. The implementation follows a phased approach: database schema updates, backend access control logic, API endpoint modifications, frontend UI components, and comprehensive testing.

## Tasks

- [x] 1. Database Schema Migration
  - Create migration script to add visibility_scope and cohort_id columns to posts table
  - Add foreign key constraint for cohort_id referencing cohorts table
  - Create database indexes for performance optimization
  - Migrate existing posts to use visibility_scope='community' and cohort_id=NULL
  - Validate data integrity after migration
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 7.1, 7.2, 7.3, 7.4_

- [x] 2. Implement Access Control Service
  - [x] 2.1 Create AccessControlService class
    - Implement getUserCommunities() method to fetch user's community memberships
    - Implement getUserCohorts() method to fetch user's cohort memberships
    - Implement canAccessPost() method to verify user access to a specific post
    - Implement buildPostFilterClause() method to generate SQL WHERE clause for filtering posts
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ]* 2.2 Write property test for community-scoped access control
    - **Property 6: Community-Scoped Post Access Control**
    - **Validates: Requirements 2.2, 4.1, 4.2**

  - [ ]* 2.3 Write property test for cohort-scoped access control
    - **Property 7: Cohort-Scoped Post Access Control**
    - **Validates: Requirements 2.3, 4.1, 4.3**

  - [ ]* 2.4 Write unit tests for AccessControlService methods
    - Test getUserCommunities with various user IDs
    - Test getUserCohorts with various user IDs
    - Test canAccessPost with different visibility scopes
    - Test buildPostFilterClause with different membership combinations
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Update Post Creation Endpoint
  - [x] 3.1 Modify POST /v1/api/posts endpoint
    - Add visibility_scope, community_id, and cohort_id to request validation
    - Implement cohort-to-community validation logic
    - Update post insertion to include new fields
    - Handle backward compatibility with community_ids field
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 3.2 Write property test for post creation validation
    - **Property 1: Post Creation Requires Visibility Scope**
    - **Validates: Requirements 1.1**

  - [ ]* 3.3 Write property test for community-scoped post data integrity
    - **Property 2: Community-Scoped Posts Have NULL Cohort ID**
    - **Validates: Requirements 1.2**

  - [ ]* 3.4 Write property test for cohort-scoped post data integrity
    - **Property 3: Cohort-Scoped Posts Require Both IDs**
    - **Validates: Requirements 1.3**

  - [ ]* 3.5 Write property test for cohort-community validation
    - **Property 4: Cohort Must Belong to Community**
    - **Validates: Requirements 1.4**

  - [ ]* 3.6 Write property test for post data persistence
    - **Property 5: Post Data Persistence Round-Trip**
    - **Validates: Requirements 1.5**

  - [ ]* 3.7 Write unit tests for post creation endpoint
    - Test successful community-scoped post creation
    - Test successful cohort-scoped post creation
    - Test validation errors for missing fields
    - Test validation errors for invalid cohort-community combination
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 8.3_

- [ ] 4. Checkpoint - Ensure post creation tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Update Post Retrieval Endpoints
  - [x] 5.1 Modify GET /v1/api/posts endpoint
    - Integrate AccessControlService to filter posts by user membership
    - Update query to use buildPostFilterClause()
    - Ensure posts are ordered by created_at DESC
    - Implement 100 post limit with pagination support
    - _Requirements: 2.2, 2.3, 4.1, 4.2, 4.3, 4.4, 9.5_

  - [x] 5.2 Modify GET /v1/posts/:post_id endpoint
    - Integrate AccessControlService to verify user access
    - Return 404 for unauthorized access (not 403)
    - Maintain existing user and community data fetching logic
    - _Requirements: 2.4, 2.5, 8.1, 8.2_

  - [ ]* 5.3 Write property test for unauthorized access handling
    - **Property 8: Unauthorized Access Returns 404**
    - **Validates: Requirements 2.5, 8.1, 8.2**

  - [ ]* 5.4 Write property test for post ordering
    - **Property 9: Posts Ordered by Creation Date**
    - **Validates: Requirements 4.4**

  - [ ]* 5.5 Write property test for pagination limit
    - **Property 11: Pagination Limit Enforced**
    - **Validates: Requirements 9.5**

  - [ ]* 5.6 Write unit tests for post retrieval endpoints
    - Test community member can see community posts
    - Test non-member cannot see community posts
    - Test cohort member can see cohort posts
    - Test non-cohort-member cannot see cohort posts
    - Test 404 response for unauthorized single post access
    - Test empty list for user with no memberships
    - Test post ordering by creation date
    - Test 100 post limit enforcement
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 4.4, 4.5, 9.5_

- [x] 6. Update Comment Endpoints with Access Control
  - [x] 6.1 Modify GET /v1/post/:post_id/comments endpoint
    - Add access control check before returning comments
    - Verify user has access to parent post using AccessControlService
    - Return error if user lacks access to parent post
    - _Requirements: 6.1, 6.2_

  - [x] 6.2 Modify POST /v1/post/:post_id/comments endpoint
    - Add access control check before allowing comment creation
    - Verify user has access to parent post using AccessControlService
    - Return error if user lacks access to parent post
    - _Requirements: 6.3, 6.4_

  - [ ]* 6.3 Write property test for comment access control
    - **Property 10: Comment Access Requires Post Access**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

  - [ ]* 6.4 Write unit tests for comment access control
    - Test comment retrieval allowed for users with post access
    - Test comment retrieval rejected for users without post access
    - Test comment creation allowed for users with post access
    - Test comment creation rejected for users without post access
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 7. Checkpoint - Ensure backend access control tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement Error Handling and Logging
  - [x] 8.1 Create AccessControlLogger class
    - Implement logAccessViolation() method
    - Implement logValidationError() method
    - Integrate logging into AccessControlService
    - _Requirements: 8.5_

  - [x] 8.2 Update error responses across all endpoints
    - Ensure validation errors return 400 with descriptive messages
    - Ensure access control violations return 404 (not 403)
    - Ensure database errors return 500 without exposing query details
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 8.3 Write unit tests for error handling
    - Test validation error response format
    - Test access violation returns 404
    - Test database error handling
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 9. Frontend: Create Visibility Scope Selector Component
  - [x] 9.1 Create VisibilityScopeSelector component
    - Implement radio buttons for "Entire Community" and "Specific Cohort"
    - Implement cohort dropdown that appears when "Specific Cohort" is selected
    - Fetch cohorts for the selected community
    - Call onScopeChange callback with selected scope and cohort ID
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [ ]* 9.2 Write unit tests for VisibilityScopeSelector
    - Test component renders with both visibility options
    - Test cohort dropdown appears when "Specific Cohort" is selected
    - Test cohort dropdown hidden when "Entire Community" is selected
    - Test onScopeChange callback is called with correct parameters
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 10. Frontend: Update Post Creation Form
  - [x] 10.1 Integrate VisibilityScopeSelector into post creation form
    - Add VisibilityScopeSelector component to form
    - Track visibility_scope and cohort_id in form state
    - Disable submit button until valid visibility scope is selected
    - Update API call to include visibility_scope, community_id, and cohort_id
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 10.2 Write unit tests for post creation form
    - Test submit button disabled until visibility scope selected
    - Test submit button enabled when community scope selected
    - Test submit button enabled when cohort scope selected with valid cohort
    - Test API call includes correct visibility parameters
    - _Requirements: 5.4_

- [x] 11. Frontend: Update Post Feed Display
  - [x] 11.1 Update post feed to handle new visibility fields
    - Update API call to fetch posts (no changes needed, backend handles filtering)
    - Display visibility indicator on each post (optional enhancement)
    - Ensure posts are displayed in correct order
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 12. Integration Testing
  - [ ]* 12.1 Write end-to-end integration tests
    - Test full post creation and retrieval flow with community scope
    - Test full post creation and retrieval flow with cohort scope
    - Test users in different communities cannot see each other's posts
    - Test users in different cohorts cannot see each other's cohort posts
    - Test comment access control with post visibility
    - _Requirements: 10.3, 10.4, 10.5_

- [ ] 13. Final Checkpoint - Run all tests and verify functionality
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- The migration script (Task 1) should be run in a staging environment first
- Backward compatibility is maintained through the community_ids field during transition
- All access control violations are logged for security auditing
