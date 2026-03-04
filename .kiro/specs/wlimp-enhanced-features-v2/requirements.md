# Requirements Document

## Introduction

The WLIMP Enhanced Features (V2) transforms the WLIMP platform from a basic content delivery system into a comprehensive learning management system. Building on V1's foundation of code-based enrollment and weekly lesson structure, V2 adds rich content creation, learner engagement, progress tracking, and analytics capabilities. This enhancement enables conveners to create more engaging learning experiences while providing learners with tools to track their progress and engage with content and peers.

## Glossary

- **WLIMP**: Workforce Leadership & Impact Mentorship Programme
- **Learner**: A participant enrolled in the WLIMP programme
- **Convener**: A facilitator or administrator who manages programme content and structure
- **Programme**: A structured learning experience organized into weeks and lessons
- **Cohort**: A specific group of learners going through the programme together
- **Lesson**: A single learning unit containing content (rich text, files, or external links)
- **Week**: A grouping of lessons representing one week of programme content
- **Rich_Content**: Formatted text with headings, lists, bold, italic, links, and embedded media
- **File_Attachment**: A PDF, document, or image uploaded directly to a lesson
- **Comment**: A text message posted by a learner or convener on a lesson
- **Thread**: A comment and its replies
- **Progress**: A learner's completion status across lessons
- **Analytics**: Metrics and reports about learner engagement and completion
- **Certificate**: A PDF document awarded upon programme completion
- **Notification**: An alert sent via email or displayed in-app about programme events

## Requirements

### Requirement 1: File Upload and Management

**User Story:** As a convener, I want to upload files directly to lessons, so that learners can access materials without relying on external links.

#### Acceptance Criteria

1. WHEN a convener creates or edits a lesson, THE System SHALL provide a file upload interface
2. THE System SHALL accept PDF, DOC, DOCX, PNG, JPG, and JPEG file types
3. WHEN a file exceeds 10MB, THE System SHALL reject the upload and display an error message
4. THE Convener SHALL upload multiple files to a single lesson
5. WHEN a file is uploaded, THE System SHALL store it securely and generate a unique access URL
6. THE System SHALL prevent unauthorized users from accessing uploaded files
7. WHEN a learner views a lesson with file attachments, THE System SHALL display file names, types, and sizes
8. THE Learner SHALL download attached files by clicking on them
9. THE Convener SHALL delete uploaded files from lessons
10. WHEN a file is deleted, THE System SHALL remove it from storage and revoke access URLs

### Requirement 2: Rich Text Content Editor

**User Story:** As a convener, I want to create formatted lesson content with rich text, so that I can provide clear, structured learning materials.

#### Acceptance Criteria

1. WHEN a convener creates or edits a lesson, THE System SHALL provide a rich text editor interface
2. THE Rich_Text_Editor SHALL support headings (H1, H2, H3), paragraphs, bold, italic, underline, and strikethrough formatting
3. THE Rich_Text_Editor SHALL support bulleted lists, numbered lists, and blockquotes
4. THE Rich_Text_Editor SHALL support hyperlinks with custom text
5. THE Rich_Text_Editor SHALL support image embedding via URL or file upload
6. THE Rich_Text_Editor SHALL provide a preview mode showing how content will appear to learners
7. WHEN a convener saves rich content, THE System SHALL store it in a structured format
8. WHEN a learner views a lesson with rich content, THE System SHALL render the formatted content correctly
9. THE System SHALL sanitize rich content to prevent XSS attacks
10. THE Rich_Text_Editor SHALL work on mobile devices with touch input

### Requirement 3: Analytics and Reporting Dashboard

**User Story:** As a convener, I want to view analytics about learner engagement, so that I can understand how learners are progressing and identify areas needing support.

#### Acceptance Criteria

1. THE System SHALL provide a convener analytics dashboard accessible from the programme page
2. WHEN a convener views analytics, THE System SHALL display total enrollment count per cohort
3. THE Analytics_Dashboard SHALL display lesson completion rates as percentages
4. THE Analytics_Dashboard SHALL display average time spent per lesson
5. THE Analytics_Dashboard SHALL display engagement metrics showing which lessons have the most views
6. THE Convener SHALL filter analytics by cohort and date range
7. THE Convener SHALL export analytics data as CSV files
8. THE Convener SHALL export analytics reports as PDF files
9. THE Analytics_Dashboard SHALL display visual charts for completion rates and engagement trends
10. THE System SHALL update analytics data within 5 minutes of learner activity

### Requirement 4: Comments and Discussions

**User Story:** As a learner, I want to comment on lessons and discuss with peers, so that I can ask questions and share insights.

#### Acceptance Criteria

1. WHEN a learner views a lesson, THE System SHALL display a comments section below the content
2. THE Learner SHALL post a comment with text content up to 2000 characters
3. WHEN a comment is posted, THE System SHALL display it immediately with the author's name and timestamp
4. THE Learner SHALL reply to existing comments creating threaded discussions
5. THE Convener SHALL reply to learner comments
6. THE Convener SHALL delete inappropriate comments
7. WHEN a comment is deleted, THE System SHALL remove it and all its replies
8. THE System SHALL display comments in chronological order with newest first
9. THE System SHALL paginate comments when more than 20 exist on a lesson
10. WHEN a learner or convener posts a comment, THE System SHALL send notifications to relevant users

### Requirement 5: Progress Tracking

**User Story:** As a learner, I want to track my progress through the programme, so that I can see what I've completed and what remains.

#### Acceptance Criteria

1. WHEN a learner views a lesson, THE System SHALL provide a "Mark as Complete" button
2. WHEN a learner marks a lesson as complete, THE System SHALL record the completion with timestamp
3. THE System SHALL allow learners to unmark lessons as complete
4. WHEN a learner views the programme page, THE System SHALL display a progress bar showing completion percentage
5. THE Programme_Page SHALL indicate which lessons have been completed with visual markers
6. THE Dashboard SHALL display overall progress percentage for each enrolled programme
7. THE System SHALL track time spent on each lesson based on page view duration
8. WHEN a learner returns to a programme, THE System SHALL highlight the next incomplete lesson
9. THE System SHALL calculate completion percentage as (completed lessons / total lessons) × 100
10. THE System SHALL persist progress data across sessions and devices

### Requirement 6: Certificate Generation

**User Story:** As a learner, I want to receive a certificate upon completing the programme, so that I have proof of my achievement.

#### Acceptance Criteria

1. WHEN a learner completes all lessons in a programme, THE System SHALL automatically generate a certificate
2. THE Certificate SHALL include the learner's full name, programme name, and completion date
3. THE Certificate SHALL include a unique verification code
4. THE System SHALL provide a certificate download link on the programme page
5. THE Learner SHALL download the certificate as a PDF file
6. THE Convener SHALL customize certificate templates with programme branding
7. THE System SHALL provide a public verification page where anyone can verify a certificate using its code
8. WHEN a certificate is verified, THE System SHALL display the learner name, programme name, and completion date
9. THE System SHALL send an email notification when a certificate is generated
10. THE Certificate SHALL be professionally formatted and print-ready

### Requirement 7: Notification System

**User Story:** As a learner, I want to receive notifications about programme updates, so that I stay informed about new content and interactions.

#### Acceptance Criteria

1. WHEN a new lesson is published, THE System SHALL send email notifications to all enrolled learners
2. WHEN a convener replies to a learner's comment, THE System SHALL send an email notification to that learner
3. WHEN a learner completes a programme, THE System SHALL send a congratulatory email with certificate link
4. THE System SHALL provide an in-app notification center accessible from the dashboard
5. THE Notification_Center SHALL display unread notifications with visual indicators
6. THE Learner SHALL mark notifications as read
7. THE Learner SHALL configure notification preferences (email on/off for each notification type)
8. THE System SHALL batch notifications to avoid sending excessive emails (maximum one email per hour)
9. WHEN a learner reaches a milestone (25%, 50%, 75% completion), THE System SHALL send a congratulatory notification
10. THE System SHALL include unsubscribe links in all email notifications

### Requirement 8: Mobile and Performance Optimization

**User Story:** As a learner on a mobile device with limited bandwidth, I want V2 features to work reliably, so that I can engage with content without frustration.

#### Acceptance Criteria

1. THE System SHALL render all V2 features responsively on mobile browsers (320px minimum width)
2. THE Rich_Text_Editor SHALL provide a mobile-optimized interface with touch-friendly controls
3. THE File_Upload interface SHALL work with mobile device cameras and file pickers
4. THE Comments_Section SHALL be touch-friendly with appropriate spacing for mobile interaction
5. THE System SHALL lazy-load comments to reduce initial page load time
6. THE System SHALL compress uploaded images to reduce file sizes while maintaining quality
7. THE Analytics_Dashboard SHALL render charts responsively on mobile devices
8. THE System SHALL cache static assets aggressively to reduce bandwidth usage
9. THE System SHALL load core content before loading analytics and comments
10. THE System SHALL provide offline indicators when network connectivity is lost

### Requirement 9: Data Privacy and Security

**User Story:** As a system administrator, I want learner data to be secure and private, so that we comply with data protection regulations.

#### Acceptance Criteria

1. THE System SHALL encrypt uploaded files at rest using AES-256 encryption
2. THE System SHALL generate signed URLs for file access with expiration times
3. WHEN a learner is unenrolled, THE System SHALL maintain their progress data but restrict access
4. THE System SHALL anonymize analytics data to protect individual learner privacy
5. THE Convener SHALL NOT see individual learner time-tracking data, only aggregated metrics
6. THE System SHALL log all file access attempts for security auditing
7. THE System SHALL validate and sanitize all user-generated content (comments, rich text)
8. THE System SHALL implement rate limiting on comment posting (maximum 10 comments per minute)
9. THE System SHALL implement rate limiting on file uploads (maximum 5 uploads per minute)
10. THE System SHALL comply with GDPR requirements for data export and deletion

### Requirement 10: Backward Compatibility

**User Story:** As a system architect, I want V2 to maintain V1 functionality, so that existing programmes continue working without disruption.

#### Acceptance Criteria

1. THE System SHALL continue supporting external content links (Zoom, Drive, YouTube, PDF URLs)
2. WHEN a lesson has only external links and no rich content, THE System SHALL display it using V1 rendering
3. THE System SHALL maintain existing database schema for programmes, cohorts, weeks, and lessons
4. THE System SHALL extend existing tables with new columns rather than creating incompatible structures
5. WHEN V2 features are not used, THE System SHALL behave identically to V1
6. THE System SHALL migrate existing lessons to support both external links and rich content
7. THE Convener SHALL choose between external link mode and rich content mode per lesson
8. THE System SHALL maintain API backward compatibility for V1 endpoints
9. THE System SHALL support gradual rollout of V2 features per programme
10. THE System SHALL provide a feature flag system to enable/disable V2 features per programme
