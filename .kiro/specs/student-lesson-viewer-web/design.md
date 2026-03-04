# Design Document: Student Lesson Viewer Web

## Overview

The Student Lesson Viewer Web is a Next.js 14 application that provides authenticated students with a browser-based interface for viewing and interacting with lessons. The system supports four core lesson types (text, video, pdf, link) and integrates with the existing cohortle-api backend without requiring any backend modifications.

The design follows a component-based architecture using React Server Components and Client Components appropriately, leverages the existing Tailwind CSS styling, and implements a responsive layout optimized for desktop and tablet browsers.

## Architecture

### Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS (pre-configured)
- **State Management**: React Query (TanStack Query) for server state
- **Authentication**: Token-based (stored in cookies/localStorage)
- **Video Players**: 
  - YouTube: iframe embed
  - BunnyStream: iframe embed
- **PDF Viewer**: Browser native PDF viewer via iframe/embed

### Directory Structure

```
cohortle-web/
├── src/
│   ├── app/
│   │   ├── (marketing)/          # Existing marketing pages
│   │   │   ├── page.tsx          # Homepage
│   │   │   ├── about/
│   │   │   ├── contact/
│   │   │   ├── learner/
│   │   │   ├── partner/
│   │   │   ├── our-approach/
│   │   │   └── what-we-support/
│   │   ├── login/
│   │   │   └── page.tsx          # Login page
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Student dashboard (future)
│   │   └── lessons/
│   │       └── [lessonId]/
│   │           └── page.tsx      # Main lesson viewer page
│   ├── components/
│   │   └── lessons/
│   │       ├── LessonViewer.tsx      # Main viewer component
│   │       ├── TextLessonContent.tsx # Text lesson renderer
│   │       ├── VideoLessonContent.tsx # Video lesson renderer
│   │       ├── PdfLessonContent.tsx  # PDF lesson renderer
│   │       ├── LinkLessonContent.tsx # Link lesson renderer
│   │       ├── LessonComments.tsx    # Comments section
│   │       ├── LessonNavigation.tsx  # Navigation controls
│   │       └── CompletionButton.tsx  # Completion tracking
│   ├── lib/
│   │   ├── api/
│   │   │   ├── lessons.ts            # Lesson API functions
│   │   │   ├── comments.ts           # Comments API functions
│   │   │   └── auth.ts               # Auth utilities
│   │   ├── hooks/
│   │   │   ├── useLessonData.ts      # Lesson data hook
│   │   │   ├── useLessonCompletion.ts # Completion hook
│   │   │   └── useLessonComments.ts  # Comments hook
│   │   └── utils/
│   │       ├── lessonTypeDetection.ts # Type detection logic
│   │       └── videoUrlHelpers.ts    # Video URL parsing
│   └── types/
│       └── lesson.ts                 # TypeScript interfaces
```

### Routing

The application uses Next.js App Router with the following route structure:

**Existing Marketing Routes (unchanged):**
- `/` - Homepage (marketing)
- `/about` - About page
- `/contact` - Contact page
- `/learner` - Learner information
- `/partner` - Partner information
- `/our-approach` - Approach page
- `/what-we-support` - Support page

**New Learning App Routes:**
- `/login` - Login page for students
- `/dashboard` - Student dashboard (future enhancement)
- `/lessons/[lessonId]?cohortId=X` - Main lesson viewer page

**Lesson Viewer Query Parameters:**
- `lessonId` (required): The ID of the lesson to display
- `cohortId` (required): The ID of the cohort context

This structure maintains clear separation between the public marketing site and the authenticated learning application.

## Components and Interfaces

### Core Components

#### 1. LessonViewer (Client Component)

Main orchestrator component that handles lesson loading, type detection, and rendering.

```typescript
interface LessonViewerProps {
  lessonId: string;
  cohortId: string;
}

export function LessonViewer({ lessonId, cohortId }: LessonViewerProps) {
  // Fetch lesson data
  // Detect lesson type
  // Render appropriate content component
  // Handle loading and error states
}
```

**Responsibilities:**
- Fetch lesson data using React Query
- Detect lesson type based on content
- Render appropriate content component
- Coordinate completion tracking
- Display comments section
- Show navigation controls

#### 2. TextLessonContent (Client Component)

Renders rich text HTML content safely.

```typescript
interface TextLessonContentProps {
  title: string;
  htmlContent: string;
}

export function TextLessonContent({ title, htmlContent }: TextLessonContentProps) {
  // Sanitize and render HTML content
}
```

**Responsibilities:**
- Sanitize HTML to prevent XSS attacks
- Render formatted text content
- Apply appropriate typography styles

#### 3. VideoLessonContent (Client Component)

Embeds video players for YouTube and BunnyStream.

```typescript
interface VideoLessonContentProps {
  title: string;
  videoUrl: string;
  textContent?: string;
  onVideoEnd?: () => void;
}

export function VideoLessonContent({ 
  title, 
  videoUrl, 
  textContent,
  onVideoEnd 
}: VideoLessonContentProps) {
  // Detect video platform
  // Embed appropriate player
  // Handle video end event
}
```

**Responsibilities:**
- Detect YouTube vs BunnyStream URLs
- Embed appropriate iframe player
- Listen for video completion events
- Trigger auto-completion on video end
- Display supplementary text content

#### 4. PdfLessonContent (Client Component)

Displays PDF documents using browser native viewer.

```typescript
interface PdfLessonContentProps {
  title: string;
  pdfUrl: string;
  textContent?: string;
}

export function PdfLessonContent({ 
  title, 
  pdfUrl, 
  textContent 
}: PdfLessonContentProps) {
  // Embed PDF viewer
  // Handle load errors
  // Provide download fallback
}
```

**Responsibilities:**
- Embed PDF using iframe or object tag
- Handle PDF loading errors
- Provide download link fallback
- Display supplementary text content

#### 5. LinkLessonContent (Client Component)

Displays external link with description.

```typescript
interface LinkLessonContentProps {
  title: string;
  linkUrl: string;
  textContent?: string;
}

export function LinkLessonContent({ 
  title, 
  linkUrl, 
  textContent 
}: LinkLessonContentProps) {
  // Display link with open button
  // Show description
}
```

**Responsibilities:**
- Display external URL prominently
- Provide "Open Link" button (opens in new tab)
- Show external link indicator icon
- Display supplementary text content

#### 6. LessonComments (Client Component)

Displays and manages lesson comments.

```typescript
interface LessonCommentsProps {
  lessonId: string;
  cohortId: string;
}

export function LessonComments({ lessonId, cohortId }: LessonCommentsProps) {
  // Fetch comments
  // Display comment list
  // Handle new comment submission
}
```

**Responsibilities:**
- Fetch comments from API
- Display comments with author and timestamp
- Provide comment input form
- Submit new comments
- Handle optimistic updates

#### 7. CompletionButton (Client Component)

Manages lesson completion state and actions.

```typescript
interface CompletionButtonProps {
  lessonId: string;
  cohortId: string;
  isCompleted: boolean;
  onComplete?: () => void;
}

export function CompletionButton({ 
  lessonId, 
  cohortId, 
  isCompleted,
  onComplete 
}: CompletionButtonProps) {
  // Display completion status
  // Handle manual completion
}
```

**Responsibilities:**
- Display current completion status
- Provide "Mark as Complete" button
- Handle completion API call
- Update UI on success
- Trigger callback for navigation updates

#### 8. LessonNavigation (Client Component)

Provides navigation controls between lessons.

```typescript
interface LessonNavigationProps {
  currentLessonId: string;
  moduleId: string;
  cohortId: string;
  isCompleted: boolean;
}

export function LessonNavigation({ 
  currentLessonId, 
  moduleId, 
  cohortId,
  isCompleted 
}: LessonNavigationProps) {
  // Fetch sibling lessons
  // Determine next lesson
  // Provide navigation buttons
}
```

**Responsibilities:**
- Fetch all lessons in the module
- Determine next lesson based on order
- Show "Next Lesson" button when available
- Show "Back to Dashboard" button
- Conditionally enable "Next" based on completion

## Data Models

### Lesson Interface

```typescript
interface Lesson {
  id: number;
  name: string;
  description?: string;
  text?: string;           // HTML content
  media?: string;          // URL to video/pdf/link
  module_id: number;
  order_number: number;
  lesson_type?: LessonUnitType;
  created_at: string;
  updated_at: string;
}

type LessonUnitType = 'text' | 'video' | 'pdf' | 'link';
```

### Completion Status Interface

```typescript
interface LessonCompletion {
  lesson_id: number;
  cohort_id: number;
  user_id: number;
  completed: boolean;
  completed_at?: string;
}
```

### Comment Interface

```typescript
interface LessonComment {
  id: number;
  lesson_id: number;
  cohort_id: number;
  user_id: number;
  author_name: string;
  content: string;
  created_at: string;
  updated_at: string;
}
```

### Module Lessons Interface

```typescript
interface ModuleLesson {
  id: number;
  name: string;
  order_number: number;
  module_id: number;
}
```

## Lesson Type Detection Logic

The system detects lesson types based on content analysis:

```typescript
function detectLessonType(lesson: Lesson): LessonUnitType {
  // Priority 1: Check explicit lesson_type field
  if (lesson.lesson_type) {
    return lesson.lesson_type;
  }
  
  // Priority 2: Analyze media URL
  if (lesson.media) {
    if (isYouTubeUrl(lesson.media)) {
      return 'video';
    }
    if (isBunnyStreamUrl(lesson.media)) {
      return 'video';
    }
    if (isPdfUrl(lesson.media)) {
      return 'pdf';
    }
    // Default to link for other URLs
    return 'link';
  }
  
  // Priority 3: Text-only lesson
  if (lesson.text) {
    return 'text';
  }
  
  // Fallback
  return 'text';
}

function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be');
}

function isBunnyStreamUrl(url: string): boolean {
  return url.includes('iframe.mediadelivery.net');
}

function isPdfUrl(url: string): boolean {
  return url.toLowerCase().endsWith('.pdf') || 
         url.includes('content-type=application/pdf');
}
```

## Video URL Helpers

### YouTube URL Conversion

```typescript
function getYouTubeEmbedUrl(url: string): string {
  // Extract video ID from various YouTube URL formats
  // youtube.com/watch?v=VIDEO_ID
  // youtu.be/VIDEO_ID
  // youtube.com/embed/VIDEO_ID
  
  const videoId = extractYouTubeVideoId(url);
  return `https://www.youtube.com/embed/${videoId}`;
}

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&]+)/,
    /(?:youtu\.be\/)([^?]+)/,
    /(?:youtube\.com\/embed\/)([^?]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}
```

### BunnyStream URL Handling

BunnyStream URLs are already in iframe-ready format:
```
https://iframe.mediadelivery.net/embed/{library_id}/{video_id}
```

No transformation needed - use directly in iframe src.

## API Integration

### API Client Setup

```typescript
// lib/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Add auth token to all requests
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken(); // From cookies or localStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

### Lesson API Functions

```typescript
// lib/api/lessons.ts
export async function fetchLesson(lessonId: string): Promise<Lesson> {
  const response = await apiClient.get(`/api/lessons/${lessonId}`);
  return response.data;
}

export async function fetchLessonCompletion(
  lessonId: string, 
  cohortId: string
): Promise<LessonCompletion> {
  const response = await apiClient.get(
    `/api/lessons/${lessonId}/completion`,
    { params: { cohort_id: cohortId } }
  );
  return response.data;
}

export async function markLessonComplete(
  lessonId: string,
  cohortId: string
): Promise<void> {
  await apiClient.post(`/api/lessons/${lessonId}/complete`, {
    cohort_id: cohortId,
  });
}

export async function fetchModuleLessons(
  moduleId: string,
  cohortId: string
): Promise<ModuleLesson[]> {
  const response = await apiClient.get(
    `/api/modules/${moduleId}/lessons`,
    { params: { cohort_id: cohortId } }
  );
  return response.data;
}
```

### Comments API Functions

```typescript
// lib/api/comments.ts
export async function fetchLessonComments(
  lessonId: string,
  cohortId: string
): Promise<LessonComment[]> {
  const response = await apiClient.get(
    `/api/lessons/${lessonId}/comments`,
    { params: { cohort_id: cohortId } }
  );
  return response.data;
}

export async function postLessonComment(
  lessonId: string,
  cohortId: string,
  content: string
): Promise<LessonComment> {
  const response = await apiClient.post(
    `/api/lessons/${lessonId}/comments`,
    { content, cohort_id: cohortId }
  );
  return response.data;
}
```

### React Query Hooks

```typescript
// lib/hooks/useLessonData.ts
export function useLessonData(lessonId: string) {
  return useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => fetchLesson(lessonId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// lib/hooks/useLessonCompletion.ts
export function useLessonCompletion(lessonId: string, cohortId: string) {
  return useQuery({
    queryKey: ['lesson-completion', lessonId, cohortId],
    queryFn: () => fetchLessonCompletion(lessonId, cohortId),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useMarkLessonComplete() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ lessonId, cohortId }: { lessonId: string; cohortId: string }) =>
      markLessonComplete(lessonId, cohortId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['lesson-completion', variables.lessonId, variables.cohortId],
      });
    },
  });
}

// lib/hooks/useLessonComments.ts
export function useLessonComments(lessonId: string, cohortId: string) {
  return useQuery({
    queryKey: ['lesson-comments', lessonId, cohortId],
    queryFn: () => fetchLessonComments(lessonId, cohortId),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function usePostComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      lessonId, 
      cohortId, 
      content 
    }: { 
      lessonId: string; 
      cohortId: string; 
      content: string;
    }) => postLessonComment(lessonId, cohortId, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['lesson-comments', variables.lessonId, variables.cohortId],
      });
    },
  });
}
```

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Authentication token inclusion in API requests

*For any* API request made by the Lesson_Viewer, the request headers should include the authentication token.

**Validates: Requirements 1.4**

### Property 2: HTML content rendering preservation

*For any* valid HTML content received from the API, the rendered output should preserve all formatting tags (bold, italic, lists, headings, etc.).

**Validates: Requirements 2.2, 2.4**

### Property 3: Lesson title placement

*For any* lesson, the title should appear before the main content in the DOM structure.

**Validates: Requirements 2.3**

### Property 4: YouTube video embedding

*For any* lesson with a media URL containing 'youtube.com' or 'youtu.be', the Lesson_Viewer should render a YouTube iframe embed.

**Validates: Requirements 3.1**

### Property 5: BunnyStream video embedding

*For any* lesson with a media URL containing 'iframe.mediadelivery.net', the Lesson_Viewer should render a BunnyStream iframe embed.

**Validates: Requirements 3.2**

### Property 6: Text content placement with media

*For any* lesson containing both media (video/pdf) and text content, the text content should appear after the media element in the DOM structure.

**Validates: Requirements 3.4, 4.5**

### Property 7: PDF document embedding

*For any* lesson with a PDF URL, the Lesson_Viewer should create an iframe or embed element with the PDF URL as the source.

**Validates: Requirements 4.2**

### Property 8: External link display

*For any* link lesson, the rendered output should contain the external URL in visible text and a button/link element with target="_blank" attribute.

**Validates: Requirements 5.1, 5.2**

### Property 9: External link indicator presence

*For any* link lesson, the rendered output should include a visual indicator (icon or text) that the link opens an external resource.

**Validates: Requirements 5.4**

### Property 10: Link lesson text content display

*For any* link lesson with text content, the text content should be rendered alongside the link.

**Validates: Requirements 5.3**

### Property 11: Completion button conditional rendering

*For any* lesson with completion status completed=false, the UI should render a "Mark as Complete" button; for any lesson with completed=true, the UI should render a "Completed" indicator instead.

**Validates: Requirements 6.2, 6.5**

### Property 12: Next lesson button conditional rendering

*For any* completed lesson that has a next lesson in the module, the UI should display a "Next Lesson" button; for any lesson that is the last in its module, no "Next Lesson" button should be displayed.

**Validates: Requirements 7.2, 7.5**

### Property 13: Back button presence

*For any* lesson page, a "Back" button should be present in the UI.

**Validates: Requirements 7.4**

### Property 14: Next lesson determination

*For any* lesson in a module, the system should correctly identify the next lesson as the lesson with the next sequential order_number, or null if no such lesson exists.

**Validates: Requirements 7.1**

### Property 15: Comment chronological ordering

*For any* set of comments for a lesson, the displayed comments should be sorted in chronological order by created_at timestamp.

**Validates: Requirements 8.2**

### Property 16: Comment display format

*For any* comment, the rendered output should include the author name, timestamp, and content text.

**Validates: Requirements 8.5**

### Property 17: Lesson type detection from YouTube URLs

*For any* lesson with a media URL matching YouTube URL patterns (youtube.com, youtu.be), the detected lesson type should be 'video'.

**Validates: Requirements 11.1**

### Property 18: Lesson type detection from BunnyStream URLs

*For any* lesson with a media URL containing 'iframe.mediadelivery.net', the detected lesson type should be 'video'.

**Validates: Requirements 11.2**

### Property 19: Lesson type detection from PDF URLs

*For any* lesson with a media URL ending in '.pdf', the detected lesson type should be 'pdf'.

**Validates: Requirements 11.3**

### Property 20: Lesson type detection fallback for links

*For any* lesson with a media URL that doesn't match video or PDF patterns, the detected lesson type should be 'link'.

**Validates: Requirements 11.4**

### Property 21: Lesson type detection for text-only lessons

*For any* lesson with no media URL but with text content, the detected lesson type should be 'text'.

**Validates: Requirements 11.5**

### Property 22: Component selection based on lesson type

*For any* lesson with a detected type, the appropriate content component (TextLessonContent, VideoLessonContent, PdfLessonContent, or LinkLessonContent) should be rendered.

**Validates: Requirements 11.6**

### Property 23: API endpoint correctness for lesson fetching

*For any* lesson data fetch operation, the API request URL should match the pattern `/api/lessons/{lessonId}`.

**Validates: Requirements 12.1**

### Property 24: API endpoint correctness for completion fetching

*For any* completion status fetch operation, the API request URL should match the pattern `/api/lessons/{lessonId}/completion` and include cohortId as a query parameter.

**Validates: Requirements 12.2, 12.7**

### Property 25: API endpoint correctness for marking complete

*For any* mark complete operation, the API request should be a POST to `/api/lessons/{lessonId}/complete` with cohort_id in the request body.

**Validates: Requirements 12.3**

### Property 26: API endpoint correctness for module lessons

*For any* module lessons fetch operation, the API request URL should match the pattern `/api/modules/{moduleId}/lessons` and include cohortId as a query parameter.

**Validates: Requirements 12.4, 12.7**

### Property 27: API endpoint correctness for comments

*For any* comments fetch operation, the API request URL should match the pattern `/api/lessons/{lessonId}/comments` and include cohortId as a query parameter; for any comment post operation, the API request should be a POST to `/api/lessons/{lessonId}/comments`.

**Validates: Requirements 12.5, 12.6, 12.7**

### Property 28: YouTube embed URL transformation

*For any* YouTube URL (in various formats: watch?v=, youtu.be/, embed/), the system should extract the video ID and generate a valid embed URL in the format `https://www.youtube.com/embed/{videoId}`.

**Validates: Requirements 3.1**

## Error Handling

### Authentication Errors

**Unauthenticated Access:**
- Detect missing or invalid auth token
- Redirect to `/login` page with return URL
- Preserve intended lesson URL for post-login redirect

**Token Expiration:**
- Intercept 401 responses from API
- Clear expired token from storage
- Redirect to `/login` with session expired message

### API Errors

**Network Errors:**
- Display user-friendly error message
- Provide retry button
- Log error details for debugging

**404 Not Found:**
- Display "Lesson not found" message
- Provide link back to module/course overview

**500 Server Errors:**
- Display generic error message
- Provide retry button
- Avoid exposing technical details to users

### Content Loading Errors

**Video Load Failures:**
- Catch iframe load errors
- Display error message in video container
- Continue rendering other lesson content (text, comments)
- Provide fallback message: "Video unavailable"

**PDF Load Failures:**
- Detect PDF loading errors
- Display error message
- Provide direct download link as fallback
- Continue rendering other lesson content

**Missing Content:**
- Handle lessons with no content gracefully
- Display "No content available" message
- Still show comments section

### Validation Errors

**Missing Route Parameters:**
- Validate lessonId and cohortId on page load
- Display validation error if missing
- Prevent API calls with invalid parameters
- Provide link back to course overview

**Invalid Parameter Types:**
- Validate parameter types (should be numeric IDs)
- Display validation error for non-numeric values
- Prevent rendering with invalid data

### Comment Submission Errors

**Empty Comment:**
- Validate comment content before submission
- Display inline validation error
- Disable submit button for empty content

**API Submission Failure:**
- Display error message near comment form
- Preserve user's comment text
- Provide retry option

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of lesson rendering
- Edge cases (empty content, missing fields)
- Error conditions (API failures, load errors)
- User interactions (button clicks, form submissions)
- Integration points between components

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs
- Type detection logic across various URL formats
- API endpoint construction for all operations
- Conditional rendering based on state
- Content ordering and structure

Both approaches are complementary and necessary for comprehensive coverage. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing Configuration

**Library:** fast-check (JavaScript/TypeScript property-based testing library)

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: student-lesson-viewer-web, Property {N}: {property description}`

**Example Property Test Structure:**

```typescript
import fc from 'fast-check';

describe('Feature: student-lesson-viewer-web', () => {
  it('Property 17: Lesson type detection from YouTube URLs', () => {
    // Feature: student-lesson-viewer-web, Property 17
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('https://www.youtube.com/watch?v='),
          fc.constant('https://youtu.be/'),
          fc.constant('https://www.youtube.com/embed/')
        ).chain(prefix => 
          fc.string({ minLength: 11, maxLength: 11 }).map(id => prefix + id)
        ),
        (youtubeUrl) => {
          const lesson = { media: youtubeUrl, text: 'content' };
          const detectedType = detectLessonType(lesson);
          expect(detectedType).toBe('video');
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing Focus Areas

**Component Rendering:**
- Test each lesson type component renders correctly
- Test loading states display properly
- Test error states display appropriate messages
- Test empty states (no comments, no content)

**User Interactions:**
- Test "Mark as Complete" button triggers API call
- Test "Next Lesson" button navigates correctly
- Test comment submission posts to API
- Test external link button opens in new tab

**API Integration:**
- Mock API responses and test data flow
- Test error handling for failed requests
- Test loading states during API calls
- Test cache invalidation after mutations

**Edge Cases:**
- Empty lesson content
- Missing optional fields
- Last lesson in module (no next button)
- Lessons with only text, only video, or both
- Very long comment threads
- Special characters in content

### Integration Testing

**End-to-End Flows:**
- Complete lesson viewing flow (load → view → complete → next)
- Comment posting flow (load comments → post → see new comment)
- Error recovery flow (error → retry → success)
- Authentication flow (unauthenticated → redirect → login → return)

**Cross-Component Integration:**
- LessonViewer coordinates all child components
- Completion button updates navigation state
- Comment submission updates comment list
- Type detection drives component selection

### Testing Tools

- **Jest**: Unit test runner
- **React Testing Library**: Component testing
- **fast-check**: Property-based testing
- **MSW (Mock Service Worker)**: API mocking
- **Playwright** (optional): E2E testing for critical flows

### Test Coverage Goals

- **Unit Tests**: 80%+ code coverage
- **Property Tests**: All correctness properties implemented
- **Integration Tests**: All major user flows covered
- **E2E Tests**: Critical path (view lesson → complete → next)

## Implementation Notes

### Next.js 14 Considerations

**Server vs Client Components:**
- Page component (`app/lessons/[lessonId]/page.tsx`) can be a Server Component for initial data fetching
- Interactive components (LessonViewer, CompletionButton, Comments) must be Client Components
- Use `'use client'` directive appropriately

**Data Fetching:**
- Use React Query for client-side data fetching and caching
- Consider Server Components for initial page load optimization
- Implement proper loading and error boundaries

### Authentication Implementation

**Token Storage:**
- Use HTTP-only cookies for security (preferred)
- Fallback to localStorage if cookies not available
- Implement token refresh mechanism if supported by API

**Protected Routes:**
- Create middleware to check authentication on `/lessons/*` and `/dashboard` routes
- Redirect unauthenticated users to `/login`
- Preserve return URL for post-login redirect

### Performance Optimizations

**Code Splitting:**
- Lazy load lesson type components
- Split video player embeds into separate chunks
- Use dynamic imports for heavy dependencies

**Caching:**
- Configure React Query cache times appropriately
- Cache lesson data for 5 minutes
- Cache completion status for 1 minute
- Cache comments for 30 seconds

**Image/Video Optimization:**
- Use Next.js Image component where applicable
- Lazy load video embeds (load on scroll or interaction)
- Preload critical resources

### Accessibility

**Keyboard Navigation:**
- Ensure all interactive elements are keyboard accessible
- Implement proper focus management
- Use semantic HTML elements

**Screen Readers:**
- Add ARIA labels to buttons and controls
- Provide alt text for icons
- Announce dynamic content changes

**Color Contrast:**
- Ensure text meets WCAG AA standards
- Don't rely solely on color for information
- Test with accessibility tools

### Security Considerations

**XSS Prevention:**
- Sanitize HTML content before rendering
- Use DOMPurify or similar library
- Never use dangerouslySetInnerHTML without sanitization

**CSRF Protection:**
- Include CSRF tokens in mutation requests
- Validate tokens on backend
- Use SameSite cookie attribute

**Content Security Policy:**
- Configure CSP headers to allow YouTube and BunnyStream embeds
- Restrict inline scripts
- Whitelist trusted domains

## Future Enhancements

While out of scope for this initial implementation, these enhancements could be added later:

1. **Mobile Responsive Design**: Optimize for mobile phone screens
2. **Offline Support**: Cache lessons for offline viewing
3. **Progress Tracking**: Visual progress indicators for modules
4. **Bookmarking**: Save position in video lessons
5. **Note Taking**: Allow students to take notes on lessons
6. **Search**: Search within lesson content
7. **Accessibility Improvements**: Enhanced screen reader support, keyboard shortcuts
8. **Analytics**: Track lesson engagement and completion times
9. **Social Features**: Like/react to comments, @mentions
10. **Additional Lesson Types**: Support for quiz, assignment, form, reflection, practical_task
