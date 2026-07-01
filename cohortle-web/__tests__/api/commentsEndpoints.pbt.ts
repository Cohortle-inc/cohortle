/**
 * Property-Based Tests: Comments API Endpoint Correctness
 * Feature: student-lesson-viewer-web
 * Property 27: API endpoint correctness for comments
 * **Validates: Requirements 12.5, 12.6, 12.7**
 */

import fc from 'fast-check';
import axios, { AxiosInstance } from 'axios';

// Mock axios module
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the auth module - no longer needed with httpOnly cookies
// Auth is now handled server-side via /api/proxy routes
jest.mock('@/lib/api/auth', () => ({}));

// Mock the client module to avoid initialization issues
jest.mock('@/lib/api/client', () => {
  const mockInstance = {
    get: jest.fn(),
    post: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockInstance,
  };
});

import { fetchLessonComments, postLessonComment } from '@/lib/api/comments';
import apiClient from '@/lib/api/client';

describe('Feature: student-lesson-viewer-web, Comments API Endpoint Correctness', () => {
  const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 27: API endpoint correctness for comments
   * 
   * For any comments fetch operation, the API request URL should match
   * the pattern `/api/lessons/{lessonId}/comments` and include cohortId as a query parameter.
   * For any comment post operation, the API request should be a POST to
   * `/api/lessons/{lessonId}/comments` with content and cohort_id in the request body.
   * 
   * **Validates: Requirements 12.5, 12.6, 12.7**
   */
  describe('Property 27: API endpoint correctness for comments', () => {
    it('should use correct endpoint pattern for fetching comments', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            lessonId: fc.oneof(
              fc.integer({ min: 1, max: 10000 }).map(String),
              fc.uuid(),
              fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('/'))
            ),
            cohortId: fc.oneof(
              fc.integer({ min: 1, max: 10000 }).map(String),
              fc.uuid(),
              fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('/'))
            ),
          }),
          async ({ lessonId, cohortId }) => {
            // Reset mocks before each property test run
            mockApiClient.get.mockClear();
            
            // Mock successful response
            mockApiClient.get.mockResolvedValue({ 
              data: [
                { 
                  id: 1, 
                  lesson_id: lessonId, 
                  cohort_id: cohortId, 
                  user_id: 1,
                  author_name: 'Test User',
                  content: 'Test comment',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }
              ] 
            });
            
            await fetchLessonComments(lessonId, cohortId);
            
            // Verify the endpoint pattern
            const expectedUrl = `/api/lessons/${lessonId}/comments`;
            expect(mockApiClient.get).toHaveBeenCalledWith(
              expectedUrl,
              { params: { cohort_id: cohortId } }
            );
            
            // Verify the URL structure
            const callUrl = mockApiClient.get.mock.calls[0][0];
            expect(callUrl).toMatch(/^\/api\/lessons\/.+\/comments$/);
            expect(callUrl).toBe(expectedUrl);
            
            // Verify cohortId is in params
            const callParams = mockApiClient.get.mock.calls[0][1];
            expect(callParams).toBeDefined();
            expect(callParams).toHaveProperty('params');
            expect(callParams?.params).toHaveProperty('cohort_id', cohortId);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should use correct endpoint pattern for posting comments', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            lessonId: fc.oneof(
              fc.integer({ min: 1, max: 10000 }).map(String),
              fc.uuid(),
              fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('/'))
            ),
            cohortId: fc.oneof(
              fc.integer({ min: 1, max: 10000 }).map(String),
              fc.uuid(),
              fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('/'))
            ),
            content: fc.string({ minLength: 1, maxLength: 500 }),
          }),
          async ({ lessonId, cohortId, content }) => {
            // Reset mocks before each property test run
            mockApiClient.post.mockClear();
            
            // Mock successful response
            mockApiClient.post.mockResolvedValue({ 
              data: {
                id: 1,
                lesson_id: lessonId,
                cohort_id: cohortId,
                user_id: 1,
                author_name: 'Test User',
                content: content,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            });
            
            await postLessonComment(lessonId, cohortId, content);
            
            // Verify the endpoint pattern and method
            const expectedUrl = `/api/lessons/${lessonId}/comments`;
            expect(mockApiClient.post).toHaveBeenCalledWith(
              expectedUrl,
              { content, cohort_id: cohortId }
            );
            
            // Verify the URL structure
            const callUrl = mockApiClient.post.mock.calls[0][0];
            expect(callUrl).toMatch(/^\/api\/lessons\/.+\/comments$/);
            expect(callUrl).toBe(expectedUrl);
            
            // Verify content and cohortId are in request body
            const callBody = mockApiClient.post.mock.calls[0][1];
            expect(callBody).toHaveProperty('content', content);
            expect(callBody).toHaveProperty('cohort_id', cohortId);
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
