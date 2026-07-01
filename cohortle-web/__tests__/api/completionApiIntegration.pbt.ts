/**
 * Property-Based Tests for Completion API Integration
 * Feature: mvp-completion-gaps
 */

import fc from 'fast-check';
import { markLessonComplete } from '@/lib/api/lessons';
import apiClient from '@/lib/api/client';

// Mock the API client
jest.mock('@/lib/api/client');

describe('Feature: mvp-completion-gaps - Completion API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 13: Completion API Integration
   * For any lesson completion action, the system should make the correct API call 
   * with lesson ID and cohort ID parameters. The API endpoint should be called with 
   * the proper HTTP method (POST) and the cohort_id should be included in the request body.
   * 
   * **Validates: Requirements 2.2, 2.9**
   */
  it('Property 13: Completion API calls use correct endpoint and parameters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }).map(String), // lessonId
        fc.integer({ min: 1, max: 10000 }).map(String), // cohortId
        async (lessonId, cohortId) => {
          // Mock successful API response
          const mockPost = jest.fn().mockResolvedValue({ data: {} });
          (apiClient.post as jest.Mock) = mockPost;

          // Call the API function
          await markLessonComplete(lessonId, cohortId);

          // Verify the API was called exactly once
          expect(mockPost).toHaveBeenCalledTimes(1);

          // Verify the correct endpoint was called
          const expectedEndpoint = `/v1/api/lessons/${lessonId}/complete`;
          expect(mockPost).toHaveBeenCalledWith(
            expectedEndpoint,
            expect.any(Object)
          );

          // Verify the cohort_id is included in the request body
          const callArgs = mockPost.mock.calls[0];
          expect(callArgs[0]).toBe(expectedEndpoint);
          expect(callArgs[1]).toEqual({ cohort_id: cohortId });

          // Verify the request body structure
          const requestBody = callArgs[1];
          expect(requestBody).toHaveProperty('cohort_id');
          expect(requestBody.cohort_id).toBe(cohortId);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 13b: Completion API Integration - Parameter Types
   * For any valid lesson and cohort IDs (as strings), the API should accept them 
   * and construct the correct endpoint URL and request body without type errors.
   * 
   * **Validates: Requirements 2.2, 2.9**
   */
  it('Property 13b: Completion API accepts string IDs and constructs correct request', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }), // lessonId as string
        fc.string({ minLength: 1, maxLength: 50 }), // cohortId as string
        async (lessonId, cohortId) => {
          // Mock successful API response
          const mockPost = jest.fn().mockResolvedValue({ data: {} });
          (apiClient.post as jest.Mock) = mockPost;

          // Call the API function
          await markLessonComplete(lessonId, cohortId);

          // Verify the endpoint URL contains the lessonId
          const callArgs = mockPost.mock.calls[0];
          const endpoint = callArgs[0];
          expect(endpoint).toContain(lessonId);
          expect(endpoint).toMatch(/^\/v1\/api\/lessons\/.+\/complete$/);

          // Verify the request body contains the cohortId
          const requestBody = callArgs[1];
          expect(requestBody.cohort_id).toBe(cohortId);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 13c: Completion API Integration - HTTP Method
   * For any completion action, the system should use the POST HTTP method,
   * not GET, PUT, PATCH, or DELETE.
   * 
   * **Validates: Requirements 2.2, 2.9**
   */
  it('Property 13c: Completion API uses POST method', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }).map(String),
        fc.integer({ min: 1, max: 10000 }).map(String),
        async (lessonId, cohortId) => {
          // Mock all HTTP methods
          const mockPost = jest.fn().mockResolvedValue({ data: {} });
          const mockGet = jest.fn();
          const mockPut = jest.fn();
          const mockPatch = jest.fn();
          const mockDelete = jest.fn();

          (apiClient.post as jest.Mock) = mockPost;
          (apiClient.get as jest.Mock) = mockGet;
          (apiClient.put as jest.Mock) = mockPut;
          (apiClient.patch as jest.Mock) = mockPatch;
          (apiClient.delete as jest.Mock) = mockDelete;

          // Call the API function
          await markLessonComplete(lessonId, cohortId);

          // Verify POST was called
          expect(mockPost).toHaveBeenCalledTimes(1);

          // Verify other methods were NOT called
          expect(mockGet).not.toHaveBeenCalled();
          expect(mockPut).not.toHaveBeenCalled();
          expect(mockPatch).not.toHaveBeenCalled();
          expect(mockDelete).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 13d: Completion API Integration - Error Propagation
   * For any completion action that fails, the system should propagate the error
   * to the caller without swallowing it, allowing proper error handling.
   * 
   * **Validates: Requirements 2.2, 2.9**
   */
  it('Property 13d: Completion API propagates errors correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }).map(String),
        fc.integer({ min: 1, max: 10000 }).map(String),
        fc.string({ minLength: 5, maxLength: 100 }), // error message
        async (lessonId, cohortId, errorMessage) => {
          // Mock API error
          const mockError = new Error(errorMessage);
          const mockPost = jest.fn().mockRejectedValue(mockError);
          (apiClient.post as jest.Mock) = mockPost;

          // Call the API function and expect it to throw
          await expect(markLessonComplete(lessonId, cohortId)).rejects.toThrow(errorMessage);

          // Verify the API was called
          expect(mockPost).toHaveBeenCalledTimes(1);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 13e: Completion API Integration - No Extra Parameters
   * For any completion action, the system should only send the required cohort_id
   * parameter in the request body, without adding extra unnecessary parameters.
   * 
   * **Validates: Requirements 2.2, 2.9**
   */
  it('Property 13e: Completion API sends only required parameters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }).map(String),
        fc.integer({ min: 1, max: 10000 }).map(String),
        async (lessonId, cohortId) => {
          // Mock successful API response
          const mockPost = jest.fn().mockResolvedValue({ data: {} });
          (apiClient.post as jest.Mock) = mockPost;

          // Call the API function
          await markLessonComplete(lessonId, cohortId);

          // Verify the request body contains only cohort_id
          const callArgs = mockPost.mock.calls[0];
          const requestBody = callArgs[1];
          const keys = Object.keys(requestBody);

          expect(keys).toHaveLength(1);
          expect(keys[0]).toBe('cohort_id');
          expect(requestBody.cohort_id).toBe(cohortId);
        }
      ),
      { numRuns: 20 }
    );
  });
});
