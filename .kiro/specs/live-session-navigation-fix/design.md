# Design Document: Live Session Navigation Fix

## Overview

This design addresses the Live Session Navigation Bug where clicking into a live session shows a blank screen and back navigation exits the app. The root cause is that the Module_Screen (module.tsx) doesn't handle live session lesson types properly - it attempts to render video content when no media URL exists, and doesn't parse or display the session data stored in the description field.

The fix involves:
1. Adding live session type detection and specialized rendering
2. Parsing and displaying session data (date, time, duration, meeting link)
3. Ensuring proper error boundaries to prevent blank screens
4. Validating route parameters to maintain navigation stack integrity
5. Providing fallback UI when data is missing or invalid

## Architecture

### Component Structure

```
Module Screen (module.tsx)
├── Error Boundary (wraps entire screen)
├── Route Parameter Validation
├── Lesson Type Detection
│   ├── Live Session Renderer (new)
│   │   ├── Session Info Display
│   │   ├── Meeting Link Button
│   │   └── Session Notes
│   ├── Video Renderer (existing)
│   └── Text Renderer (existing)
├── Lesson Comments
└── Navigation Controls
```

### Data Flow

```
User clicks lesson → Router navigates with params → Module Screen
                                                    ↓
                                    Validate lessonId & cohortId
                                                    ↓
                                    Fetch lesson data via useGetLesson
                                                    ↓
                                    Detect lesson type from data
                                                    ↓
                        ┌───────────────────────────┴───────────────────────────┐
                        ↓                                                       ↓
            Live Session Type                                        Other Types
                        ↓                                                       ↓
        Parse description field                                    Render normally
        as LiveSessionData JSON                                    (video/text)
                        ↓
        Display session info UI
        (date, time, duration, link)
```

## Components and Interfaces

### 1. LiveSessionData Interface

```typescript
interface LiveSessionData {
  sessionDate: string;      // ISO 8601 date string
  duration: number;         // Duration in minutes
  meetingLink: string;      // Video conference URL
  notes: string;            // Optional session notes
}
```

This interface matches the data structure saved by the LiveSessionEditor.

### 2. LiveSessionDisplay Component

A new component to render live session information within the Module screen.

```typescript
interface LiveSessionDisplayProps {
  sessionData: LiveSessionData;
  lessonTitle: string;
}

const LiveSessionDisplay: React.FC<LiveSessionDisplayProps> = ({
  sessionData,
  lessonTitle
}) => {
  // Parse and format date/time
  // Display session information
  // Provide meeting link button
  // Show session notes if available
}
```

### 3. Enhanced Module Screen

Modifications to the existing Module component:

```typescript
const Module = () => {
  // Existing state...
  const [lessonType, setLessonType] = useState<LessonUnitType | null>(null);
  const [sessionData, setSessionData] = useState<LiveSessionData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Detect lesson type from lessonData
  useEffect(() => {
    if (lessonData) {
      // Determine type based on data characteristics
      // For live sessions: no media, has description with session data
      detectLessonType(lessonData);
    }
  }, [lessonData]);

  // Parse session data for live sessions
  useEffect(() => {
    if (lessonType === 'live_session' && lessonData?.description) {
      try {
        const parsed = JSON.parse(lessonData.description);
        setSessionData(parsed);
        setParseError(null);
      } catch (error) {
        setParseError('Could not load session information');
      }
    }
  }, [lessonType, lessonData]);

  // Conditional rendering based on lesson type
  return (
    <SafeAreaView>
      {lessonType === 'live_session' ? (
        <LiveSessionDisplay 
          sessionData={sessionData} 
          lessonTitle={title}
        />
      ) : (
        // Existing video/text rendering
      )}
    </SafeAreaView>
  );
}
```

### 4. Route Parameter Validation

Add validation at the start of the Module component:

```typescript
const Module = () => {
  const params = useLocalSearchParams<{ lessonId?: string; cohortId?: string }>();
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.lessonId || !params.cohortId) {
      setValidationError('Missing required parameters');
    } else if (isNaN(Number(params.lessonId)) || isNaN(Number(params.cohortId))) {
      setValidationError('Invalid parameter format');
    }
  }, [params]);

  if (validationError) {
    return <ErrorFallback message={validationError} onBack={() => router.back()} />;
  }
  
  // Rest of component...
}
```

### 5. Error Boundary Integration

Wrap the Module screen export with an error boundary:

```typescript
// In module.tsx
export default function ModuleWithErrorBoundary() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <ErrorFallback 
          error={error}
          onRetry={reset}
          onBack={() => router.back()}
        />
      )}
    >
      <Module />
    </ErrorBoundary>
  );
}
```

## Data Models

### Lesson Data Structure

The lesson object returned from the API:

```typescript
interface Lesson {
  id: number;
  name: string;
  description: string;      // For live sessions: JSON-encoded LiveSessionData
  media: string | null;     // For live sessions: typically null or empty
  text: string | null;      // Optional text content
  module_id: number;
  order_number: number;
  status: 'draft' | 'published';
  type?: LessonUnitType;    // May not be present in API response
  created_at: string;
  updated_at: string;
}
```

### Lesson Type Detection Logic

Since the API may not return a `type` field, we need to infer the lesson type:

```typescript
function detectLessonType(lesson: Lesson): LessonUnitType {
  // Check if description contains valid LiveSessionData JSON
  if (lesson.description && !lesson.media) {
    try {
      const parsed = JSON.parse(lesson.description);
      if (parsed.sessionDate && parsed.duration && parsed.meetingLink) {
        return 'live_session';
      }
    } catch {
      // Not a live session
    }
  }
  
  // Check for video
  if (lesson.media) {
    return 'video';
  }
  
  // Default to text
  return 'text';
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Live Session Detection Accuracy

*For any* lesson with valid LiveSessionData in the description field and no media URL, the lesson type detection SHALL identify it as a 'live_session' type.

**Validates: Requirements 7.1, 7.2**

### Property 2: Session Data Parsing Consistency

*For any* valid LiveSessionData JSON string, parsing then stringifying SHALL produce equivalent data with all required fields (sessionDate, duration, meetingLink) preserved.

**Validates: Requirements 1.2, 1.3**

### Property 3: Navigation Stack Preservation

*For any* navigation to the Module screen with valid route parameters, pressing the back button SHALL return to the previous screen without exiting the application.

**Validates: Requirements 2.1, 2.2, 2.3, 3.2**

### Property 4: Parameter Validation Completeness

*For any* route parameters passed to the Module screen, if lessonId or cohortId is missing or invalid, the screen SHALL display an error message and provide navigation options without attempting to fetch data.

**Validates: Requirements 6.1, 6.2, 6.3**

### Property 5: Error Boundary Isolation

*For any* rendering error within the Module screen, the Error Boundary SHALL catch the error and display a fallback UI without crashing the entire application.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 6: Partial Content Rendering

*For any* live session with missing or invalid session data, the Module screen SHALL render the lesson title and any available text content rather than showing a blank screen.

**Validates: Requirements 1.4, 4.4**

### Property 7: Meeting Link Validation

*For any* LiveSessionData with a meetingLink field, the link SHALL be validated as a proper URL format before being displayed as a clickable element.

**Validates: Requirements 5.2**

### Property 8: Date Formatting Consistency

*For any* valid ISO 8601 date string in sessionDate, the formatting function SHALL produce a human-readable date and time string that includes day, month, year, hour, and minute information.

**Validates: Requirements 5.2, 5.3**

## Error Handling

### Error Categories

1. **Missing Route Parameters**
   - Detection: Check params.lessonId and params.cohortId on mount
   - Handling: Display error message with "Go Back" button
   - User Action: Navigate back to previous screen

2. **Invalid Route Parameters**
   - Detection: Validate that parameters are numeric
   - Handling: Display error message with "Go Back" button
   - User Action: Navigate back to previous screen

3. **API Fetch Failure**
   - Detection: useGetLesson hook returns error
   - Handling: Display loading state, then error message with "Retry" button
   - User Action: Retry fetch or navigate back

4. **Session Data Parse Failure**
   - Detection: JSON.parse throws error on description field
   - Handling: Display fallback message "Session information unavailable"
   - User Action: Continue viewing lesson, contact instructor

5. **Missing Session Data Fields**
   - Detection: Parsed object missing required fields
   - Handling: Display partial information with warnings for missing fields
   - User Action: Continue viewing lesson, contact instructor

6. **Component Rendering Error**
   - Detection: Error Boundary catches error
   - Handling: Display error fallback UI with error details
   - User Action: Retry rendering or navigate back

### Error Messages

```typescript
const ERROR_MESSAGES = {
  MISSING_PARAMS: 'Unable to load lesson. Required information is missing.',
  INVALID_PARAMS: 'Unable to load lesson. Invalid lesson or cohort ID.',
  FETCH_FAILED: 'Failed to load lesson. Please check your connection and try again.',
  PARSE_FAILED: 'Session information could not be loaded. The lesson may still contain other content.',
  MISSING_FIELDS: 'Some session details are unavailable. Please contact your instructor.',
  RENDER_ERROR: 'An unexpected error occurred while displaying this lesson.',
};
```

### Error Fallback Component

```typescript
interface ErrorFallbackProps {
  error?: Error;
  message?: string;
  onRetry?: () => void;
  onBack: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  message,
  onRetry,
  onBack
}) => {
  return (
    <SafeAreaView style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
      <Text style={styles.errorTitle}>Oops!</Text>
      <Text style={styles.errorMessage}>
        {message || error?.message || ERROR_MESSAGES.RENDER_ERROR}
      </Text>
      <View style={styles.errorActions}>
        {onRetry && (
          <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
```

## Testing Strategy

### Unit Tests

Unit tests will focus on specific examples, edge cases, and error conditions:

1. **Lesson Type Detection**
   - Test detection with valid live session data
   - Test detection with video lesson (has media)
   - Test detection with text lesson (no media, no session data)
   - Test detection with malformed JSON in description

2. **Session Data Parsing**
   - Test parsing valid LiveSessionData JSON
   - Test parsing with missing optional fields (notes)
   - Test parsing with invalid JSON
   - Test parsing with missing required fields

3. **Date Formatting**
   - Test formatting with various ISO 8601 date strings
   - Test formatting with past dates
   - Test formatting with future dates
   - Test formatting with invalid date strings

4. **URL Validation**
   - Test validation with valid URLs (https, http)
   - Test validation with Zoom links
   - Test validation with Google Meet links
   - Test validation with invalid URLs

5. **Error Boundary**
   - Test that errors are caught and don't crash the app
   - Test that fallback UI is displayed
   - Test that retry functionality works

### Property-Based Tests

Property-based tests will verify universal properties across all inputs. Each test should run a minimum of 100 iterations.

1. **Property Test: Live Session Detection**
   - **Feature: live-session-navigation-fix, Property 1: Live Session Detection Accuracy**
   - Generate random lesson objects with valid LiveSessionData
   - Verify all are detected as 'live_session' type
   - Generate random lesson objects with media URLs
   - Verify none are detected as 'live_session' type

2. **Property Test: Session Data Round Trip**
   - **Feature: live-session-navigation-fix, Property 2: Session Data Parsing Consistency**
   - Generate random LiveSessionData objects
   - Stringify then parse each object
   - Verify all required fields are preserved and equal

3. **Property Test: Parameter Validation**
   - **Feature: live-session-navigation-fix, Property 4: Parameter Validation Completeness**
   - Generate random valid and invalid parameter combinations
   - Verify validation correctly identifies invalid parameters
   - Verify valid parameters pass validation

4. **Property Test: Date Formatting**
   - **Feature: live-session-navigation-fix, Property 8: Date Formatting Consistency**
   - Generate random valid ISO 8601 date strings
   - Format each date string
   - Verify output contains day, month, year, hour, minute
   - Verify output is human-readable (matches expected format)

5. **Property Test: URL Validation**
   - **Feature: live-session-navigation-fix, Property 7: Meeting Link Validation**
   - Generate random valid URLs
   - Verify all pass validation
   - Generate random invalid strings
   - Verify all fail validation

### Integration Tests

Integration tests will verify the complete flow:

1. **Navigation Flow Test**
   - Navigate from course screen to live session
   - Verify Module screen renders
   - Press back button
   - Verify return to course screen (not app exit)

2. **Live Session Display Test**
   - Navigate to live session with valid data
   - Verify session info is displayed
   - Verify meeting link is clickable
   - Verify notes are displayed if present

3. **Error Recovery Test**
   - Navigate to live session with invalid data
   - Verify error message is displayed
   - Press "Go Back" button
   - Verify return to previous screen

### Testing Configuration

- **Framework**: Jest with React Native Testing Library
- **Property Testing Library**: fast-check
- **Minimum Iterations**: 100 per property test
- **Coverage Target**: 80% for modified files
- **Test Location**: `cohortz/__tests__/screens/liveSessionNavigation.test.ts` (unit tests)
- **Test Location**: `