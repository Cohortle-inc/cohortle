# Requirements Document

## Introduction

The Convener Dashboard is a self-service web interface that enables conveners to create and manage programmes, cohorts, weeks, and lessons without requiring developer assistance. Currently, conveners must use API scripts to perform these operations. This feature will provide a visual, user-friendly interface that leverages existing backend API endpoints to streamline programme management workflows.

## Glossary

- **Convener**: A user with elevated permissions who creates and manages learning programmes
- **Programme**: A structured learning experience consisting of multiple weeks and lessons
- **Cohort**: A group of learners enrolled in a programme with a unique enrollment code
- **Week**: A time-based organizational unit within a programme containing multiple lessons
- **Lesson**: Individual learning content (video, PDF, link, or text) within a week
- **Enrollment_Code**: A unique code that allows learners to join a specific cohort
- **Dashboard**: The web interface where conveners manage their programmes
- **Content_Type**: The format of lesson content (video, PDF, link, or text)
- **Learner_View**: The interface that learners see when accessing programme content
- **System**: The Convener Dashboard web application

## Requirements

### Requirement 1: Authentication and Access Control

**User Story:** As a convener, I want to securely access the dashboard using my existing credentials, so that only authorized users can manage programmes.

#### Acceptance Criteria

1. WHEN a user attempts to access the dashboard, THE System SHALL verify the user has convener role permissions
2. WHEN a non-convener user attempts to access the dashboard, THE System SHALL deny access and redirect to an appropriate page
3. WHEN a convener successfully authenticates, THE System SHALL display the dashboard interface
4. THE System SHALL use the existing authentication system for credential verification

### Requirement 2: Programme Management

**User Story:** As a convener, I want to create and manage programmes, so that I can organize learning content for my cohorts.

#### Acceptance Criteria

1. WHEN a convener creates a new programme, THE System SHALL accept programme name, description, and metadata
2. WHEN a convener submits valid programme data, THE System SHALL call POST `/v1/api/programmes` and create the programme
3. WHEN a convener views their dashboard, THE System SHALL display all programmes they have created
4. WHEN a convener selects a programme, THE System SHALL display the programme details including cohorts, weeks, and lessons
5. WHEN a convener edits programme details, THE System SHALL update the programme information via the appropriate API endpoint
6. WHEN programme data is invalid, THE System SHALL display validation errors and prevent submission

### Requirement 3: Cohort Management

**User Story:** As a convener, I want to create cohorts with enrollment codes, so that learners can join my programmes.

#### Acceptance Criteria

1. WHEN a convener creates a cohort for a programme, THE System SHALL accept cohort name, start date, and generate an enrollment code
2. WHEN a convener submits valid cohort data, THE System SHALL call POST `/v1/api/programmes/:id/cohorts` and create the cohort
3. WHEN a cohort is created, THE System SHALL display the enrollment code prominently for the convener to share
4. WHEN a convener views a programme, THE System SHALL display all cohorts associated with that programme
5. WHEN cohort data is invalid, THE System SHALL display validation errors and prevent submission

### Requirement 4: Week Management

**User Story:** As a convener, I want to create weeks within my programme, so that I can organize lessons into time-based units.

#### Acceptance Criteria

1. WHEN a convener creates a week for a programme, THE System SHALL accept week title, description, and order number
2. WHEN a convener submits valid week data, THE System SHALL call POST `/v1/api/programmes/:id/weeks` and create the week
3. WHEN a convener views a programme, THE System SHALL display all weeks in sequential order
4. WHEN week data is invalid, THE System SHALL display validation errors and prevent submission
5. THE System SHALL automatically assign sequential order numbers to weeks based on creation order

### Requirement 5: Lesson Creation and Management

**User Story:** As a convener, I want to create lessons with different content types, so that I can provide diverse learning materials.

#### Acceptance Criteria

1. WHEN a convener creates a lesson, THE System SHALL accept lesson title, description, content type, and content data
2. WHEN content type is video, THE System SHALL accept a video URL
3. WHEN content type is PDF, THE System SHALL accept a PDF URL
4. WHEN content type is link, THE System SHALL accept an external link URL
5. WHEN content type is text, THE System SHALL accept rich text content
6. WHEN a convener submits valid lesson data, THE System SHALL call POST `/v1/api/weeks/:id/lessons` and create the lesson
7. WHEN a convener edits a lesson, THE System SHALL call PUT `/v1/api/lessons/:id` and update the lesson
8. WHEN lesson data is invalid, THE System SHALL display validation errors and prevent submission

### Requirement 6: Lesson Ordering

**User Story:** As a convener, I want to reorder lessons within a week, so that I can control the learning sequence.

#### Acceptance Criteria

1. WHEN a convener views lessons within a week, THE System SHALL display lessons in their current order
2. WHEN a convener drags a lesson to a new position, THE System SHALL update the visual order immediately
3. WHEN a convener completes reordering, THE System SHALL call PUT `/v1/api/weeks/:id/lessons/reorder` with the new order
4. WHEN the reorder API call fails, THE System SHALL revert the visual order and display an error message
5. THE System SHALL provide an alternative reordering mechanism for mobile devices where drag-and-drop may not be available

### Requirement 7: Programme Preview

**User Story:** As a convener, I want to preview how my programme looks to learners, so that I can verify the content before publishing.

#### Acceptance Criteria

1. WHEN a convener selects preview mode for a programme, THE System SHALL display the programme in learner view
2. WHEN in preview mode, THE System SHALL render all weeks and lessons as they would appear to learners
3. WHEN in preview mode, THE System SHALL clearly indicate that this is a preview and not the actual learner interface
4. WHEN a convener exits preview mode, THE System SHALL return to the dashboard management interface
5. THE System SHALL display preview content using the same components that learners see

### Requirement 8: Data Retrieval and Display

**User Story:** As a convener, I want to see my programme structure and content, so that I can understand what I have created.

#### Acceptance Criteria

1. WHEN a convener views a programme, THE System SHALL call GET `/v1/api/programmes/:id` to retrieve programme details
2. WHEN a convener views programme weeks, THE System SHALL call GET `/v1/api/programmes/:id/weeks` to retrieve all weeks and lessons
3. WHEN API calls fail, THE System SHALL display appropriate error messages and retry options
4. THE System SHALL display loading states while fetching data from the API
5. THE System SHALL cache retrieved data appropriately to minimize unnecessary API calls

### Requirement 9: Responsive Design

**User Story:** As a convener, I want to manage programmes on any device, so that I can work from desktop, tablet, or mobile.

#### Acceptance Criteria

1. WHEN a convener accesses the dashboard on a mobile device, THE System SHALL display a mobile-optimized layout
2. WHEN a convener accesses the dashboard on a tablet, THE System SHALL display a tablet-optimized layout
3. WHEN a convener accesses the dashboard on a desktop, THE System SHALL display a desktop-optimized layout
4. THE System SHALL ensure all interactive elements are touch-friendly on mobile and tablet devices
5. THE System SHALL maintain functionality across all screen sizes

### Requirement 10: Error Handling and Validation

**User Story:** As a convener, I want clear feedback when something goes wrong, so that I can correct issues and complete my tasks.

#### Acceptance Criteria

1. WHEN an API call fails, THE System SHALL display a user-friendly error message explaining what went wrong
2. WHEN form validation fails, THE System SHALL highlight invalid fields and display specific validation messages
3. WHEN network connectivity is lost, THE System SHALL inform the user and provide retry options
4. WHEN a convener submits incomplete data, THE System SHALL prevent submission and indicate required fields
5. THE System SHALL log errors for debugging purposes while displaying user-friendly messages to conveners

### Requirement 11: User Interface Components

**User Story:** As a convener, I want a consistent and intuitive interface, so that I can efficiently manage my programmes.

#### Acceptance Criteria

1. THE System SHALL reuse existing UI components from the codebase where applicable
2. THE System SHALL follow the existing design system and styling conventions
3. WHEN displaying forms, THE System SHALL use consistent input components and validation patterns
4. WHEN displaying lists, THE System SHALL use consistent card or table layouts
5. THE System SHALL provide clear navigation between different sections of the dashboard

### Requirement 12: Programme Publication Workflow

**User Story:** As a convener, I want to control when my programme becomes available to learners, so that I can finalize content before release.

#### Acceptance Criteria

1. WHEN a convener creates a programme, THE System SHALL set the programme status to draft by default
2. WHEN a convener is ready to release a programme, THE System SHALL provide an option to publish or activate the programme
3. WHEN a programme is published, THE System SHALL make it visible to enrolled learners
4. WHEN a programme is in draft status, THE System SHALL prevent learners from accessing it
5. THE System SHALL clearly indicate the publication status of each programme in the dashboard
