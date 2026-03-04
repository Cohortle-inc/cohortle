# Design Document: Assignment Submission Backend

## Overview

The Assignment Submission Backend provides the complete API infrastructure required by the production-ready frontend Assignment Submission System. This backend implementation follows established Cohortle API patterns, using Express.js for routing, BackendSDK for database operations, and TokenMiddleware for authentication.

The design prioritizes consistency with existing backend patterns (as seen in `cohortle-api/routes/lesson.js`), comprehensive error handling, proper authorization checks, and efficient database queries. The backend supports multipart/form-data file uploads, implements cascade deletion for data consistency, and provides detailed submission statistics for conveners.

### Key Design Principles

1. **Pattern Consistency**: Follow existing route patterns from `lesson.js` and other Cohortle API routes
2. **Security First**: Implement authentication and authorization at every endpoint
3. **Data Integrity**: Use foreign key constraints and cascade deletes
4. **Error Clarity**: Provide specific, actionable error messages
5. **Performance**: Use efficient queries with proper indexing
6. **Testability**: Design for easy unit and integration testing

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                   Frontend Application                       │
│              (React Native - Production Ready)               │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS/REST
                         │ Authorization: Bearer <token>
┌────────────────────────▼────────────────────────────────────┐
│                   Express.js API Server                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Middleware Layer                         │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ - UrlMiddleware (URL parsing)                        │   │
│  │ - TokenMiddleware (JWT validation)                   │   │
│  │ - Multer (File upload parsing)                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Route Handlers                           │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ /v1/api/lessons/:lessonId/assignments                │   │
│  │ /v1/api/assignments/:assignmentId                    │   │
│  │ /v1/api/assignments/:id/submissions                  │   │
│  │ /v1/api/submissions/:submissionId                    │   │
│  │ /v1/api/submissions/:submissionId/grade              │   │
│  │ /v1/api/students/assignments                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Services                                 │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ - ValidationService (Input validation)               │   │
│  │ - BackendSDK (Database operations)                   │   │
│  │ - FileUploadService (File handling)                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                   MySQL Database                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ assignments                                           │   │
│  │ - id (PK)                                             │   │
│  │ - lesson_id (FK → module_lessons)                    │   │
│  │ - title, instructions, due_date                      │   │
│  │ - created_at, updated_at                             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ submissions                                           │   │
│  │ - id (PK)                                             │   │
│  │ - assignment_id (FK → assignments)                   │   │
│  │ - student_id (FK → users)                            │   │
│  │ - text_answer, status, grading_status                │   │
│  │ - feedback, submitted_at, graded_at                  │   │
│  │ - created_at, updated_at                             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ submission_files                                      │   │
│  │ - id (PK)                                             │   │
│  │ - submission_id (FK → submissions)                   │   │
│  │ - file_name, file_url, file_type                     │   │
│  │ - file_size, uploaded_at                             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Examples

#### Assignment Creation Flow
```
1. Convener → POST /v1/api/lessons/:lessonId/assignments
2. UrlMiddleware → Parse URL parameters
3. TokenMiddleware → Validate JWT, extract user_id, verify role='convener'
4. ValidationService → Validate { title, instructions, dueDate }
5. BackendSDK → Check lesson exists
6. BackendSDK → INSERT into assignments table
7. Response → { error: false, message: "Assignment created", assignment: {...} }
```

#### Submission with Files Flow
```
1. Learner → POST /v1/api/assignments/:id/submissions (multipart/form-data)
2. UrlMiddleware → Parse URL parameters
3. TokenMiddleware → Validate JWT, extract user_id, verify role='learner'
4. Multer → Parse multipart data, save files to temp directory
5. ValidationService → Validate file types and sizes
6. FileUploadService → Upload files to storage, get URLs
7. BackendSDK → INSERT into submissions table
8. BackendSDK → INSERT into submission_files table (for each file)
9. Response → { error: false, message: "Submission created", submission: {...} }
```

#### Grading Flow
```
1. Convener → POST /v1/api/submissions/:submissionId/grade
2. UrlMiddleware → Parse URL parameters
3. TokenMiddleware → Validate JWT, extract user_id, verify role='convener'
4. ValidationService → Validate { status: 'passed'|'failed', feedback }
5. BackendSDK → Fetch submission, verify exists
6. BackendSDK → UPDATE submissions SET grading_status, feedback, graded_at, status='graded'
7. Response → { error: false, message: "Submission graded", submission: {...} }
```

## Components and Interfaces

### Route Handlers

#### Assignment Routes (`routes/assignment.js`)

```javascript
// POST /v1/api/lessons/:lessonId/assignments
// Create a new assignment for a lesson
app.post(
  "/v1/api/lessons/:lessonId/assignments",
  [UrlMiddleware, TokenMiddleware({ role: "convener" })],
  async function (req, res) {
    // 1. Validate request body
    // 2. Check lesson exists
    // 3. Create assignment record
    // 4. Return created assignment
  }
);

// GET /v1/api/lessons/:lessonId/assignments
// Get assignment for a lesson
app.get(
  "/v1/api/lessons/:lessonId/assignments",
  [UrlMiddleware, TokenMiddleware({ role: "convener|learner" })],
  async function (req, res) {
    // 1. Fetch assignment by lesson_id
    // 2. If learner, include their submission
    // 3. Return assignment or null
  }
);

// PUT /v1/api/assignments/:assignmentId
// Update an existing assignment
app.put(
  "/v1/api/assignments/:assignmentId",
  [UrlMiddleware, TokenMiddleware({ role: "convener" })],
  async function (req, res) {
    // 1. Validate request body
    // 2. Check assignment exists
    // 3. Update assignment record
    // 4. Return updated assignment
  }
);

// DELETE /v1/api/assignments/:assignmentId
// Delete an assignment and all submissions
app.delete(
  "/v1/api/assignments/:assignmentId",
  [UrlMiddleware, TokenMiddleware({ role: "convener" })],
  async function (req, res) {
    // 1. Check assignment exists
    // 2. Delete assignment (cascade deletes submissions and files)
    // 3. Return success message
  }
);

// GET /v1/api/students/assignments
// Get all assignments for a student across all cohorts
app.get(
  "/v1/api/students/assignments",
  [UrlMiddleware, TokenMiddleware({ role: "learner" })],
  async function (req, res) {
    // 1. Get all cohorts student is enrolled in
    // 2. Get all lessons from those cohorts
    // 3. Get all assignments for those lessons
    // 4. Include submission status for each
    // 5. Return assignments array
  }
);
```

#### Submission Routes (`routes/submission.js`)

```javascript
// POST /v1/api/assignments/:id/submissions
// Submit an assignment with files and/or text
app.post(
  "/v1/api/assignments/:id/submissions",
  [
    UrlMiddleware,
    TokenMiddleware({ role: "learner" }),
    upload.array("files", 10), // Max 10 files
  ],
  async function (req, res) {
    // 1. Validate assignment exists and not past due
    // 2. Validate files (type, size)
    // 3. Upload files to storage
    // 4. Create submission record
    // 5. Create submission_files records
    // 6. Return created submission
  }
);

// GET /v1/api/assignments/:id/submissions
// Get submissions for an assignment
// Conveners see all, learners see only their own
app.get(
  "/v1/api/assignments/:id/submissions",
  [UrlMiddleware, TokenMiddleware({ role: "convener|learner" })],
  async function (req, res) {
    // 1. Check user role
    // 2. If convener: fetch all submissions with student info
    // 3. If learner: fetch only their submission
    // 4. Include submission_files for each
    // 5. Return submissions array
  }
);

// GET /v1/api/assignments/:id/submissions/:subId
// Get a specific submission
app.get(
  "/v1/api/assignments/:id/submissions/:subId",
  [UrlMiddleware, TokenMiddleware({ role: "convener|learner" })],
  async function (req, res) {
    // 1. Fetch submission
    // 2. Check authorization (convener or owner)
    // 3. Include submission_files
    // 4. Return submission
  }
);

// PUT /v1/api/submissions/:submissionId
// Update a submission (before due date)
app.put(
  "/v1/api/submissions/:submissionId",
  [
    UrlMiddleware,
    TokenMiddleware({ role: "learner" }),
    upload.array("files", 10),
  ],
  async function (req, res) {
    // 1. Fetch submission and assignment
    // 2. Check ownership
    // 3. Check due date not passed
    // 4. Validate and upload new files
    // 5. Update submission record
    // 6. Create new submission_files records
    // 7. Return updated submission
  }
);

// POST /v1/api/submissions/:submissionId/grade
// Grade a submission
app.post(
  "/v1/api/submissions/:submissionId/grade",
  [UrlMiddleware, TokenMiddleware({ role: "convener" })],
  async function (req, res) {
    // 1. Validate grade data
    // 2. Fetch submission
    // 3. Update submission with grade
    // 4. Set graded_at timestamp
    // 5. Change status to 'graded'
    // 6. Return graded submission
  }
);

// GET /v1/api/submissions/:submissionId/download
// Download a single submission's files
app.get(
  "/v1/api/submissions/:submissionId/download",
  [UrlMiddleware, TokenMiddleware({ role: "convener" })],
  async function (req, res) {
    // 1. Fetch submission and files
    // 2. Create ZIP archive
    // 3. Include text answer as .txt file
    // 4. Stream ZIP to response
  }
);

// GET /v1/api/assignments/:id/download-all
// Download all submissions for an assignment
app.get(
  "/v1/api/assignments/:id/download-all",
  [UrlMiddleware, TokenMiddleware({ role: "convener" })],
  async function (req, res) {
    // 1. Fetch all submissions for assignment
    // 2. Create ZIP with folders per student
    // 3. Include all files and text answers
    // 4. Stream ZIP to response
  }
);
```

### Validation Service Integration

```javascript
// Example validation for assignment creation
const validationResult = await ValidationService.validateObject(
  {
    lesson_id: "required|integer",
    title: "required|string|max:200",
    instructions: "required|string|max:5000",
    due_date: "required|string", // ISO 8601 date
  },
  { lesson_id, title, instructions, due_date }
);

if (validationResult.error) {
  return res.status(400).json(validationResult);
}

// Example validation for file uploads
function validateFile(file) {
  const allowedTypes = [".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx"];
  const maxSize = 10 * 1024 * 1024; // 10MB

  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedTypes.includes(ext)) {
    return {
      valid: false,
      error: `File type ${ext} not allowed. Allowed: ${allowedTypes.join(", ")}`,
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds 10MB limit`,
    };
  }

  return { valid: true };
}
```

### File Upload Service

```javascript
// File upload configuration using multer
const multer = require("multer");
const path = require("path");
const os = require("os");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir()); // Use system temp directory
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "submission-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

// File upload to storage (using Bunny CDN pattern or local storage)
async function uploadSubmissionFile(file) {
  // Option 1: Upload to Bunny CDN (if configured)
  if (BUNNY_ENABLED) {
    const result = await uploadToBunny(file.path, {
      title: file.originalname,
    });
    return result.fileUrl;
  }

  // Option 2: Store locally (for development/testing)
  const uploadDir = path.join(__dirname, "../uploads/submissions");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `${Date.now()}-${file.originalname}`;
  const filepath = path.join(uploadDir, filename);
  fs.renameSync(file.path, filepath);

  return `/uploads/submissions/${filename}`;
}
```

### Authorization Helpers

```javascript
// Check if user is convener for the cohort containing this assignment
async function isConvenerForAssignment(userId, assignmentId, sdk) {
  // Get assignment and lesson
  sdk.setTable("assignments");
  const assignment = (await sdk.get({ id: assignmentId }))[0];
  if (!assignment) return false;

  sdk.setTable("module_lessons");
  const lesson = (await sdk.get({ id: assignment.lesson_id }))[0];
  if (!lesson) return false;

  // Get module and programme
  sdk.setTable("programme_modules");
  const module = (await sdk.get({ id: lesson.module_id }))[0];
  if (!module) return false;

  sdk.setTable("programmes");
  const programme = (await sdk.get({ id: module.programme_id }))[0];
  if (!programme) return false;

  // Check if user created the programme
  return programme.created_by === userId;
}

// Check if submission belongs to user
async function isSubmissionOwner(userId, submissionId, sdk) {
  sdk.setTable("submissions");
  const submission = (await sdk.get({ id: submissionId }))[0];
  return submission && submission.student_id === userId;
}
```

## Data Models

### Database Schema

#### assignments Table

```sql
CREATE TABLE assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lesson_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  instructions TEXT NOT NULL,
  due_date DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (lesson_id) REFERENCES module_lessons(id) ON DELETE CASCADE,
  INDEX idx_lesson_id (lesson_id)
);
```

#### submissions Table

```sql
CREATE TABLE submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT NOT NULL,
  student_id INT NOT NULL,
  text_answer TEXT NULL,
  status ENUM('draft', 'submitted', 'graded') DEFAULT 'submitted',
  grading_status ENUM('pending', 'passed', 'failed') DEFAULT 'pending',
  feedback TEXT NULL,
  submitted_at DATETIME NULL,
  graded_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_assignment_id (assignment_id),
  INDEX idx_student_id (student_id),
  UNIQUE KEY unique_student_assignment (assignment_id, student_id)
);
```

#### submission_files Table

```sql
CREATE TABLE submission_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INT NOT NULL,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
  INDEX idx_submission_id (submission_id)
);
```

### API Response Models

#### Assignment Response

```javascript
{
  error: false,
  message: "Assignment fetched successfully",
  assignment: {
    id: 1,
    lessonId: 42,
    title: "Week 1 Reflection",
    instructions: "Write a 500-word reflection...",
    dueDate: "2024-03-15T23:59:59Z",
    createdAt: "2024-03-01T10:00:00Z",
    updatedAt: "2024-03-01T10:00:00Z",
    
    // For learners
    mySubmission: {
      id: 10,
      status: "submitted",
      gradingStatus: "pending",
      submittedAt: "2024-03-10T14:30:00Z"
    },
    
    // For conveners
    submissionStats: {
      totalStudents: 25,
      submittedCount: 20,
      gradedCount: 15,
      pendingCount: 5,
      passedCount: 12,
      failedCount: 3
    }
  }
}
```

#### Submission Response

```javascript
{
  error: false,
  message: "Submission created successfully",
  submission: {
    id: 10,
    assignmentId: 1,
    studentId: 100,
    textAnswer: "My reflection on this week's content...",
    files: [
      {
        id: 1,
        submissionId: 10,
        fileName: "reflection.pdf",
        fileUrl: "/uploads/submissions/1234567890-reflection.pdf",
        fileType: "application/pdf",
        fileSize: 524288,
        uploadedAt: "2024-03-10T14:30:00Z"
      }
    ],
    status: "submitted",
    gradingStatus: "pending",
    feedback: null,
    submittedAt: "2024-03-10T14:30:00Z",
    gradedAt: null,
    createdAt: "2024-03-10T14:30:00Z",
    updatedAt: "2024-03-10T14:30:00Z",
    
    student: {
      id: 100,
      name: "John Doe",
      email: "john@example.com",
      avatar: "/avatars/john.jpg"
    }
  }
}
```

#### Student Assignments Response

```javascript
{
  error: false,
  message: "Assignments fetched successfully",
  assignments: [
    {
      id: 1,
      lessonId: 42,
      title: "Week 1 Reflection",
      dueDate: "2024-03-15T23:59:59Z",
      lesson: {
        id: 42,
        title: "Introduction to Leadership",
        moduleId: 5
      },
      cohort: {
        id: 10,
        name: "Spring 2024 Cohort"
      },
      mySubmission: {
        id: 10,
        status: "submitted",
        gradingStatus: "passed",
        feedback: "Great work!",
        gradedAt: "2024-03-12T09:00:00Z"
      },
      isOverdue: false
    }
  ]
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Assignment Creation Round-Trip

*For any* valid assignment data (title, instructions, due date), creating an assignment for a lesson and then fetching it by lesson ID should return an assignment with all the same field values.

**Validates: Requirements 1.2, 2.1**

### Property 2: Required Field Validation

*For any* assignment creation request, if it is missing title, instructions, or dueDate, the API should reject it with a validation error; if all required fields are present, the API should accept it.

**Validates: Requirements 1.1**

### Property 3: Successful Creation Status Code

*For any* valid assignment creation request, the API should return HTTP status 201 with the created assignment in the response.

**Validates: Requirements 1.3**

### Property 4: Non-Existent Resource Returns 404

*For any* request referencing a non-existent assignment or lesson ID, the API should return HTTP status 404 with a descriptive error message.

**Validates: Requirements 1.4, 3.4, 4.4**

### Property 5: Convener Authorization

*For any* convener-only endpoint (create, update, delete assignment, grade submission, download submissions), if the user does not have the convener role, the API should return HTTP status 403.

**Validates: Requirements 1.5, 3.5, 4.5, 8.5, 9.5, 11.3**

### Property 6: Empty Assignment Query Returns Null

*For any* lesson that has no assignment, querying for the assignment should return null with HTTP status 200.

**Validates: Requirements 2.2**

### Property 7: Student Assignments Include Enrollment

*For any* learner, the assignments returned by GET /v1/api/students/assignments should include only assignments from cohorts the learner is enrolled in.

**Validates: Requirements 2.3**

### Property 8: Learner Assignments Include Submission Status

*For any* assignment returned to a learner, the response should include the learner's submission status (submitted, graded, pending) for that assignment.

**Validates: Requirements 2.4**

### Property 9: Assignment Update Requires Fields

*For any* assignment update request with no fields to update, the API should reject it with a validation error.

**Validates: Requirements 3.1**

### Property 10: Assignment Update Round-Trip

*For any* existing assignment and valid update data, updating the assignment and then fetching it should return the assignment with the updated values.

**Validates: Requirements 3.2**

### Property 11: Successful Update Status Code

*For any* valid assignment update request, the API should return HTTP status 200 with the updated assignment in the response.

**Validates: Requirements 3.3**

### Property 12: Assignment Deletion Removes Record

*For any* existing assignment, after deleting it, fetching the assignment should return null or 404.

**Validates: Requirements 4.1**

### Property 13: Cascade Deletion of Submissions

*For any* assignment with associated submissions and files, deleting the assignment should also delete all submission records and submission file records.

**Validates: Requirements 4.2, 16.1**

### Property 14: Successful Deletion Status Code

*For any* valid assignment deletion request, the API should return HTTP status 200 with a success message.

**Validates: Requirements 4.3**

### Property 15: Submission Accepts Multipart Data

*For any* valid submission request with textAnswer and/or files in multipart/form-data format, the API should accept and process the submission.

**Validates: Requirements 5.1**

### Property 16: File Type Validation

*For any* file upload, if the file extension is not in [.pdf, .png, .jpg, .jpeg, .doc, .docx], the API should reject it with a specific error message; if the extension is in the allowed list, the API should accept it.

**Validates: Requirements 5.2, 12.4**

### Property 17: File Size Validation

*For any* file upload, if the file size exceeds 10MB, the API should reject it with a specific error message indicating the size limit; if the file size is 10MB or less, the API should accept it.

**Validates: Requirements 5.3, 12.5**

### Property 18: Submission Status Set to Submitted

*For any* valid submission creation request, the created submission should have status 'submitted'.

**Validates: Requirements 5.4**

### Property 19: File Records Created for Uploads

*For any* submission with N uploaded files, there should be exactly N submission_file records created, each containing fileName, fileUrl, fileType, and fileSize.

**Validates: Requirements 5.5**

### Property 20: Convener Sees All Submissions

*For any* assignment with N submissions, when a convener requests submissions for that assignment, the API should return all N submissions.

**Validates: Requirements 6.1**

### Property 21: Submissions Include Student Information

*For any* submission returned to a convener, the response should include student information (name, email, avatar).

**Validates: Requirements 6.2**

### Property 22: Learner Sees Only Own Submission

*For any* learner requesting submissions for an assignment, the API should return only that learner's submission, not other students' submissions.

**Validates: Requirements 6.3, 6.5, 11.4**

### Property 23: Authorized Submission Access

*For any* specific submission request, if the user is the submission owner or a convener managing the cohort, the API should return the submission; otherwise, the API should return 403.

**Validates: Requirements 6.4**

### Property 24: Due Date Validation for Updates

*For any* submission update request, if the current date is after the assignment's due date, the API should reject the request with HTTP status 403; if the current date is before the due date, the API should allow the update.

**Validates: Requirements 7.1, 7.2**

### Property 25: Submission Update Round-Trip

*For any* existing submission and valid update data, updating the submission and then fetching it should return the submission with the updated values.

**Validates: Requirements 7.3**

### Property 26: New Files Create Records

*For any* submission update that adds M new files, there should be M new submission_file records created.

**Validates: Requirements 7.4**

### Property 27: Learner Updates Only Own Submission

*For any* learner attempting to update a submission, if the submission does not belong to that learner, the API should return HTTP status 403.

**Validates: Requirements 7.5**

### Property 28: Grade Status Validation

*For any* grading request, if the status is not 'passed' or 'failed', the API should reject it with a validation error; if the status is 'passed' or 'failed', the API should accept it.

**Validates: Requirements 8.1**

### Property 29: Grading Round-Trip

*For any* submission and valid grade data (status and optional feedback), after grading the submission, fetching it should return the submission with the gradingStatus and feedback matching the provided values.

**Validates: Requirements 8.2**

### Property 30: Graded Timestamp Set

*For any* submission that is graded, the gradedAt field should be set to a non-null timestamp.

**Validates: Requirements 8.3**

### Property 31: Graded Status Updated

*For any* submission that is graded, the status field should be changed to 'graded'.

**Validates: Requirements 8.4**

### Property 32: Single Submission Download Includes Files

*For any* submission with N files, downloading the submission should return a package containing all N files.

**Validates: Requirements 9.1**

### Property 33: Bulk Download Includes All Submissions

*For any* assignment with M submissions containing files, downloading all submissions should return a package containing files from all M submissions.

**Validates: Requirements 9.2**

### Property 34: Download Package Organized by Student

*For any* bulk download package, files should be organized into folders or sections by student name or ID.

**Validates: Requirements 9.3**

### Property 35: Text Answers Included in Downloads

*For any* submission with non-empty text_answer, the download package should include the text in a readable format (e.g., .txt file).

**Validates: Requirements 9.4**

### Property 36: Authentication Token Required

*For any* API request without a valid JWT token in the Authorization header, the API should return HTTP status 401 with an authentication error message.

**Validates: Requirements 11.1, 11.2**

### Property 37: Convener Manages Cohort Authorization

*For any* convener accessing submissions for an assignment, if the convener does not manage the cohort containing the assignment, the API should return HTTP status 403.

**Validates: Requirements 11.5**

### Property 38: Title Length Validation

*For any* assignment creation or update, if the title is empty or exceeds 200 characters, the API should reject it with a validation error.

**Validates: Requirements 12.1**

### Property 39: Instructions Length Validation

*For any* assignment creation or update, if the instructions are empty or exceed 5000 characters, the API should reject it with a validation error.

**Validates: Requirements 12.2**

### Property 40: Due Date Format Validation

*For any* assignment creation or update, if the dueDate is not a valid ISO 8601 date string, the API should reject it with a validation error.

**Validates: Requirements 12.3**

### Property 41: Error Response Format

*For any* API request that fails validation, the API should return a response with structure { error: true, message: string }.

**Validates: Requirements 13.1, 18.2**

### Property 42: 404 Error Includes Message

*For any* API request that results in HTTP status 404, the response should include a descriptive error message.

**Validates: Requirements 13.2**

### Property 43: 403 Error Includes Message

*For any* API request that results in HTTP status 403, the response should include a descriptive error message.

**Validates: Requirements 13.3**

### Property 44: 401 Error Includes Message

*For any* API request that results in HTTP status 401, the response should include a descriptive error message.

**Validates: Requirements 13.4**

### Property 45: 500 Error Logged

*For any* unexpected error that results in HTTP status 500, the error details (message and stack trace) should be logged.

**Validates: Requirements 13.5**

### Property 46: File Upload Returns URL

*For any* successful file upload, the API should return a file URL that can be used to access the file.

**Validates: Requirements 14.3, 14.5**

### Property 47: File Upload Error Identifies File

*For any* failed file upload, the error message should identify which file failed (by name).

**Validates: Requirements 14.4**

### Property 48: Total Students Matches Enrollment

*For any* assignment, the totalStudents count in submission statistics should equal the number of students enrolled in cohorts that have access to the lesson.

**Validates: Requirements 15.1**

### Property 49: Submission Status Counts Sum Correctly

*For any* assignment with submission statistics, the sum of submittedCount, gradedCount, and pendingCount should equal the totalStudents.

**Validates: Requirements 15.2**

### Property 50: Grading Status Counts Sum Correctly

*For any* assignment with submission statistics, the sum of passedCount and failedCount should equal the gradedCount.

**Validates: Requirements 15.3**

### Property 51: Statistics Include All Students

*For any* assignment, the submission statistics breakdown should include an entry for every student enrolled in cohorts that have access to the lesson.

**Validates: Requirements 15.4**

### Property 52: Statistics Match Frontend Interface

*For any* submission statistics response, the structure should match the frontend SubmissionStatistics TypeScript interface (with fields: assignmentId, totalStudents, submittedCount, gradedCount, pendingCount, passedCount, failedCount, students array).

**Validates: Requirements 15.5**

### Property 53: Assignment Exists Before Submission

*For any* submission creation request, if the assignment does not exist, the API should reject the request with an error.

**Validates: Requirements 16.2**

### Property 54: Student Enrolled Before Submission

*For any* submission creation request, if the student is not enrolled in a cohort that has access to the lesson, the API should reject the request with an error.

**Validates: Requirements 16.3**

### Property 55: Grading Requires Submitted Status

*For any* grading request, if the submission does not exist or is not in 'submitted' status, the API should reject the request with an error.

**Validates: Requirements 16.5**

### Property 56: Pagination Applied for Large Results

*For any* API endpoint that returns a list, if the result set exceeds 100 records, the API should apply pagination.

**Validates: Requirements 17.2**

### Property 57: Success Response Format

*For any* successful API request, the response should have structure { error: false, message: string, data: object }.

**Validates: Requirements 18.1**

### Property 58: CamelCase Field Names

*For any* API response containing assignment or submission data, field names should be in camelCase format (e.g., lessonId, dueDate, gradingStatus).

**Validates: Requirements 18.3**

### Property 59: ISO 8601 Date Format

*For any* API response containing date fields, the dates should be formatted as ISO 8601 strings.

**Validates: Requirements 18.4**

### Property 60: Null Values Are Null

*For any* API response with null fields, the values should be null (not undefined or empty strings).

**Validates: Requirements 18.5**

## Error Handling


### Error Categories

The backend handles errors in the following categories:

1. **Validation Errors (400)**: Invalid input data, missing required fields, format errors
2. **Authentication Errors (401)**: Missing or invalid JWT tokens
3. **Authorization Errors (403)**: Insufficient permissions, accessing other users' data
4. **Not Found Errors (404)**: Non-existent resources (assignments, submissions, lessons)
5. **Server Errors (500)**: Unexpected errors, database failures, file system errors

### Error Response Format

All error responses follow a consistent structure:

```javascript
{
  error: true,
  message: "Descriptive error message"
}
```

### Error Handling Patterns

#### Validation Errors

```javascript
// Example: Missing required fields
const validationResult = await ValidationService.validateObject(
  {
    title: "required|string|max:200",
    instructions: "required|string|max:5000",
    due_date: "required|string",
  },
  { title, instructions, due_date }
);

if (validationResult.error) {
  return res.status(400).json(validationResult);
}
```

#### Authentication Errors

```javascript
// Handled by TokenMiddleware
// If token is missing or invalid, middleware returns:
return res.status(401).json({
  error: true,
  message: "Authentication required. Please log in.",
});
```

#### Authorization Errors

```javascript
// Example: Checking convener role
if (req.user_role !== "convener") {
  return res.status(403).json({
    error: true,
    message: "Access denied. Convener role required.",
  });
}

// Example: Checking submission ownership
if (submission.student_id !== req.user_id) {
  return res.status(403).json({
    error: true,
    message: "Access denied. You can only access your own submissions.",
  });
}
```

#### Not Found Errors

```javascript
// Example: Assignment not found
const assignment = (await sdk.get({ id: assignmentId }))[0];
if (!assignment) {
  return res.status(404).json({
    error: true,
    message: "Assignment not found",
  });
}
```

#### Server Errors

```javascript
// Example: Unexpected error handling
try {
  // ... operation
} catch (err) {
  console.error("Assignment creation error:", err);
  return res.status(500).json({
    error: true,
    message: "An unexpected error occurred. Please try again later.",
  });
}
```

### File Upload Error Handling

```javascript
// Validate files before processing
for (const file of req.files) {
  const validation = validateFile(file);
  if (!validation.valid) {
    return res.status(400).json({
      error: true,
      message: `File "${file.originalname}": ${validation.error}`,
    });
  }
}

// Handle upload failures
try {
  const fileUrl = await uploadSubmissionFile(file);
} catch (err) {
  console.error(`File upload failed for ${file.originalname}:`, err);
  return res.status(500).json({
    error: true,
    message: `Failed to upload file "${file.originalname}". Please try again.`,
  });
}
```

## Testing Strategy

### Dual Testing Approach

The Assignment Submission Backend requires both unit tests and property-based tests:

- **Unit tests**: Verify specific examples, edge cases, error conditions, and integration points
- **Property tests**: Verify universal properties across all inputs through randomized testing

Both approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing

**Library**: Use `fast-check` for JavaScript/Node.js property-based testing

**Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property
- Tag format: `// Feature: assignment-submission-backend, Property {number}: {property_text}`

**Example Property Test**:

```javascript
const fc = require('fast-check');
const request = require('supertest');
const app = require('../app');

// Feature: assignment-submission-backend, Property 1: Assignment Creation Round-Trip
describe('Property 1: Assignment Creation Round-Trip', () => {
  it('should preserve all fields when creating and fetching', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }),
          instructions: fc.string({ minLength: 1, maxLength: 5000 }),
          due_date: fc.date({ min: new Date() }).map(d => d.toISOString()),
        }),
        async (assignmentData) => {
          const lessonId = 1; // Test lesson
          
          // Create assignment
          const createRes = await request(app)
            .post(`/v1/api/lessons/${lessonId}/assignments`)
            .set('Authorization', `Bearer ${convenerToken}`)
            .send(assignmentData);
          
          expect(createRes.status).toBe(201);
          const assignmentId = createRes.body.assignment.id;
          
          // Fetch assignment
          const fetchRes = await request(app)
            .get(`/v1/api/lessons/${lessonId}/assignments`)
            .set('Authorization', `Bearer ${convenerToken}`);
          
          expect(fetchRes.status).toBe(200);
          expect(fetchRes.body.assignment.title).toBe(assignmentData.title);
          expect(fetchRes.body.assignment.instructions).toBe(assignmentData.instructions);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing

**Framework**: Jest with Supertest for API testing

**Focus Areas**:
- Specific examples demonstrating correct behavior
- Edge cases (empty submissions, boundary conditions)
- Error conditions and error messages
- Authorization checks
- Database constraints

**Example Unit Test**:

```javascript
describe('Assignment API', () => {
  describe('POST /v1/api/lessons/:lessonId/assignments', () => {
    it('should return 403 when non-convener tries to create assignment', async () => {
      const res = await request(app)
        .post('/v1/api/lessons/1/assignments')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({
          title: 'Test Assignment',
          instructions: 'Test instructions',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
      
      expect(res.status).toBe(403);
      expect(res.body.error).toBe(true);
      expect(res.body.message).toContain('Convener role required');
    });
    
    it('should return 404 when lesson does not exist', async () => {
      const res = await request(app)
        .post('/v1/api/lessons/99999/assignments')
        .set('Authorization', `Bearer ${convenerToken}`)
        .send({
          title: 'Test Assignment',
          instructions: 'Test instructions',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe(true);
      expect(res.body.message).toContain('Lesson not found');
    });
  });
});
```

### Integration Testing

**Test Database**: Use a separate test database with migrations applied

**Test Data**: Create seed data for:
- Test users (conveners and learners)
- Test cohorts and enrollments
- Test programmes, modules, and lessons
- Test assignments and submissions

**Example Integration Test**:

```javascript
describe('Submission Flow Integration', () => {
  let assignmentId;
  let learnerToken;
  
  beforeAll(async () => {
    // Set up test data
    await seedTestData();
    learnerToken = await getTestToken('learner');
    
    // Create test assignment
    const res = await request(app)
      .post('/v1/api/lessons/1/assignments')
      .set('Authorization', `Bearer ${convenerToken}`)
      .send({
        title: 'Integration Test Assignment',
        instructions: 'Submit your work',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    
    assignmentId = res.body.assignment.id;
  });
  
  it('should allow learner to submit, convener to grade, and learner to see grade', async () => {
    // Learner submits
    const submitRes = await request(app)
      .post(`/v1/api/assignments/${assignmentId}/submissions`)
      .set('Authorization', `Bearer ${learnerToken}`)
      .field('textAnswer', 'My submission text')
      .attach('files', Buffer.from('test file content'), 'test.pdf');
    
    expect(submitRes.status).toBe(201);
    const submissionId = submitRes.body.submission.id;
    
    // Convener grades
    const gradeRes = await request(app)
      .post(`/v1/api/submissions/${submissionId}/grade`)
      .set('Authorization', `Bearer ${convenerToken}`)
      .send({
        status: 'passed',
        feedback: 'Great work!',
      });
    
    expect(gradeRes.status).toBe(200);
    
    // Learner sees grade
    const fetchRes = await request(app)
      .get(`/v1/api/assignments/${assignmentId}/submissions/${submissionId}`)
      .set('Authorization', `Bearer ${learnerToken}`);
    
    expect(fetchRes.status).toBe(200);
    expect(fetchRes.body.submission.gradingStatus).toBe('passed');
    expect(fetchRes.body.submission.feedback).toBe('Great work!');
  });
});
```

### Test Coverage Goals

- **Unit Test Coverage**: Minimum 80% code coverage
- **Property Test Coverage**: All 60 correctness properties must have corresponding property tests
- **Integration Test Coverage**: All critical user flows (create assignment, submit work, grade submission, download submissions)
- **Error Handling Coverage**: All error categories must have tests

### Testing Environments

1. **Local Development**: Run tests with `npm test` or `yarn test`
2. **CI/CD Pipeline**: Automated test runs on every commit
3. **Pre-deployment**: Full test suite must pass before production deployment

