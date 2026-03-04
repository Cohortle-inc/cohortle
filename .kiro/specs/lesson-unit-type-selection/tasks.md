# Implementation Plan: Lesson Unit Type Selection

## Overview

This implementation plan breaks down the lesson unit type selection feature into incremental coding tasks. Each task builds on previous work, starting with core data structures and the type selection modal, then adding routing and editor screens, and finally integrating with the existing assignment system. The plan includes property-based tests and unit tests as sub-tasks to validate correctness throughout development.

## Tasks

- [x] 1. Create type definitions and configuration
  - Create `cohortz/types/lessonTypes.ts` with LessonUnitType enum and UnitTypeConfig interface
  - Define UNIT_TYPE_CONFIGS array with all 10 unit types (labels, icons, default names, routes)
  - Export helper functions: `getDefaultLessonName(type)`, `getUnitTypeIcon(type)`, `getEditorRoute(type)`
  - _Requirements: 1.3, 2.3, 3.1-3.10, 4.1, 4.2_

- [ ]* 1.1 Write property test for type configuration completeness
  - **Property 2: Default Name Mapping Completeness**
  - **Property 3: Type-to-Route Mapping Completeness**
  - **Property 4: Type-to-Icon Mapping Uniqueness**
  - **Validates: Requirements 2.3, 3.1-3.10, 4.1, 4.2**

- [x] 2. Create UnitTypeCard component
  - [x] 2.1 Create `cohortz/components/lessons/UnitTypeCard.tsx`
    - Implement UnitTypeCard component with icon, label, and touchable wrapper
    - Add press feedback styling (scale animation or background color change)
    - Use Ionicons for icon display
    - Style for mobile-optimized card layout
    - _Requirements: 1.2, 6.2_

  - [ ]* 2.2 Write unit tests for UnitTypeCard
    - Test component renders with correct icon and label
    - Test onPress callback is triggered on tap
    - Test press feedback styling is applied
    - _Requirements: 1.2, 6.2_

- [x] 3. Create UnitTypeSelectionModal component
  - [x] 3.1 Create `cohortz/components/lessons/UnitTypeSelectionModal.tsx`
    - Implement modal using OptionModal component for consistency
    - Use FlatList with numColumns={2} for grid layout
    - Render UnitTypeCard for each unit type from UNIT_TYPE_CONFIGS
    - Add close/cancel button at top or bottom
    - Handle onSelectType and onCancel callbacks
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.3, 6.4, 6.5_

  - [ ]* 3.2 Write unit tests for UnitTypeSelectionModal
    - Test modal renders all 10 unit types
    - Test selecting a type calls onSelectType with correct type
    - Test cancel button calls onCancel
    - Test backdrop press calls onCancel
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 6.3_

- [x] 4. Update Lesson API types and hooks
  - [x] 4.1 Update `cohortz/api/communities/lessons/postLessons.tsx`
    - Add `type?: LessonUnitType` to LessonProp interface
    - Update postLesson function to include type in request payload
    - _Requirements: 2.1, 2.2, 8.2_

  - [x] 4.2 Update `cohortz/api/communities/lessons/getLessons.tsx` (if exists)
    - Add `type: LessonUnitType` to lesson response interface
    - Ensure type field is returned in API responses
    - _Requirements: 8.5_

  - [x]* 4.3 Write property test for lesson type round-trip
    - **Property 1: Lesson Type Round-Trip Consistency**
    - **Validates: Requirements 2.1, 8.5**

  - [x]* 4.4 Write property test for type field validation
    - **Property 7: Type Field Validation**
    - **Validates: Requirements 8.2, 8.3**

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Modify Module component to use type selection modal
  - [x] 6.1 Update `cohortz/app/convener-screens/(cohorts)/community/(course)/[id].tsx`
    - Import UnitTypeSelectionModal and lesson type utilities
    - Add state: `const [showTypeModal, setShowTypeModal] = useState(false)`
    - Modify handleCreateLesson to set showTypeModal to true instead of creating immediately
    - Add handleTypeSelected function that creates lesson with selected type
    - Add UnitTypeSelectionModal to render tree with appropriate props
    - Implement routeToEditor function using getEditorRoute helper
    - _Requirements: 1.1, 1.4, 1.5, 2.1, 2.3, 3.1-3.10_

  - [ ]* 6.2 Write unit tests for modified Module component
    - Test clicking "Add lesson" shows type selection modal
    - Test selecting a type creates lesson with correct type
    - Test canceling modal doesn't create lesson
    - Test successful creation navigates to correct editor
    - _Requirements: 1.1, 1.4, 1.5, 2.1_

- [x] 7. Update lesson list to display type-specific icons
  - [x] 7.1 Modify LessonRow in Module component
    - Import getUnitTypeIcon helper
    - Replace hardcoded play-circle-outline icon with dynamic icon based on lesson.type
    - Add fallback to videocam-outline for lessons without type field (legacy)
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 7.2 Write unit tests for lesson icon display
    - Test each lesson type displays correct icon
    - Test legacy lessons without type display default video icon
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 8. Create Text Lesson Editor
  - [x] 8.1 Create `cohortz/app/convener-screens/(cohorts)/community/textLessonEditor.tsx`
    - Copy structure from uploadLesson.tsx
    - Remove video upload section
    - Keep rich text editor for lesson content
    - Add save button that updates lesson text field
    - Handle loading and error states
    - _Requirements: 3.2, 7.9_

  - [ ]* 8.2 Write unit tests for Text Lesson Editor
    - Test editor loads with existing lesson data
    - Test save updates lesson text field
    - Test error handling for save failures
    - _Requirements: 3.2, 7.9_

- [x] 9. Create PDF Lesson Editor
  - [x] 9.1 Create `cohortz/app/convener-screens/(cohorts)/community/pdfLessonEditor.tsx`
    - Use DocumentPicker for PDF file selection
    - Display PDF file name and size after selection
    - Implement upload to server (similar to video upload)
    - Store PDF URL in lesson.url field
    - Add loading indicator during upload
    - Handle errors with user-friendly messages
    - _Requirements: 3.3, 7.7_

  - [ ]* 9.2 Write unit tests for PDF Lesson Editor
    - Test PDF file selection
    - Test upload progress indication
    - Test successful upload stores URL
    - Test error handling
    - _Requirements: 3.3, 7.7_

- [x] 10. Create Link/External Resource Editor
  - [x] 10.1 Create `cohortz/app/convener-screens/(cohorts)/community/linkLessonEditor.tsx`
    - Add URL input field with validation
    - Add description text area
    - Add optional thumbnail URL input
    - Store link data as JSON in lesson.description field
    - Validate URL format before saving
    - _Requirements: 3.5, 7.8_

  - [ ]* 10.2 Write unit tests for Link Lesson Editor
    - Test URL validation
    - Test link data is stored as JSON
    - Test save with valid URL succeeds
    - Test save with invalid URL shows error
    - _Requirements: 3.5, 7.8_

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Create Live Session Editor
  - [x] 12.1 Create `cohortz/app/convener-screens/(cohorts)/community/liveSessionEditor.tsx`
    - Add date/time picker for session scheduling
    - Add duration selector (dropdown or number input)
    - Add meeting link text input
    - Add notes text area
    - Store session data as JSON in lesson.description field
    - Validate date is in future before saving
    - _Requirements: 3.4, 7.4_

  - [ ]* 12.2 Write unit tests for Live Session Editor
    - Test date/time selection
    - Test session data is stored as JSON
    - Test validation prevents past dates
    - Test save with valid data succeeds
    - _Requirements: 3.4, 7.4_

- [x] 13. Create Quiz Editor
  - [x] 13.1 Create `cohortz/app/convener-screens/(cohorts)/community/quizEditor.tsx`
    - Implement question list with add/remove functionality
    - Add question text input for each question
    - Add multiple choice options (4 options per question)
    - Add correct answer selection (radio buttons)
    - Store quiz data as JSON in lesson.description field
    - Validate at least one question exists before saving
    - _Requirements: 3.6, 7.1_

  - [ ]* 13.2 Write unit tests for Quiz Editor
    - Test adding and removing questions
    - Test quiz data is stored as JSON
    - Test validation requires at least one question
    - Test save with valid quiz succeeds
    - _Requirements: 3.6, 7.1_

- [ ] 14. Create Forms and Survey Editor
  - [ ] 14.1 Create `cohortz/app/convener-screens/(cohorts)/community/formEditor.tsx`
    - Implement form field builder with add/remove
    - Support field types: text, textarea, multiple_choice, checkbox, rating
    - Add field label input
    - Add required toggle for each field
    - Add options input for multiple_choice and checkbox types
    - Store form schema as JSON in lesson.description field
    - Validate at least one field exists before saving
    - _Requirements: 3.7, 7.2_

  - [ ]* 14.2 Write unit tests for Forms Editor
    - Test adding and removing form fields
    - Test different field types
    - Test form schema is stored as JSON
    - Test validation requires at least one field
    - _Requirements: 3.7, 7.2_

- [ ] 15. Create Reflection Prompt Editor
  - [ ] 15.1 Create `cohortz/app/convener-screens/(cohorts)/community/reflectionEditor.tsx`
    - Add prompt text area (main reflection question)
    - Add guidance text area (optional instructions)
    - Add suggested word count number input (optional)
    - Store reflection data as JSON in lesson.description field
    - Validate prompt is not empty before saving
    - _Requirements: 3.9, 7.3_

  - [ ]* 15.2 Write unit tests for Reflection Editor
    - Test reflection data is stored as JSON
    - Test validation requires non-empty prompt
    - Test save with valid data succeeds
    - _Requirements: 3.9, 7.3_

- [ ] 16. Create Practical Task Editor
  - [ ] 16.1 Create `cohortz/app/convener-screens/(cohorts)/community/practicalTaskEditor.tsx`
    - Add task description text area
    - Add media type selector (checkboxes for image, video, document)
    - Add max file size input (in MB)
    - Add optional deadline date picker
    - Store task config as JSON in lesson.description field
    - Validate at least one media type is selected
    - _Requirements: 3.10, 7.10_

  - [ ]* 16.2 Write unit tests for Practical Task Editor
    - Test task config is stored as JSON
    - Test validation requires at least one media type
    - Test save with valid config succeeds
    - _Requirements: 3.10, 7.10_

- [ ] 17. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 18. Implement Assignment integration
  - [ ] 18.1 Update assignment creation flow for lesson type "assignment"
    - Modify handleTypeSelected in Module component
    - When type is "assignment", create lesson first, then create assignment with lessonId
    - Use existing createAssignment API from assignment system
    - Handle errors in either creation step (rollback if needed)
    - _Requirements: 2.5, 5.1, 5.2_

  - [ ] 18.2 Update assignment deletion to cascade from lesson deletion
    - Modify handleDeleteLesson in Module component
    - Check if lesson type is "assignment"
    - If yes, delete associated assignment before deleting lesson
    - Use existing deleteAssignment API
    - _Requirements: 5.5_

  - [ ]* 18.3 Write property test for assignment-lesson linking
    - **Property 5: Assignment-Lesson Linking Integrity**
    - **Validates: Requirements 5.2**

  - [ ]* 18.4 Write property test for assignment cascade deletion
    - **Property 6: Assignment Cascade Deletion**
    - **Validates: Requirements 5.5**

  - [ ]* 18.5 Write unit tests for assignment integration
    - Test creating assignment-type lesson creates both records
    - Test assignment has correct lessonId
    - Test deleting assignment-type lesson deletes both records
    - Test AssignmentIndicator displays for assignment-type lessons
    - _Requirements: 2.5, 5.1, 5.2, 5.3, 5.5_

- [ ] 19. Add error handling and loading states
  - [ ] 19.1 Add error handling to lesson creation flow
    - Wrap lesson creation in try-catch
    - Display Alert with error message on failure
    - Log errors for debugging
    - Maintain modal state to allow retry
    - _Requirements: 9.1, 9.2, 9.4_

  - [ ] 19.2 Add error handling to routing
    - Wrap navigation in try-catch
    - Display error Alert if routing fails
    - Return to module view on routing error
    - Log routing errors with lesson ID and type
    - _Requirements: 9.3, 9.4_

  - [ ] 19.3 Add loading indicator during lesson creation
    - Add loading state to Module component
    - Display ActivityIndicator or loading text during creation
    - Disable "Add lesson" button while loading
    - _Requirements: 10.5_

  - [ ]* 19.4 Write unit tests for error handling
    - Test network error displays error message
    - Test validation error displays descriptive message
    - Test routing error returns to module view
    - Test loading indicator appears during creation
    - _Requirements: 9.1, 9.2, 9.3, 10.5_

- [ ] 20. Add backward compatibility for legacy lessons
  - [ ] 20.1 Update lesson display logic
    - Check if lesson.type exists
    - If not, default to "video" type for icon display
    - Ensure existing lessons without type field display correctly
    - _Requirements: 2.4, 4.3_

  - [ ]* 20.2 Write unit tests for backward compatibility
    - Test lessons without type field default to "video"
    - Test legacy lessons display video icon
    - Test legacy lessons can be edited
    - _Requirements: 2.4, 4.3_

- [ ] 21. Final integration and polish
  - [ ] 21.1 Test end-to-end flow for all unit types
    - Manually test creating each of the 10 unit types
    - Verify correct editor opens for each type
    - Verify lessons display with correct icons
    - Verify assignment integration works
    - _Requirements: All_

  - [ ] 21.2 Optimize modal performance
    - Ensure modal appears quickly (<100ms)
    - Preload modal component if needed
    - Test on slower devices
    - _Requirements: 10.1, 10.2_

  - [ ] 21.3 Add visual feedback for type selection
    - Add press animation or highlight to UnitTypeCard
    - Add haptic feedback on selection (optional)
    - Ensure smooth transition from modal to editor
    - _Requirements: 6.2, 10.3_

- [ ] 22. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows React Native and Expo patterns used in the existing codebase
- All new components should follow the existing styling patterns from the codebase
- Error handling should use Alert for user-facing messages and console.error for debugging
- Loading states should use ActivityIndicator from react-native
