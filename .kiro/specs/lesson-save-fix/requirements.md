# Requirements Document: Lesson Save Failure Fix

## Introduction

This specification addresses a critical bug where lesson save operations fail when lessonId is missing or not properly handled. The issue affects all lesson types (Video, Assignment, Live Session, Form, PDF, Text, Link, Quiz, Reflection, Practical Task) and prevents lessons from being created or updated correctly. This fix ensures proper lessonId generation, validation, and propagation throughout the lesson lifecycle.

## Glossary

- **Lesson**: A learning unit within a module that can be of various types (video, text, assignment, etc.)
- **LessonId**: A unique identifier assigned to each lesson upon creation by the backend
- **Module**: A collection of lessons organized within a programme
- **Backend**: The Node.js/Express API server (cohortle-api) that handles lesson persistence
- **Frontend**: The React Native mobile application (cohortz) that provides the lesson editing interface
- **Editor_Screen**: A specialized UI component for creating/editing a specific lesson type
- **Save_Operation**: The process of persisting lesson data to the database via API calls
- **Update_Operation**: The process of modifying existing lesson data via API calls

## Requirements

### Requirement 1: Backend Lesson Creation

**User Story:** As a backend system, I want to generate a valid lessonId when creating a lesson, so that all lessons have a unique identifier for future operations.

#### Acceptance Criteria

1. WHEN a lesson creation request is received, THE Backend SHALL generate a unique lessonId
2. WHEN a lesson is created successfully, THE Backend SHALL return the generated lessonId in the response
3. WHEN a lesson creation fails, THE Backend SHALL return a descriptive error message
4. THE Backend SHALL validate that all required fields (name, module_id, order_number) are present before creating a lesson
5. WHEN a lesson is created, THE Backend SHALL set the status to 'draft' by default

### Requirement 2: Backend Lesson Update Validation

**User Story:** As a backend system, I want to validate that lessonId exists before updating a lesson, so that update operations only succeed for valid lessons.

#### Acceptance Criteria

1. WHEN an update request is received, THE Backend SHALL validate that lessonId is provided
2. WHEN lessonId is missing, THE Backend SHALL return a 400 error with message "Lesson ID is required"
3. WHEN lessonId does not exist in the database, THE Backend SHALL return a 404 error with message "Lesson not found"
4. WHEN lessonId is valid, THE Backend SHALL proceed with the update operation
5. WHEN an update succeeds, THE Backend SHALL return the updated lesson data including lessonId

### Requirement 3: Frontend Lesson Creation Flow

**User Story:** As a convener, I want to create a new lesson and have it properly saved with a lessonId, so that I can edit it later.

#### Acceptance Criteria

1. WHEN a convener selects a lesson type, THE Frontend SHALL call the lesson creation API
2. WHEN the creation API returns successfully, THE Frontend SHALL extract and store the lessonId
3. WHEN lessonId is received, THE Frontend SHALL navigate to the appropriate editor with lessonId as a parameter
4. WHEN the creation API fails, THE Frontend SHALL display an error message to the user
5. THE Frontend SHALL not allow editing operations until a valid lessonId is obtained

### Requirement 4: Frontend Lesson Update Flow

**User Story:** As a convener, I want to update an existing lesson, so that I can modify its content and settings.

#### Acceptance Criteria

1. WHEN an editor screen loads, THE Frontend SHALL verify that lessonId is present in the route parameters
2. WHEN lessonId is missing, THE Frontend SHALL display an error message and prevent save operations
3. WHEN saving lesson changes, THE Frontend SHALL include lessonId in the API request
4. WHEN the update API returns successfully, THE Frontend SHALL display a success message
5. WHEN the update API fails, THE Frontend SHALL display the error message returned by the backend

### Requirement 5: Editor Screen LessonId Handling

**User Story:** As a lesson editor component, I want to properly receive and use lessonId, so that save operations succeed.

#### Acceptance Criteria

1. WHEN an editor screen is opened, THE Editor_Screen SHALL extract lessonId from route parameters
2. WHEN lessonId is present, THE Editor_Screen SHALL use it for all save and update operations
3. WHEN lessonId is missing, THE Editor_Screen SHALL display a warning and disable save functionality
4. THE Editor_Screen SHALL pass lessonId to all API calls that modify lesson data
5. WHEN navigating between editor screens, THE Editor_Screen SHALL preserve lessonId in the route

### Requirement 6: Error Handling and User Feedback

**User Story:** As a convener, I want clear error messages when lesson save fails, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN a save operation fails due to missing lessonId, THE Frontend SHALL display "Cannot save: Lesson ID is missing"
2. WHEN a save operation fails due to network error, THE Frontend SHALL display "Save failed: Please check your connection"
3. WHEN a save operation fails due to server error, THE Frontend SHALL display the server's error message
4. WHEN a save operation succeeds, THE Frontend SHALL display "Lesson saved successfully"
5. THE Frontend SHALL log detailed error information to the console for debugging

### Requirement 7: All Lesson Types Support

**User Story:** As a system, I want all lesson types to properly handle lessonId, so that the fix applies universally.

#### Acceptance Criteria

1. THE Video_Lesson_Editor SHALL properly handle lessonId for save operations
2. THE Assignment_Editor SHALL properly handle lessonId for save operations
3. THE Live_Session_Editor SHALL properly handle lessonId for save operations
4. THE Form_Editor SHALL properly handle lessonId for save operations
5. THE PDF_Lesson_Editor SHALL properly handle lessonId for save operations
6. THE Text_Lesson_Editor SHALL properly handle lessonId for save operations
7. THE Link_Lesson_Editor SHALL properly handle lessonId for save operations
8. THE Quiz_Editor SHALL properly handle lessonId for save operations
9. THE Reflection_Editor SHALL properly handle lessonId for save operations
10. THE Practical_Task_Editor SHALL properly handle lessonId for save operations

### Requirement 8: Lesson Creation API Response

**User Story:** As a frontend developer, I want the lesson creation API to return complete lesson data, so that I can properly initialize the editor.

#### Acceptance Criteria

1. WHEN a lesson is created, THE Backend SHALL return a response containing the lesson_id field
2. THE Backend SHALL return the response in JSON format with error: false
3. THE Backend SHALL include a success message in the response
4. WHEN the frontend receives the response, THE Frontend SHALL parse the lesson_id from the response
5. THE Frontend SHALL handle both lesson_id and id field names for backward compatibility

### Requirement 9: Lesson Update API Request

**User Story:** As a frontend developer, I want to send proper update requests with lessonId, so that lessons are updated correctly.

#### Acceptance Criteria

1. WHEN updating a lesson, THE Frontend SHALL send a PUT request to /v1/api/lessons/{lessonId}
2. THE Frontend SHALL include lessonId in the URL path, not in the request body
3. THE Frontend SHALL include the authentication token in the request headers
4. THE Frontend SHALL handle multipart/form-data for media uploads
5. WHEN the request succeeds, THE Frontend SHALL process the response and update local state

### Requirement 10: Data Validation and Integrity

**User Story:** As a system, I want to validate lesson data before save operations, so that only valid data is persisted.

#### Acceptance Criteria

1. WHEN saving a lesson, THE Frontend SHALL validate that required fields are not empty
2. WHEN validation fails, THE Frontend SHALL display field-specific error messages
3. THE Backend SHALL perform server-side validation of all lesson fields
4. WHEN backend validation fails, THE Backend SHALL return a 400 error with validation details
5. THE Backend SHALL ensure lessonId is an integer and exists in the database before updates
