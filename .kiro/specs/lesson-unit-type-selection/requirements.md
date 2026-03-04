# Requirements Document

## Introduction

This document specifies requirements for a lesson unit type selection feature in Cohortz, a learning management platform. Currently, when conveners (instructors) create lessons, they are immediately created with a default type supporting only video and text content. This feature will introduce a modal-based selection interface that allows conveners to choose from 10 different lesson unit types before creation, enabling diverse learning experiences including quizzes, assignments, live sessions, and more.

## Glossary

- **Convener**: An instructor or course creator who manages courses, modules, and lessons
- **Lesson**: A learning unit within a module that contains educational content
- **Module**: A collection of lessons organized within a course
- **Unit_Type**: The category or format of a lesson (e.g., video, quiz, assignment)
- **Type_Selection_Modal**: The user interface component that displays available unit types for selection
- **Lesson_Editor**: The screen or interface where conveners create and modify lesson content
- **Assignment_System**: The existing functionality for creating and managing student assignments
- **Lesson_API**: The backend service that handles lesson creation and management

## Requirements

### Requirement 1: Unit Type Selection Interface

**User Story:** As a convener, I want to see a modal with different lesson unit types when I click "Add lesson", so that I can choose the appropriate format for my content.

#### Acceptance Criteria

1. WHEN a convener clicks the "Add lesson" button, THE Type_Selection_Modal SHALL display before creating the lesson
2. THE Type_Selection_Modal SHALL display all 10 unit types with clear labels and icons
3. THE Type_Selection_Modal SHALL include the following unit types: Text lesson, Video lesson, Document (PDF), Live session, Link/External resource, Assignment, Quiz, Forms and survey, Reflection prompt, and Practical task
4. WHEN a convener selects a unit type from the modal, THE System SHALL close the modal and proceed with lesson creation
5. WHEN a convener dismisses the modal without selecting, THE System SHALL cancel lesson creation and maintain the current state

### Requirement 2: Lesson Creation with Type

**User Story:** As a convener, I want lessons to be created with the unit type I selected, so that the system knows what kind of content to expect.

#### Acceptance Criteria

1. WHEN a convener selects a unit type, THE Lesson_API SHALL create a lesson with the selected type stored in the lesson record
2. THE Lesson_API SHALL accept a type field in the lesson creation payload
3. WHEN a lesson is created, THE System SHALL assign a default name based on the unit type (e.g., "New Video Lesson", "New Quiz")
4. THE System SHALL maintain backward compatibility with existing lessons that have no type field
5. WHEN creating a lesson with type "Assignment", THE System SHALL integrate with the existing Assignment_System

### Requirement 3: Type-Specific Routing

**User Story:** As a convener, I want to be taken to the appropriate editor for my selected unit type, so that I can immediately start creating content.

#### Acceptance Criteria

1. WHEN a lesson is created with type "Video lesson", THE System SHALL route to the video upload editor
2. WHEN a lesson is created with type "Text lesson", THE System SHALL route to the rich text editor
3. WHEN a lesson is created with type "Document (PDF)", THE System SHALL route to the PDF upload interface
4. WHEN a lesson is created with type "Assignment", THE System SHALL route to the existing assignment creation form
5. WHEN a lesson is created with type "Quiz", THE System SHALL route to the quiz creation interface
6. WHEN a lesson is created with type "Forms and survey", THE System SHALL route to the form builder interface
7. WHEN a lesson is created with type "Live session", THE System SHALL route to the live session scheduling interface
8. WHEN a lesson is created with type "Link/External resource", THE System SHALL route to the link input interface
9. WHEN a lesson is created with type "Reflection prompt", THE System SHALL route to the reflection prompt editor
10. WHEN a lesson is created with type "Practical task", THE System SHALL route to the practical task editor with media submission configuration

### Requirement 4: Visual Type Indicators

**User Story:** As a convener, I want to see what type each lesson is in the module view, so that I can quickly identify different content types.

#### Acceptance Criteria

1. WHEN displaying lessons in the module view, THE System SHALL show a type-specific icon for each lesson
2. THE System SHALL use distinct icons for each of the 10 unit types
3. WHEN a lesson has no type field (legacy lessons), THE System SHALL display a default video icon
4. THE System SHALL maintain visual consistency with the existing lesson list design

### Requirement 5: Assignment Integration

**User Story:** As a convener, I want the assignment unit type to work seamlessly with the existing assignment system, so that I can continue using familiar assignment workflows.

#### Acceptance Criteria

1. WHEN a convener selects "Assignment" as the unit type, THE System SHALL create both a lesson record and an assignment record
2. THE Assignment_System SHALL link the assignment to the created lesson via lessonId
3. WHEN viewing a lesson of type "Assignment", THE System SHALL display the existing AssignmentIndicator component
4. THE System SHALL maintain all existing assignment functionality including submission tracking, grading, and file uploads
5. WHEN deleting a lesson of type "Assignment", THE System SHALL also delete the associated assignment record

### Requirement 6: Modal User Experience

**User Story:** As a convener, I want the type selection modal to be intuitive and easy to use, so that I can quickly create lessons without confusion.

#### Acceptance Criteria

1. THE Type_Selection_Modal SHALL display unit types in a grid or list layout optimized for mobile screens
2. WHEN a convener taps a unit type, THE System SHALL provide visual feedback (e.g., highlight, animation)
3. THE Type_Selection_Modal SHALL include a close/cancel button that dismisses the modal without creating a lesson
4. THE Type_Selection_Modal SHALL use the existing OptionModal or SlideModal component for consistency
5. WHEN the modal is displayed, THE System SHALL prevent interaction with content behind the modal

### Requirement 7: Editor Screen Creation

**User Story:** As a convener, I want appropriate editor screens for new unit types, so that I can create content for quizzes, forms, and other new lesson types.

#### Acceptance Criteria

1. THE System SHALL provide a quiz creation interface that allows adding multiple questions with answer options
2. THE System SHALL provide a forms and survey interface that allows creating custom form fields
3. THE System SHALL provide a live session interface that allows scheduling date, time, and video conferencing details
4. THE System SHALL provide a link input interface that allows entering URLs and descriptions for external resources
5. THE System SHALL provide a reflection prompt interface that allows entering prompts and optional guidance
6. THE System SHALL provide a practical task interface that allows defining tasks and configuring media submission requirements
7. THE System SHALL provide a PDF upload interface that allows uploading and previewing PDF documents
8. THE System SHALL reuse the existing video upload editor for video lessons
9. THE System SHALL provide or reuse a rich text editor for text lessons

### Requirement 8: Data Model Extension

**User Story:** As a system architect, I want the lesson data model to support unit types, so that the system can store and retrieve type information reliably.

#### Acceptance Criteria

1. THE Lesson_API SHALL add a type field to the lesson database schema
2. THE type field SHALL accept values: "text", "video", "pdf", "live_session", "link", "assignment", "quiz", "form", "reflection", "practical_task"
3. THE Lesson_API SHALL validate that the type field contains only allowed values
4. WHEN the type field is not provided, THE Lesson_API SHALL default to "video" for backward compatibility
5. THE Lesson_API SHALL return the type field in all lesson retrieval responses

### Requirement 9: Error Handling

**User Story:** As a convener, I want clear error messages if lesson creation fails, so that I understand what went wrong and can retry.

#### Acceptance Criteria

1. WHEN lesson creation fails due to network errors, THE System SHALL display an error message and allow retry
2. WHEN lesson creation fails due to invalid data, THE System SHALL display a descriptive error message
3. WHEN routing to an editor fails, THE System SHALL display an error and return to the module view
4. THE System SHALL log all lesson creation errors for debugging purposes
5. WHEN an error occurs, THE System SHALL not leave orphaned lesson records in the database

### Requirement 10: Performance and Responsiveness

**User Story:** As a convener, I want the type selection modal to appear instantly, so that my workflow is not interrupted.

#### Acceptance Criteria

1. THE Type_Selection_Modal SHALL appear within 100ms of clicking "Add lesson"
2. THE System SHALL preload modal assets to minimize display latency
3. WHEN a unit type is selected, THE System SHALL provide immediate visual feedback before navigation
4. THE System SHALL complete lesson creation and navigation within 2 seconds under normal network conditions
5. WHEN network is slow, THE System SHALL display a loading indicator during lesson creation
