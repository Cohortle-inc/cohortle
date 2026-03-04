# Requirements Document: MVP Completion Gaps

## Introduction

This document identifies and prioritizes the critical missing components that prevent Cohortle from being a functional MVP. While the backend API is 100% complete and the convener flow is now functional, the learner experience is severely limited due to missing core UI components. This spec focuses on the essential features needed to achieve MVP status.

## Glossary

- **MVP**: Minimum Viable Product - the basic version that allows users to complete core workflows
- **Learner**: A user who consumes learning content (student role)
- **Convener**: A user who creates and manages learning programmes
- **Lesson Viewer**: The component that displays lesson content to learners
- **Completion Tracking**: The system that tracks learner progress through lessons
- **Critical Path**: The essential user journey that must work for MVP
- **Blocking Issue**: A missing feature that prevents core functionality
- **API Parity**: Frontend functionality matching available backend endpoints

## Current State Assessment

### ✅ What's Working (Backend)
- All core API endpoints implemented and tested
- Authentication system with JWT tokens
- Programme/cohort/week/lesson management
- Multiple lesson types (text, video, PDF, link, quiz, live session)
- Enrollment system with code-based access
- Progress tracking endpoints
- Comments and discussions endpoints
- File upload system (Bunny Stream integration)

### ✅ What's Working (Frontend)
- Authentication (login, signup, password reset)
- Convener dashboard and programme management
- Programme creation and editing
- Cohort and week management
- Lesson creation forms
- Join programme with enrollment code
- Role-based access control

### ❌ What's Blocking MVP
- Learners cannot view lesson content (lesson viewer not implemented)
- Learners cannot mark lessons complete (completion UI missing)
- Learners cannot navigate between lessons (navigation missing)
- No discussion/comment capability on lessons
- No progress visibility for learners

## Requirements

### Requirement 1: Lesson Content Viewer

**User Story:** As a learner, I want to view lesson content in all supported formats, so that I can access the learning materials.

#### Acceptance Criteria

1.1. **Text Lesson Display**
   - WHEN a learner opens a text lesson, THE System SHALL render the HTML content with proper formatting
   - WHEN the lesson contains rich text (bold, italic, lists, headings), THE System SHALL preserve formatting
   - THE System SHALL display the lesson title prominently above the content
   - THE System SHALL make text readable on desktop and tablet screen sizes

1.2. **Video Lesson Display**
   - WHEN a learner opens a video lesson, THE System SHALL display an embedded video player
   - WHEN the video is from YouTube, THE System SHALL use YouTube embed API
   - WHEN the video is from BunnyStream, THE System SHALL use BunnyStream player
   - THE System SHALL support video controls (play, pause, seek, volume)
   - THE System SHALL track video completion for progress

1.3. **PDF Lesson Display**
   - WHEN a learner opens a PDF lesson, THE System SHALL display the PDF in an embedded viewer
   - THE System SHALL provide PDF controls (zoom, page navigation, download)
   - THE System SHALL handle PDF loading states and errors gracefully
   - THE System SHALL support responsive PDF viewing

1.4. **Link Lesson Display**
   - WHEN a learner opens a link lesson, THE System SHALL display the external link prominently
   - THE System SHALL provide a clear call-to-action to visit the link
   - THE System SHALL open external links in a new tab/window
   - THE System SHALL track link clicks for progress

1.5. **Quiz Lesson Display**
   - WHEN a learner opens a quiz lesson, THE System SHALL display interactive quiz questions
   - THE System SHALL support multiple choice, true/false, and text input questions
   - THE System SHALL provide immediate feedback on answers
   - THE System SHALL calculate and display quiz scores

1.6. **Live Session Display**
   - WHEN a learner opens a live session lesson, THE System SHALL display session details
   - THE System SHALL show session date, time, and join link
   - THE System SHALL indicate if session is upcoming, live, or completed
   - THE System SHALL provide calendar integration options

### Requirement 2: Lesson Completion Tracking

**User Story:** As a learner, I want to mark lessons as complete and track my progress, so that I can monitor my learning journey.

#### Acceptance Criteria

2.1. **Completion Button**
   - WHEN a learner finishes viewing a lesson, THE System SHALL display a "Mark Complete" button
   - WHEN a learner clicks "Mark Complete", THE System SHALL update the lesson status via API
   - WHEN a lesson is already complete, THE System SHALL show "Completed" status with checkmark
   - THE System SHALL provide visual feedback during completion status updates

2.2. **Progress Indicators**
   - WHEN a learner views a programme, THE System SHALL show overall progress percentage
   - WHEN a learner views a week, THE System SHALL show week-specific progress
   - THE System SHALL display completed lessons with visual indicators (checkmarks, green color)
   - THE System SHALL update progress indicators in real-time after completion

2.3. **Progress Persistence**
   - WHEN a learner marks a lesson complete, THE System SHALL persist the status to the backend
   - WHEN a learner returns to a lesson, THE System SHALL display the correct completion status
   - THE System SHALL handle completion status errors gracefully with retry options

### Requirement 3: Lesson Navigation

**User Story:** As a learner, I want to navigate between lessons easily, so that I can progress through the programme efficiently.

#### Acceptance Criteria

3.1. **Sequential Navigation**
   - WHEN a learner is viewing a lesson, THE System SHALL display "Previous" and "Next" buttons
   - WHEN a learner clicks "Next", THE System SHALL navigate to the next lesson in sequence
   - WHEN a learner clicks "Previous", THE System SHALL navigate to the previous lesson
   - THE System SHALL disable navigation buttons appropriately (no previous on first lesson, etc.)

3.2. **Module/Week Overview**
   - WHEN a learner is viewing a lesson, THE System SHALL display a sidebar or dropdown with all lessons in the week
   - WHEN a learner clicks on a lesson in the overview, THE System SHALL navigate to that lesson
   - THE System SHALL highlight the current lesson in the overview
   - THE System SHALL show completion status for all lessons in the overview

3.3. **Breadcrumb Navigation**
   - WHEN a learner is viewing a lesson, THE System SHALL display breadcrumbs (Programme > Week > Lesson)
   - WHEN a learner clicks on a breadcrumb, THE System SHALL navigate to that level
   - THE System SHALL maintain navigation context across page refreshes

### Requirement 4: Comments and Discussions

**User Story:** As a learner, I want to read and post comments on lessons, so that I can engage in discussions with other learners.

#### Acceptance Criteria

4.1. **Comment Display**
   - WHEN a learner views a lesson, THE System SHALL display existing comments below the content
   - THE System SHALL show comment author, timestamp, and content
   - THE System SHALL support threaded replies to comments
   - THE System SHALL handle empty comment states gracefully

4.2. **Comment Posting**
   - WHEN a learner wants to comment, THE System SHALL provide a comment input form
   - WHEN a learner submits a comment, THE System SHALL post it via the API
   - THE System SHALL display the new comment immediately after posting
   - THE System SHALL handle comment posting errors with user feedback

4.3. **Comment Management**
   - WHEN a learner posts a comment, THE System SHALL allow them to edit or delete it
   - THE System SHALL show loading states during comment operations
   - THE System SHALL support markdown formatting in comments (optional)

### Requirement 5: Progress Dashboard

**User Story:** As a learner, I want to see my overall progress across all programmes, so that I can track my learning achievements.

#### Acceptance Criteria

5.1. **Programme Progress Overview**
   - WHEN a learner views their dashboard, THE System SHALL display progress for each enrolled programme
   - THE System SHALL show completion percentage, completed lessons, and total lessons
   - THE System SHALL provide visual progress bars or indicators
   - THE System SHALL highlight recently accessed programmes

5.2. **Detailed Progress View**
   - WHEN a learner clicks on a programme, THE System SHALL show detailed week-by-week progress
   - THE System SHALL indicate which lessons are completed, in progress, or not started
   - THE System SHALL show estimated time to completion
   - THE System SHALL provide quick access to continue learning

### Requirement 6: Convener Programme Preview

**User Story:** As a convener, I want to preview my programme as a learner would see it, so that I can verify the content before publishing.

#### Acceptance Criteria

6.1. **Preview Mode**
   - WHEN a convener views their programme, THE System SHALL provide a "Preview as Learner" button
   - WHEN a convener clicks preview, THE System SHALL display the programme using the learner interface
   - THE System SHALL clearly indicate preview mode with visual cues
   - THE System SHALL allow conveners to exit preview mode easily

6.2. **Preview Functionality**
   - WHEN in preview mode, THE System SHALL show all lessons as they would appear to learners
   - THE System SHALL allow conveners to navigate through lessons
   - THE System SHALL NOT allow conveners to mark lessons complete in preview mode
   - THE System SHALL show completion tracking UI without persisting data

### Requirement 7: Lesson Reordering Interface

**User Story:** As a convener, I want to reorder lessons within a week, so that I can organize content in the optimal learning sequence.

#### Acceptance Criteria

7.1. **Drag and Drop Reordering**
   - WHEN a convener views a week's lessons, THE System SHALL provide drag handles for each lesson
   - WHEN a convener drags a lesson, THE System SHALL show visual feedback during the drag operation
   - WHEN a convener drops a lesson, THE System SHALL update the lesson order via API
   - THE System SHALL handle reordering errors with user feedback and rollback

7.2. **Manual Reordering**
   - WHEN drag and drop is not available, THE System SHALL provide up/down arrow buttons
   - WHEN a convener clicks reorder buttons, THE System SHALL move lessons accordingly
   - THE System SHALL update lesson numbering immediately after reordering
   - THE System SHALL persist the new order to the backend

## Priority Classification

### 🔴 CRITICAL (Blocks MVP Launch)
- **Requirement 1**: Lesson Content Viewer (ALL lesson types)
- **Requirement 2**: Lesson Completion Tracking
- **Requirement 3**: Lesson Navigation (basic next/previous)

**Rationale**: Without these, learners cannot consume content or track progress, making the platform non-functional.

### 🟠 HIGH (Severely Limits Usability)
- **Requirement 4**: Comments and Discussions
- **Requirement 5**: Progress Dashboard
- **Requirement 6**: Convener Programme Preview

**Rationale**: These enable engagement and content management, essential for a complete learning experience.

### 🟡 MEDIUM (Nice-to-Have for MVP)
- **Requirement 7**: Lesson Reordering Interface
- Advanced navigation features (breadcrumbs, overview sidebar)
- Mobile optimization

**Rationale**: These improve usability but don't block core functionality.

## Success Criteria

### MVP Launch Ready When:
1. ✅ Learners can view all 6 lesson types (text, video, PDF, link, quiz, live session)
2. ✅ Learners can mark lessons complete and see progress
3. ✅ Learners can navigate between lessons in sequence
4. ✅ Conveners can preview programmes before publishing
5. ✅ Basic error handling and loading states work
6. ✅ Responsive design works on desktop and tablet

### Post-MVP Enhancements:
1. Comments and discussions on lessons
2. Comprehensive progress dashboard
3. Lesson reordering interface
4. Assignment submission and grading
5. Analytics and reporting
6. Mobile app feature parity

## Technical Considerations

### Frontend Implementation
- Leverage existing API client methods in `cohortle-web/src/lib/api/`
- Use existing component patterns from convener pages
- Implement responsive design with Tailwind CSS
- Add proper TypeScript types for all data structures
- Include comprehensive error handling and loading states

### Backend Integration
- All required endpoints already exist and are tested
- Use existing authentication and authorization patterns
- Leverage existing progress tracking and completion endpoints
- Utilize existing comment and discussion endpoints

### Testing Requirements
- Unit tests for all new components
- Integration tests for lesson viewer workflows
- End-to-end tests for complete learner journey
- Property-based tests for progress tracking
- Cross-browser compatibility testing

## Estimated Implementation Timeline

### Phase 1: Critical Features (Week 1)
- Lesson Content Viewer (3-4 days)
- Completion Tracking (1 day)
- Basic Navigation (1 day)

### Phase 2: High Priority Features (Week 2)
- Comments UI (2 days)
- Progress Dashboard (2 days)
- Programme Preview (1 day)

### Phase 3: Polish and Testing (Week 3)
- Lesson Reordering (1 day)
- Comprehensive testing (2 days)
- Bug fixes and optimization (2 days)

**Total Estimated Time**: 15-18 development days (3 weeks)

## Dependencies

### External Dependencies
- YouTube Embed API (for video lessons)
- BunnyStream Player (for hosted videos)
- PDF.js or similar (for PDF viewing)

### Internal Dependencies
- Existing backend API endpoints (all available)
- Authentication system (working)
- API client methods (mostly implemented)
- UI component library (Tailwind CSS, existing patterns)

## Risk Assessment

### High Risk
- **Lesson Viewer Complexity**: Supporting 6 different content types requires careful architecture
- **Video Integration**: YouTube and BunnyStream players may have different APIs
- **Progress Sync**: Ensuring completion status stays synchronized between frontend and backend

### Medium Risk
- **Performance**: Large PDFs or videos may impact page load times
- **Mobile Compatibility**: Ensuring lesson viewer works well on mobile devices
- **Error Handling**: Graceful degradation when content fails to load

### Low Risk
- **API Integration**: Backend endpoints are well-tested and documented
- **Authentication**: Existing auth system is stable
- **UI Consistency**: Existing component patterns can be reused

## Conclusion

The Cohortle platform is **60% complete for learners** and **80% complete for conveners** on the web. The backend is fully functional. The primary gap is the **lesson viewer component** and associated learner UI features.

With focused development on the critical requirements (lesson viewer, completion tracking, navigation), the platform can achieve MVP status within 2-3 weeks. The mobile app (Cohortz) already provides full functionality and can serve as a reference implementation for the web interface.

**Next Steps:**
1. Create implementation spec for lesson viewer component
2. Begin development with text and video lesson types
3. Implement completion tracking integration
4. Add basic lesson navigation
5. Test end-to-end learner workflow
6. Deploy and validate MVP functionality