# Requirements Document

## Introduction

The WLIMP Programme Rollout feature enables the Workforce Leadership & Impact Mentorship Programme to migrate from WhatsApp-based content delivery to Cohortle's web platform. This feature provides a calm, reliable learning home where learners can access programme content, join using codes, and navigate weekly structured lessons without disrupting their current learning experience.

## Glossary

- **WLIMP**: Workforce Leadership & Impact Mentorship Programme
- **Learner**: A participant enrolled in the WLIMP programme
- **Convener**: A facilitator or administrator who manages programme content and structure
- **Programme**: A structured learning experience organized into weeks and lessons
- **Cohort**: A specific group of learners going through the programme together
- **Lesson**: A single learning unit containing external content links
- **Week**: A grouping of lessons representing one week of programme content
- **Enrollment_Code**: A unique code used to join a specific programme cohort
- **Dashboard**: The main learner interface showing enrolled programmes
- **External_Content**: Links to Zoom recordings, Google Drive files, YouTube videos, or PDFs hosted elsewhere

## Requirements

### Requirement 1: Programme Creation and Management

**User Story:** As a convener, I want to create and structure the WLIMP programme with weekly lessons, so that learners can access organized content progressively.

#### Acceptance Criteria

1. THE Convener SHALL create a programme with title "WLIMP – Workforce Leadership & Impact Mentorship Programme" and description
2. WHEN a convener creates a programme, THE System SHALL support multiple cohorts for that programme
3. THE Convener SHALL organize lessons into weekly groupings (Week 1, Week 2, etc.)
4. WHEN a convener creates a lesson, THE System SHALL allow assignment to a specific week
5. THE Convener SHALL paste external content links (Zoom, Google Drive, YouTube, PDF URLs) into lesson content
6. THE Convener SHALL reorder lessons within a week
7. THE System SHALL NOT provide file upload functionality
8. THE System SHALL NOT provide rich text editor functionality
9. THE System SHALL NOT provide analytics or reporting functionality

### Requirement 2: Code-Based Enrollment

**User Story:** As a learner, I want to join the WLIMP programme using a simple code, so that I can quickly access content without complex registration processes.

#### Acceptance Criteria

1. WHEN a learner enters a valid enrollment code, THE System SHALL enroll them in the corresponding programme cohort immediately
2. WHEN enrollment succeeds, THE System SHALL redirect the learner to the programme page
3. THE System SHALL process enrollment within 2 seconds on standard mobile connections
4. WHEN a learner enters an invalid enrollment code, THE System SHALL display a clear error message
5. THE Enrollment_Interface SHALL be accessible from the learner dashboard
6. THE Enrollment_Code SHALL follow the format: PROGRAMME-YEAR (e.g., WLIMP-2026)
7. WHEN a learner is already enrolled in a programme, THE System SHALL prevent duplicate enrollment

### Requirement 3: Programme Page Display

**User Story:** As a learner, I want to view the programme structure organized by weeks, so that I can understand the learning journey and access current content.

#### Acceptance Criteria

1. WHEN a learner views the programme page, THE System SHALL display the programme title and description
2. THE Programme_Page SHALL indicate which week is the current week
3. THE Programme_Page SHALL group lessons by week with clear week labels
4. WHEN displaying lessons, THE System SHALL show lesson title, description, and a "View lesson" call-to-action
5. THE Programme_Page SHALL display all past weeks and the current week
6. THE Programme_Page SHALL NOT display future weeks that have no content yet
7. THE Programme_Page SHALL be responsive and functional on mobile browsers

### Requirement 4: Lesson Viewing Experience

**User Story:** As a learner, I want to view lesson content with embedded or linked external resources, so that I can access recordings and materials easily.

#### Acceptance Criteria

1. WHEN a learner opens a lesson, THE System SHALL display the lesson title and description
2. THE Lesson_Page SHALL display or link to external content (Zoom, Google Drive, YouTube, PDF)
3. WHEN external content is a YouTube video, THE System SHALL embed the video player
4. WHEN external content is a PDF or Drive link, THE System SHALL provide a clickable link
5. THE Lesson_Page SHALL provide a back link to return to the programme page
6. THE System SHALL NOT provide comment functionality
7. THE System SHALL NOT provide download functionality
8. THE System SHALL NOT track lesson completion or progress

### Requirement 5: Dashboard Integration

**User Story:** As a learner, I want to see my enrolled programmes on the dashboard with current week information, so that I can quickly access ongoing learning.

#### Acceptance Criteria

1. WHEN a learner is enrolled in programmes, THE Dashboard SHALL display programme cards
2. WHEN displaying a programme card, THE System SHALL show the programme title and current week indicator
3. THE Programme_Card SHALL provide a call-to-action to view the programme
4. WHEN a learner is not enrolled in any programmes, THE Dashboard SHALL display an empty state
5. THE Empty_State SHALL provide a "Join with code" call-to-action
6. THE Dashboard SHALL load within 3 seconds on standard mobile connections

### Requirement 6: Mobile and Low-Bandwidth Support

**User Story:** As a learner on a mobile device with limited bandwidth, I want the platform to work reliably, so that I can access content without frustration.

#### Acceptance Criteria

1. THE System SHALL render all pages responsively on mobile browsers (320px minimum width)
2. THE System SHALL load core content (text, structure) before loading external embeds
3. WHEN network conditions are poor, THE System SHALL display content progressively
4. THE System SHALL minimize JavaScript bundle size for faster initial page loads
5. THE System SHALL use lazy loading for embedded video content

### Requirement 7: Progressive Content Addition

**User Story:** As a convener, I want to add content weekly without requiring developer assistance, so that I can maintain the programme independently.

#### Acceptance Criteria

1. THE Convener SHALL add new lessons to existing weeks without developer intervention
2. THE Convener SHALL create new weeks and add lessons to them without developer intervention
3. WHEN a convener adds content, THE System SHALL make it immediately visible to enrolled learners
4. THE System SHALL maintain existing lesson order when new lessons are added
5. THE Convener SHALL edit existing lesson titles, descriptions, and content links

### Requirement 8: Platform Integration

**User Story:** As a system architect, I want the WLIMP feature to integrate with existing Cohortle authentication and data models, so that the platform remains consistent and maintainable.

#### Acceptance Criteria

1. THE System SHALL use existing Cohortle authentication for learner access
2. THE System SHALL use existing programme and module data models where applicable
3. WHEN a learner logs in, THE System SHALL maintain session state across programme and lesson pages
4. THE System SHALL follow existing Cohortle UI patterns and component library
5. THE System SHALL use the existing Next.js routing structure
