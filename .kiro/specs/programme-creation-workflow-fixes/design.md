# Design Document

## Overview

This design provides a systematic approach to identify, diagnose, and fix all issues preventing the Programme Creation Workflow from functioning correctly. The solution encompasses deployment verification, environment configuration validation, form validation fixes, API consistency improvements, and comprehensive diagnostic tooling.

The design follows a layered approach:
1. **Infrastructure Layer**: Deployment and environment configuration
2. **Validation Layer**: Form and data validation
3. **API Layer**: Backend endpoints and data transformation
4. **Diagnostic Layer**: Automated testing and issue identification

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Diagnostic Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Deployment   │  │ Workflow     │  │ Schema       │      │
│  │ Verifier     │  │ Tester       │  │ Validator    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Programme    │  │ Cohort       │  │ Week/Lesson  │      │
│  │ Form         │  │ Form         │  │ Forms        │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         ↓                  ↓                  ↓              │
│  ┌──────────────────────────────────────────────────┐      │
│  │         Form Validation & Error Handling          │      │
│  └──────────────────────────────────────────────────┘      │
│         ↓                  ↓                  ↓              │
│  ┌──────────────────────────────────────────────────┐      │
│  │         API Client (Data Transformation)          │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Express)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Programme    │  │ Cohort       │  │ Week/Lesson  │      │
│  │ Routes       │  │ Routes       │  │ Routes       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         ↓                  ↓                  ↓              │
│  ┌──────────────────────────────────────────────────┐      │
│  │         Validation & Business Logic               │      │
│  └──────────────────────────────────────────────────┘      │
│         ↓                  ↓                  ↓              │
│  ┌──────────────────────────────────────────────────┐      │
│  │              Database Layer (MySQL)               │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Input → Form Validation → API Client (camelCase → snake_case)
    ↓
Backend Route → Validation Service → Database Operation
    ↓
Response (snake_case → camelCase) → UI Update
```

## Components and Interfaces

### 1. Deployment Verification System

**Purpose**: Verify that code changes are actually deployed to production

**Interface**:
```typescript
interface DeploymentVerifier {
  checkFrontendDeployment(): Promise<DeploymentStatus>;
  checkBackendDeployment(): Promise<DeploymentStatus>;
  verifyCodeMarker(marker: string): Promise<boolean>;
  triggerCachePurge(): Promise<void>;
}

interface DeploymentStatus {
  deployed: boolean;
  commitHash: string;
  timestamp: Date;
  codeMarkers: string[];
  issues: string[];
}
```

**Implementation Strategy**:
- Add unique code markers (comments with commit hash) to deployed files
- Create verification endpoint that returns current commit hash
- Compare deployed hash with expected hash from git
- Automate Cloudflare cache purging via GitHub Actions

### 2. Environment Configuration Validator

**Purpose**: Validate all environment variables are set correctly

**Interface**:
```typescript
interface EnvironmentValidator {
  validateBackendEnv(): ValidationResult;
  validateFrontendEnv(): ValidationResult;
  checkDatabaseConnection(): Promise<boolean>;
}

interface ValidationResult {
  valid: boolean;
  errors: EnvironmentError[];
  warnings: string[];
}

interface EnvironmentError {
  variable: string;
  expected: string;
  actual: string;
  severity: 'critical' | 'warning';
}
```

**Required Environment Variables**:

Backend:
- `NODE_ENV`: Must be "production" (not "development")
- `DB_DATABASE`: Must be actual database name (not "cohortle.com")
- `DB_HOSTNAME`: Database server hostname
- `JWT_SECRET`: Secret for token signing
- All must be available at runtime

Frontend:
- `NEXT_PUBLIC_API_URL`: Must be available at BUILD TIME and RUNTIME
- Must be set to production API URL

### 3. Form Validation System

**Purpose**: Provide consistent, user-friendly form validation

**Interface**:
```typescript
interface FormValidator {
  validateProgrammeForm(data: ProgrammeFormData): ValidationErrors;
  validateCohortForm(data: CohortFormData): ValidationErrors;
  validateWeekForm(data: WeekFormData): ValidationErrors;
  validateLessonForm(data: LessonFormData): ValidationErrors;
}

interface ValidationErrors {
  [field: string]: string;
}
```

**Validation Rules**:

Programme Form:
- `name`: Required, 3-200 characters
- `description`: Optional, max 1000 characters
- `startDate`: Required, must be today or future (local timezone)

Cohort Form:
- `name`: Required, 3-200 characters
- `enrollmentCode`: Required, alphanumeric with hyphens, must be unique
- `startDate`: Required, must be today or future

Week Form:
- `weekNumber`: Required, integer >= 1
- `title`: Required, 3-200 characters
- `startDate`: Required, must be today or future

Lesson Form:
- `title`: Required, 3-200 characters
- `description`: Optional, max 1000 characters
- `contentType`: Required, one of: video, pdf, link, text
- `contentUrl`: Required for video/pdf/link, must be valid URL
- `contentText`: Required for text type, max 50000 characters
- `orderIndex`: Required, integer >= 0

**Date Validation Fix**:
```typescript
// WRONG (uses UTC):
const today = new Date().toISOString().split('T')[0];

// CORRECT (uses local timezone):
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const day = String(today.getDate()).padStart(2, '0');
const todayString = `${year}-${month}-${day}`;
```

### 4. Enrollment Code Management

**Purpose**: Generate and validate unique enrollment codes

**Interface**:
```typescript
interface EnrollmentCodeService {
  generateCode(): string;
  checkAvailability(code: string): Promise<boolean>;
  validateFormat(code: string): boolean;
}
```

**Implementation**:
```typescript
// Frontend
function generateEnrollmentCode(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PROG-${year}-${random}`;
}

// Backend endpoint
GET /v1/api/enrollment-codes/check?code=XXX
Response: { available: boolean }

// Real-time checking (debounced)
useEffect(() => {
  const checkCode = async () => {
    if (!code || code.length < 3) return;
    const available = await checkEnrollmentCodeAvailability(code);
    setCodeAvailability({ available, message: ... });
  };
  const timeoutId = setTimeout(checkCode, 500);
  return () => clearTimeout(timeoutId);
}, [code]);
```

### 5. Data Transformation Layer

**Purpose**: Transform data between frontend (camelCase) and backend (snake_case)

**Interface**:
```typescript
interface DataTransformer {
  toSnakeCase(data: object): object;
  toCamelCase(data: object): object;
}
```

**Field Mappings**:
```typescript
const fieldMappings = {
  // Programme
  startDate: 'start_date',
  createdBy: 'created_by',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  
  // Cohort
  enrollmentCode: 'enrollment_code',
  programmeId: 'programme_id',
  
  // Week
  weekNumber: 'week_number',
  
  // Lesson
  contentType: 'content_type',
  contentUrl: 'content_url',
  orderIndex: 'order_index',
  weekId: 'week_id',
};
```

**Implementation**:
```typescript
// Frontend API client
export async function createCohort(programmeId: string, data: CohortFormData) {
  const requestData = {
    name: data.name,
    enrollment_code: data.enrollmentCode,  // Transform
    start_date: data.startDate,            // Transform
  };
  
  const response = await apiClient.post(
    `/v1/api/programmes/${programmeId}/cohorts`,
    requestData
  );
  
  // Transform response back to camelCase
  return transformToCamelCase(response.data.cohort);
}
```

### 6. API Response Standardization

**Purpose**: Ensure consistent API response format

**Interface**:
```typescript
interface ApiResponse<T> {
  error: boolean;
  message: string;
  data?: T;
  // Specific resource fields
  programme?: Programme;
  cohort?: Cohort;
  week?: Week;
  lesson?: Lesson;
}
```

**Backend Response Format**:
```javascript
// Success
res.status(201).json({
  error: false,
  message: "Cohort created successfully",
  cohort_id: 123,
  cohort: { id: 123, name: "...", enrollment_code: "...", ... }
});

// Error
res.status(400).json({
  error: true,
  message: "This enrollment code is already in use"
});
```

### 7. Comprehensive Logging System

**Purpose**: Log all operations for debugging

**Interface**:
```typescript
interface Logger {
  logFormSubmission(formName: string, data: object): void;
  logApiRequest(endpoint: string, method: string, data: object): void;
  logApiResponse(endpoint: string, status: number, data: object): void;
  logError(context: string, error: Error): void;
}
```

**Implementation**:

Frontend:
```typescript
// Form submission
console.log('CohortForm: Submitting data for programme', programmeId, ':', data);

// API request
console.log('createCohort: Sending request to backend:', { programmeId, requestData });

// API response
console.log('createCohort: Backend response:', response.data);

// Error
console.error('createCohort: Error occurred:', error);
if (error.response) {
  console.error('createCohort: Response data:', error.response.data);
  console.error('createCohort: Response status:', error.response.status);
}
```

Backend:
```javascript
// Request logging
console.log('Cohort creation request:', {
  programme_id,
  body: req.body,
  user_id: req.user_id
});

// Database operation
console.log('Creating cohort with data:', cohortData);

// Success
console.log('Cohort created with ID:', cohort_id);

// Error
console.error('Error creating cohort:', err);
console.error('Error details:', {
  message: err.message,
  stack: err.stack,
  code: err.code
});
```

### 8. Workflow Diagnostic System

**Purpose**: Systematically test the entire workflow

**Interface**:
```typescript
interface WorkflowDiagnostic {
  testProgrammeCreation(): Promise<DiagnosticResult>;
  testCohortCreation(programmeId: string): Promise<DiagnosticResult>;
  testWeekCreation(programmeId: string): Promise<DiagnosticResult>;
  testLessonCreation(weekId: string): Promise<DiagnosticResult>;
  runFullWorkflow(): Promise<WorkflowReport>;
}

interface DiagnosticResult {
  step: string;
  success: boolean;
  duration: number;
  errors: string[];
  warnings: string[];
  data?: object;
}

interface WorkflowReport {
  overallSuccess: boolean;
  steps: DiagnosticResult[];
  summary: string;
  recommendations: string[];
}
```

**Test Scenarios**:

1. Programme Creation:
   - Valid data
   - Invalid name (too short, too long)
   - Invalid date (past date)
   - Missing required fields

2. Cohort Creation:
   - Valid data with unique code
   - Duplicate enrollment code
   - Invalid code format
   - Missing required fields

3. Week Creation:
   - Valid data
   - Invalid week number (< 1)
   - Invalid date
   - Missing required fields

4. Lesson Creation:
   - Video content with valid YouTube URL
   - PDF content with valid PDF URL
   - Link content with valid URL
   - Text content with plain text
   - Invalid URLs for each type
   - Missing required fields

## Data Models

### Programme
```typescript
interface Programme {
  id: number;
  name: string;
  description: string;
  startDate: string;  // YYYY-MM-DD
  status: 'draft' | 'published';
  createdBy: number;
  createdAt: string;  // ISO 8601
  updatedAt: string;  // ISO 8601
}
```

### Cohort
```typescript
interface Cohort {
  id: number;
  programmeId: number;
  name: string;
  enrollmentCode: string;  // Format: PROG-YYYY-XXXXXX
  startDate: string;       // YYYY-MM-DD
  endDate?: string;        // YYYY-MM-DD
  maxMembers?: number;
  status: 'active' | 'inactive';
  memberCount: number;
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
}
```

### Week
```typescript
interface Week {
  id: string;
  programmeId: number;
  weekNumber: number;
  title: string;
  startDate: string;  // YYYY-MM-DD
  createdAt: string;  // ISO 8601
  updatedAt: string;  // ISO 8601
}
```

### Lesson
```typescript
interface Lesson {
  id: string;
  weekId: string;
  title: string;
  description: string;
  contentType: 'video' | 'pdf' | 'link' | 'text';
  contentUrl: string;  // URL for video/pdf/link, text content for text type
  orderIndex: number;
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I've identified several areas where properties can be consolidated:

**Redundancy Analysis:**

1. **Form Validation Properties (3.4, 3.5, 5.6)**: All test string length validation. Can be combined into a single property about field length validation.

2. **API Response Completeness (7.2, 7.3, 7.4, 4.10, 5.7, 6.10)**: All test that created resources return complete objects. Can be combined into one property about API response completeness.

3. **Error Response Format (7.6, 9.1, 9.2, 9.3)**: All test error response structure. Can be combined into one property about error re