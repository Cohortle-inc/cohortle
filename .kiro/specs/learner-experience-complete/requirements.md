# Requirements Document

## Introduction

This document specifies the complete learner experience for the Cohortle web platform. The learner experience encompasses all interactions from discovering programmes through completing learning activities, tracking progress, and engaging with the cohort community. This builds upon existing authentication and basic dashboard functionality to create a comprehensive learning journey.

## Glossary

- **Learner**: A user enrolled in one or more programmes on the platform
- **Programme**: A structured learning experience containing weeks, lessons, and cohorts
- **Cohort**: A group of learners progressing through a programme together with specific start/end dates
- **Week**: A module or unit within a programme containing multiple lessons
- **Lesson**: Individual learning content (video, text, PDF, link, quiz, or live session)
- **Enrollment_Code**: A unique code used to join a specific cohort
- **Completion_Status**: Binary state indicating whether a learner has completed a lesson
- **Progress_Indicator**: Visual representation of completion percentage across programme/week/lesson levels
- **Live_Session**: A scheduled synchronous learning event with specific date and time
- **Community_Feed**: A cohort-specific stream of posts, questions, and discussions
- **Learning_Dashboard**: The main learner interface showing enrolled programmes and progress
- **Programme_Catalogue**: Public listing of available programmes for discovery
- **Breadcrumb_Navigation**: Hierarchical navigation showing Programme > Week > Lesson path

## Requirements

### Requirement 1: Programme Discovery and Enrollment

**User Story:** As a learner, I want to discover and enroll in programmes, so that I can access learning content and join cohorts.

#### Acceptance Criteria

1. THE System SHALL display a public programme catalogue accessible without authentication
2. WHEN a learner views the programme catalogue, THE System SHALL display programme title, description, duration, and thumbnail for each programme
3. WHEN a learner clicks on a programme in the catalogue, THE System SHALL display detailed programme information including weeks, lesson count, and prerequisites
4. WHEN a learner enters an enrollment code, THE System SHALL validate the code against active cohorts
5. IF an enrollment code is invalid or expired, THEN THE System SHALL display a descriptive error message
6. WHEN a valid enrollment code is submitted, THE System SHALL create an enrollment record linking the learner to the cohort
7. WHEN enrollment succeeds, THE System SHALL redirect the learner to their learning dashboard
8. THE System SHALL prevent duplicate enrollments for the same learner and cohort combination
9. WHEN displaying programme details, THE System SHALL show prerequisites and requirements if they exist
10. THE System SHALL display the number of weeks and total lessons in programme details


### Requirement 2: Learning Dashboard

**User Story:** As a learner, I want a centralized dashboard showing my enrolled programmes and progress, so that I can quickly access my learning activities and track my advancement.

#### Acceptance Criteria

1. WHEN a learner accesses the dashboard, THE System SHALL display all programmes in which the learner is enrolled
2. WHEN displaying enrolled programmes, THE System SHALL show programme title, thumbnail, overall progress percentage, and cohort name
3. WHEN a learner has no enrolled programmes, THE System SHALL display an empty state with a call-to-action to browse programmes or enter an enrollment code
4. THE System SHALL calculate overall progress as the percentage of completed lessons across all lessons in the programme
5. WHEN a learner clicks on a programme card, THE System SHALL navigate to the programme learning view
6. WHEN displaying the dashboard, THE System SHALL show upcoming live sessions across all enrolled programmes
7. WHEN displaying upcoming live sessions, THE System SHALL show session title, programme name, date, and time
8. THE System SHALL sort upcoming live sessions chronologically with nearest sessions first
9. WHEN a learner has completed lessons recently, THE System SHALL display a recent activity feed showing the last 5 completed lessons
10. WHEN displaying recent activity, THE System SHALL show lesson title, programme name, and completion timestamp
11. THE System SHALL provide a "Continue Learning" quick action that navigates to the next incomplete lesson across all programmes
12. WHEN no incomplete lessons exist, THE System SHALL display a completion message instead of the continue learning action

### Requirement 3: Programme Learning View

**User Story:** As a learner, I want to view the structure of my programme and navigate through weeks and lessons, so that I can understand the learning path and access content.

#### Acceptance Criteria

1. WHEN a learner accesses a programme, THE System SHALL display the programme title, description, and overall progress
2. WHEN displaying programme structure, THE System SHALL show all weeks in sequential order
3. WHEN displaying each week, THE System SHALL show week title, description, start date, and completion status
4. WHEN displaying each week, THE System SHALL show all lessons within that week in sequential order
5. WHEN displaying each lesson, THE System SHALL show lesson title, type icon, duration estimate, and completion status
6. THE System SHALL calculate week progress as the percentage of completed lessons within that week
7. WHEN a week's start date is in the future, THE System SHALL display the week as locked with the unlock date visible
8. WHEN a week is locked, THE System SHALL prevent learners from accessing lessons within that week
9. WHEN a week is unlocked, THE System SHALL allow learners to access all lessons within that week
10. WHEN a learner clicks on an unlocked lesson, THE System SHALL navigate to the lesson viewing page
11. THE System SHALL display a breadcrumb navigation showing Programme > Week > Lesson hierarchy
12. WHEN displaying the programme view, THE System SHALL show a progress indicator for overall programme completion
13. THE System SHALL visually distinguish completed lessons from incomplete lessons using checkmarks or status indicators


### Requirement 4: Lesson Viewing Experience

**User Story:** As a learner, I want to view lessons with appropriate content rendering based on lesson type, so that I can consume learning materials effectively.

#### Acceptance Criteria

1. WHEN a learner accesses a lesson, THE System SHALL display the lesson title, description, and type
2. WHEN a lesson type is "video", THE System SHALL embed and render the video player with the content URL
3. WHEN a lesson type is "text", THE System SHALL render the text content with proper formatting and styling
4. WHEN a lesson type is "pdf", THE System SHALL embed a PDF viewer displaying the content URL
5. WHEN a lesson type is "link", THE System SHALL display the external link with a description and open button
6. WHEN a lesson type is "quiz", THE System SHALL display quiz questions with interactive answer options
7. WHEN a lesson type is "live_session", THE System SHALL display session details including date, time, and join link
8. THE System SHALL display a completion button for each lesson allowing learners to mark it complete
9. WHEN a learner marks a lesson complete, THE System SHALL update the completion status immediately
10. WHEN a learner marks a lesson complete, THE System SHALL update all related progress indicators
11. THE System SHALL display previous and next lesson navigation buttons when applicable
12. WHEN a learner clicks previous or next, THE System SHALL navigate to the adjacent lesson in the programme sequence
13. THE System SHALL display breadcrumb navigation showing Programme > Week > Lesson path
14. WHEN a learner clicks a breadcrumb element, THE System SHALL navigate to that level
15. THE System SHALL display an estimated duration for the lesson if available
16. WHEN a video lesson is displayed, THE System SHALL support YouTube and Vimeo embed formats
17. WHEN a PDF lesson is displayed, THE System SHALL provide a fallback download link if embedding fails
18. WHEN a link lesson is displayed, THE System SHALL open external links in a new tab

### Requirement 5: Lesson Comments and Discussions

**User Story:** As a learner, I want to post comments and questions on lessons, so that I can engage with peers and conveners about the content.

#### Acceptance Criteria

1. WHEN a learner views a lesson, THE System SHALL display a comments section below the lesson content
2. WHEN displaying comments, THE System SHALL show commenter name, timestamp, and comment text
3. THE System SHALL sort comments chronologically with newest comments first
4. WHEN a learner submits a comment, THE System SHALL validate that the comment text is not empty
5. WHEN a valid comment is submitted, THE System SHALL create a comment record linked to the lesson and learner
6. WHEN a comment is created, THE System SHALL display it immediately in the comments list
7. THE System SHALL allow learners to reply to existing comments creating threaded discussions
8. WHEN displaying replies, THE System SHALL indent them visually to show the thread hierarchy
9. THE System SHALL limit comment nesting to two levels to maintain readability
10. WHEN a learner is the author of a comment, THE System SHALL display edit and delete options
11. WHEN a learner edits a comment, THE System SHALL update the comment text and display an "edited" indicator
12. WHEN a learner deletes a comment, THE System SHALL remove it from the display immediately
13. THE System SHALL display a comment count badge showing the total number of comments on the lesson


### Requirement 6: Progress Tracking and Visualization

**User Story:** As a learner, I want to see my progress across programmes, weeks, and lessons, so that I can track my advancement and stay motivated.

#### Acceptance Criteria

1. THE System SHALL calculate programme progress as (completed lessons / total lessons) × 100
2. THE System SHALL calculate week progress as (completed lessons in week / total lessons in week) × 100
3. WHEN displaying progress indicators, THE System SHALL show percentage values and visual progress bars
4. WHEN a learner completes a lesson, THE System SHALL update all affected progress indicators immediately
5. THE System SHALL display programme progress on the learning dashboard for each enrolled programme
6. THE System SHALL display week progress in the programme learning view for each week
7. THE System SHALL display overall programme progress in the programme header
8. WHEN a programme is 100% complete, THE System SHALL display a completion badge or indicator
9. WHEN a week is 100% complete, THE System SHALL display a completion checkmark
10. THE System SHALL persist completion status across sessions and devices
11. THE System SHALL allow learners to view their completion history showing all completed lessons with timestamps
12. WHEN displaying completion history, THE System SHALL group completions by programme and week

### Requirement 7: Community Feed

**User Story:** As a learner, I want to participate in a cohort-specific community feed, so that I can share updates, ask questions, and engage with my learning cohort.

#### Acceptance Criteria

1. WHEN a learner accesses a programme, THE System SHALL display a community feed tab or section
2. THE System SHALL restrict community feed visibility to learners enrolled in the same cohort
3. WHEN displaying the community feed, THE System SHALL show posts in reverse chronological order
4. WHEN displaying each post, THE System SHALL show author name, timestamp, post content, and engagement metrics
5. THE System SHALL allow learners to create new posts with text content up to 2000 characters
6. WHEN a learner submits a post, THE System SHALL validate that content is not empty
7. WHEN a valid post is submitted, THE System SHALL create a post record linked to the cohort
8. WHEN a post is created, THE System SHALL display it immediately at the top of the feed
9. THE System SHALL allow learners to comment on posts
10. WHEN displaying post comments, THE System SHALL show commenter name, timestamp, and comment text
11. THE System SHALL allow learners to like or react to posts
12. WHEN a learner likes a post, THE System SHALL increment the like count and highlight the like button
13. WHEN a learner unlikes a post, THE System SHALL decrement the like count and remove the highlight
14. WHEN a learner is the author of a post, THE System SHALL display edit and delete options
15. WHEN a learner edits a post, THE System SHALL update the post content and display an "edited" indicator
16. WHEN a learner deletes a post, THE System SHALL remove it from the feed immediately
17. THE System SHALL display a post count showing the total number of posts in the cohort feed
18. THE System SHALL paginate the feed showing 20 posts per page with load more functionality


### Requirement 8: Learner Profile and Settings

**User Story:** As a learner, I want to manage my profile and preferences, so that I can personalize my learning experience and control notifications.

#### Acceptance Criteria

1. WHEN a learner accesses their profile, THE System SHALL display name, email, and profile picture
2. THE System SHALL allow learners to edit their name and profile picture
3. WHEN a learner updates profile information, THE System SHALL validate that name is not empty
4. WHEN valid profile updates are submitted, THE System SHALL persist the changes immediately
5. THE System SHALL display a list of enrolled programmes in the profile view
6. THE System SHALL display overall completion statistics including total lessons completed and programmes completed
7. THE System SHALL allow learners to set notification preferences for email notifications
8. WHEN displaying notification preferences, THE System SHALL show toggles for lesson reminders, community activity, and programme updates
9. WHEN a learner changes notification preferences, THE System SHALL save the preferences immediately
10. THE System SHALL display achievement badges earned by the learner
11. WHEN a learner completes a programme, THE System SHALL award a completion badge
12. THE System SHALL allow learners to set learning goals such as lessons per week
13. WHEN displaying learning goals, THE System SHALL show progress toward the current goal
14. THE System SHALL allow learners to change their password through a secure form
15. WHEN a password change is submitted, THE System SHALL validate password strength requirements

### Requirement 9: Mobile-Responsive Design

**User Story:** As a learner, I want to access all learning features on mobile devices, so that I can learn on-the-go from any device.

#### Acceptance Criteria

1. THE System SHALL render all learner pages responsively for screen widths from 320px to 1920px
2. WHEN accessed on mobile devices, THE System SHALL use touch-friendly button sizes of at least 44×44 pixels
3. WHEN displaying navigation on mobile, THE System SHALL use a collapsible hamburger menu
4. WHEN displaying the programme structure on mobile, THE System SHALL use collapsible accordions for weeks
5. WHEN displaying video lessons on mobile, THE System SHALL use responsive video players that adapt to screen size
6. WHEN displaying the community feed on mobile, THE System SHALL optimize post layout for narrow screens
7. THE System SHALL ensure text content is readable without horizontal scrolling on mobile devices
8. WHEN displaying forms on mobile, THE System SHALL use appropriate input types for mobile keyboards
9. THE System SHALL optimize image loading for mobile networks with responsive image sizes
10. WHEN displaying progress indicators on mobile, THE System SHALL maintain visibility and readability
11. THE System SHALL ensure all interactive elements are accessible via touch gestures
12. WHEN displaying breadcrumb navigation on mobile, THE System SHALL truncate or collapse long paths


### Requirement 10: Navigation and User Experience

**User Story:** As a learner, I want intuitive navigation throughout the platform, so that I can easily move between different sections and find content.

#### Acceptance Criteria

1. THE System SHALL display a persistent navigation bar on all learner pages
2. WHEN displaying the navigation bar, THE System SHALL include links to Dashboard, My Programmes, Browse Programmes, and Profile
3. WHEN a learner clicks a navigation link, THE System SHALL navigate to the corresponding page
4. THE System SHALL highlight the active navigation item corresponding to the current page
5. WHEN a learner is viewing a lesson, THE System SHALL provide a back button to return to the programme view
6. THE System SHALL display breadcrumb navigation on programme and lesson pages
7. WHEN a learner clicks a breadcrumb element, THE System SHALL navigate to that hierarchical level
8. THE System SHALL provide keyboard navigation support for all interactive elements
9. WHEN a learner presses Tab, THE System SHALL move focus to the next interactive element in logical order
10. THE System SHALL display loading states when fetching data from the server
11. WHEN an error occurs, THE System SHALL display user-friendly error messages with recovery options
12. THE System SHALL maintain scroll position when navigating back from lesson to programme view
13. THE System SHALL provide a search function to find programmes, weeks, or lessons by title
14. WHEN search results are displayed, THE System SHALL highlight matching text and provide direct navigation links

### Requirement 11: Performance and Accessibility

**User Story:** As a learner, I want fast page loads and accessible content, so that I can learn efficiently regardless of my abilities or connection speed.

#### Acceptance Criteria

1. THE System SHALL load the learning dashboard within 2 seconds on a standard broadband connection
2. THE System SHALL load lesson content within 3 seconds on a standard broadband connection
3. THE System SHALL implement lazy loading for images and video content
4. THE System SHALL cache programme structure data to reduce server requests
5. THE System SHALL use semantic HTML elements for proper document structure
6. THE System SHALL provide alt text for all images and icons
7. THE System SHALL ensure colour contrast ratios meet WCAG 2.1 AA standards
8. THE System SHALL support screen reader navigation with proper ARIA labels
9. THE System SHALL allow keyboard-only navigation for all functionality
10. WHEN displaying video content, THE System SHALL provide captions or transcript options when available
11. THE System SHALL implement focus indicators for all interactive elements
12. THE System SHALL use descriptive link text instead of generic "click here" phrases


### Requirement 12: Data Persistence and Synchronization

**User Story:** As a learner, I want my progress and activity to be saved automatically, so that I can switch devices and continue learning without losing data.

#### Acceptance Criteria

1. WHEN a learner marks a lesson complete, THE System SHALL persist the completion status to the database immediately
2. WHEN a learner posts a comment, THE System SHALL persist the comment to the database before displaying success
3. WHEN a learner updates their profile, THE System SHALL persist changes to the database immediately
4. THE System SHALL synchronize completion status across all devices within 5 seconds
5. WHEN a network error occurs during save operations, THE System SHALL retry the operation up to 3 times
6. IF all retry attempts fail, THEN THE System SHALL display an error message and queue the operation for later retry
7. THE System SHALL validate data integrity before persisting to the database
8. WHEN a learner accesses the platform from a new device, THE System SHALL load their complete learning state
9. THE System SHALL implement optimistic UI updates showing changes immediately before server confirmation
10. WHEN server confirmation fails, THE System SHALL revert optimistic updates and display an error message
11. THE System SHALL store user preferences locally for faster page loads
12. THE System SHALL synchronize local preferences with the server on each session start

### Requirement 13: Security and Privacy

**User Story:** As a learner, I want my learning data and personal information to be secure and private, so that I can trust the platform with my information.

#### Acceptance Criteria

1. THE System SHALL require authentication for all learner pages and API endpoints
2. WHEN a learner's session expires, THE System SHALL redirect to the login page
3. THE System SHALL restrict access to cohort community feeds to enrolled learners only
4. THE System SHALL restrict access to lesson content to learners enrolled in the programme
5. THE System SHALL validate all user input to prevent injection attacks
6. THE System SHALL sanitize user-generated content before displaying to prevent XSS attacks
7. THE System SHALL use HTTPS for all data transmission
8. THE System SHALL not expose sensitive data in URLs or client-side code
9. THE System SHALL implement rate limiting on API endpoints to prevent abuse
10. WHEN a learner deletes their account, THE System SHALL remove or anonymize their personal data
11. THE System SHALL log security-relevant events for audit purposes
12. THE System SHALL comply with data protection regulations regarding learner data storage and processing
