# Implementation Plan: Student Lesson Viewer Web

## Overview

This implementation plan breaks down the student lesson viewer web feature into discrete coding tasks. The approach follows a bottom-up strategy: building core utilities and API functions first, then components, and finally integrating everything into the page. Each task builds on previous work, with property-based tests placed close to implementation to catch errors early.

The implementation uses Next.js 14 with TypeScript, React Query for server state management, and Tailwind CSS for styling. All components integrate with the existing cohortle-api backend without requiring backend modifications.

## Tasks

- [ ] 1. Set up project structure and core types
  - Create directory structure: `src/app/lessons/[lessonId]/`, `src/components/lessons/`, `src/lib/api/`, `src/lib/hooks/`, `src/lib/utils/`, `src/types/`
  - Define TypeScript interfaces in `src/types/lesson.ts` for Lesson, LessonCompletion, LessonComment, ModuleLesson, LessonUnitType
  - Install dependencies: `@tanstack/react-query`, `dompurify`, `@types/dompurify`, `axios`
  - _Requirements: 12.1, 12.2, 12.5_

- [ ] 2. Implement authentication utilities
  - [ ] 2.1 Create auth token management in `src/lib/api/auth.ts`
    - Implement `getAuthToken()` to retrieve token from cookies/localStorage
    - Implement `setAuthToken()` to store token
    - Implement `clearAuthToken()` to remove token
    - _Requirements: 1.2_
  
  - [ ]* 2.2 Write property test for auth token inclusion
    - **Property 1: Authentication token inclusion in API requests**
    - **Validates: Requirements 1.4**

- [ ] 3. Implement API client and lesson API functions
  - [ ] 3.1 Create API client in `src/lib/api/client.ts`
    - Set up axios instance with base URL from environment variable
    - Add request interceptor to include auth token in headers
    - Add response interceptor to handle 401 errors (redirect to /login)
    - _Requirements: 1.1, 1.3, 1.4_
  
  - [ ] 3.2 Implement lesson API functions in `src/lib/api/lessons.ts`
    - Implement `fetchLesson(lessonId)` using GET /api/lessons/:lessonId
    - Implement `fetchLessonCompletion(lessonId, cohortId)` using GET /api/lessons/:lessonId/completion
    - Implement `markLessonComplete(lessonId, cohortId)` using POST /api/lessons/:lessonId/complete
    - Implement `fetchModuleLessons(moduleId, cohortId)` using GET /api/modules/:moduleId/lessons
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.7_
  
  - [ ]* 3.3 Write property tests for API endpoint correctness
    - **Property 23: API endpoint correctness for lesson fetching**
    - **Property 24: API endpoint correctness for completion fetching**
    - **Property 25: API endpoint correctness for marking complete**
    - **Property 26: API endpoint correctness for module lessons**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.7**

- [ ] 4. Implement comments API functions
  - [ ] 4.1 Create comments API in `src/lib/api/comments.ts`
    - Implement `fetchLessonComments(lessonId, cohortId)` using GET /api/lessons/:lessonId/comments
    - Implement `postLessonComment(lessonId, cohortId, content)` using POST /api/lessons/:lessonId/comments
    - _Requirements: 12.5, 12.6, 12.7_
  
  - [ ]* 4.2 Write property test for comments API endpoints
    - **Property 27: API endpoint correctness for comments**
    - **Validates: Requirements 12.5, 12.6, 12.7**

- [ ] 5. Implement lesson type detection utilities
  - [ ] 5.1 Create video URL helpers in `src/lib/utils/videoUrlHelpers.ts`
    - Implement `isYouTubeUrl(url)` to detect YouTube URLs
    - Implement `isBunnyStreamUrl(url)` to detect BunnyStream URLs
    - Implement `getYouTubeEmbedUrl(url)` to convert YouTube URLs to embed format
    - Implement `extractYouTubeVideoId(url)` to extract video ID from various YouTube URL formats
    - _Requirements: 3.1, 3.2, 11.1, 11.2_
  
  - [ ]* 5.2 Write property tests for YouTube URL handling
    - **Property 17: Lesson type detection from YouTube URLs**
    - **Property 28: YouTube embed URL transformation**
    - **Validates: Requirements 3.1, 11.1**
  
  - [ ] 5.3 Create lesson type detection in `src/lib/utils/lessonTypeDetection.ts`
    - Implement `isPdfUrl(url)` to detect PDF URLs
    - Implement `detectLessonType(lesson)` to determine lesson type based on content
    - Handle priority: explicit lesson_type field → media URL analysis → text-only fallback
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [ ]* 5.4 Write property tests for lesson type detection
    - **Property 18: Lesson type detection from BunnyStream URLs**
    - **Property 19: Lesson type detection from PDF URLs**
    - **Property 20: Lesson type detection fallback for links**
    - **Property 21: Lesson type detection for text-only lessons**
    - **Validates: Requirements 11.2, 11.3, 11.4, 11.5**

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement React Query hooks
  - [ ] 7.1 Create lesson data hooks in `src/lib/hooks/useLessonData.ts`
    - Implement `useLessonData(lessonId)` hook using React Query
    - Configure staleTime to 5 minutes
    - Handle loading and error states
    - _Requirements: 2.1, 9.1, 9.2_
  
  - [ ] 7.2 Create completion hooks in `src/lib/hooks/useLessonCompletion.ts`
    - Implement `useLessonCompletion(lessonId, cohortId)` hook
    - Implement `useMarkLessonComplete()` mutation hook
    - Configure cache invalidation on completion success
    - _Requirements: 6.1, 6.3, 6.4_
  
  - [ ] 7.3 Create comments hooks in `src/lib/hooks/useLessonComments.ts`
    - Implement `useLessonComments(lessonId, cohortId)` hook
    - Implement `usePostComment()` mutation hook
    - Configure cache invalidation on comment post success
    - _Requirements: 8.1, 8.3, 8.4_

- [ ] 8. Implement text lesson component
  - [ ] 8.1 Create TextLessonContent component in `src/components/lessons/TextLessonContent.tsx`
    - Accept title and htmlContent props
    - Sanitize HTML using DOMPurify before rendering
    - Render title prominently above content
    - Use dangerouslySetInnerHTML with sanitized content
    - Apply Tailwind typography styles
    - _Requirements: 2.2, 2.3, 2.4_
  
  - [ ]* 8.2 Write property tests for text lesson rendering
    - **Property 2: HTML content rendering preservation**
    - **Property 3: Lesson title placement**
    - **Validates: Requirements 2.2, 2.3, 2.4**
  
  - [ ]* 8.3 Write unit tests for TextLessonContent
    - Test rendering with various HTML formatting (bold, italic, lists, headings)
    - Test XSS prevention with malicious HTML
    - Test empty content handling

- [ ] 9. Implement video lesson component
  - [ ] 9.1 Create VideoLessonContent component in `src/components/lessons/VideoLessonContent.tsx`
    - Accept title, videoUrl, textContent, and onVideoEnd props
    - Detect video platform using utility functions
    - Render YouTube iframe for YouTube URLs
    - Render BunnyStream iframe for BunnyStream URLs
    - Display text content below video player if present
    - Listen for video end events and trigger onVideoEnd callback
    - Handle video load errors gracefully
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 9.3_
  
  - [ ]* 9.2 Write property tests for video lesson rendering
    - **Property 4: YouTube video embedding**
    - **Property 5: BunnyStream video embedding**
    - **Property 6: Text content placement with media**
    - **Validates: Requirements 3.1, 3.2, 3.4**
  
  - [ ]* 9.3 Write unit tests for VideoLessonContent
    - Test YouTube URL detection and iframe creation
    - Test BunnyStream URL detection and iframe creation
    - Test video end event handling
    - Test error state rendering
    - Test text content display below video

- [ ] 10. Implement PDF lesson component
  - [ ] 10.1 Create PdfLessonContent component in `src/components/lessons/PdfLessonContent.tsx`
    - Accept title, pdfUrl, and textContent props
    - Render PDF using iframe with pdfUrl as src
    - Handle PDF load errors with error message and download link
    - Display text content below PDF viewer if present
    - Make PDF viewer responsive
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 9.4_
  
  - [ ]* 10.2 Write property tests for PDF lesson rendering
    - **Property 7: PDF document embedding**
    - **Property 6: Text content placement with media** (verify for PDF)
    - **Validates: Requirements 4.2, 4.5**
  
  - [ ]* 10.3 Write unit tests for PdfLessonContent
    - Test iframe creation with PDF URL
    - Test error handling and download link display
    - Test text content display below PDF

- [ ] 11. Implement link lesson component
  - [ ] 11.1 Create LinkLessonContent component in `src/components/lessons/LinkLessonContent.tsx`
    - Accept title, linkUrl, and textContent props
    - Display external URL prominently
    - Render "Open Link" button with target="_blank" and rel="noopener noreferrer"
    - Display external link indicator icon
    - Display text content with the link
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ]* 11.2 Write property tests for link lesson rendering
    - **Property 8: External link display**
    - **Property 9: External link indicator presence**
    - **Property 10: Link lesson text content display**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
  
  - [ ]* 11.3 Write unit tests for LinkLessonContent
    - Test URL display
    - Test button attributes (target="_blank", rel="noopener noreferrer")
    - Test external indicator icon presence
    - Test text content display

- [ ] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Implement completion button component
  - [ ] 13.1 Create CompletionButton component in `src/components/lessons/CompletionButton.tsx`
    - Accept lessonId, cohortId, isCompleted, and onComplete props
    - Display "Mark as Complete" button when isCompleted is false
    - Display "Completed" indicator when isCompleted is true
    - Handle button click to call useMarkLessonComplete mutation
    - Show loading state during API call
    - Trigger onComplete callback on success
    - _Requirements: 6.2, 6.3, 6.4, 6.5_
  
  - [ ]* 13.2 Write property test for completion button rendering
    - **Property 11: Completion button conditional rendering**
    - **Validates: Requirements 6.2, 6.5**
  
  - [ ]* 13.3 Write unit tests for CompletionButton
    - Test button rendering when not completed
    - Test indicator rendering when completed
    - Test button click triggers API call
    - Test loading state display
    - Test onComplete callback invocation

- [ ] 14. Implement lesson navigation component
  - [ ] 14.1 Create LessonNavigation component in `src/components/lessons/LessonNavigation.tsx`
    - Accept currentLessonId, moduleId, cohortId, and isCompleted props
    - Fetch module lessons using React Query
    - Determine next lesson based on order_number
    - Display "Next Lesson" button when next lesson exists and current is completed
    - Display "Back to Module" button always
    - Handle navigation using Next.js router
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ]* 14.2 Write property tests for lesson navigation
    - **Property 12: Next lesson button conditional rendering**
    - **Property 13: Back button presence**
    - **Property 14: Next lesson determination**
    - **Validates: Requirements 7.1, 7.2, 7.4, 7.5**
  
  - [ ]* 14.3 Write unit tests for LessonNavigation
    - Test next button appears when next lesson exists and completed
    - Test next button hidden when last lesson
    - Test next button hidden when not completed
    - Test back button always present
    - Test navigation on button clicks

- [x] 15. Implement comments component
  - [x] 15.1 Create LessonComments component in `src/components/lessons/LessonComments.tsx`
    - Accept lessonId and cohortId props
    - Fetch comments using useLessonComments hook
    - Display comments in chronological order
    - Show author name and timestamp for each comment
    - Provide comment input form with submit button
    - Handle comment submission using usePostComment mutation
    - Display empty state message when no comments exist
    - Handle loading and error states
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [x]* 15.2 Write property tests for comments display
    - **Property 15: Comment chronological ordering**
    - **Property 16: Comment display format**
    - **Validates: Requirements 8.2, 8.5**
  
  - [x]* 15.3 Write unit tests for LessonComments
    - Test comments display in order
    - Test author and timestamp rendering
    - Test comment form submission
    - Test empty state message
    - Test loading state
    - Test error handling

- [ ] 16. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Set up React Query provider
  - [ ] 17.1 Configure React Query in `src/app/providers.tsx`
    - Create QueryClient with appropriate default options
    - Create QueryClientProvider wrapper component
    - Configure default staleTime and cacheTime
    - Set up devtools for development
    - _Requirements: 2.1, 6.1, 8.1_
  
  - [ ] 17.2 Update root layout to include QueryClientProvider
    - Wrap app children with QueryClientProvider in `src/app/layout.tsx`
    - Ensure provider is at appropriate level in component tree

- [x] 18. Implement main lesson viewer component
  - [x] 18.1 Create LessonViewer component in `src/components/lessons/LessonViewer.tsx`
    - Accept lessonId and cohortId props
    - Fetch lesson data using useLessonData hook
    - Fetch completion status using useLessonCompletion hook
    - Detect lesson type using detectLessonType utility
    - Render appropriate content component based on type (TextLessonContent, VideoLessonContent, PdfLessonContent, LinkLessonContent)
    - Pass onVideoEnd handler to VideoLessonContent for auto-completion
    - Render CompletionButton component
    - Render LessonNavigation component
    - Render LessonComments component
    - Handle loading states with loading indicator
    - Handle error states with error messages and retry option
    - _Requirements: 2.1, 3.6, 6.1, 9.1, 9.2, 11.6_
  
  - [x]* 18.2 Write property test for component selection
    - **Property 22: Component selection based on lesson type**
    - **Validates: Requirements 11.6**
  
  - [x]* 18.3 Write unit tests for LessonViewer
    - Test loading state display
    - Test error state display
    - Test correct component rendering for each lesson type
    - Test auto-completion on video end
    - Test all child components are rendered

- [ ] 19. Implement error boundaries
  - [ ] 19.1 Create error boundary components in `src/components/errors/`
    - Create generic ErrorBoundary component for catching React errors
    - Create ErrorFallback component for displaying error UI
    - Add retry functionality to error fallback
    - _Requirements: 9.2_

- [x] 20. Implement lesson page
  - [x] 20.1 Create lesson page in `src/app/lessons/[lessonId]/page.tsx`
    - Extract lessonId from route params
    - Extract cohortId from query params (searchParams)
    - Validate required parameters (lessonId and cohortId)
    - Display validation error if parameters missing or invalid
    - Render LessonViewer component with validated params
    - Mark as Client Component with 'use client' directive
    - Wrap with ErrorBoundary for error handling
    - _Requirements: 9.6_
  
  - [x]* 20.2 Write unit tests for lesson page
    - Test parameter extraction
    - Test validation error display
    - Test LessonViewer rendering with valid params
    - Test error boundary catches rendering errors

- [x] 21. Implement authentication middleware
  - [x] 21.1 Create or update auth middleware in `src/middleware.ts`
    - Check for auth token on lesson page requests (match /lessons/*)
    - Redirect to /login if token missing
    - Preserve return URL for post-login redirect
    - _Requirements: 1.1_
  
  - [x]* 21.2 Write unit tests for auth middleware
    - Test redirect on missing token
    - Test return URL preservation
    - Test allows access with valid token

- [ ] 22. Add environment configuration
  - [ ] 22.1 Update `.env.local` with required variables
    - Add NEXT_PUBLIC_API_URL for backend API base URL
    - Document required environment variables in README
    - _Requirements: 12.1_

- [ ] 23. Implement responsive styles and accessibility
  - [ ] 23.1 Add responsive Tailwind classes to all components
    - Ensure single-column layout on all screen sizes
    - Add appropriate spacing for desktop (≥1024px) and tablet (768px-1023px)
    - Set max-width for content readability
    - Ensure touch targets are appropriately sized
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ] 23.2 Implement accessibility improvements
    - Add ARIA labels to buttons and interactive elements
    - Ensure keyboard navigation works for all controls
    - Add focus indicators for keyboard users
    - Use semantic HTML elements throughout
    - _Requirements: 10.5_

- [x] 24. Final integration and testing
  - [x]* 24.1 Integration testing
    - Test complete lesson viewing flow (load → view → complete → next)
    - Test comment posting flow
    - Test error recovery flows
    - Test authentication flow
    - _Requirements: All_
    - _Note: See INTEGRATION_TESTING_GUIDE.md for comprehensive testing instructions_
  
  - [ ]* 24.2 Run all property-based tests
    - Execute all property tests with 100+ iterations
    - Verify all properties pass
    - Fix any failures discovered
  
  - [ ]* 24.3 Run all unit tests
    - Execute full unit test suite
    - Verify code coverage meets 80%+ goal
    - Fix any failures

- [ ] 25. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows a bottom-up approach: utilities → API → hooks → components → pages
- All components use TypeScript for type safety
- Tailwind CSS is used for all styling
- React Query handles all server state management
- The lesson viewer integrates with existing cohortle-api backend without requiring backend changes
