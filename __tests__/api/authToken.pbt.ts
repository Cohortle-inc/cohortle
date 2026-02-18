// Property-Based Test: Authentication Token Inclusion
// Feature: assignment-submission-system, Property 22: Authentication Token Inclusion
// Validates: Requirements 11.1

import fc from 'fast-check';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { createAssignment } from '@/api/assignments/createAssignment';
import { getAssignmentByLesson, getStudentAssignments } from '@/api/assignments/getAssignments';
import { updateAssignment } from '@/api/assignments/updateAssignment';
import { deleteAssignment } from '@/api/assignments/deleteAssignment';
import { submitAssignment } from '@/api/submissions/submitAssignment';
import { getSubmissionsByAssignment, getMySubmission } from '@/api/submissions/getSubmissions';
import { gradeSubmission } from '@/api/submissions/gradeSubmission';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('Property 22: Authentication Token Inclusion', () => {
  const mockApiUrl = 'https://api.test.com';

  beforeAll(() => {
    process.env.EXPO_PUBLIC_API_URL = mockApiUrl;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    delete process.env.EXPO_PUBLIC_API_URL;
  });

  /**
   * Property: For any API request made by the Assignment_System,
   * the request should include an Authorization header with a Bearer token
   * retrieved from AsyncStorage.
   */
  it('should include Bearer token in Authorization header for all assignment API calls', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random tokens and IDs
        fc.record({
          token: fc.string({ minLength: 20, maxLength: 100 }),
          lessonId: fc.uuid(),
          assignmentId: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          instructions: fc.string({ minLength: 1, maxLength: 500 }),
          dueDate: fc.date({ min: new Date() }).map(d => d.toISOString()),
        }),
        async ({ token, lessonId, assignmentId, title, instructions, dueDate }) => {
          // Mock AsyncStorage to return the token
          (AsyncStorage.getItem as jest.Mock).mockResolvedValue(token);

          // Mock successful API responses
          mockedAxios.post.mockResolvedValue({
            data: { assignment: { id: assignmentId, title, instructions, dueDate } },
          });
          mockedAxios.get.mockResolvedValue({
            data: { assignment: { id: assignmentId } },
          });
          mockedAxios.put.mockResolvedValue({
            data: { assignment: { id: assignmentId } },
          });
          mockedAxios.delete.mockResolvedValue({ data: { success: true } });

          // Test createAssignment
          await createAssignment(lessonId, { title, instructions, dueDate });
          expect(mockedAxios.post).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(Object),
            expect.objectContaining({
              headers: expect.objectContaining({
                Authorization: `Bearer ${token}`,
              }),
            })
          );

          jest.clearAllMocks();
          (AsyncStorage.getItem as jest.Mock).mockResolvedValue(token);

          // Test getAssignmentByLesson
          await getAssignmentByLesson(lessonId);
          expect(mockedAxios.get).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
              headers: expect.objectContaining({
                Authorization: `Bearer ${token}`,
              }),
            })
          );

          jest.clearAllMocks();
          (AsyncStorage.getItem as jest.Mock).mockResolvedValue(token);

          // Test getStudentAssignments
          mockedAxios.get.mockResolvedValue({ data: { assignments: [] } });
          await getStudentAssignments();
          expect(mockedAxios.get).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
              headers: expect.objectContaining({
                Authorization: `Bearer ${token}`,
              }),
            })
          );

          jest.clearAllMocks();
          (AsyncStorage.getItem as jest.Mock).mockResolvedValue(token);

          // Test updateAssignment
          await updateAssignment(assignmentId, { title: 'Updated' });
          expect(mockedAxios.put).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(Object),
            expect.objectContaining({
              headers: expect.objectContaining({
                Authorization: `Bearer ${token}`,
              }),
            })
          );

          jest.clearAllMocks();
          (AsyncStorage.getItem as jest.Mock).mockResolvedValue(token);

          // Test deleteAssignment
          await deleteAssignment(assignmentId);
          expect(mockedAxios.delete).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
              headers: expect.objectContaining({
                Authorization: `Bearer ${token}`,
              }),
            })
          );
        }
      ),
      { numRuns: 30 } // Reduced runs for faster execution
    );
  });

  it('should include Bearer token in Authorization header for all submission API calls', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random tokens and IDs
        fc.record({
          token: fc.string({ minLength: 20, maxLength: 100 }),
          assignmentId: fc.uuid(),
          submissionId: fc.uuid(),
          textAnswer: fc.string({ minLength: 1, maxLength: 500 }),
        }),
        async ({ token, assignmentId, submissionId, textAnswer }) => {
          // Mock AsyncStorage to return the token
          (AsyncStorage.getItem as jest.Mock).mockResolvedValue(token);

          // Mock successful API responses
          mockedAxios.post.mockResolvedValue({
            data: { submission: { id: submissionId } },
          });
          mockedAxios.get.mockResolvedValue({
            data: { submissions: [] },
          });

          // Test submitAssignment
          await submitAssignment(assignmentId, textAnswer, []);
          expect(mockedAxios.post).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(Object),
            expect.objectContaining({
              headers: expect.objectContaining({
                Authorization: `Bearer ${token}`,
              }),
            })
          );

          jest.clearAllMocks();
          (AsyncStorage.getItem as jest.Mock).mockResolvedValue(token);

          // Test getSubmissionsByAssignment
          await getSubmissionsByAssignment(assignmentId);
          expect(mockedAxios.get).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
              headers: expect.objectContaining({
                Authorization: `Bearer ${token}`,
              }),
            })
          );

          jest.clearAllMocks();
          (AsyncStorage.getItem as jest.Mock).mockResolvedValue(token);

          // Test getMySubmission
          mockedAxios.get.mockResolvedValue({ data: { submission: null } });
          await getMySubmission(assignmentId);
          expect(mockedAxios.get).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
              headers: expect.objectContaining({
                Authorization: `Bearer ${token}`,
              }),
            })
          );

          jest.clearAllMocks();
          (AsyncStorage.getItem as jest.Mock).mockResolvedValue(token);

          // Test gradeSubmission
          mockedAxios.post.mockResolvedValue({
            data: { submission: { id: submissionId, gradingStatus: 'passed' } },
          });
          await gradeSubmission(submissionId, { status: 'passed', feedback: 'Good work' });
          expect(mockedAxios.post).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(Object),
            expect.objectContaining({
              headers: expect.objectContaining({
                Authorization: `Bearer ${token}`,
              }),
            })
          );
        }
      ),
      { numRuns: 30 } // Reduced runs for faster execution
    );
  });

  it('should reject API calls when no token is available', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          lessonId: fc.uuid(),
          assignmentId: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          instructions: fc.string({ minLength: 1, maxLength: 500 }),
          dueDate: fc.date({ min: new Date() }).map(d => d.toISOString()),
        }),
        async ({ lessonId, assignmentId, title, instructions, dueDate }) => {
          // Mock AsyncStorage to return null (no token)
          (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

          // Test that API calls throw error when no token
          await expect(
            createAssignment(lessonId, { title, instructions, dueDate })
          ).rejects.toThrow(/not logged in/i);

          await expect(getAssignmentByLesson(lessonId)).rejects.toThrow(/not logged in/i);

          await expect(getStudentAssignments()).rejects.toThrow(/not logged in/i);

          await expect(
            updateAssignment(assignmentId, { title: 'Updated' })
          ).rejects.toThrow(/not logged in/i);

          await expect(deleteAssignment(assignmentId)).rejects.toThrow(/not logged in/i);

          await expect(
            submitAssignment(assignmentId, 'Test answer', [])
          ).rejects.toThrow(/not logged in/i);

          await expect(
            getSubmissionsByAssignment(assignmentId)
          ).rejects.toThrow(/not logged in/i);

          await expect(getMySubmission(assignmentId)).rejects.toThrow(/not logged in/i);

          await expect(
            gradeSubmission(assignmentId, { status: 'passed' })
          ).rejects.toThrow(/not logged in/i);
        }
      ),
      { numRuns: 30 } // Reduced runs for faster execution
    );
  });

  it('should use Bearer token format (not just the token)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          token: fc.string({ minLength: 20, maxLength: 100 }),
          lessonId: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          instructions: fc.string({ minLength: 1, maxLength: 500 }),
          dueDate: fc.date({ min: new Date() }).map(d => d.toISOString()),
        }),
        async ({ token, lessonId, title, instructions, dueDate }) => {
          // Mock AsyncStorage to return the token
          (AsyncStorage.getItem as jest.Mock).mockResolvedValue(token);

          // Mock successful API response
          mockedAxios.post.mockResolvedValue({
            data: { assignment: { id: 'test-id' } },
          });

          await createAssignment(lessonId, { title, instructions, dueDate });

          // Verify the Authorization header uses Bearer format
          const callArgs = mockedAxios.post.mock.calls[0];
          const headers = callArgs[2]?.headers;

          expect(headers.Authorization).toBe(`Bearer ${token}`);
          expect(headers.Authorization).toMatch(/^Bearer /);
          expect(headers.Authorization).not.toBe(token); // Should not be just the token
        }
      ),
      { numRuns: 30 } // Reduced runs for faster execution
    );
  });
});
