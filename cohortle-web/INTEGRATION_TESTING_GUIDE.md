# Integration Testing Guide - Student Lesson Viewer Web

## Overview

This guide provides instructions for integration testing the Student Lesson Viewer Web application with the cohortle-api backend. Integration tests validate that the frontend correctly communicates with the backend API and handles real-world scenarios.

## Prerequisites

### 1. Backend Setup (cohortle-api)

Ensure the backend is running and accessible:

```bash
cd cohortle-api
npm install
npm start
```

The API should be running on `http://localhost:3001` (or your configured port).

### 2. Database Setup

Ensure the database has test data:
- At least one user account (student role)
- At least one cohort with the student as a member
- At least one module with lessons in various formats (text, video, PDF, link)
- Some existing comments on lessons

### 3. Frontend Setup

Configure the frontend to connect to the backend:

```bash
cd cohortle-web

# Create .env.local if it doesn't exist
cp .env.example .env.local

# Edit .env.local to set:
# NEXT_PUBLIC_API_URL=http://localhost:3001
```

Install dependencies:
```bash
npm install
```

## Manual Integration Testing Checklist

### Test Flow 1: Authentication

**Objective**: Verify authentication flow works correctly

1. **Unauthenticated Access**
   - [ ] Navigate to `http://localhost:3000/lessons/1?cohortId=1` without being logged in
   - [ ] Verify redirect to `/login` page
   - [ ] Verify return URL is preserved in query params

2. **Login**
   - [ ] Log in with valid credentials
   - [ ] Verify auth token is stored (check cookies/localStorage)
   - [ ] Verify redirect back to intended lesson page

3. **Token Expiration**
   - [ ] Clear auth token manually
   - [ ] Try to access a lesson page
   - [ ] Verify redirect to login

### Test Flow 2: Text Lesson Viewing

**Objective**: Verify text lessons display correctly

1. **Load Text Lesson**
   - [ ] Navigate to a text lesson: `/lessons/{textLessonId}?cohortId={cohortId}`
   - [ ] Verify lesson title displays prominently
   - [ ] Verify HTML content renders with proper formatting
   - [ ] Verify rich text (bold, italic, lists, headings) displays correctly

2. **XSS Protection**
   - [ ] Create a text lesson with malicious HTML (e.g., `<script>alert('xss')</script>`)
   - [ ] Verify the script does not execute
   - [ ] Verify content is sanitized

### Test Flow 3: Video Lesson Viewing

**Objective**: Verify video lessons work with YouTube and BunnyStream

1. **YouTube Video**
   - [ ] Navigate to a lesson with YouTube URL
   - [ ] Verify YouTube iframe embeds correctly
   - [ ] Verify video player controls work (play, pause, seek)
   - [ ] Verify fullscreen mode works
   - [ ] Watch video to completion
   - [ ] Verify lesson auto-marks as complete

2. **BunnyStream Video**
   - [ ] Navigate to a lesson with BunnyStream URL
   - [ ] Verify BunnyStream iframe embeds correctly
   - [ ] Verify video player controls work
   - [ ] Verify text content displays below video (if present)

3. **Video Error Handling**
   - [ ] Navigate to a lesson with invalid video URL
   - [ ] Verify error message displays
   - [ ] Verify other lesson content still displays

### Test Flow 4: PDF Lesson Viewing

**Objective**: Verify PDF documents display correctly

1. **PDF Display**
   - [ ] Navigate to a lesson with PDF URL
   - [ ] Verify PDF embeds in browser viewer
   - [ ] Verify PDF is scrollable and zoomable
   - [ ] Verify text content displays below PDF (if present)

2. **PDF Error Handling**
   - [ ] Navigate to a lesson with invalid PDF URL
   - [ ] Verify error message displays
   - [ ] Verify download link is provided as fallback

### Test Flow 5: Link Lesson Viewing

**Objective**: Verify external link lessons work correctly

1. **Link Display**
   - [ ] Navigate to a link lesson
   - [ ] Verify external URL displays prominently
   - [ ] Verify "Open Link" button is present
   - [ ] Verify external link indicator icon displays

2. **Link Behavior**
   - [ ] Click "Open Link" button
   - [ ] Verify link opens in new tab
   - [ ] Verify original lesson page remains open
   - [ ] Verify button has `target="_blank"` and `rel="noopener noreferrer"`

### Test Flow 6: Lesson Completion

**Objective**: Verify completion tracking works correctly

1. **Manual Completion**
   - [ ] Navigate to an incomplete lesson
   - [ ] Verify "Mark as Complete" button displays
   - [ ] Click "Mark as Complete"
   - [ ] Verify button changes to "Completed" indicator
   - [ ] Verify completion persists on page reload

2. **Auto-Completion (Video)**
   - [ ] Navigate to a video lesson
   - [ ] Watch video to completion
   - [ ] Verify lesson automatically marks as complete
   - [ ] Verify "Next Lesson" button appears (if applicable)

3. **Completion Status**
   - [ ] Navigate to an already completed lesson
   - [ ] Verify "Completed" indicator displays (not button)
   - [ ] Verify completion date/time displays

### Test Flow 7: Lesson Navigation

**Objective**: Verify navigation between lessons works

1. **Next Lesson**
   - [ ] Complete a lesson that has a next lesson
   - [ ] Verify "Next Lesson" button appears
   - [ ] Click "Next Lesson"
   - [ ] Verify navigation to next lesson in module

2. **Last Lesson**
   - [ ] Navigate to the last lesson in a module
   - [ ] Complete the lesson
   - [ ] Verify "Next Lesson" button does NOT appear

3. **Back Navigation**
   - [ ] Verify "Back to Module" button always displays
   - [ ] Click "Back to Module"
   - [ ] Verify navigation to module overview

### Test Flow 8: Comments and Discussions

**Objective**: Verify comment functionality works correctly

1. **View Comments**
   - [ ] Navigate to a lesson with existing comments
   - [ ] Verify comments display in chronological order (oldest first)
   - [ ] Verify each comment shows author name, timestamp, and content

2. **Post Comment**
   - [ ] Type a comment in the input form
   - [ ] Click "Post Comment"
   - [ ] Verify comment appears in the list
   - [ ] Verify comment shows your name and current timestamp

3. **Empty State**
   - [ ] Navigate to a lesson with no comments
   - [ ] Verify empty state message displays
   - [ ] Verify message encourages starting a discussion

4. **Comment Validation**
   - [ ] Try to submit an empty comment
   - [ ] Verify validation error displays
   - [ ] Verify submit button is disabled for empty content

### Test Flow 9: Error Handling

**Objective**: Verify error states display correctly

1. **Network Errors**
   - [ ] Stop the backend API server
   - [ ] Try to load a lesson
   - [ ] Verify error message displays
   - [ ] Verify retry button is present
   - [ ] Restart backend and click retry
   - [ ] Verify lesson loads successfully

2. **404 Not Found**
   - [ ] Navigate to a non-existent lesson ID
   - [ ] Verify "Lesson not found" error displays
   - [ ] Verify link back to dashboard/module

3. **Invalid Parameters**
   - [ ] Navigate to `/lessons/abc?cohortId=xyz` (non-numeric IDs)
   - [ ] Verify validation error displays
   - [ ] Verify error message explains the issue

4. **Missing Parameters**
   - [ ] Navigate to `/lessons/123` (missing cohortId)
   - [ ] Verify validation error displays
   - [ ] Verify error message lists missing parameters

### Test Flow 10: Loading States

**Objective**: Verify loading indicators display correctly

1. **Lesson Loading**
   - [ ] Navigate to a lesson
   - [ ] Verify loading skeleton displays while fetching
   - [ ] Verify skeleton disappears when content loads

2. **Comments Loading**
   - [ ] Navigate to a lesson
   - [ ] Verify comments loading indicator displays
   - [ ] Verify indicator disappears when comments load

3. **Completion Loading**
   - [ ] Click "Mark as Complete"
   - [ ] Verify button shows loading state during API call
   - [ ] Verify button updates to "Completed" after success

### Test Flow 11: Responsive Design

**Objective**: Verify layout works on different screen sizes

1. **Desktop (≥1024px)**
   - [ ] Resize browser to desktop width
   - [ ] Verify single-column layout with appropriate max-width
   - [ ] Verify proper spacing and padding
   - [ ] Verify video/PDF players scale appropriately

2. **Tablet (768px-1023px)**
   - [ ] Resize browser to tablet width
   - [ ] Verify layout adjusts for touch interaction
   - [ ] Verify buttons are easily tappable
   - [ ] Verify content remains readable

### Test Flow 12: Accessibility

**Objective**: Verify accessibility features work correctly

1. **Keyboard Navigation**
   - [ ] Use Tab key to navigate through interactive elements
   - [ ] Verify focus indicators are visible
   - [ ] Verify all buttons and links are keyboard accessible
   - [ ] Verify Enter/Space keys activate buttons

2. **ARIA Labels**
   - [ ] Inspect buttons and interactive elements
   - [ ] Verify ARIA labels are present
   - [ ] Verify labels are descriptive

3. **Semantic HTML**
   - [ ] Inspect page structure
   - [ ] Verify proper heading hierarchy (h1, h2, h3)
   - [ ] Verify semantic elements (nav, main, article, section)

## Automated Integration Testing

### Setup Integration Test Environment

Create a separate test configuration for integration tests:

**File: `jest.integration.config.js`**
```javascript
const config = require('./jest.config');

module.exports = {
  ...config,
  testMatch: ['**/__tests__/integration/**/*.test.{ts,tsx}'],
  testTimeout: 30000, // Longer timeout for API calls
  setupFilesAfterEnv: [
    ...config.setupFilesAfterEnv,
    '<rootDir>/__tests__/integration/setup.ts',
  ],
};
```

### Integration Test Setup

**File: `__tests__/integration/setup.ts`**
```typescript
// Integration test setup
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Check if backend is running
beforeAll(async () => {
  try {
    const response = await fetch(`${API_URL}/health`);
    if (!response.ok) {
      throw new Error('Backend health check failed');
    }
  } catch (error) {
    console.error('Backend is not running. Start cohortle-api before running integration tests.');
    process.exit(1);
  }
});

// Clean up test data after all tests
afterAll(async () => {
  // Optional: Clean up any test data created during tests
});
```

### Example Integration Test

**File: `__tests__/integration/lessonViewing.test.ts`**
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { LessonViewer } from '@/components/lessons/LessonViewer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('Integration: Lesson Viewing', () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };

  it('should load and display a real lesson from the API', async () => {
    // Use a known lesson ID from your test database
    const testLessonId = '1';
    const testCohortId = '1';

    render(
      <LessonViewer lessonId={testLessonId} cohortId={testCohortId} />,
      { wrapper: createWrapper() }
    );

    // Wait for the lesson to load from the real API
    await waitFor(
      () => {
        expect(screen.queryByTestId('lesson-skeleton')).not.toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Verify lesson content displays
    expect(screen.getByTestId('text-lesson-content')).toBeInTheDocument();
  });
});
```

### Run Integration Tests

```bash
# Run integration tests only
npm test -- --config=jest.integration.config.js

# Run integration tests with coverage
npm test -- --config=jest.integration.config.js --coverage
```

## Test Data Setup

### Create Test Data Script

**File: `scripts/create-test-data.js`**
```javascript
// Script to create test data in the database
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function createTestData() {
  // Create test user
  const user = await axios.post(`${API_URL}/api/users`, {
    email: 'test@example.com',
    password: 'password123',
    role: 'student',
  });

  // Create test cohort
  const cohort = await axios.post(`${API_URL}/api/cohorts`, {
    name: 'Test Cohort',
  });

  // Add user to cohort
  await axios.post(`${API_URL}/api/cohorts/${cohort.data.id}/members`, {
    user_id: user.data.id,
  });

  // Create test module
  const module = await axios.post(`${API_URL}/api/modules`, {
    name: 'Test Module',
    cohort_id: cohort.data.id,
  });

  // Create test lessons
  const lessons = [
    {
      name: 'Text Lesson',
      text: '<h1>Welcome</h1><p>This is a test lesson.</p>',
      lesson_type: 'text',
      module_id: module.data.id,
      order_number: 1,
    },
    {
      name: 'Video Lesson',
      media: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      lesson_type: 'video',
      module_id: module.data.id,
      order_number: 2,
    },
    {
      name: 'PDF Lesson',
      media: 'https://example.com/sample.pdf',
      lesson_type: 'pdf',
      module_id: module.data.id,
      order_number: 3,
    },
    {
      name: 'Link Lesson',
      media: 'https://example.com',
      lesson_type: 'link',
      module_id: module.data.id,
      order_number: 4,
    },
  ];

  for (const lesson of lessons) {
    await axios.post(`${API_URL}/api/lessons`, lesson);
  }

  console.log('Test data created successfully!');
  console.log(`User ID: ${user.data.id}`);
  console.log(`Cohort ID: ${cohort.data.id}`);
  console.log(`Module ID: ${module.data.id}`);
}

createTestData().catch(console.error);
```

Run the script:
```bash
node scripts/create-test-data.js
```

## Troubleshooting

### Backend Not Responding
- Verify backend is running: `curl http://localhost:3001/health`
- Check backend logs for errors
- Verify database connection

### CORS Errors
- Ensure backend CORS is configured to allow `http://localhost:3000`
- Check browser console for specific CORS errors

### Authentication Issues
- Verify auth token is being sent in requests (check Network tab)
- Verify token format matches backend expectations
- Check token expiration

### Data Not Loading
- Verify API endpoints return expected data format
- Check Network tab for failed requests
- Verify cohortId and lessonId are valid

## Continuous Integration

### GitHub Actions Example

**File: `.github/workflows/integration-tests.yml`**
```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: password
          MYSQL_DATABASE: cohortle_test
        ports:
          - 3306:3306
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install backend dependencies
        run: |
          cd cohortle-api
          npm install
      
      - name: Run database migrations
        run: |
          cd cohortle-api
          npm run migrate
      
      - name: Start backend
        run: |
          cd cohortle-api
          npm start &
          sleep 10
      
      - name: Install frontend dependencies
        run: |
          cd cohortle-web
          npm install
      
      - name: Run integration tests
        run: |
          cd cohortle-web
          npm test -- --config=jest.integration.config.js
```

## Summary

This guide provides comprehensive instructions for integration testing the Student Lesson Viewer Web application. Follow the manual testing checklist for thorough validation, and implement automated integration tests for continuous verification.

For questions or issues, refer to the main README.md or contact the development team.
