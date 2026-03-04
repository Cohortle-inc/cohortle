# Requirements Document: Assignment Submission System

## Introduction

The Assignment Submission System enables conveners to create assignments for lessons and students to submit their work through file uploads and text responses. The system supports pass/fail grading with optional feedback, submission tracking, and bulk operations for conveners. This feature is critical for the WeCare Leadership programme and must prioritize reliability, clear error handling, and mobile-first design.

## Glossary

- **Assignment**: A task attached to a lesson that requires student submission
- **Submission**: A student's response to an assignment, containing files and/or text
- **Convener**: An educator who creates assignments and grades submissions
- **Student**: A learner who submits assignments and receives grades
- **Grading_Status**: The evaluation state of a submission (pending, passed, failed)
- **Submission_Status**: The lifecycle state of a submission (draft, submitted, graded)
- **Assignment_System**: The complete feature for managing assignments and submissions
- **File_Handler**: Component responsible for file upload and validation
- **Grading_Interface**: UI component for conveners to evaluate submissions
- **Submission_Tracker**: Component that monitors submission states and statistics

## Requirements

### Requirement 1: Assignment Creation

**User Story:** As a convener, I want to create an assignment for a lesson with instructions and a due date, so that students know what work to submit and when.

#### Acceptance Criteria

1. WHEN a convener creates an assignment for a lesson, THE Assignment_System SHALL store the assignment with title, instructions, and due date
2. WHEN a convener sets a due date, THE Assignment_System SHALL validate that the due date is in the future
3. WHEN an assignment is created, THE Assignment_System SHALL associate it with exactly one lesson
4. WHEN a lesson already has an assignment, THE Assignment_System SHALL allow the convener to edit the existing assignment
5. THE Assignment_System SHALL persist assignment data to the backend API immediately upon creation

### Requirement 2: Assignment Visibility

**User Story:** As a student, I want to see if a lesson has an assignment and view its details, so that I know what work is required.

#### Acceptance Criteria

1. WHEN a student views a lesson with an assignment, THE Assignment_System SHALL display an assignment indicator
2. WHEN a student opens an assignment, THE Assignment_System SHALL display the title, instructions, due date, and submission status
3. WHEN the current date is past the due date, THE Assignment_System SHALL display a visual indicator that the assignment is overdue
4. WHEN a student has already submitted, THE Assignment_System SHALL display their submission status and grade if available

### Requirement 3: File Submission

**User Story:** As a student, I want to upload multiple files as part of my assignment submission, so that I can provide comprehensive work.

#### Acceptance Criteria

1. WHEN a student selects files for upload, THE File_Handler SHALL validate that each file type is supported (PDF, PNG, JPG, JPEG, DOC, DOCX)
2. WHEN a student selects files for upload, THE File_Handler SHALL validate that each file size does not exceed 10MB
3. IF a file fails validation, THEN THE File_Handler SHALL display a specific error message and prevent upload
4. WHEN files are uploading, THE File_Handler SHALL display upload progress for each file
5. WHEN a file upload fails, THE File_Handler SHALL allow the student to retry that specific file
6. THE Assignment_System SHALL support uploading multiple files in a single submission

### Requirement 4: Text Submission

**User Story:** As a student, I want to provide text answers along with file uploads, so that I can explain my work or answer written questions.

#### Acceptance Criteria

1. WHEN a student enters text in the submission field, THE Assignment_System SHALL validate that the text is not empty or only whitespace
2. WHEN a student submits with only text and no files, THE Assignment_System SHALL accept the submission
3. WHEN a student submits with only files and no text, THE Assignment_System SHALL accept the submission
4. IF a student attempts to submit with neither text nor files, THEN THE Assignment_System SHALL prevent submission and display an error message

### Requirement 5: Submission Management

**User Story:** As a student, I want to save my work as a draft and edit it before final submission, so that I can work on assignments over time.

#### Acceptance Criteria

1. WHEN a student saves a draft submission, THE Assignment_System SHALL store the draft locally using AsyncStorage
2. WHEN a student returns to an assignment with a draft, THE Assignment_System SHALL restore the draft content
3. WHEN a student submits an assignment, THE Assignment_System SHALL change the submission status from draft to submitted
4. WHEN a submission is in submitted status, THE Assignment_System SHALL prevent further edits unless the submission is before the due date
5. WHEN the current date is past the due date, THE Assignment_System SHALL prevent new submissions and edits

### Requirement 6: Submission Tracking

**User Story:** As a convener, I want to see which students have submitted and which haven't, so that I can follow up with students who need reminders.

#### Acceptance Criteria

1. WHEN a convener views an assignment, THE Submission_Tracker SHALL display a list of all enrolled students
2. FOR each student, THE Submission_Tracker SHALL display their submission status (not submitted, submitted, graded)
3. WHEN displaying the student list, THE Submission_Tracker SHALL show submission timestamps for submitted work
4. THE Submission_Tracker SHALL display summary statistics showing total students, submitted count, and pending count
5. WHEN a convener filters by submission status, THE Submission_Tracker SHALL display only students matching that status

### Requirement 7: Submission Download

**User Story:** As a convener, I want to download all student submissions, so that I can review work offline.

#### Acceptance Criteria

1. WHEN a convener requests to download submissions, THE Assignment_System SHALL package all submitted files into a downloadable format
2. WHEN packaging submissions, THE Assignment_System SHALL organize files by student name or ID
3. WHEN a submission contains text answers, THE Assignment_System SHALL include the text in the download package
4. IF no submissions exist, THEN THE Assignment_System SHALL display a message indicating there are no submissions to download
5. WHEN the download is in progress, THE Assignment_System SHALL display a progress indicator

### Requirement 8: Grading System

**User Story:** As a convener, I want to grade submissions as pass or fail with optional comments, so that students receive feedback on their work.

#### Acceptance Criteria

1. WHEN a convener grades a submission, THE Grading_Interface SHALL accept only "passed" or "failed" as valid grading values
2. WHEN a convener provides feedback, THE Grading_Interface SHALL allow text comments of any length
3. WHEN a grade is submitted, THE Assignment_System SHALL update the submission's grading status immediately
4. WHEN a grade is submitted, THE Assignment_System SHALL persist the grade and feedback to the backend API
5. WHEN a submission is graded, THE Assignment_System SHALL make the grade and feedback visible to the student

### Requirement 9: Student Assignment Overview

**User Story:** As a student, I want to see all my assignments across all cohorts in one place, so that I can manage my workload.

#### Acceptance Criteria

1. WHEN a student views their assignment overview, THE Assignment_System SHALL display all assignments from all enrolled cohorts
2. FOR each assignment, THE Assignment_System SHALL display the lesson name, cohort name, due date, and submission status
3. WHEN displaying assignments, THE Assignment_System SHALL sort them by due date with nearest deadlines first
4. WHEN an assignment is overdue and not submitted, THE Assignment_System SHALL display it with a visual warning indicator
5. WHEN a student filters by grading status, THE Assignment_System SHALL display only assignments matching that status

### Requirement 10: Error Handling and Offline Support

**User Story:** As a user, I want clear error messages and the ability to work offline, so that I can use the system reliably in various network conditions.

#### Acceptance Criteria

1. WHEN a network request fails, THE Assignment_System SHALL display a user-friendly error message explaining the issue
2. WHEN a user is offline, THE Assignment_System SHALL allow viewing previously loaded assignments and submissions
3. WHEN a user is offline, THE Assignment_System SHALL save draft submissions locally and sync when connection is restored
4. WHEN the app regains connectivity, THE Assignment_System SHALL automatically retry failed operations
5. IF a file upload fails due to network issues, THEN THE Assignment_System SHALL allow the user to retry without re-selecting the file

### Requirement 11: Data Validation and Security

**User Story:** As a system administrator, I want all data properly validated and secured, so that the system maintains data integrity and user privacy.

#### Acceptance Criteria

1. WHEN any API request is made, THE Assignment_System SHALL include the authentication token from AsyncStorage
2. WHEN authentication fails, THE Assignment_System SHALL redirect the user to the login screen
3. WHEN a student attempts to access another student's submission, THE Assignment_System SHALL deny access and return an error
4. WHEN a convener attempts to grade submissions for a cohort they don't manage, THE Assignment_System SHALL deny access and return an error
5. THE Assignment_System SHALL validate all user inputs on both client and server side before processing

### Requirement 12: Performance and Loading States

**User Story:** As a user, I want the system to respond quickly and show clear loading indicators, so that I understand what's happening.

#### Acceptance Criteria

1. WHEN any data is loading, THE Assignment_System SHALL display a loading indicator within 100ms
2. WHEN file uploads are in progress, THE Assignment_System SHALL display individual progress bars for each file
3. WHEN large lists are displayed, THE Assignment_System SHALL implement pagination or virtual scrolling to maintain performance
4. WHEN images are displayed, THE Assignment_System SHALL show thumbnails with lazy loading for full-size images
5. THE Assignment_System SHALL cache frequently accessed data using TanStack Query to minimize API calls
