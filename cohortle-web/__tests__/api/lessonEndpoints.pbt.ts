/**
 * Property-Based Tests: API Endpoint Correctness
 * Feature: student-lesson-viewer-web
 * Properties 23-26: API endpoint correctness for lesson operations
 * **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.7**
 */

import fc from 'fast-check';
import axios, { AxiosInstance } from 'axios';
import { fetchLesson, fetchLessonCompletion, markLessonComplete, fetchModuleLessons } from '@/lib/api/lessons';

// Mock axios module
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the auth module - no longer needed with httpOnly cookies
// Auth is now handled server-side via /api/proxy routes
jest.mock('@/lib/api/auth', () => ({}));

describe('Feature: student-lesson-viewer-web, API Endpoint Correctness', () => {
  let mockAxiosInstance: jest.Mocked<AxiosInstance>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
    } as any;
    
    // Mock axios.create to return our mock instance
    mockedAxios.create = jest.fn(() => mockAxiosInstance);
  });

  /**
   * Property 23: API endpoint correctness for lesson fetching
   * 
   * For any lesson data fetch operation, the API request URL should match
   * the pattern `/api/lessons/{lessonId}`.
   * 
   * **Validates: Requirements 12.1**
   */
  it('Property 23: should use correct endpoint pattern for lesson fetching', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          lessonId: fc.oneof(
            fc.integer({ min: 1, max: 10000 }).map(String),
            fc.uuid(),
            fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('/'))
          ),
        }),
        async ({ lessonId }) => {
          // Mock successful response
          mockAxiosInstance.get.mockResolvedValue({ 
            data: { id: lessonId, name: 'Test Lesson' } 
          });
          
          await fetchLesson(lessonId);
          
          // Verify the endpoint pattern
          const expectedUrl = `/api/lessons/${lessonId}`;
          expect(mockAxiosInstance.get).toHaveBeenCalledWith(expectedUrl);
          
          // Verify the URL structure
          const callUrl = mockAxiosInstance.get.mock.calls[0][0];
          expect(callUrl).toMatch(/^\/api\/lessons\/.+$/);
          expect(callUrl).toBe(expectedUrl);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 24: API endpoint correctness for completion fetching
   * 
   * For any completion status fetch operation, the API request URL should match
   * the pattern `/api/lessons/{lessonId}/completion` and include cohortId as a query parameter.
   * 
   * **Validates: Requirements 12.2, 12.7**
   */
  it('Property 24: should use correct endpoint pattern for completion fetching', async () => {
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
          // Mock successful response
          mockAxiosInstance.get.mockResolvedValue({ 
            data: { lesson_id: lessonId, cohort_id: cohortId, completed: false } 
          });
          
          await fetchLessonCompletion(lessonId, cohortId);
          
          // Verify the endpoint pattern
          const expectedUrl = `/api/lessons/${lessonId}/completion`;
          expect(mockAxiosInstance.get).toHaveBeenCalledWith(
            expectedUrl,
            { params: { cohort_id: cohortId } }
          );
          
          // Verify the URL structure
          const callUrl = mockAxiosInstance.get.mock.calls[0][0];
          expect(callUrl).toMatch(/^\/api\/lessons\/.+\/completion$/);
          expect(callUrl).toBe(expectedUrl);
          
          // Verify cohortId is in params
          const callParams = mockAxiosInstance.get.mock.calls[0][1];
          expect(callParams).toBeDefined();
          expect(callParams).toHaveProperty('params');
          expect(callParams?.params).toHaveProperty('cohort_id', cohortId);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 25: API endpoint correctness for marking complete
   * 
   * For any mark complete operation, the API request should be a POST to
   * `/api/lessons/{lessonId}/complete` with cohort_id in the request body.
   * 
   * **Validates: Requirements 12.3**
   */
  it('Property 25: should use correct endpoint pattern for marking complete', async () => {
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
          // Mock successful response
          mockAxiosInstance.post.mockResolvedValue({ data: { success: true } });
          
          await markLessonComplete(lessonId, cohortId);
          
          // Verify the endpoint pattern and method
          const expectedUrl = `/api/lessons/${lessonId}/complete`;
          expect(mockAxiosInstance.post).toHaveBeenCalledWith(
            expectedUrl,
            { cohort_id: cohortId }
          );
          
          // Verify the URL structure
          const callUrl = mockAxiosInstance.post.mock.calls[0][0];
          expect(callUrl).toMatch(/^\/api\/lessons\/.+\/complete$/);
          expect(callUrl).toBe(expectedUrl);
          
          // Verify cohortId is in request body
          const callBody = mockAxiosInstance.post.mock.calls[0][1];
          expect(callBody).toHaveProperty('cohort_id', cohortId);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 26: API endpoint correctness for module lessons
   * 
   * For any module lessons fetch operation, the API request URL should match
   * the pattern `/api/modules/{moduleId}/lessons` and include cohortId as a query parameter.
   * 
   * **Validates: Requirements 12.4, 12.7**
   */
  it('Property 26: should use correct endpoint pattern for module lessons', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          moduleId: fc.oneof(
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
        async ({ moduleId, cohortId }) => {
          // Mock successful response
          mockAxiosInstance.get.mockResolvedValue({ 
            data: [
              { id: 1, name: 'Lesson 1', order_number: 1, module_id: moduleId },
              { id: 2, name: 'Lesson 2', order_number: 2, module_id: moduleId },
            ]
          });
          
          await fetchModuleLessons(moduleId, cohortId);
          
          // Verify the endpoint pattern
          const expectedUrl = `/api/modules/${moduleId}/lessons`;
          expect(mockAxiosInstance.get).toHaveBeenCalledWith(
            expectedUrl,
            { params: { cohort_id: cohortId } }
          );
          
          // Verify the URL structure
          const callUrl = mockAxiosInstance.get.mock.calls[0][0];
          expect(callUrl).toMatch(/^\/api\/modules\/.+\/lessons$/);
          expect(callUrl).toBe(expectedUrl);
          
          // Verify cohortId is in params
          const callParams = mockAxiosInstance.get.mock.calls[0][1];
          expect(callParams).toBeDefined();
          expect(callParams).toHaveProperty('params');
          expect(callParams?.params).toHaveProperty('cohort_id', cohortId);
        }
      ),
      { numRuns: 20 }
    );
  });
});
