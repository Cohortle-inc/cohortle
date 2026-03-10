# Requirements Document

## Introduction

This feature addresses user confusion about role management in the Cohortle platform and implements a dual-role system that allows users to be both learners and conveners simultaneously. Currently, users have ONE role at a time, which creates friction when someone wants to both create programmes (as a convener) and participate in other programmes (as a learner).

The proposed solution implements a role switcher that allows users to toggle between "Learner Mode" and "Convener Mode" while maintaining a single account. This preserves learner identity and programme history when users are upgraded to convener, and allows conveners to experience programmes as learners.

## Glossary

- **Role**: A set of permissions and access rights assigned to a user (Learner, Convener, Administrator)
- **Role_Switcher**: UI component that allows users with multiple roles to toggle between role contexts
- **Learner_Mode**: Interface context where the user experiences the platform as a learner
- **Convener_Mode**: Interface context where the user experiences the platform as a convener
- **Dual_Role_User**: A user who has been assigned both Learner and Convener roles
- **Active_Role**: The currently selected role context that determines which interface and permissions are active
- **Role_Context**: The current operational mode (Learner or Convener) that determines UI and available actions
- **Learner_Identity**: Persistent platform identity that accumulates programme history across all programmes
- **Programme_History**: Record of all programmes a user has participated in as a learner
- **Role_Upgrade**: Process of adding Convener role to a user who already has Learner role
- **System**: The Cohortle platform

## Requirements

### Requirement 1: Dual Role Assignment

**User Story:** As an administrator, I want to assign both Learner and Convener roles to a single user, so that they can both create programmes and participate in other programmes.

#### Acceptance Criteria

1. WHEN an administrator upgrades a learner to convener, THE System SHALL retain the learner role assignment in addition to adding the convener role
2. WHEN a user has both roles, THE System SHALL store both role assignments in the user_role_assignments table with active status
3. WHEN a user is assigned multiple roles, THE System SHALL set a default active role (Convener if available, otherwise Learner)
4. THE System SHALL validate that a user can have at most one of each role type (one Learner, one Convener)
5. WHEN role assignments are queried, THE System SHALL return all active roles for a user

### Requirement 2: Role Context Switching

**User Story:** As a dual-role user, I want to switch between Learner Mode and Convener Mode, so that I can access the appropriate interface for my current task.

#### Acceptance Criteria

1. WHEN a dual-role user logs in, THE System SHALL display them in their default active role context
2. WHEN a dual-role user is in any interface, THE System SHALL display a role switcher component in the navigation
3. WHEN a user clicks the role switcher, THE System SHALL display available roles (Learner, Convener)
4. WHEN a user selects a different role, THE System SHALL update the active role context and redirect to the appropriate dashboard
5. WHEN a user switches roles, THE System SHALL update the JWT token to reflect the new active role

### Requirement 3: Learner Mode Interface

**User Story:** As a dual-role user in Learner Mode, I want to access learner features, so that I can participate in programmes as a learner.

#### Acceptance Criteria

1. WHEN a user is in Learner Mode, THE System SHALL display the learner dashboard with enrolled programmes
2. WHEN a user is in Learner Mode, THE System SHALL allow access to learner features (join cohorts, view lessons, complete coursework, participate in community)
3. WHEN a user is in Learner Mode, THE System SHALL hide convener-specific features (programme creation, cohort management)
4. WHEN a user is in Learner Mode, THE System SHALL display the role switcher showing "Learner Mode" as active
5. THE System SHALL ensure learner programme history is visible and accessible in Learner Mode

### Requirement 4: Convener Mode Interface

**User Story:** As a dual-role user in Convener Mode, I want to access convener features, so that I can create and manage programmes.

#### Acceptance Criteria

1. WHEN a user is in Convener Mode, THE System SHALL display the convener dashboard with created programmes
2. WHEN a user is in Convener Mode, THE System SHALL allow access to convener features (create programmes, manage cohorts, manage content, view analytics)
3. WHEN a user is in Convener Mode, THE System SHALL hide learner-specific features (join cohorts, learner dashboard)
4. WHEN a user is in Convener Mode, THE System SHALL display the role switcher showing "Convener Mode" as active
5. THE System SHALL allow conveners in Convener Mode to preview programmes as learners would see them

### Requirement 5: Persistent Learner Identity

**User Story:** As a learner who is upgraded to convener, I want to retain my learner identity and programme history, so that my learning portfolio is not lost.

#### Acceptance Criteria

1. WHEN a learner is upgraded to convener, THE System SHALL preserve all existing programme enrollments
2. WHEN a learner is upgraded to convener, THE System SHALL preserve all lesson completion records
3. WHEN a learner is upgraded to convener, THE System SHALL preserve all community participation history
4. WHEN a dual-role user switches to Learner Mode, THE System SHALL display their complete programme history
5. THE System SHALL ensure learner identity persists independently of role assignments

### Requirement 6: Convener as Learner Participation

**User Story:** As a convener, I want to participate in other conveners' programmes as a learner, so that I can experience programmes from the learner perspective.

#### Acceptance Criteria

1. WHEN a convener switches to Learner Mode, THE System SHALL allow them to join cohorts using enrollment codes
2. WHEN a convener joins a cohort as a learner, THE System SHALL enroll them with learner permissions for that programme
3. WHEN a convener is enrolled in another convener's programme, THE System SHALL not grant them convener permissions for that programme
4. WHEN a convener views a programme they are enrolled in as a learner, THE System SHALL display the learner interface
5. THE System SHALL allow conveners to accumulate learner programme history across multiple programmes

### Requirement 7: Role Switcher UI Component

**User Story:** As a dual-role user, I want a clear and accessible role switcher, so that I can easily toggle between modes.

#### Acceptance Criteria

1. WHEN a dual-role user is logged in, THE System SHALL display the role switcher in the main navigation bar
2. WHEN a user has only one role, THE System SHALL hide the role switcher
3. WHEN a user clicks the role switcher, THE System SHALL display a dropdown or modal with available roles
4. WHEN displaying available roles, THE System SHALL clearly indicate the currently active role
5. THE System SHALL provide visual feedback during role switching (loading state, confirmation)

### Requirement 8: Authentication and JWT Token Updates

**User Story:** As a developer, I want JWT tokens to reflect the active role context, so that role-based access control works correctly.

#### Acceptance Criteria

1. WHEN a user logs in, THE System SHALL include the default active role in the JWT token
2. WHEN a user switches roles, THE System SHALL issue a new JWT token with the updated active role
3. WHEN a JWT token is validated, THE System SHALL verify the active role matches one of the user's assigned roles
4. WHEN a user's role assignments change, THE System SHALL invalidate existing tokens and require re-authentication
5. THE System SHALL include both assigned roles and active role in the JWT payload for validation purposes

### Requirement 9: Dashboard Routing and Redirection

**User Story:** As a dual-role user, I want to be redirected to the appropriate dashboard when I switch roles, so that I see the correct interface.

#### Acceptance Criteria

1. WHEN a user switches to Learner Mode, THE System SHALL redirect to the learner dashboard (/dashboard)
2. WHEN a user switches to Convener Mode, THE System SHALL redirect to the convener dashboard (/convener/dashboard)
3. WHEN a user logs in with multiple roles, THE System SHALL redirect to the dashboard for their default active role
4. WHEN a user attempts to access a convener route in Learner Mode, THE System SHALL deny access and display an appropriate message
5. WHEN a user attempts to access a learner route in Convener Mode, THE System SHALL allow access (conveners can view learner features)

### Requirement 10: Role Assignment History and Audit

**User Story:** As an administrator, I want to track role assignment changes, so that I can audit role management activities.

#### Acceptance Criteria

1. WHEN a user is upgraded to convener, THE System SHALL log the role assignment with timestamp and administrator ID
2. WHEN a user switches active roles, THE System SHALL log the role context change with timestamp
3. WHEN viewing role assignment history, THE System SHALL display all role changes for a user
4. THE System SHALL track which administrator performed each role assignment or modification
5. THE System SHALL provide an API endpoint for retrieving role assignment history

### Requirement 11: Migration of Existing Users

**User Story:** As a system administrator, I want to migrate existing single-role users to the dual-role system, so that the platform can support the new role model.

#### Acceptance Criteria

1. WHEN the dual-role system is deployed, THE System SHALL migrate existing learner-only users to have Learner role assignment
2. WHEN the dual-role system is deployed, THE System SHALL migrate existing convener users to have both Learner and Convener role assignments
3. WHEN migrating convener users, THE System SHALL set Convener as the default active role
4. WHEN migration is complete, THE System SHALL validate that all users have at least one role assignment
5. THE System SHALL provide a migration script that can be run safely multiple times (idempotent)

### Requirement 12: Role Context Persistence

**User Story:** As a dual-role user, I want my role context to persist across sessions, so that I don't have to switch roles every time I log in.

#### Acceptance Criteria

1. WHEN a user switches roles, THE System SHALL store the active role preference in the database
2. WHEN a user logs in, THE System SHALL load their last active role and display the appropriate dashboard
3. WHEN a user's active role preference is stored, THE System SHALL update it whenever they switch roles
4. WHEN a user has no stored preference, THE System SHALL default to Convener role if available, otherwise Learner role
5. THE System SHALL allow users to explicitly set their default role preference

### Requirement 13: Access Control with Active Role

**User Story:** As a developer, I want access control to respect the active role context, so that users only see features appropriate to their current mode.

#### Acceptance Criteria

1. WHEN validating permissions, THE System SHALL check the user's active role rather than all assigned roles
2. WHEN a user is in Learner Mode, THE System SHALL deny access to convener-only routes and features
3. WHEN a user is in Convener Mode, THE System SHALL grant access to convener features
4. WHEN a user attempts an action, THE System SHALL validate permissions based on the active role context
5. THE System SHALL provide middleware that validates active role for protected routes

### Requirement 14: User Communication and Onboarding

**User Story:** As a dual-role user, I want clear communication about role switching, so that I understand how to use the feature.

#### Acceptance Criteria

1. WHEN a learner is upgraded to convener, THE System SHALL display a welcome message explaining the dual-role system
2. WHEN a dual-role user first sees the role switcher, THE System SHALL provide a tooltip or brief explanation
3. WHEN a user switches roles for the first time, THE System SHALL display a confirmation message explaining what changed
4. THE System SHALL provide help documentation explaining the difference between Learner Mode and Convener Mode
5. WHEN a user is confused about their role, THE System SHALL provide clear indicators of their current mode

### Requirement 15: Administrator Role Handling

**User Story:** As an administrator, I want to access both learner and convener features without switching roles, so that I can efficiently manage the platform.

#### Acceptance Criteria

1. WHEN an administrator logs in, THE System SHALL grant access to all features without requiring role switching
2. WHEN an administrator views the platform, THE System SHALL display an admin-specific dashboard with access to all sections
3. THE System SHALL not display the role switcher to administrators (they have full access by default)
4. WHEN an administrator needs to test learner or convener experiences, THE System SHALL provide a preview mode
5. THE System SHALL ensure administrators can perform all learner and convener actions without role context switching
