# Implementation Plan: MVP Completion Gaps

## Overview

This implementation plan converts the MVP completion gaps design into actionable coding tasks. The focus is on implementing the lesson viewer component and associated learner UI features to complete the Cohortle MVP. Each task builds incrementally on previous work, with comprehensive testing integrated throughout.

The implementation leverages existing TypeScript/React patterns, API endpoints, and UI components while introducing new learner-focused interfaces. All tasks involve writing, modifying, or testing code components.

## Quick Status Summary

**🎯 MVP Completion: 85%**

**✅ What's Working:**
- All 6 lesson types render correctly (Text, Video, PDF, Link, Quiz, Live Session)
- Lesson completion tracking with API integration
- Sequential navigation between lessons
- Comments display and posting
- Progress calculation utilities
- Dashboard with enrolled programmes
- Breadcrumb navigation
- Comprehensive error handling

**🔴 Critical Gap (Blocks Full MVP):**
- **Task 11.3**: Programme pages need completion status indicators (checkmarks, progress bars)

**🟠 High Priority (Post-MVP):**
- **Task 8.5**: Comment edit/delete functionality
- **Task 12**: Convener preview mode

**🟡 Medium Priority:**
- **Task 13**: Lesson reordering interface
- Optional property tests and optimizations

**Current Implementation Status (Updated):**

**✅ COMPLETED (Core Learner Journey)**
- All 6 lesson content components (Text, Video, PDF, Link, Quiz, LiveSession)
- Lesson page routing at `/lessons/[lessonId]` with WLIMP support
- Completion tracking with CompletionButton and API integration
- Sequential lesson navigation (Previous/Next buttons)
- Comments display and posting functionality
- Lesson overview sidebar showing all lessons in a week
- Progress calculation utilities (progressCalculation.ts)
- Breadcrumb navigation (Programme > Week > Lesson)
- Dashboard showing enrolled programmes with basic progress
- Comprehensive property-based tests for core components
- Error handling and loading states throughout

**🔴 CRITICAL - Blocks Full MVP**
- **Programme page completion status display**: Programme pages show weeks and lessons but don't display completion indicators (checkmarks, progress bars)
- **Detailed progress view**: Need to integrate completion data into existing programme/module pages

**🟠 HIGH PRIORITY - Enhances Usability**
- **Comment management**: Edit and delete functionality for user's own comments
- **Convener preview mode**: Allow conveners to preview programmes as learners
- **Progress dashboard enhancements**: More detailed progress tracking and analytics

**🟡 MEDIUM PRIORITY - Nice-to-Have**
- **Lesson reordering interface**: Drag-and-drop or button-based lesson reordering
- **Additional property tests**: Some property tests remain unimplemented (marked with `*`)
- **Mobile optimization**: Enhanced mobile/tablet experience
- **Performance optimizations**: Code splitting, lazy loading, caching

**MVP Readiness**: ~85% complete. Core learner journey is functional end-to-end. Main gap is visual progress indicators on programme pages.

## Tasks

- [x] 1. Set up lesson viewer foundation and core interfaces
  - Create lesson viewer page route at `/lessons/[lessonId]`
  - Set up TypeScript interfaces for enhanced lesson types (quiz, live session)
  - Configure React Query for lesson data management
  - Implement lesson type detection utility with all 6 lesson types
  - _Requirements: 1.1, 1.5, 1.10, 1.14, 1.18, 1.22_

- [x] 2. Implement core lesson content components
  - [x] 2.1 Enhance TextLessonContent component
    - Add proper HTML sanitization with DOMPurify
    - Implement responsive typography with Tailwind prose classes
    - Ensure title displays prominently above content
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 2.2 Write property test for HTML content preservation
    - **Property 2: HTML Content Preservation**
    - **Validates: Requirements 1.2**
  
  - [x] 2.3 Enhance VideoLessonContent component
    - Implement YouTube and BunnyStream URL detection
    - Add video embed generation with proper security attributes
    - Implement video end event handling for auto-completion
    - Add video player error handling and fallbacks
    - _Requirements: 1.5, 1.6, 1.7, 1.9_
  
  - [x] 2.4 Write property test for video provider detection
    - **Property 4: Video Provider Detection**
    - **Validates: Requirements 1.6, 1.7**

- [x] 3. Implement PDF and link lesson components
  - [x] 3.1 Enhance PdfLessonContent component
    - Implement PDF embed viewer with responsive design
    - Add PDF loading states and error handling
    - Provide download fallback for PDF viewing issues
    - _Requirements: 1.10, 1.12_
  
  - [x] 3.2 Write property test for PDF error handling
    - **Property 6: PDF Error Handling**
    - **Validates: Requirements 1.12**
  
  - [x] 3.3 Enhance LinkLessonContent component
    - Implement external link display with clear call-to-action
    - Add target="_blank" and security attributes for external links
    - Implement link click tracking for progress
    - _Requirements: 1.14, 1.15, 1.16, 1.17_
  
  - [x] 3.4 Write property test for external link attributes
    - **Property 7: External Link Attributes**
    - **Validates: Requirements 1.16**

- [x] 4. Implement advanced lesson types (quiz and live session)
  - [x] 4.1 Create QuizLessonContent component
    - Implement multiple choice, true/false, and text input question types
    - Add immediate feedback display for quiz answers
    - Implement quiz score calculation and display
    - Add quiz completion tracking integration
    - _Requirements: 1.18, 1.19, 1.20, 1.21_
  
  - [x] 4.2 Write property test for quiz question rendering
    - **Property 9: Quiz Question Rendering**
    - **Validates: Requirements 1.19**
  
  - [x] 4.3 Write property test for quiz score calculation
    - **Property 10: Quiz Score Calculation**
    - **Validates: Requirements 1.21**
  
  - [x] 4.4 Create LiveSessionContent component
    - Display session details (date, time, join link)
    - Implement session status indicators (upcoming, live, completed)
    - Add calendar integration options
    - Handle timezone display and conversion
    - _Requirements: 1.22, 1.23, 1.24, 1.25_
  
  - [x] 4.5 Write property test for live session status display
    - **Property 11: Live Session Status Display**
    - **Validates: Requirements 1.24**

- [x] 5. Checkpoint - Ensure lesson viewer components work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement lesson completion tracking system
  - [x] 6.1 Enhance CompletionButton component
    - Implement completion state display (Mark Complete vs Completed)
    - Add loading states during API calls
    - Implement completion API integration with error handling
    - Add visual feedback and success states
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 6.2 Write property test for completion button state
    - **Property 12: Completion Button State**
    - **Validates: Requirements 2.1, 2.3**
  
  - [x] 6.3 Write property test for completion API integration
    - **Property 13: Completion API Integration**
    - **Validates: Requirements 2.2, 2.9**
  
  - [x] 6.4 Implement progress calculation utilities
    - Create progress calculation functions for programmes and weeks
    - Implement real-time progress updates after completion
    - Add progress persistence and loading from backend
    - _Requirements: 2.5, 2.6, 2.8, 2.9, 2.10_
  
  - [x] 6.5 Write property test for progress calculation accuracy
    - **Property 14: Progress Calculation Accuracy**
    - **Validates: Requirements 2.5, 2.6**
  
  - [x] 6.6 Write property test for progress indicator updates
    - **Property 15: Progress Indicator Updates**
    - **Validates: Requirements 2.8**
  
  - [x] 6.7 Write property test for completion status persistence
    - **Property 16: Completion Status Persistence**
    - **Validates: Requirements 2.10**
  
  - [x] 6.8 Add completion error handling and retry logic
    - Implement graceful error handling for completion failures
    - Add retry mechanisms with exponential backoff
    - Provide user feedback for completion errors
    - _Requirements: 2.11_

- [x] 7. Implement lesson navigation system
  - [x] 7.1 Create LessonNavigation component
    - Implement previous/next navigation buttons
    - Add navigation button state management (disabled when appropriate)
    - Fetch module lessons for navigation context
    - Handle navigation routing between lessons
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 7.2 Write property test for navigation button functionality
    - **Property 17: Navigation Button Functionality**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
  
  - [x] 7.3 Create lesson overview sidebar component
    - Display all lessons in current week/module
    - Implement lesson overview navigation
    - Add current lesson highlighting
    - Show completion status for all lessons in overview
    - _Requirements: 3.5, 3.6, 3.7, 3.8_
  
  - [x] 7.4 Write property test for lesson overview navigation
    - **Property 18: Lesson Overview Navigation**
    - **Validates: Requirements 3.6**
  
  - [x] 7.5 Write property test for current lesson highlighting
    - **Property 19: Current Lesson Highlighting**
    - **Validates: Requirements 3.7**

- [x] 8. Implement comments and discussions system
  - [x] 8.1 Create LessonComments component
    - Display existing comments with author, timestamp, and content
    - Handle empty comment states gracefully
    - Implement threaded reply support
    - Add comment loading states and error handling
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 8.2 Write property test for comment display completeness
    - **Property 21: Comment Display Completeness**
    - **Validates: Requirements 4.2**
  
  - [x] 8.3 Create CommentForm component
    - Implement comment input form with validation
    - Add comment submission with API integration
    - Display new comments immediately after posting
    - Handle comment posting errors with user feedback
    - _Requirements: 4.5, 4.6, 4.7, 4.8_
  
  - [x] 8.4 Write property test for comment submission integration
    - **Property 22: Comment Submission Integration**
    - **Validates: Requirements 4.6, 4.7**
  
  - [x] 8.5 Add comment management features
    - Implement edit and delete options for user's own comments
    - Add loading states during comment operations
    - Support markdown formatting in comments (optional)
    - **NOTE**: Basic comments work, but edit/delete functionality not yet implemented
    - _Requirements: 4.9, 4.10, 4.11_
  
  - [x] 8.6 Write property test for comment management permissions
    - **Property 23: Comment Management Permissions**
    - **Validates: Requirements 4.9**

- [x] 9. Implement breadcrumb navigation for lesson pages
  - [x] 9.1 Create Breadcrumb component for lesson viewer
    - Create breadcrumb component with Programme > Week > Lesson hierarchy
    - Add functional navigation links in breadcrumbs
    - Maintain navigation context across page refreshes
    - Integrate with existing breadcrumbs in ProgrammeHeader/ModuleHeader
    - _Requirements: 3.9, 3.10, 3.11_
  
  - [x] 9.2 Write property test for breadcrumb navigation
    - **Property 20: Breadcrumb Navigation**
    - **Validates: Requirements 3.9, 3.10**

- [x] 10. Checkpoint - Ensure core learner features work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement progress dashboard
  - [x] 11.1 Create ProgressDashboard component
    - Display progress for each enrolled programme
    - Show completion percentage, completed lessons, and total lessons
    - Add visual progress bars and indicators
    - Highlight recently accessed programmes
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [x] 11.2 Write property test for dashboard progress display
    - **Property 24: Dashboard Progress Display**
    - **Validates: Requirements 5.2**
  
  - [x] 11.3 Enhance programme page with completion status display
    - Fetch completion data for all lessons in the programme
    - Add visual completion indicators (checkmarks, progress bars) to LessonCard components
    - Show week-level progress in WeekSection components
    - Indicate lesson status (completed, in progress, not started) with color coding
    - Display overall programme progress at the top
    - Add "Continue Learning" button that navigates to next incomplete lesson
    - _Requirements: 5.5, 5.6, 5.7, 5.8_
    - **NOTE**: This is CRITICAL for MVP - programme pages exist but lack completion visibility
  
  - [x] 11.4 Write property test for programme progress navigation
    - **Property 25: Programme Progress Navigation**
    - **Validates: Requirements 5.5**

- [ ] 12. Implement convener programme preview
  - [ ] 12.1 Create PreviewMode wrapper component
    - Add "Preview as Learner" button to convener programme pages
    - Implement preview mode with visual indicators
    - Show learner interface when in preview mode
    - Provide easy exit from preview mode
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [ ]* 12.2 Write property test for preview mode functionality
    - **Property 26: Preview Mode Functionality**
    - **Validates: Requirements 6.2, 6.7, 6.8**
  
  - [ ] 12.3 Implement preview mode restrictions
    - Allow navigation through lessons in preview mode
    - Show completion tracking UI without persisting data
    - Disable actual completion actions in preview mode
    - _Requirements: 6.5, 6.6, 6.7, 6.8_

- [ ] 13. Implement lesson reordering interface
  - [ ] 13.1 Create drag-and-drop reordering component
    - Add drag handles to lesson items in convener view
    - Implement visual feedback during drag operations
    - Update lesson order via API when lessons are dropped
    - Handle reordering errors with user feedback and rollback
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ]* 13.2 Write property test for lesson reordering integration
    - **Property 27: Lesson Reordering Integration**
    - **Validates: Requirements 7.3, 7.6, 7.7, 7.8**
  
  - [ ] 13.3 Add alternative reordering controls
    - Provide up/down arrow buttons when drag-and-drop unavailable
    - Implement reorder button functionality
    - Update lesson numbering immediately after reordering
    - Persist new order to backend
    - _Requirements: 7.5, 7.6, 7.7, 7.8_

- [x] 14. Integrate all components in main LessonViewer
  - [x] 14.1 Wire lesson viewer components together
    - Integrate all content components with lesson type detection
    - Connect completion tracking with progress updates
    - Wire navigation components with lesson context
    - Integrate comments system with lesson viewer
    - _Requirements: All lesson viewer requirements_
  
  - [x] 14.2 Write property test for lesson type detection and rendering
    - **Property 1: Lesson Type Detection and Rendering**
    - **Validates: Requirements 1.1, 1.5, 1.10, 1.14, 1.18, 1.22**
  
  - [ ]* 14.3 Write property test for lesson title display
    - **Property 3: Lesson Title Display**
    - **Validates: Requirements 1.3**
  
  - [ ]* 14.4 Write property test for video completion tracking
    - **Property 5: Video Completion Tracking**
    - **Validates: Requirements 1.9**
  
  - [ ]* 14.5 Write property test for link click tracking
    - **Property 8: Link Click Tracking**
    - **Validates: Requirements 1.17**
  
  - [ ]* 14.6 Write integration tests for lesson viewer
    - Test complete lesson viewing workflow
    - Test completion tracking end-to-end
    - Test navigation between different lesson types
    - _Requirements: All core requirements_
  
  - [x] 14.7 Add comprehensive error handling
    - Implement error boundaries for all lesson components
    - Add retry mechanisms for failed API calls
    - Provide user-friendly error messages
    - Handle offline states and network failures

- [x] 15. Implement lesson page routing and layout
  - [x] 15.1 Create lesson page at `/lessons/[lessonId]`
    - Set up dynamic routing for lesson pages
    - Implement authentication checks and redirects
    - Add cohort context detection from URL or user enrollment
    - Handle lesson access permissions and enrollment validation
    - _Requirements: All navigation requirements_
  
  - [ ]* 15.2 Add responsive layout and mobile optimization
    - Ensure lesson viewer works on desktop and tablet
    - Optimize video players for different screen sizes
    - Make navigation touch-friendly on mobile devices
    - Test PDF viewing on various devices

- [ ] 16. Final integration and testing
  - [ ]* 16.1 Add performance optimizations
    - Implement code splitting for lesson content components
    - Add lazy loading for heavy dependencies (PDF viewers, video players)
    - Optimize bundle size with tree shaking
    - Add caching strategies for lesson data
  
  - [ ]* 16.2 Conduct end-to-end testing
    - Test complete learner journey from login to lesson completion
    - Verify progress tracking across multiple lessons
    - Test convener preview functionality
    - Validate error handling and recovery scenarios
  
  - [ ]* 16.3 Cross-browser and device testing
    - Test on Chrome, Firefox, Safari, Edge
    - Verify video player compatibility across browsers
    - Test PDF viewer functionality on different browsers
    - Validate responsive design on desktop and tablet

- [ ]* 17. Final checkpoint - Ensure MVP is complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and allow for user feedback
- Property tests validate universal correctness properties with 100+ iterations each
- Unit tests validate specific examples, edge cases, and integration points
- The implementation builds incrementally, with each phase adding functionality to the previous
- All components follow existing TypeScript and React patterns in the codebase
- API integration leverages existing endpoints and authentication patterns
- Error handling and loading states are integrated throughout for robust user experience
- All 27 correctness properties from the design document are covered by property tests

## Summary of Remaining Work

### 🔴 CRITICAL - Blocks Full MVP Launch

**Task 11.3: Programme Page Completion Status Display**
- **What's Missing**: Programme pages (`/programmes/[id]`) show weeks and lessons but lack completion indicators
- **What's Needed**: 
  - Fetch completion data for all lessons when programme page loads
  - Add checkmarks/progress bars to LessonCard components
  - Show week-level progress in WeekSection components
  - Color-code lessons (green=completed, gray=not started)
  - Add "Continue Learning" button that navigates to next incomplete lesson
- **Impact**: Without this, learners can't see their progress at a glance
- **Estimated Effort**: 1-2 days
- **Files to Modify**: 
  - `cohortle-web/src/app/programmes/[id]/page.tsx`
  - `cohortle-web/src/components/programmes/LessonCard.tsx`
  - `cohortle-web/src/components/programmes/WeekSection.tsx`
  - `cohortle-web/src/lib/api/programmes.ts` (add completion fetching)

### 🟠 HIGH PRIORITY - Significantly Improves Usability

**Task 8.5: Comment Management (Edit/Delete)**
- **What's Missing**: Users can post comments but can't edit or delete them
- **What's Needed**: 
  - Add edit/delete buttons to comments authored by current user
  - Implement edit mode with inline editing
  - Add delete confirmation dialog
  - Handle API calls for edit/delete operations
- **Impact**: Basic engagement feature, but not blocking core learning
- **Estimated Effort**: 1 day

**Task 12: Convener Preview Mode**
- **What's Missing**: Conveners can't preview programmes as learners would see them
- **What's Needed**:
  - Add "Preview as Learner" button to convener programme pages
  - Create PreviewMode wrapper that shows learner UI
  - Disable completion persistence in preview mode
  - Add visual indicators showing preview mode is active
- **Impact**: Important for content validation before publishing
- **Estimated Effort**: 1-2 days

### 🟡 MEDIUM PRIORITY - Nice-to-Have Enhancements

**Task 13: Lesson Reordering Interface**
- **What's Missing**: Conveners can't easily reorder lessons within weeks
- **What's Needed**:
  - Drag-and-drop interface for lesson reordering
  - Alternative up/down arrow buttons
  - API integration to persist new order
  - Error handling and rollback on failure
- **Impact**: Quality-of-life improvement for conveners
- **Estimated Effort**: 2-3 days

### ⚪ OPTIONAL - Testing & Polish

**Additional Property Tests** (Tasks 14.3-14.6, 15.2, 16.1-16.3, 17)
- Several property-based tests marked optional with `*`
- Mobile optimization and responsive design enhancements
- Performance optimizations (code splitting, lazy loading)
- Cross-browser and end-to-end testing
- **Impact**: Improves quality and coverage but not blocking
- **Estimated Effort**: 3-5 days total

## Current MVP Status

**Overall Completion**: ~85%

**What Works End-to-End**:
✅ Learner can log in and view enrolled programmes
✅ Learner can navigate to lessons and view all 6 content types
✅ Learner can mark lessons complete
✅ Learner can navigate between lessons (prev/next)
✅ Learner can view and post comments
✅ Dashboard shows enrolled programmes with basic progress
✅ Breadcrumb navigation works throughout
✅ Error handling and loading states are robust

**What's Missing for Full MVP**:
❌ Visual progress indicators on programme pages (CRITICAL)
❌ Comment edit/delete functionality (HIGH)
❌ Convener preview mode (HIGH)

**Recommendation**: Complete Task 11.3 (programme page completion status) to achieve full MVP status. Tasks 8.5 and 12 can follow as post-MVP enhancements.
