# Design Document: Lesson Save Failure Fix

## Overview

This design addresses a critical bug in the lesson management system where save operations fail when `lessonId` is missing or improperly handled. The issue affects all lesson types and prevents proper lesson creation and updates.

The root cause is a disconnect between lesson creation and editing flows:
1. Lessons are created via POST to `/v1/api/modules/{moduleId}/lessons`
2. The backend generates and returns a `lesson_id` in the response
3. Editor screens must extract this `lesson_id` and use it for subsequent updates
4. Updates require PUT to `/v1/api/lessons/{lessonId}` with lessonId in the URL path

The fix ensures proper lessonId lifecycle management:
- **Backend**: Generate unique lessonId on creation, validate on updates
- **Frontend**: Extract lessonId from creation response, pass to editors, include in all update requests
- **Error Handling**: Clear feedback when lessonId is missing or invalid

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React Native)                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │ Lesson Type      │         │ Editor Screens   │          │
│  │ Selection Modal  │────────▶│ (10 types)       │          │
│  └──────────────────┘         └──────────────────┘          │
│         │                              │                     │
│         │ 1. Create                    │ 2. Update           │
│         ▼                              ▼                     │
│  ┌──────────────────────────────────────────────┐           │
│  │         API Layer (axios)                    │           │
│  │  - postLesson()                              │           │
│  │  - uploadLessonMedia()                       │           │
│  │  - updateLesson()                            │           │
│  └──────────────────────────────────────────────┘           │
│         │                              │                     │
└─────────┼──────────────────────────────┼─────────────────────┘
          │                              │
          ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend (Node.js/Express)                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────┐           │
│  │         Lesson Routes                        │           │
│  │  POST   /v1/api/modules/:id/lessons          │           │
│  │  PUT    /v1/api/lessons/:lessonId            │           │
│  │  GET    /v1/api/lessons/:lessonId            │           │
│  └──────────────────────────────────────────────┘           │
│         │                              │                     │
│         ▼                              ▼                     │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │ Validation       │         │ Database Layer   │          │
│  │ Middleware       │────────▶│ (PostgreSQL)     │          │
│  └──────────────────┘         └──────────────────┘          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Lesson Creation Flow:**
```
1. User selects lesson type
   ↓
2. Frontend calls postLesson(moduleId, lessonData)
   ↓
3. Backend validates required fields (name, module_id, order_number)
   ↓
4. Backend generates unique lessonId (auto-increment)
   ↓
5. Backend saves to database with status='draft'
   ↓
6. Backend returns { error: false, lesson_id: X, message: "Success" }
   ↓
7. Frontend extracts lesson_id from response
   ↓
8. Frontend navigates to editor with lessonId parameter
```

**Lesson Update Flow:**
```
1. Editor screen loads with lessonId from route params
   ↓
2. Editor validates lessonId is present
   ↓
3. User makes changes and clicks save
   ↓
4. Frontend validates required fields
   ↓
5. Frontend calls uploadLessonMedia(lessonId, media, text)
   ↓
6. Frontend constructs PUT /v1/api/lessons/{lessonId}
   ↓
7. Backend validates lessonId is provided
   ↓
8. Backend validates lessonId exists in database
   ↓
9. Backend updates lesson data
   ↓
10. Backend returns updated lesson with lessonId
    ↓
11. Frontend displays success message
```

## Components and Interfaces

### Backend Components

#### Lesson Creation Endpoint

**Route:** `POST /v1/api/modules/:moduleId/lessons`

**Request Body:**
```typescript
{
  name: string;           // Required
  module_id: number;      // Required
  order_number: number;   // Required
  description?: string;   // Optional
  url?: string;           // Optional
  type?: LessonUnitType;  // Optional
}
```

**Response (Success):**
```typescript
{
  error: false;
  lesson_id: number;      // Generated by database
  message: string;
  lesson: {
    id: number;
    name: string;
    module_id: number;
    order_number: number;
    status: 'draft';      // Default value
    description: string | null;
    url: string | null;
    type: LessonUnitType | null;
    created_at: string;
    updated_at: string;
  }
}
```

**Response (Error):**
```typescript
{
  error: true;
  message: string;        // Descriptive error message
  details?: object;       // Validation details if applicable
}
```

**Validation Rules:**
- `name`: Required, non-empty string
- `module_id`: Required, must be a valid integer, must exist in database
- `order_number`: Required, must be a positive integer
- `type`: Optional, must be valid LessonUnitType enum value
- Auto-generate `lessonId` using database auto-increment
- Auto-set `status` to 'draft' if not provided

#### Lesson Update Endpoint

**Route:** `PUT /v1/api/lessons/:lessonId`

**URL Parameters:**
- `lessonId`: Required, must be integer, must exist in database

**Request Body (multipart/form-data):**
```typescript
{
  name?: string;
  description?: string;
  media?: string | File;  // YouTube URL or file upload
  text?: string;          // Rich text content
  url?: string;
  status?: 'draft' | 'published';
  // ... other lesson fields
}
```

**Response (Success):**
```typescript
{
  error: false;
  message: string;
  lesson: {
    id: number;           // Same as lessonId from URL
    // ... all lesson fields including updates
  }
}
```

**Response (Error - Missing lessonId):**
```typescript
{
  error: true;
  message: "Lesson ID is required";
  status: 400;
}
```

**Response (Error - Lesson Not Found):**
```typescript
{
  error: true;
  message: "Lesson not found";
  status: 404;
}
```

**Validation Rules:**
- `lessonId` in URL: Required, must be integer, must exist in database
- Validate lessonId before processing any updates
- Return 400 if lessonId is missing or invalid format
- Return 404 if lessonId doesn't exist in database
- Validate all field updates according to schema constraints

### Frontend Components

#### Lesson Creation API

**File:** `cohortz/api/communities/lessons/postLessons.tsx`

**Function:** `postLesson(lessonData, moduleId)`

```typescript
interface LessonProp {
  id?: number;
  module_id: number;
  name: string;
  description?: string;
  url: string;
  order_number: number;
  type?: LessonUnitType;
}

const postLesson = async (
  lessonData: LessonProp,
  moduleId: number
): Promise<{
  error: boolean;
  lesson_id: number;
  message: string;
  lesson: Lesson;
}> => {
  const token = await AsyncStorage.getItem('authToken');
  const response = await axios.post(
    `${apiURL}/v1/api/modules/${moduleId}/lessons`,
    lessonData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};
```

**Key Changes:**
- Parse `lesson_id` from response
- Handle both `lesson_id` and `id` for backward compatibility
- Throw descriptive errors on failure
- Return complete response including lessonId

#### Lesson Update API

**File:** `cohortz/api/communities/lessons/uploadMedia.ts`

**Function:** `uploadLessonMedia(lessonId, mediaOrUrl, text)`

```typescript
const uploadLessonMedia = async (
  lessonId: string,
  mediaOrUrl: string | File | null,
  text?: string
): Promise<LessonResponse> => {
  // Validate lessonId is present
  if (!lessonId) {
    throw new Error('Lesson ID is missing. Cannot update lesson.');
  }

  const formData = new FormData();
  
  // Add text content
  if (text) {
    formData.append('text', text);
  }
  
  // Add media (YouTube URL or file)
  if (mediaOrUrl) {
    if (typeof mediaOrUrl === 'string') {
      formData.append('media', mediaOrUrl);
    } else {
      formData.append('media', mediaOrUrl);
    }
  }

  // PUT request with lessonId in URL
  const response = await axios.put(
    `${apiURL}/v1/api/lessons/${lessonId}`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
};
```

**Key Changes:**
- Validate lessonId before making request
- Include lessonId in URL path (not body)
- Throw descriptive error if lessonId is missing
- Handle both string URLs and file uploads
- Support text content updates

#### Editor Screen Pattern

**Files:** All lesson type editors (10 types)
- `uploadLesson.tsx` (Video)
- `textLessonEditor.tsx`
- `pdfLessonEditor.tsx`
- `linkLessonEditor.tsx`
- `quizEditor.tsx`
- `liveSessionEditor.tsx`
- And 4 more...

**Common Pattern:**

```typescript
const EditorScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Extract lessonId from route parameters
  const lessonId = params.lessonId as string;
  const moduleId = params.moduleId as string;
  
  // Validate lessonId is present
  useEffect(() => {
    if (!lessonId) {
      Alert.alert(
        'Error',
        'Lesson ID is missing. Cannot edit lesson.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  }, [lessonId]);
  
  // Disable save if no lessonId
  const canSave = !!lessonId;
  
  const handleSave = async () => {
    if (!lessonId) {
      Alert.alert('Error', 'Cannot save: Lesson ID is missing');
      return;
    }
    
    try {
      await uploadLessonMedia(lessonId, mediaData, textContent);
      Alert.alert('Success', 'Lesson saved successfully');
    } catch (error) {
      const message = error.message || 'Save failed: Please check your connection';
      Alert.alert('Error', message);
      console.error('Save error:', error);
    }
  };
  
  return (
    <View>
      {/* Editor UI */}
      <TouchableOpacity
        onPress={handleSave}
        disabled={!canSave}
      >
        <Text>Save Lesson</Text>
      </TouchableOpacity>
    </View>
  );
};
```

**Key Changes:**
- Extract lessonId from route params on mount
- Validate lessonId is present
- Display error and disable save if missing
- Pass lessonId to all update API calls
- Preserve lessonId when navigating between editors
- Show clear error messages for different failure scenarios

#### Lesson Type Selection Flow

**File:** `cohortz/components/lessons/UnitTypeSelectionModal.tsx`

**Flow:**

```typescript
const handleLessonTypeSelection = async (type: LessonUnitType) => {
  try {
    // 1. Create lesson with selected type
    const response = await postLesson({
      name: `New ${type} Lesson`,
      module_id: moduleId,
      order_number: nextOrderNumber,
      type: type,
      url: '',
      description: '',
    }, moduleId);
    
    // 2. Extract lessonId from response
    const lessonId = response.lesson_id || response.lesson?.id;
    
    if (!lessonId) {
      throw new Error('Failed to create lesson: No lesson ID returned');
    }
    
    // 3. Navigate to appropriate editor with lessonId
    const editorRoute = getEditorRoute(type);
    router.push({
      pathname: editorRoute,
      params: {
        lessonId: lessonId.toString(),
        moduleId: moduleId.toString(),
        moduleTitle: moduleTitle,
      },
    });
    
  } catch (error) {
    Alert.alert('Error', error.message || 'Failed to create lesson');
    console.error('Lesson creation error:', error);
  }
};
```

**Key Changes:**
- Call postLesson immediately when type is selected
- Extract lessonId from response (handle both field names)
- Validate lessonId was returned
- Pass lessonId to editor via route params
- Show error if creation fails

## Data Models

### Lesson Model (Database)

```sql
CREATE TABLE lessons (
  id SERIAL PRIMARY KEY,              -- Auto-generated lessonId
  module_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  url TEXT,
  media TEXT,                         -- YouTube URL or file path
  text TEXT,                          -- Rich text content
  order_number INTEGER NOT NULL,
  type VARCHAR(50),                   -- LessonUnitType enum
  status VARCHAR(20) DEFAULT 'draft', -- 'draft' or 'published'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);
```

### TypeScript Types

```typescript
// Lesson Unit Types
type LessonUnitType =
  | 'video'
  | 'assignment'
  | 'live_session'
  | 'form'
  | 'pdf'
  | 'text'
  | 'link'
  | 'quiz'
  | 'reflection'
  | 'practical_task';

// Lesson Interface
interface Lesson {
  id: number;                    // lessonId
  module_id: number;
  name: string;
  description: string | null;
  url: string | null;
  media: string | null;
  text: string | null;
  order_number: number;
  type: LessonUnitType | null;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

// API Response Types
interface LessonCreationResponse {
  error: false;
  lesson_id: number;
  message: string;
  lesson: Lesson;
}

interface LessonUpdateResponse {
  error: false;
  message: string;
  lesson: Lesson;
}

interface ErrorResponse {
  error: true;
  message: string;
  details?: any;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I've identified the following redundancies:
- Properties 5.2 and 5.4 both test that lessonId is used in all API calls - these can be combined
- Properties 8.1, 8.2, 8.3 all test response structure - these can be combined into one comprehensive property
- Properties 8.4 and 8.5 both test response parsing - these can be combined
- Properties 9.1 and 9.2 both test request structure - these can be combined
- All 10 lesson type properties (7.1-7.10) test the same behavior - these should be one property

### Backend Properties

**Property 1: Unique LessonId Generation**
*For any* set of lesson creation requests, all successfully created lessons should have unique, non-null lessonIds.
**Validates: Requirements 1.1**

**Property 2: LessonId in Creation Response**
*For any* successful lesson creation, the response should contain a valid lessonId (either as `lesson_id` or `id` field) that matches the database record.
**Validates: Requirements 1.2, 8.1, 8.2, 8.3**

**Property 3: Creation Error Messages**
*For any* invalid lesson creation request (missing required fields, invalid data), the backend should return an error response with a descriptive message.
**Validates: Requirements 1.3**

**Property 4: Required Field Validation**
*For any* lesson creation request missing required fields (name, module_id, or order_number), the backend should reject the request with a validation error.
**Validates: Requirements 1.4**

**Property 5: Default Status Assignment**
*For any* lesson created without an explicit status field, the backend should set the status to 'draft' by default.
**Validates: Requirements 1.5**

**Property 6: Update Requires LessonId**
*For any* lesson update request, if lessonId is missing or invalid format, the backend should reject the request before attempting database operations.
**Validates: Requirements 2.1, 10.5**

**Property 7: Valid LessonId Enables Update**
*For any* lesson update request with a valid lessonId that exists in the database, the backend should successfully process the update and return the updated lesson data including the lessonId.
**Validates: Requirements 2.4, 2.5**

**Property 8: Server-Side Validation**
*For any* lesson update request with invalid field values, the backend should reject the request with a 400 error containing validation details.
**Validates: Requirements 10.3, 10.4**

### Frontend Properties

**Property 9: LessonId Extraction from Creation Response**
*For any* successful lesson creation API response, the frontend should correctly extract the lessonId from either `lesson_id` or `id` field and use it for navigation.
**Validates: Requirements 3.2, 8.4, 8.5**

**Property 10: Navigation with LessonId**
*For any* lesson type selection, after successful creation, the frontend should navigate to the appropriate editor with lessonId included in the route parameters.
**Validates: Requirements 3.3**

**Property 11: Creation Error Handling**
*For any* failed lesson creation API call, the frontend should display an error message to the user and not navigate to the editor.
**Validates: Requirements 3.4**

**Property 12: Save Disabled Without LessonId**
*For any* editor screen, if lessonId is missing from route parameters, the save functionality should be disabled and a warning should be displayed.
**Validates: Requirements 3.5, 4.2, 5.3**

**Property 13: LessonId in Route Parameters**
*For any* editor screen load, the screen should extract lessonId from route parameters and validate it is present before enabling edit operations.
**Validates: Requirements 4.1, 5.1**

**Property 14: LessonId in Update Requests**
*For any* lesson save operation, the frontend should include the lessonId in the API request URL path and validate it is present before making the request.
**Validates: Requirements 4.3, 5.2, 5.4, 9.1, 9.2**

**Property 15: Update Success Feedback**
*For any* successful lesson update, the frontend should display a success message to the user.
**Validates: Requirements 4.4**

**Property 16: Update Error Feedback**
*For any* failed lesson update, the frontend should display the error message from the backend (or a user-friendly default) and log detailed error information to the console.
**Validates: Requirements 4.5, 6.3, 6.5**

**Property 17: LessonId Preservation in Navigation**
*For any* navigation between editor screens, the lessonId should be preserved in the route parameters.
**Validates: Requirements 5.5**

**Property 18: Universal Lesson Type Support**
*For any* lesson type (video, assignment, live_session, form, pdf, text, link, quiz, reflection, practical_task), the editor should properly extract lessonId from route parameters and use it for all save operations.
**Validates: Requirements 7.1-7.10**

**Property 19: Request Authentication**
*For any* lesson creation or update request, the frontend should include the authentication token in the request headers.
**Validates: Requirements 9.3**

**Property 20: Multipart Form Data for Media**
*For any* lesson update that includes media uploads, the frontend should use multipart/form-data content type.
**Validates: Requirements 9.4**

**Property 21: State Update After Save**
*For any* successful lesson update, the frontend should process the response and update local state accordingly.
**Validates: Requirements 9.5**

**Property 22: Client-Side Validation**
*For any* lesson save attempt, the frontend should validate that required fields are not empty before making the API request.
**Validates: Requirements 10.1**

**Property 23: Field-Specific Validation Errors**
*For any* validation failure, the frontend should display field-specific error messages to guide the user.
**Validates: Requirements 10.2**

## Error Handling

### Backend Error Scenarios

| Scenario | HTTP Status | Response | Action |
|----------|-------------|----------|--------|
| Missing lessonId in update | 400 | `{ error: true, message: "Lesson ID is required" }` | Return immediately without database query |
| LessonId not found | 404 | `{ error: true, message: "Lesson not found" }` | Return after database lookup fails |
| Missing required fields | 400 | `{ error: true, message: "Validation failed", details: {...} }` | Return validation errors |
| Invalid module_id | 400 | `{ error: true, message: "Invalid module ID" }` | Validate foreign key exists |
| Database error | 500 | `{ error: true, message: "Internal server error" }` | Log error, return generic message |
| Invalid lessonId format | 400 | `{ error: true, message: "Invalid lesson ID format" }` | Validate lessonId is integer |

### Frontend Error Scenarios

| Scenario | User Message | Console Log | Action |
|----------|--------------|-------------|--------|
| Missing lessonId on editor load | "Lesson ID is missing. Cannot edit lesson." | Full error details | Navigate back |
| Missing lessonId on save | "Cannot save: Lesson ID is missing" | Full error details | Prevent save |
| Network error | "Save failed: Please check your connection" | Full error details | Allow retry |
| Server error (4xx/5xx) | Server's error message | Full error details | Allow retry |
| Creation failure | "Failed to create lesson: [reason]" | Full error details | Stay on selection screen |
| Validation error | Field-specific messages | Validation details | Highlight fields |
| Success | "Lesson saved successfully" | Success confirmation | Navigate back or stay |

### Error Handling Implementation

**Backend Validation Middleware:**
```typescript
const validateLessonId = (req, res, next) => {
  const { lessonId } = req.params;
  
  if (!lessonId) {
    return res.status(400).json({
      error: true,
      message: "Lesson ID is required"
    });
  }
  
  if (!Number.isInteger(Number(lessonId))) {
    return res.status(400).json({
      error: true,
      message: "Invalid lesson ID format"
    });
  }
  
  next();
};

const validateLessonExists = async (req, res, next) => {
  const { lessonId } = req.params;
  const lesson = await db.query('SELECT id FROM lessons WHERE id = $1', [lessonId]);
  
  if (lesson.rows.length === 0) {
    return res.status(404).json({
      error: true,
      message: "Lesson not found"
    });
  }
  
  next();
};
```

**Frontend Error Handling:**
```typescript
const handleSaveError = (error: any) => {
  let userMessage: string;
  
  if (!lessonId) {
    userMessage = 'Cannot save: Lesson ID is missing';
  } else if (error.code === 'ECONNABORTED' || error.message.includes('Network')) {
    userMessage = 'Save failed: Please check your connection';
  } else if (error.response?.data?.message) {
    userMessage = error.response.data.message;
  } else {
    userMessage = error.message || 'An unexpected error occurred';
  }
  
  Alert.alert('Error', userMessage);
  console.error('Save error details:', {
    lessonId,
    error: error.response?.data || error.message,
    stack: error.stack,
  });
};
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests** focus on:
- Specific error messages (e.g., "Lesson ID is required")
- Specific HTTP status codes (400, 404, 500)
- Edge cases (empty strings, null values, malformed data)
- Integration between components
- UI state changes

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs
- Randomized lesson data generation
- Comprehensive input coverage
- Invariants that must always hold

### Property-Based Testing Configuration

**Library:** fast-check (TypeScript/JavaScript)

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: lesson-save-fix, Property {N}: {property text}`

**Example Property Test:**
```typescript
import fc from 'fast-check';

// Feature: lesson-save-fix, Property 1: Unique LessonId Generation
test('all created lessons have unique lessonIds', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.array(fc.record({
        name: fc.string({ minLength: 1 }),
        module_id: fc.integer({ min: 1 }),
        order_number: fc.integer({ min: 1 }),
      }), { minLength: 2, maxLength: 10 }),
      async (lessonDataArray) => {
        const createdLessons = [];
        
        for (const lessonData of lessonDataArray) {
          const response = await createLesson(lessonData);
          createdLessons.push(response.lesson_id);
        }
        
        const uniqueIds = new Set(createdLessons);
        expect(uniqueIds.size).toBe(createdLessons.length);
        expect(createdLessons.every(id => id !== null && id !== undefined)).toBe(true);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Coverage Requirements

**Backend Tests:**
- Property tests for all backend properties (1-8)
- Unit tests for specific error messages and status codes
- Integration tests for database operations
- Edge case tests for validation logic

**Frontend Tests:**
- Property tests for all frontend properties (9-23)
- Unit tests for specific UI states and messages
- Integration tests for navigation flows
- Mock API responses for error scenarios

**End-to-End Tests:**
- Complete lesson creation and update flow
- All 10 lesson types
- Error recovery scenarios
- Navigation preservation

### Test Organization

```
cohortz/__tests__/
├── api/
│   ├── lessonCreation.pbt.ts      # Properties 1-8
│   ├── lessonCreation.test.ts     # Unit tests for creation
│   ├── lessonUpdate.pbt.ts        # Properties 6-8
│   └── lessonUpdate.test.ts       # Unit tests for updates
├── components/
│   ├── editorScreens.pbt.ts       # Properties 12-18
│   ├── editorScreens.test.ts      # Unit tests for editors
│   └── lessonTypeSelection.test.ts # Unit tests for selection flow
└── integration/
    └── lessonLifecycle.test.ts    # End-to-end flows

cohortle-api/__tests__/
├── routes/
│   ├── lessonCreation.pbt.js      # Backend properties 1-5
│   ├── lessonCreation.test.js     # Backend unit tests
│   ├── lessonUpdate.pbt.js        # Backend properties 6-8
│   └── lessonUpdate.test.js       # Backend unit tests
└── middleware/
    └── validation.test.js         # Validation middleware tests
```

