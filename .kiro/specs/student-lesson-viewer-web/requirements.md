# Requirements Document: Student Lesson Viewer Web

## Introduction

This document specifies the requirements for a web-based student lesson viewer that enables authenticated students to view and interact with lessons through a browser. The system will support core lesson types (text, video, pdf, link) and provide essential learning features including lesson completion tracking, navigation, and discussions. This implementation leverages the existing backend API and focuses on desktop and tablet browser experiences.

## Glossary

- **Student**: An authenticated user with learner role who accesses lessons
- **Lesson**: A learning unit containing content (text, video, pdf, or link) within a module
- **Module**: A collection of ordered lessons within a cohort
- **Cohort**: A group of students taking a course together
- **Lesson_Viewer**: The web application component that displays lesson content
- **API**: The existing backend service (cohortle-api) that provides lesson data
- **Completion_Status**: A boolean indicator of whether a student has completed a lesson
- **YouTube_Video**: A video hosted on YouTube platform
- **BunnyStream_Video**: A video hosted on BunnyStream CDN
- **PDF_Document**: A portable document format file displayed in the browser
- **External_Link**: A URL pointing to a resource outside the application
- **Comment_Thread**: A discussion thread associated with a specific lesson
- **Navigation_Controls**: UI elements that allow moving between lessons in a module

## Requirements

### Requirement 1: Student Authentication

**User Story:** As a student, I want to access lessons only when authenticated, so that my learning progress is tracked and content is protected.

#### Acceptance Criteria

1. WHEN an unauthenticated user attempts to access a lesson page, THE Lesson_Viewer SHALL redirect to the login page
2. WHEN a student successfully authenticates, THE Lesson_Viewer SHALL store the authentication token for API requests
3. WHEN an authentication token expires, THE Lesson_Viewer SHALL prompt the student to re-authenticate
4. THE Lesson_Viewer SHALL include the authentication token in all API requests to the backend

### Requirement 2: Text Lesson Display

**User Story:** As a student, I want to view text lessons with rich formatting, so that I can read and understand the content clearly.

#### Acceptance Criteria

1. WHEN a student opens a text lesson, THE Lesson_Viewer SHALL fetch the lesson data from the API
2. WHEN the lesson data is received, THE Lesson_Viewer SHALL render the HTML content with proper formatting
3. THE Lesson_Viewer SHALL display the lesson title prominently above the content
4. WHEN the lesson contains rich text formatting (bold, italic, lists, headings), THE Lesson_Viewer SHALL preserve and display the formatting correctly
5. THE Lesson_Viewer SHALL make the text content readable on both desktop and tablet screen sizes

### Requirement 3: Video Lesson Display

**User Story:** As a student, I want to watch video lessons from YouTube and BunnyStream, so that I can learn through video content.

#### Acceptance Criteria

1. WHEN a student opens a video lesson with a YouTube URL, THE Lesson_Viewer SHALL embed the YouTube video player
2. WHEN a student opens a video lesson with a BunnyStream URL, THE Lesson_Viewer SHALL embed the BunnyStream video player
3. THE Lesson_Viewer SHALL display the video player with standard playback controls (play, pause, seek, volume, fullscreen)
4. WHEN a video lesson includes text content, THE Lesson_Viewer SHALL display the text content below the video player
5. THE Lesson_Viewer SHALL make the video player responsive to desktop and tablet screen sizes
6. WHEN a video finishes playing, THE Lesson_Viewer SHALL automatically mark the lesson as complete

### Requirement 4: PDF Document Display

**User Story:** As a student, I want to view PDF documents in my browser, so that I can read document-based lessons without downloading files.

#### Acceptance Criteria

1. WHEN a student opens a PDF lesson, THE Lesson_Viewer SHALL fetch the PDF URL from the API
2. THE Lesson_Viewer SHALL embed the PDF document using the browser's native PDF viewer
3. WHEN the PDF fails to load, THE Lesson_Viewer SHALL display an error message and provide a download link
4. THE Lesson_Viewer SHALL make the PDF viewer responsive to desktop and tablet screen sizes
5. WHEN a PDF lesson includes text content, THE Lesson_Viewer SHALL display the text content below the PDF viewer

### Requirement 5: External Link Display

**User Story:** As a student, I want to access external resources through link lessons, so that I can explore supplementary materials.

#### Acceptance Criteria

1. WHEN a student opens a link lesson, THE Lesson_Viewer SHALL display the external URL prominently
2. THE Lesson_Viewer SHALL provide a button to open the external link in a new browser tab
3. WHEN a link lesson includes text content, THE Lesson_Viewer SHALL display the text content with the link
4. THE Lesson_Viewer SHALL display a clear indication that the link opens an external resource
5. WHEN a student clicks the external link button, THE Lesson_Viewer SHALL open the URL in a new tab without navigating away from the lesson page

### Requirement 6: Lesson Completion Tracking

**User Story:** As a student, I want to mark lessons as complete, so that I can track my progress through the course.

#### Acceptance Criteria

1. WHEN a student opens a lesson, THE Lesson_Viewer SHALL fetch the completion status from the API
2. WHEN a lesson is not yet completed, THE Lesson_Viewer SHALL display a "Mark as Complete" button
3. WHEN a student clicks "Mark as Complete", THE Lesson_Viewer SHALL send a completion request to the API
4. WHEN the completion request succeeds, THE Lesson_Viewer SHALL update the UI to show the lesson as completed
5. WHEN a lesson is already completed, THE Lesson_Viewer SHALL display a "Completed" indicator instead of the button
6. WHEN a video lesson finishes playing, THE Lesson_Viewer SHALL automatically mark the lesson as complete without requiring manual action

### Requirement 7: Lesson Navigation

**User Story:** As a student, I want to navigate between lessons in a module, so that I can progress through the course sequentially.

#### Acceptance Criteria

1. WHEN a student completes a lesson, THE Lesson_Viewer SHALL determine if a next lesson exists in the module
2. WHEN a next lesson exists, THE Lesson_Viewer SHALL display a "Next Lesson" button
3. WHEN a student clicks "Next Lesson", THE Lesson_Viewer SHALL navigate to the next lesson in the module
4. THE Lesson_Viewer SHALL display a "Back" button to return to the module overview
5. WHEN a student is viewing the last lesson in a module, THE Lesson_Viewer SHALL not display a "Next Lesson" button

### Requirement 8: Lesson Comments and Discussions

**User Story:** As a student, I want to read and post comments on lessons, so that I can engage in discussions with other students and instructors.

#### Acceptance Criteria

1. WHEN a student opens a lesson, THE Lesson_Viewer SHALL fetch existing comments from the API
2. THE Lesson_Viewer SHALL display comments in chronological order below the lesson content
3. WHEN a student types a comment and submits it, THE Lesson_Viewer SHALL post the comment to the API
4. WHEN a comment is successfully posted, THE Lesson_Viewer SHALL add the new comment to the display
5. THE Lesson_Viewer SHALL display the author name and timestamp for each comment
6. WHEN no comments exist, THE Lesson_Viewer SHALL display a message encouraging students to start a discussion

### Requirement 9: Error Handling and Loading States

**User Story:** As a student, I want clear feedback when content is loading or errors occur, so that I understand the system status.

#### Acceptance Criteria

1. WHEN a lesson is being fetched from the API, THE Lesson_Viewer SHALL display a loading indicator
2. WHEN the API request fails, THE Lesson_Viewer SHALL display an error message with a retry option
3. WHEN a video fails to load, THE Lesson_Viewer SHALL display an error message and continue showing other lesson content
4. WHEN a PDF fails to load, THE Lesson_Viewer SHALL display an error message and provide a download link
5. WHEN the network connection is lost, THE Lesson_Viewer SHALL display a connection error message
6. WHEN required route parameters (lessonId, cohortId) are missing, THE Lesson_Viewer SHALL display a validation error and prevent rendering

### Requirement 10: Responsive Layout

**User Story:** As a student, I want the lesson viewer to work well on desktop and tablet browsers, so that I can learn on different devices.

#### Acceptance Criteria

1. THE Lesson_Viewer SHALL display content in a single-column layout optimized for reading
2. WHEN viewed on a desktop browser (≥1024px width), THE Lesson_Viewer SHALL use appropriate spacing and maximum content width
3. WHEN viewed on a tablet browser (768px-1023px width), THE Lesson_Viewer SHALL adjust spacing and layout for touch interaction
4. THE Lesson_Viewer SHALL ensure video players and PDF viewers scale appropriately to screen size
5. THE Lesson_Viewer SHALL ensure all interactive elements (buttons, links) are easily clickable on touch devices

### Requirement 11: Lesson Type Detection

**User Story:** As a student, I want the system to automatically detect and display the correct lesson type, so that I see the appropriate viewer for each lesson.

#### Acceptance Criteria

1. WHEN a lesson contains a media URL with YouTube domain, THE Lesson_Viewer SHALL classify it as a YouTube video lesson
2. WHEN a lesson contains a media URL with BunnyStream domain (iframe.mediadelivery.net), THE Lesson_Viewer SHALL classify it as a BunnyStream video lesson
3. WHEN a lesson contains a media URL with PDF extension or content type, THE Lesson_Viewer SHALL classify it as a PDF lesson
4. WHEN a lesson contains a media URL that is not video or PDF, THE Lesson_Viewer SHALL classify it as a link lesson
5. WHEN a lesson contains only text content without media, THE Lesson_Viewer SHALL classify it as a text lesson
6. THE Lesson_Viewer SHALL use the detected lesson type to render the appropriate viewer component

### Requirement 12: API Integration

**User Story:** As a developer, I want the web viewer to use existing API endpoints, so that no backend changes are required.

#### Acceptance Criteria

1. THE Lesson_Viewer SHALL use the GET /api/lessons/:lessonId endpoint to fetch lesson data
2. THE Lesson_Viewer SHALL use the GET /api/lessons/:lessonId/completion endpoint to fetch completion status
3. THE Lesson_Viewer SHALL use the POST /api/lessons/:lessonId/complete endpoint to mark lessons complete
4. THE Lesson_Viewer SHALL use the GET /api/modules/:moduleId/lessons endpoint to fetch sibling lessons for navigation
5. THE Lesson_Viewer SHALL use the GET /api/lessons/:lessonId/comments endpoint to fetch comments
6. THE Lesson_Viewer SHALL use the POST /api/lessons/:lessonId/comments endpoint to post new comments
7. THE Lesson_Viewer SHALL include the cohortId as a query parameter in all relevant API requests
