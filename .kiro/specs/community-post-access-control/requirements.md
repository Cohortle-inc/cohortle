# Requirements Document: Community Post Access Control

## Introduction

This feature addresses a critical security vulnerability in the community post system. Currently, all posts are visible to all users regardless of their community or cohort membership, creating a privacy and security breach. This feature implements proper access control by allowing conveners to specify post visibility scope (entire community or specific cohort) and enforcing membership-based access restrictions at the backend level.

## Glossary

- **Post**: A message created by a convener that can include text and up to 4 media attachments
- **Community**: A top-level organizational unit that contains programmes and members
- **Cohort**: A group of learners within a programme who progress through content together
- **Convener**: A user with the role to create and manage content, including posts
- **Learner**: A user who consumes content and participates in communities and cohorts
- **Visibility_Scope**: The access level of a post, either "community" (all cohorts) or "cohort" (specific cohort only)
- **Access_Control_Middleware**: Backend logic that verifies user membership before allowing access to posts
- **Post_Feed**: The list of posts displayed to a user, filtered by their memberships

## Requirements

### Requirement 1: Post Visibility Scope Selection

**User Story:** As a convener, I want to select the visibility scope when creating a post, so that I can control whether the post is visible to the entire community or just a specific cohort.

#### Acceptance Criteria

1. WHEN creating a post, THE System SHALL require the convener to select a visibility scope
2. WHERE the visibility scope is "community", THE System SHALL store the community_id and set cohort_id to NULL
3. WHERE the visibility scope is "cohort", THE System SHALL require the convener to select a specific cohort and store both community_id and cohort_id
4. THE System SHALL validate that the selected cohort belongs to the selected community
5. THE System SHALL persist the visibility scope, community_id, and cohort_id with the post record

### Requirement 2: Post Access Control Enforcement

**User Story:** As a system administrator, I want posts to be accessible only to members within the specified scope, so that privacy and security are maintained across communities and cohorts.

#### Acceptance Criteria

1. WHEN a user requests posts, THE Access_Control_Middleware SHALL verify the user's community and cohort memberships
2. WHERE a post has visibility scope "community", THE System SHALL return the post only if the user is a member of that community
3. WHERE a post has visibility scope "cohort", THE System SHALL return the post only if the user is a member of that specific cohort
4. WHEN a user requests a single post by ID, THE System SHALL verify membership before returning the post
5. IF a user is not a member of the required scope, THEN THE System SHALL exclude the post from results without revealing its existence

### Requirement 3: Database Schema Updates

**User Story:** As a developer, I want the posts table to include visibility fields, so that access control can be properly enforced.

#### Acceptance Criteria

1. THE System SHALL add a "visibility_scope" column to the posts table with values "community" or "cohort"
2. THE System SHALL add a "cohort_id" column to the posts table as a nullable foreign key
3. THE System SHALL maintain the existing "community_ids" column for backward compatibility during migration
4. THE System SHALL create a database index on cohort_id for query performance
5. THE System SHALL create a database index on the combination of visibility_scope and community_ids for query performance

### Requirement 4: Post Retrieval Filtering

**User Story:** As a learner, I want to see only posts that are relevant to my communities and cohorts, so that my feed is not cluttered with irrelevant content.

#### Acceptance Criteria

1. WHEN retrieving all posts, THE System SHALL filter results based on the user's community_members and cohort_members records
2. THE System SHALL include community-scoped posts where the user is a community member
3. THE System SHALL include cohort-scoped posts where the user is a cohort member
4. THE System SHALL order posts by creation date with newest first
5. THE System SHALL return an empty list if the user has no memberships

### Requirement 5: Frontend Visibility Selector UI

**User Story:** As a convener, I want an intuitive interface to select post visibility, so that I can easily control who sees my posts.

#### Acceptance Criteria

1. WHEN the post creation form loads, THE System SHALL display a visibility selector with clear options
2. THE System SHALL provide two visibility options: "Entire Community" and "Specific Cohort"
3. WHEN "Specific Cohort" is selected, THE System SHALL display a dropdown of cohorts within the selected community
4. THE System SHALL disable the post submission button until a valid visibility scope is selected
5. THE System SHALL display the selected visibility scope clearly before submission

### Requirement 6: Comment Access Control

**User Story:** As a system administrator, I want comments on posts to inherit the same access restrictions as their parent posts, so that comment visibility is consistent with post visibility.

#### Acceptance Criteria

1. WHEN retrieving comments for a post, THE System SHALL first verify the user has access to the parent post
2. IF the user does not have access to the parent post, THEN THE System SHALL return an error indicating insufficient permissions
3. WHEN creating a comment, THE System SHALL verify the user has access to the parent post
4. THE System SHALL allow comments from any user who has access to the parent post
5. THE System SHALL maintain the existing comment structure without additional visibility fields

### Requirement 7: Migration and Backward Compatibility

**User Story:** As a developer, I want existing posts to be migrated safely, so that no data is lost and the system remains functional during the transition.

#### Acceptance Criteria

1. THE System SHALL provide a migration script that adds new columns to the posts table
2. THE System SHALL set visibility_scope to "community" for all existing posts
3. THE System SHALL preserve existing community_ids values during migration
4. THE System SHALL set cohort_id to NULL for all existing posts
5. THE System SHALL validate data integrity after migration completes

### Requirement 8: Error Handling and Security

**User Story:** As a security engineer, I want the system to handle unauthorized access attempts gracefully, so that no information is leaked about posts the user cannot access.

#### Acceptance Criteria

1. WHEN a user attempts to access a post without proper membership, THE System SHALL return a 404 Not Found response
2. THE System SHALL not reveal whether a post exists if the user lacks access
3. WHEN validation fails on post creation, THE System SHALL return descriptive error messages
4. IF a database query fails during access control checks, THEN THE System SHALL return a 500 Internal Server Error without exposing query details
5. THE System SHALL log all access control violations for security auditing

### Requirement 9: Performance Optimization

**User Story:** As a developer, I want post queries to be efficient, so that the system scales well with large numbers of posts and users.

#### Acceptance Criteria

1. THE System SHALL use database indexes on visibility_scope, community_ids, and cohort_id
2. WHEN fetching posts, THE System SHALL use a single optimized query with JOIN operations on membership tables
3. THE System SHALL avoid N+1 query problems by batch-fetching related data
4. THE System SHALL cache user membership data for the duration of a request
5. THE System SHALL limit post retrieval to a maximum of 100 posts per request with pagination support

### Requirement 10: Testing and Validation

**User Story:** As a quality assurance engineer, I want comprehensive tests for access control, so that security vulnerabilities are caught before deployment.

#### Acceptance Criteria

1. THE System SHALL include property-based tests that verify access control across random user and post combinations
2. THE System SHALL include unit tests for each access control scenario (community-scoped, cohort-scoped, no access)
3. THE System SHALL include integration tests that verify end-to-end post creation and retrieval with acces