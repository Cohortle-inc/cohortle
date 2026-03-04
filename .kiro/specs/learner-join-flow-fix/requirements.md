# Requirements Document

## Introduction

This document specifies the requirements for fixing the Learner Join Flow Bug where learners who successfully join a community using a join code continue to see the "Join Community" screen instead of being navigated to the programme dashboard. The issue stems from improper state persistence and navigation handling after a successful join operation.

## Glossary

- **Join_Flow**: The sequence of operations from entering a community code to accessing the community's programme dashboard
- **Community_Members_Record**: A database record in the community_members table that represents a user's membership in a community
- **Join_State**: The application state that tracks whether a user has successfully joined a community
- **Programme_Dashboard**: The screen displaying available programmes within a joined community
- **AsyncStorage**: React Native's persistent key-value storage system
- **Membership_Data**: Complete information about a user's community membership including community_id, status, role, and joined_at timestamp

## Requirements

### Requirement 1: Backend Join Response Completeness

**User Story:** As a backend developer, I want the join API to return complete membership data, so that the frontend can properly store and validate the join state.

#### Acceptance Criteria

1. WHEN a learner successfully joins a community, THE Join_API SHALL return the complete Community_Members_Record including community_id, user_id, status, and created_at timestamp
2. WHEN a learner attempts to join a community they are already a member of, THE Join_API SHALL return the existing Membership_Data with a clear status message
3. WHEN the join operation fails, THE Join_API SHALL return a descriptive error message indicating the failure reason
4. THE Join_API SHALL include the community name and programme_count in the success response

### Requirement 2: Frontend State Persistence

**User Story:** As a learner, I want my community membership to persist across app restarts, so that I don't have to rejoin communities I've already joined.

#### Acceptance Criteria

1. WHEN a learner successfully joins a community, THE Frontend SHALL store the Membership_Data in AsyncStorage immediately
2. WHEN the app starts, THE Frontend SHALL check AsyncStorage for existing Membership_Data before displaying the join screen
3. WHEN Membership_Data exists in AsyncStorage, THE Frontend SHALL validate it against the backend before proceeding
4. THE Frontend SHALL store membership data with a unique key per community to support multiple community memberships

### Requirement 3: Automatic Navigation After Join

**User Story:** As a learner, I want to be automatically navigated to the programme dashboard after successfully joining a community, so that I can immediately access the community's content.

#### Acceptance Criteria

1. WHEN a learner successfully joins a community, THE Frontend SHALL navigate to the Programme_Dashboard automatically
2. WHEN navigation occurs, THE Frontend SHALL pass the community_id and community name as route parameters
3. WHEN the "already a member" message is received, THE Frontend SHALL navigate to the Programme_Dashboard instead of showing an error
4. THE Frontend SHALL clear the join code input field after successful navigation

### Requirement 4: Join State Validation

**User Story:** As a developer, I want the app to validate join state on load, so that learners are directed to the correct screen based on their membership status.

#### Acceptance Criteria

1. WHEN the cohorts index screen loads, THE Frontend SHALL check for existing community memberships in AsyncStorage
2. WHEN memberships exist, THE Frontend SHALL display the community list instead of the empty join screen
3. WHEN the membership list is displayed, THE Frontend SHALL show accurate programme counts for each community
4. THE Frontend SHALL refresh membership data from the backend when the screen gains focus

### Requirement 5: Error Handling and Recovery

**User Story:** As a learner, I want clear error messages and recovery options when join operations fail, so that I can understand what went wrong and how to proceed.

#### Acceptance Criteria

1. WHEN a network error occurs during join, THE Frontend SHALL display a retry option with the error message
2. WHEN an invalid join code is entered, THE Frontend SHALL display a clear message indicating the code is invalid
3. WHEN the backend returns an "already a member" error, THE Frontend SHALL treat it as a success and navigate to the Programme_Dashboard
4. IF AsyncStorage operations fail, THEN THE Frontend SHALL log the error and continue with in-memory state only

### Requirement 6: Query Cache Invalidation

**User Story:** As a developer, I want the query cache to be properly invalidated after join operations, so that the UI reflects the updated membership state immediately.

#### Acceptance Criteria

1. WHEN a learner successfully joins a community, THE Frontend SHALL invalidate the learnerCohorts query cache
2. WHEN the learnerCohorts query is invalidated, THE Frontend SHALL trigger an automatic refetch of the data
3. WHEN the refetch completes, THE Frontend SHALL update the UI to display the newly joined community
4. THE Frontend SHALL invalidate both 'communities' and 'learnerCohorts' query keys to ensure consistency

### Requirement 7: Duplicate Join Prevention

**User Story:** As a learner, I want the app to prevent duplicate join attempts, so that I don't see confusing error messages when I'm already a member.

#### Acceptance Criteria

1. WHEN a learner enters a join code for a community they've already joined, THE Frontend SHALL check local membership state before making an API call
2. WHEN local membership state indicates existing membership, THE Frontend SHALL navigate directly to the Programme_Dashboard
3. WHEN the backend indicates existing membership, THE Frontend SHALL update local state and navigate to the Programme_Dashboard
4. THE Frontend SHALL display a friendly message like "Welcome back to [Community Name]" instead of an error

### Requirement 8: Loading State Management

**User Story:** As a learner, I want to see appropriate loading indicators during join operations, so that I know the app is processing my request.

#### Acceptance Criteria

1. WHEN a join operation is in progress, THE Frontend SHALL display a loading indicator on the join button
2. WHEN a join operation is in progress, THE Frontend SHALL disable the join button to prevent duplicate submissions
3. WHEN membership data is being validated on app load, THE Frontend SHALL display a loading state before showing the join screen
4. THE Frontend SHALL hide loading indicators within 500ms of operation completion

