# Design Document: Assignment Submission System

## Overview

The Assignment Submission System is a comprehensive feature that enables conveners to create assignments for lessons and students to submit their work through file uploads and text responses. The system integrates seamlessly with Cohortle's existing React Native (Expo) architecture, leveraging TanStack Query for data management, AsyncStorage for authentication and offline support, and Axios for API communication.

The system follows a mobile-first design approach with clear separation between convener and student workflows. It supports pass/fail grading with optional feedback, real-time submission tracking, bulk operations for conveners, and robust offline capabilities with draft management.

### Key Design Principles

1. **Consistency**: Follow existing Cohortle patterns for API calls, error handling, and UI components
2. **Reliability**: Implement comprehensive error handling with user-friendly messages
3. **Performance**: Use TanStack Query caching, optimistic updates, and lazy loading
4. **Offline-First**: Support draft saving locally and automatic sync when online
5. **Mobile-Optimized**: Design for touch interfaces with clear visual feedback
6. **Scalability**: Support bulk operations and efficient data fetching

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile Application                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  Student Views   │         │  Convener Views  │          │
│  ├──────────────────┤         ├──────────────────┤          │
│  │ - Assignment List│         │ - Create/Edit    │          │
│  │ - Submit Work    │         │ - Submissions    │          │
│  │ - View Grade     │         │ - Grading UI     │          │
│  └────────┬─────────┘         └────────┬─────────┘          │
│           │                            │                     │
│           └────────────┬───────────────┘                     │
│                        │                                     │
│           ┌────────────▼─────────────┐                       │
│           │   Assignment Hooks       │                       │
│           │  (TanStack Query)        │                       │
│           ├──────────────────────────┤                       │
│           │ - useGetAssignments      │                       │
│           │ - useCreateAssignment    │                       │
│           │ - useSubmitAssignment    │                       │
│           │ - useGradeSubmission     │                       │
│           └────────────┬─────────────┘                       │
│                        │                                     │
│           ┌────────────▼─────────────┐                       │
│           │   API Layer              │                       │
│           ├──────────────────────────┤                       │
│           │ - Assignment API         │                       │
│           │ - Submission API         │                       │
│           │ - File Upload Handler    │                       │
│           └────────────┬─────────────┘                       │
│                        │                                     │
│           ┌────────────▼─────────────┐                       │
│           │   Local Storage          │                       │
│           │  (AsyncStorage)          │                       │
│           ├──────────────────────────┤                       │
│           │ - Draft Submissions      │                       │
│           │ - Auth Tokens            │                       │
│           │ - Cached Data            │                       │
│           └──────────────────────────┘                       │
│                                                               │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │ HTTPS/REST
                        │
┌───────────────────────▼───────────────────────────────────────┐
│                   Backend API                                  │
│              (https://api.cohortle.com)                        │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐     │
│  │              Assignment Endpoints                     │     │
│  ├──────────────────────────────────────────────────────┤     │
│  │ POST   /v1/api/lessons/:lessonId/assignments         │     │
│  │ GET    /v1/api/lessons/:lessonId/assignments         │     │
│  │ PUT    /v1/api/assignments/:assignmentId             │     │
│  │ DELETE /v1/api/assignments/:assignmentId             │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐     │
│  │              Submission Endpoints                     │     │
│  ├──────────────────────────────────────────────────────┤     │
│  │ POST   /v1/api/assignments/:id/submissions           │     │
│  │ GET    /v1/api/assignments/:id/submissions           │     │
│  │ GET    /v1/api/assignments/:id/submissions/:subId    │     │
│  │ PUT    /v1/api/submissions/:submissionId             │     │
│  │ POST   /v1/api/submissions/:submissionId/grade       │     │
│  │ GET    /v1/api/submissions/:submissionId/download    │     │
│  │ GET    /v1/api/assignments/:id/download-all          │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐     │
│  │              Student Overview Endpoints               │     │
│  ├──────────────────────────────────────────────────────┤     │
│  │ GET    /v1/api/students/assignments                  │     │
│  │ GET    /v1/api/students/assignments/:id              │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

#### Assignment Creation Flow
```
Convener → Create Assignment Form → useCreateAssignment Hook
  → POST /v1/api/lessons/:lessonId/assignments
  → TanStack Query Cache Update → UI Refresh
```

#### Submission Flow
```
Student → Upload Files + Text → Draft Saved (AsyncStorage)
  → Submit Button → useSubmitAssignment Hook
  → POST /v1/api/assignments/:id/submissions (multipart/form-data)
  → TanStack Query Cache Update → Clear Draft → UI Refresh
```

#### Grading Flow
```
Convener → View Submissions → Select Submission → Grade (Pass/Fail + Comments)
  → useGradeSubmission Hook
  → POST /v1/api/submissions/:submissionId/grade
  → TanStack Query Cache Update → UI Refresh
```

## Components and Interfaces

### API Layer

#### Assignment API Functions

```typescript
// api/assignments/createAssignment.ts
interface CreateAssignmentPayload {
  title: string;
  instructions: string;
  dueDate: string; // ISO 8601 format
}

async function createAssignment(
  lessonId: string,
  payload: CreateAssignmentPayload
): Promise<Assignment>

// api/assignments/getAssignments.ts
async function getAssignmentByLesson(
  lessonId: string
): Promise<Assignment | null>

async function getStudentAssignments(): Promise<Assignment[]>

// api/assignments/updateAssignment.ts
async function updateAssignment(
  assignmentId: string,
  payload: Partial<CreateAssignmentPayload>
): Promise<Assignment>

// api/assignments/deleteAssignment.ts
async function deleteAssignment(assignmentId: string): Promise<void>
```

#### Submission API Functions

```typescript
// api/submissions/submitAssignment.ts
interface SubmitAssignmentPayload {
  textAnswer?: string;
  files: Array<{
    uri: string;
    name: string;
    type: string;
    size: number;
  }>;
}

async function submitAssignment(
  assignmentId: string,
  payload: SubmitAssignmentPayload
): Promise<Submission>

// api/submissions/getSubmissions.ts
async function getSubmissionsByAssignment(
  assignmentId: string
): Promise<Submission[]>

async function getSubmissionById(
  submissionId: string
): Promise<Submission>

async function getMySubmission(
  assignmentId: string
): Promise<Submission | null>

// api/submissions/updateSubmission.ts
async function updateSubmission(
  submissionId: string,
  payload: Partial<SubmitAssignmentPayload>
): Promise<Submission>

// api/submissions/gradeSubmission.ts
interface GradeSubmissionPayload {
  status: 'passed' | 'failed';
  feedback?: string;
}

async function gradeSubmission(
  submissionId: string,
  payload: GradeSubmissionPayload
): Promise<Submission>

// api/submissions/downloadSubmissions.ts
async function downloadSubmission(
  submissionId: string
): Promise<Blob>

async function downloadAllSubmissions(
  assignmentId: string
): Promise<Blob>
```

### TanStack Query Hooks

```typescript
// hooks/api/useAssignments.ts

// Query: Get assignment for a lesson
export function useGetAssignment(lessonId: string) {
  return useQuery({
    queryKey: ['assignment', lessonId],
    queryFn: () => getAssignmentByLesson(lessonId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Query: Get all student assignments
export function useGetStudentAssignments() {
  return useQuery({
    queryKey: ['student-assignments'],
    queryFn: getStudentAssignments,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Mutation: Create assignment
export function useCreateAssignment(lessonId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: CreateAssignmentPayload) =>
      createAssignment(lessonId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment', lessonId] });
    },
  });
}

// Mutation: Update assignment
export function useUpdateAssignment(assignmentId: string, lessonId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: Partial<CreateAssignmentPayload>) =>
      updateAssignment(assignmentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment', lessonId] });
    },
  });
}

// Mutation: Delete assignment
export function useDeleteAssignment(lessonId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (assignmentId: string) => deleteAssignment(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment', lessonId] });
    },
  });
}
```

```typescript
// hooks/api/useSubmissions.ts

// Query: Get submissions for an assignment (convener view)
export function useGetSubmissions(assignmentId: string) {
  return useQuery({
    queryKey: ['submissions', assignmentId],
    queryFn: () => getSubmissionsByAssignment(assignmentId),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Query: Get my submission (student view)
export function useGetMySubmission(assignmentId: string) {
  return useQuery({
    queryKey: ['my-submission', assignmentId],
    queryFn: () => getMySubmission(assignmentId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Query: Get specific submission details
export function useGetSubmission(submissionId: string) {
  return useQuery({
    queryKey: ['submission', submissionId],
    queryFn: () => getSubmissionById(submissionId),
  });
}

// Mutation: Submit assignment
export function useSubmitAssignment(assignmentId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: SubmitAssignmentPayload) =>
      submitAssignment(assignmentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-submission', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['submissions', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
    },
  });
}

// Mutation: Update submission
export function useUpdateSubmission(submissionId: string, assignmentId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: Partial<SubmitAssignmentPayload>) =>
      updateSubmission(submissionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-submission', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['submission', submissionId] });
      queryClient.invalidateQueries({ queryKey: ['submissions', assignmentId] });
    },
  });
}

// Mutation: Grade submission
export function useGradeSubmission(assignmentId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ submissionId, payload }: {
      submissionId: string;
      payload: GradeSubmissionPayload;
    }) => gradeSubmission(submissionId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['submissions', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['submission', variables.submissionId] });
    },
  });
}
```

### File Upload Handler

```typescript
// utils/fileUpload.ts

interface FileValidationResult {
  valid: boolean;
  error?: string;
}

interface UploadProgress {
  fileIndex: number;
  fileName: string;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

// Validate file type
function validateFileType(fileName: string): FileValidationResult {
  const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'];
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  
  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File type ${extension} is not supported. Allowed types: PDF, PNG, JPG, DOC, DOCX`,
    };
  }
  
  return { valid: true };
}

// Validate file size (max 10MB)
function validateFileSize(size: number): FileValidationResult {
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  
  if (size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds 10MB limit. Current size: ${(size / 1024 / 1024).toFixed(2)}MB`,
    };
  }
  
  return { valid: true };
}

// Upload files with progress tracking
async function uploadFilesWithProgress(
  files: Array<{ uri: string; name: string; type: string; size: number }>,
  onProgress: (progress: UploadProgress[]) => void
): Promise<string[]> {
  // Implementation will track individual file upload progress
  // Returns array of uploaded file URLs
}
```

### Draft Management

```typescript
// utils/draftManager.ts

interface DraftSubmission {
  assignmentId: string;
  textAnswer: string;
  files: Array<{
    uri: string;
    name: string;
    type: string;
    size: number;
  }>;
  lastModified: string; // ISO 8601 timestamp
}

// Save draft to AsyncStorage
async function saveDraft(
  assignmentId: string,
  draft: Omit<DraftSubmission, 'assignmentId' | 'lastModified'>
): Promise<void> {
  const draftData: DraftSubmission = {
    assignmentId,
    ...draft,
    lastModified: new Date().toISOString(),
  };
  
  await AsyncStorage.setItem(
    `draft_submission_${assignmentId}`,
    JSON.stringify(draftData)
  );
}

// Load draft from AsyncStorage
async function loadDraft(assignmentId: string): Promise<DraftSubmission | null> {
  const draftJson = await AsyncStorage.getItem(`draft_submission_${assignmentId}`);
  
  if (!draftJson) {
    return null;
  }
  
  return JSON.parse(draftJson);
}

// Clear draft from AsyncStorage
async function clearDraft(assignmentId: string): Promise<void> {
  await AsyncStorage.removeItem(`draft_submission_${assignmentId}`);
}

// Get all drafts (for cleanup or overview)
async function getAllDrafts(): Promise<DraftSubmission[]> {
  const keys = await AsyncStorage.getAllKeys();
  const draftKeys = keys.filter(key => key.startsWith('draft_submission_'));
  
  const drafts = await AsyncStorage.multiGet(draftKeys);
  
  return drafts
    .map(([_, value]) => value ? JSON.parse(value) : null)
    .filter(Boolean);
}
```

## Data Models

### Assignment Model

```typescript
interface Assignment {
  id: string;
  lessonId: string;
  title: string;
  instructions: string;
  dueDate: string; // ISO 8601 format
  createdAt: string;
  updatedAt: string;
  
  // Populated fields (from relations)
  lesson?: {
    id: string;
    title: string;
    moduleId: string;
  };
  
  // Computed fields (for student view)
  mySubmission?: Submission | null;
  isOverdue?: boolean;
  
  // Computed fields (for convener view)
  submissionStats?: {
    total: number;
    submitted: number;
    graded: number;
    pending: number;
  };
}
```

### Submission Model

```typescript
interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  textAnswer: string | null;
  files: SubmissionFile[];
  status: 'draft' | 'submitted' | 'graded';
  gradingStatus: 'pending' | 'passed' | 'failed';
  feedback: string | null;
  submittedAt: string | null;
  gradedAt: string | null;
  createdAt: string;
  updatedAt: string;
  
  // Populated fields
  student?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  
  assignment?: Assignment;
}

interface SubmissionFile {
  id: string;
  submissionId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}
```

### Submission Statistics Model

```typescript
interface SubmissionStatistics {
  assignmentId: string;
  totalStudents: number;
  submittedCount: number;
  gradedCount: number;
  pendingCount: number;
  passedCount: number;
  failedCount: number;
  
  // Breakdown by student
  students: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
    hasSubmitted: boolean;
    submissionId?: string;
    submittedAt?: string;
    gradingStatus?: 'pending' | 'passed' | 'failed';
    gradedAt?: string;
  }>;
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Assignment Creation Round-Trip

*For any* valid assignment data (title, instructions, future due date), creating an assignment for a lesson and then immediately fetching it should return an assignment with all the same field values.

**Validates: Requirements 1.1, 1.5**

### Property 2: Due Date Validation

*For any* date in the past, attempting to create or update an assignment with that due date should be rejected with a validation error. *For any* date in the future, the assignment should be created successfully.

**Validates: Requirements 1.2**

### Property 3: Assignment-Lesson Association

*For any* created assignment, it should have exactly one lessonId, and querying assignments by that lessonId should include the created assignment.

**Validates: Requirements 1.3**

### Property 4: Assignment Update Persistence

*For any* existing assignment, updating it with new title, instructions, or due date should result in fetching the assignment returning the updated values.

**Validates: Requirements 1.4**

### Property 5: Assignment Display Completeness

*For any* assignment, when rendered for a student, the output should contain the title, instructions, due date, and submission status fields.

**Validates: Requirements 2.2**

### Property 6: File Validation

*For any* file, validation should reject it if its extension is not in [.pdf, .png, .jpg, .jpeg, .doc, .docx] OR if its size exceeds 10MB, and should accept it otherwise. Each rejection should include a specific error message indicating which validation failed.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 7: Multiple File Upload Support

*For any* submission with N files (where N > 1), all N files should be stored and retrievable from the submission.

**Validates: Requirements 3.6**

### Property 8: Submission Content Validation

*For any* submission, it should be accepted if it contains non-whitespace text OR at least one valid file, and should be rejected if it contains neither (empty text and no files).

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 9: Draft Persistence Round-Trip

*For any* draft submission data (text and files), saving it to AsyncStorage for an assignment and then loading it back should return equivalent data with the same text content and file references.

**Validates: Requirements 5.1, 5.2**

### Property 10: Submission Status Transition

*For any* draft submission, when submitted, the status should change from "draft" to "submitted", and this change should persist when the submission is fetched again.

**Validates: Requirements 5.3**

### Property 11: Edit Permission Based on Status and Date

*For any* submission in "submitted" status, edit operations should be allowed only if the current date is before the assignment's due date, and should be rejected otherwise.

**Validates: Requirements 5.4, 5.5**

### Property 12: Submission Tracker Completeness

*For any* assignment with N enrolled students, the submission tracker should display exactly N student entries, each containing the student's submission status, and the summary statistics (total, submitted, pending) should sum correctly to N.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 13: Submission Filtering

*For any* submission status filter applied to a list of students, all displayed students should have submissions matching that status, and all students with submissions matching that status should be displayed.

**Validates: Requirements 6.5**

### Property 14: Download Package Completeness

*For any* assignment with M submissions containing files, downloading all submissions should produce a package containing all files from all M submissions, organized by student identifier.

**Validates: Requirements 7.1, 7.2**

### Property 15: Text Inclusion in Downloads

*For any* submission with non-empty text content, the download package should include that text content in a readable format.

**Validates: Requirements 7.3**

### Property 16: Grade Value Validation

*For any* grading attempt, the system should accept only "passed" or "failed" as valid grade values and reject any other values with a validation error.

**Validates: Requirements 8.1**

### Property 17: Feedback Length Acceptance

*For any* string of any length (including empty), the system should accept it as valid feedback when grading a submission.

**Validates: Requirements 8.2**

### Property 18: Grading Round-Trip

*For any* submission, after grading it with a status (passed/failed) and optional feedback, fetching the submission should return the same grade status and feedback, and the submission should be visible to the student with that grade.

**Validates: Requirements 8.3, 8.4, 8.5**

### Property 19: Student Assignment Overview Completeness

*For any* student enrolled in N cohorts with M total assignments across those cohorts, the student's assignment overview should display all M assignments, each with lesson name, cohort name, due date, and submission status.

**Validates: Requirements 9.1, 9.2**

### Property 20: Assignment Sorting by Due Date

*For any* list of assignments displayed to a student, the assignments should be ordered by due date in ascending order (nearest deadline first).

**Validates: Requirements 9.3**

### Property 21: Assignment Overview Filtering

*For any* grading status filter applied to a student's assignment list, all displayed assignments should have submissions matching that grading status, and all assignments with submissions matching that status should be displayed.

**Validates: Requirements 9.5**

### Property 22: Authentication Token Inclusion

*For any* API request made by the Assignment_System, the request should include an Authorization header with a Bearer token retrieved from AsyncStorage.

**Validates: Requirements 11.1**

## Error Handling

### Error Categories

The system handles errors in the following categories:

1. **Validation Errors**: Client-side validation failures (file type, file size, empty submissions, invalid dates)
2. **Network Errors**: Connection failures, timeouts, offline scenarios
3. **Authentication Errors**: Missing or expired tokens, unauthorized access
4. **Server Errors**: 4xx and 5xx HTTP responses
5. **File Upload Errors**: Upload failures, corrupted files, storage issues

### Error Handling Strategy

#### Validation Errors
- Validate all inputs on the client before API calls
- Display specific, actionable error messages
- Highlight the specific field or file causing the error
- Prevent form submission until validation passes

```typescript
// Example validation error messages
"File type .exe is not supported. Allowed types: PDF, PNG, JPG, DOC, DOCX"
"File size exceeds 10MB limit. Current size: 15.3MB"
"Please provide either text answer or upload at least one file"
"Due date must be in the future"
```

#### Network Errors
- Detect offline state using NetInfo
- Show clear offline indicators
- Save drafts locally when offline
- Queue operations for retry when connection restored
- Provide manual retry buttons for failed operations

```typescript
// Example network error handling
if (!isConnected) {
  // Save draft locally
  await saveDraft(assignmentId, submissionData);
  showMessage({
    message: "You're offline",
    description: "Your work has been saved as a draft and will be submitted when you're back online",
    type: "info",
  });
}
```

#### Authentication Errors
- Check for token before making requests
- Handle 401 responses by redirecting to login
- Clear cached data on logout
- Preserve drafts across login sessions

```typescript
// Example auth error handling
if (error.response?.status === 401) {
  await AsyncStorage.removeItem('authToken');
  router.replace('/login');
  showMessage({
    message: "Session Expired",
    description: "Please log in again to continue",
    type: "warning",
  });
}
```

#### Server Errors
- Parse error messages from API responses
- Provide user-friendly translations of technical errors
- Log detailed errors for debugging
- Offer retry options for transient failures

```typescript
// Example server error handling
if (error.response?.status >= 500) {
  showMessage({
    message: "Server Error",
    description: "Something went wrong on our end. Please try again in a moment.",
    type: "danger",
  });
  // Log to error tracking service
  logError(error);
}
```

#### File Upload Errors
- Track upload progress per file
- Allow individual file retry without re-uploading successful files
- Validate files before upload to catch issues early
- Handle partial upload failures gracefully

```typescript
// Example file upload error handling
const uploadResults = await Promise.allSettled(
  files.map(file => uploadFile(file))
);

const failed = uploadResults
  .filter(result => result.status === 'rejected')
  .map((result, index) => ({ file: files[index], error: result.reason }));

if (failed.length > 0) {
  showMessage({
    message: `${failed.length} file(s) failed to upload`,
    description: "You can retry uploading the failed files",
    type: "warning",
  });
}
```

### Error Recovery Patterns

1. **Automatic Retry**: Network requests automatically retry up to 3 times with exponential backoff
2. **Manual Retry**: Users can manually retry failed operations via UI buttons
3. **Draft Recovery**: Unsaved work is automatically saved as drafts every 30 seconds
4. **Offline Queue**: Operations performed offline are queued and executed when connection restored
5. **Partial Success**: For bulk operations (multiple file uploads), successful items are preserved even if some fail

## Testing Strategy

### Dual Testing Approach

The Assignment Submission System requires both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, error conditions, and integration points
- **Property tests**: Verify universal properties across all inputs through randomized testing

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing

**Library**: Use `fast-check` for TypeScript/JavaScript property-based testing

**Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property
- Tag format: `// Feature: assignment-submission-system, Property {number}: {property_text}`

**Example Property Test Structure**:

```typescript
import fc from 'fast-check';

// Feature: assignment-submission-system, Property 1: Assignment Creation Round-Trip
describe('Property 1: Assignment Creation Round-Trip', () => {
  it('should preserve all fields when creating and fetching an assignment', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }),
          instructions: fc.string({ minLength: 1, maxLength: 5000 }),
          dueDate: fc.date({ min: new Date() }), // Future dates only
        }),
        async (assignmentData) => {
          const lessonId = 'test-lesson-id';
          
          // Create assignment
          const created = await createAssignment(lessonId, {
            ...assignmentData,
            dueDate: assignmentData.dueDate.toISOString(),
          });
          
          // Fetch assignment
          const fetched = await getAssignmentByLesson(lessonId);
          
          // Verify all fields match
          expect(fetched).toBeDefined();
          expect(fetched.title).toBe(assignmentData.title);
          expect(fetched.instructions).toBe(assignmentData.instructions);
          expect(new Date(fetched.dueDate)).toEqual(assignmentData.dueDate);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing

**Framework**: Jest with React Native Testing Library

**Focus Areas**:
- Specific examples demonstrating correct behavior
- Edge cases (empty states, boundary conditions)
- Error conditions and error messages
- Integration between components
- UI interactions and user flows

**Example Unit Test Structure**:

```typescript
// Example: Testing overdue assignment indicator
describe('Assignment Display', () => {
  it('should show overdue indicator for past due date', () => {
    const overdueAssignment = {
      id: '1',
      title: 'Test Assignment',
      dueDate: '2023-01-01T00:00:00Z', // Past date
      mySubmission: null,
    };
    
    const { getByText } = render(
      <AssignmentCard assignment={overdueAssignment} />
    );
    
    expect(getByText(/overdue/i)).toBeTruthy();
  });
  
  it('should not show overdue indicator for future due date', () => {
    const futureAssignment = {
      id: '1',
      title: 'Test Assignment',
      dueDate: '2099-12-31T23:59:59Z', // Future date
      mySubmission: null,
    };
    
    const { queryByText } = render(
      <AssignmentCard assignment={futureAssignment} />
    );
    
    expect(queryByText(/overdue/i)).toBeNull();
  });
});
```

### Test Coverage Goals

- **Unit Test Coverage**: Minimum 80% code coverage
- **Property Test Coverage**: All 22 correctness properties must have corresponding property tests
- **Integration Test Coverage**: All critical user flows (create assignment, submit work, grade submission)
- **Error Handling Coverage**: All error categories must have tests

### Testing Environments

1. **Local Development**: Run tests with `npm test` or `yarn test`
2. **CI/CD Pipeline**: Automated test runs on every commit
3. **Pre-deployment**: Full test suite must pass before production deployment
4. **Mock API**: Use MSW (Mock Service Worker) for API mocking in tests

### Test Data Generation

For property-based tests, use `fast-check` arbitraries to generate:
- Random strings with various lengths and character sets
- Random dates (past, future, edge cases)
- Random file metadata (names, sizes, types)
- Random user IDs and assignment IDs
- Random submission states and grading statuses

For unit tests, use factory functions to create consistent test data:

```typescript
// factories/assignmentFactory.ts
export function createTestAssignment(overrides = {}) {
  return {
    id: 'test-assignment-1',
    lessonId: 'test-lesson-1',
    title: 'Test Assignment',
    instructions: 'Complete the following tasks...',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}
```
