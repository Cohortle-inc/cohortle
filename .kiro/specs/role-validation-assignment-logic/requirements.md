# Requirements Document

## Introduction

This feature implements comprehensive role validation and assignment logic for the Cohortle platform. Cohortle is infrastructure for running cohort-based programmes such as fellowships, incubators, bootcamps, NGO training programmes, and leadership development cohorts. The system provides robust role management, validation, and access control that aligns with programme operations rather than just course content delivery.

The system ensures that users can only perform actions appropriate to their assigned roles, that role transitions are properly validated, and that the platform hierarchy (Programme → Cohort → Learners) is properly enforced.

## Glossary

- **Role**: A set of permissions and access rights assigned to a user (Learner, Convener, Administrator)
- **Role Validation**: The process of verifying that a user has the appropriate role for a specific action or access
- **Role Assignment**: The process of assigning or changing a user's role (separate from cohort enrollment)
- **Access Control**: The system that restricts access to resources based on user roles
- **Authentication System**: The existing system that verifies user identity (currently using JWT tokens)
- **Permission**: A specific right to perform an action or access a resource
- **Programme**: The core learning structure defining content and curriculum
- **Cohort**: A specific run of a programme with a group of learners
- **Enrollment Code**: Code used by learners to join a specific cohort (NOT for role assignment)
- **Learner Identity**: Persistent platform identity that accumulates programme history over time

### Core System Structure

The platform follows this hierarchy:
```
Programme → Cohort → Learners
```

A programme can run multiple cohorts over time. Example:
- Digital Leadership Programme
  - Cohort – Feb 2026
  - Cohort – Aug 2026

Programmes define the learning structure and content, while cohorts represent specific runs of that programme with a group of learners.

### Role Definitions

#### Learner (Default Role)
- **Purpose**: Learning and participation in programmes
- **Assignment**: Automatically assigned when a user registers
- **Responsibilities**:
  - Join or apply to programmes
  - Access lessons and complete coursework
  - Participate in cohort community
  - Build learning portfolio across multiple programmes
- **Access Level**: Personal learning access only
- **Identity**: Persistent platform identity that accumulates programme history
- **Typical Users**: Students, participants, fellows, trainees

#### Convener
- **Purpose**: Programme organizer and facilitator
- **Assignment**: Admin manually upgrades user from Learner role
- **Responsibilities**:
  - Create and manage programmes and cohorts
  - Manage learners and programme content
  - Facilitate cohort-based learning experiences
  - Monitor programme operations and analytics
- **Access Level**: Programme-level access (own programmes only)
- **Typical Users**: Educators, facilitators, programme managers, instructors
- **Note**: Convener access is NOT assigned via invitation codes

#### Administrator
- **Purpose**: Platform governance
- **Assignment**: Special administrative process
- **Responsibilities**: 
  - Assign or upgrade users to convener role
  - Manage platform-level configurations
  - Oversee all programmes and users
  - Handle platform governance
- **Access Level**: Full system access
- **Typical Users**: Platform owners, system administrators

## Requirements

### Requirement 1: Role Definition and Management

**User Story:** As a system administrator, I want to define and manage user roles, so that I can control access to platform features based on user responsibilities.

#### Acceptance Criteria

1. THE System SHALL define at least three core roles: Student, Convener, and Administrator
2. WHEN a new role is defined, THE System SHALL specify the permissions associated with that role
3. WHERE role hierarchy exists, THE System SHALL enforce that higher-level roles inherit permissions from lower-level roles
4. WHEN role definitions are modified, THE System SHALL validate that existing user assignments remain valid
5. THE System SHALL provide an API for retrieving all available roles and their permissions

### Requirement 2: Role Assignment During Registration

**User Story:** As a new user, I want to be assigned the Learner role by default during registration, so that I can immediately start exploring and joining programmes.

#### Acceptance Criteria

1. WHEN any user registers on the platform, THE System SHALL automatically assign the Learner role by default
2. THE System SHALL NOT use invitation codes for role assignment (invitation codes are only for cohort enrollment)
3. WHEN a user registers, THE System SHALL create a persistent learner identity that can accumulate programme history over time
4. IF a user needs convener access, THE System SHALL require admin approval to upgrade from Learner to Convener role
5. THE System SHALL validate that all new registrations receive the Learner role unless explicitly overridden by an administrator

### Requirement 3: Role Validation for Actions

**User Story:** As a user, I want the system to validate my role before allowing actions, so that I can only perform actions appropriate to my role.

#### Acceptance Criteria

1. WHEN a user attempts to access a convener dashboard, THE System SHALL validate that the user has Convener or Administrator role
2. WHEN a user attempts to create a programme, THE System SHALL validate that the user has Convener or Administrator role
3. WHEN a user attempts to join a cohort using an enrollment code, THE System SHALL validate that the user has Learner role (or higher)
4. WHEN a user attempts to modify system settings or assign roles, THE System SHALL validate that the user has Administrator role
5. IF a user attempts an action without the required role, THEN THE System SHALL return a "403 Forbidden" error with a clear message

### Requirement 4: Role Assignment and Modification

**User Story:** As an administrator, I want to assign and modify user roles, so that I can manage user access as organizational needs change.

#### Acceptance Criteria

1. WHEN an administrator upgrades a user from Learner to Convener, THE System SHALL validate that the administrator has permission to assign that role
2. WHEN a user's role is changed from Learner to Convener, THE System SHALL revoke learner-specific permissions and grant convener permissions
3. WHEN a user's role is changed, THE System SHALL log the change with timestamp, previous role, new role, and administrator who made the change
4. IF a role change would leave the system without any administrators, THEN THE System SHALL reject the change
5. THE System SHALL provide an API for administrators to view and modify user roles
6. THE System SHALL ensure learner identity persists across role changes (learner history is retained)

### Requirement 5: Integration with Authentication System

**User Story:** As a developer, I want role information integrated with the authentication system, so that role validation happens seamlessly during authentication.

#### Acceptance Criteria

1. WHEN a user authenticates, THE System SHALL include the user's role in the JWT token payload
2. WHEN a JWT token is validated, THE System SHALL extract and verify the role information
3. WHERE middleware processes requests, THE System SHALL validate the user's role before allowing access to protected routes
4. WHEN role information in a JWT token conflicts with database records, THE System SHALL revalidate and update the token if necessary
5. THE System SHALL provide role-aware authentication middleware for both frontend and backend

### Requirement 6: Access Control Based on Roles

**User Story:** As a security-conscious developer, I want to enforce access control based on user roles, so that users can only access resources appropriate to their role.

#### Acceptance Criteria

1. WHEN a Learner accesses the platform, THE System SHALL restrict access to learner-specific features (dashboard, lessons, cohort enrollment)
2. WHEN a Convener accesses the platform, THE System SHALL provide access to convener features (programme creation, cohort management, analytics)
3. WHEN an Administrator accesses the platform, THE System SHALL provide access to all system features including user management and role assignment
4. WHERE role-based access control is implemented, THE System SHALL check permissions at both route level and resource level
5. THE System SHALL provide a consistent API for checking user permissions across the application
6. THE System SHALL ensure enrollment codes are validated against cohort entities only (not used for role assignment)

### Requirement 7: Backend API for Role Management

**User Story:** As a frontend developer, I want a comprehensive backend API for role management, so that I can build role-aware user interfaces.

#### Acceptance Criteria

1. THE System SHALL provide a GET /api/roles endpoint that returns all available roles and their permissions
2. THE System SHALL provide a GET /api/users/:id/role endpoint that returns a user's current role
3. THE System SHALL provide a PUT /api/users/:id/role endpoint that allows authorized users to change a user's role
4. THE System SHALL provide a GET /api/users/with-role/:role endpoint that returns all users with a specific role
5. WHEN role management API endpoints are called, THE System SHALL validate the caller's permissions before processing the request

### Requirement 8: Error Handling and Validation

**User Story:** As a user, I want clear error messages when role validation fails, so that I understand why I can't perform an action.

#### Acceptance Criteria

1. WHEN role validation fails due to insufficient permissions, THE System SHALL return a clear "Insufficient permissions" error message
2. WHEN role assignment fails due to invalid parameters, THE System SHALL return specific validation errors
3. IF a user attempts to access a resource without the required role, THEN THE System SHALL suggest the appropriate role needed
4. WHERE possible, THE System SHALL provide guidance on how to obtain the required role (e.g., "Contact an administrator")
5. THE System SHALL log all role validation failures for security auditing purposes

### Requirement 9: Testing and Validation

**User Story:** As a quality assurance engineer, I want comprehensive testing for role validation and assignment, so that I can ensure the system works correctly.

#### Acceptance Criteria

1. THE System SHALL include unit tests for all role validation functions
2. THE System SHALL include integration tests for role assignment workflows
3. THE System SHALL include property-based tests for role permission inheritance
4. WHEN tests are run, THE System SHALL verify that role hierarchies are correctly enforced
5. THE System SHALL include negative test cases for unauthorized role assignment attempts

### Requirement 10: Programme Lifecycle States

**User Story:** As a convener, I want programmes to support lifecycle states, so that I can manage programme operations from creation through completion.

#### Acceptance Criteria

1. THE System SHALL support the following programme lifecycle states: Draft, Recruiting, Active, Completed, Archived
2. WHEN a programme is in Draft state, THE System SHALL allow conveners to modify structure and content
3. WHEN a programme is in Recruiting state, THE System SHALL allow learners to apply or join cohorts
4. WHEN a programme is in Active state, THE System SHALL restrict structural changes but allow content updates
5. WHEN a programme is in Completed or Archived state, THE System SHALL make it read-only for learners
6. THE System SHALL provide API endpoints for transitioning programmes between lifecycle states
7. THE System SHALL log all programme lifecycle state transitions with timestamp and user who made the change

### Requirement 11: Learner Onboarding Modes

**User Story:** As a convener, I want to support different learner onboarding methods, so that I can control how learners join my programmes.

#### Acceptance Criteria

1. THE System SHALL support two learner onboarding modes: "Join with Code" and "Apply to Join"
2. WHEN a programme uses "Join with Code" mode, THE System SHALL allow learners to join directly using a cohort enrollment code
3. WHEN a programme uses "Apply to Join" mode, THE System SHALL require learners to submit an application for convener review
4. THE System SHALL allow conveners to configure the onboarding mode per programme
5. THE System SHALL provide API endpoints for managing learner applications (future feature - architecture prepared)
6. THE System SHALL ensure enrollment codes are validated against the cohort entity only (not for role assignment)