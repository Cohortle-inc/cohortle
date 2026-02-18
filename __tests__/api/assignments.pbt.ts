// Property-Based Tests for Assignment API
// Feature: assignment-submission-system
// Properties 1-4: Assignment API Operations
// Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5

import * as fc from 'fast-check';
import { createAssignment } from '@/api/assignments/createAssignment';
import { getAssignmentByLesson, getStudentAssignments } from '@/api/assignments/getAssignments';
import { updateAssignment } from '@/api/assignments/updateAssignment';
import { deleteAssignment } from '@/api/assignments/deleteAssignment';
import { Assignment, CreateAssignmentPayload } from '@/types/assignments';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Mock axios and AsyncStorage
jest.mock('axios');
jest.mock('@react-native-async-storage/async-storage');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('Assignment API Property-Based Tests', () => {
  const mockToken = 'mock-auth-token';
  const mockApiUrl = 'https://api.cohortle.com';

  beforeEach(() => {
    // Setup mocks
    mockedAsyncStorage.getItem.mockResolvedValue(mockToken);
    process.env.EXPO_PUBLIC_API_URL = mockApiUrl;
    jest.clearAllMocks();
  });

  describe('Property 1: Assignment Creation Round-Trip', () => {
    it('should create and retrieve assignment with identical data', () => {
      // Property: Any assignment created should be retrievable with the same data
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }), // lessonId
          fc.string({ minLength: 1, maxLength: 200 }), // title
          fc.string({ minLength: 1, maxLength: 5000 }), // instructions
          fc.date({ min: new Date(), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }), // future dueDate
          async (lessonId, title, instructions, dueDate) => {
            const payload: CreateAssignmentPayload = {
              title,
              instructions,
              dueDate: dueDate.toISOString(),
            };

            const mockCreatedAssignment: Assignment = {
              id: 'assignment-123',
              lessonId,
              title: payload.title,
              instructions: payload.instructions,
              dueDate: payload.dueDate,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            // Mock create
            mockedAxios.post.mockResolvedValueOnce({
              data: { assignment: mockCreatedAssignment },
            });

            // Mock get
            mockedAxios.get.mockResolvedValueOnce({
              data: { assignment: mockCreatedAssignment },
            });

            // Create assignment
            const created = await createAssignment(lessonId, payload);

            // Retrieve assignment
            const retrieved = await getAssignmentByLesson(lessonId);

            // Verify round-trip integrity
            expect(retrieved).not.toBeNull();
            expect(retrieved!.title).toBe(created.title);
            expect(retrieved!.instructions).toBe(created.instructions);
            expect(retrieved!.dueDate).toBe(created.dueDate);
            expect(retrieved!.lessonId).toBe(lessonId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve all assignment fields through creation', () => {
      // Property: All fields in the payload should be present in the created assignment
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 200 }),
            instructions: fc.string({ minLength: 1, maxLength: 5000 }),
            dueDate: fc.date({ min: new Date() }).map(d => d.toISOString()),
          }),
          async (lessonId, payload: CreateAssignmentPayload) => {
            const mockAssignment: Assignment = {
              id: 'assignment-123',
              lessonId,
              ...payload,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            mockedAxios.post.mockResolvedValueOnce({
              data: { assignment: mockAssignment },
            });

            const created = await createAssignment(lessonId, payload);

            expect(created.title).toBe(payload.title);
            expect(created.instructions).toBe(payload.instructions);
            expect(created.dueDate).toBe(payload.dueDate);
            expect(created.lessonId).toBe(lessonId);
            expect(created.id).toBeDefined();
            expect(created.createdAt).toBeDefined();
            expect(created.updatedAt).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: Due Date Validation', () => {
    it('should accept any future due date', () => {
      // Property: Any date in the future should be valid for due date
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.string({ minLength: 1, maxLength: 1000 }),
          fc.date({
            min: new Date(Date.now() + 1000), // At least 1 second in future
            max: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000), // Up to 10 years
          }),
          async (lessonId, title, instructions, dueDate) => {
            const payload: CreateAssignmentPayload = {
              title,
              instructions,
              dueDate: dueDate.toISOString(),
            };

            const mockAssignment: Assignment = {
              id: 'assignment-123',
              lessonId,
              ...payload,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            mockedAxios.post.mockResolvedValueOnce({
              data: { assignment: mockAssignment },
            });

            const created = await createAssignment(lessonId, payload);

            // Should succeed and preserve the due date
            expect(created.dueDate).toBe(payload.dueDate);
            expect(new Date(created.dueDate).getTime()).toBeGreaterThan(Date.now());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle various date formats correctly', () => {
      // Property: ISO 8601 dates should be handled consistently
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.date({ min: new Date() }),
          async (lessonId, dueDate) => {
            const isoDate = dueDate.toISOString();

            const payload: CreateAssignmentPayload = {
              title: 'Test',
              instructions: 'Test instructions',
              dueDate: isoDate,
            };

            const mockAssignment: Assignment = {
              id: 'assignment-123',
              lessonId,
              ...payload,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            mockedAxios.post.mockResolvedValueOnce({
              data: { assignment: mockAssignment },
            });

            const created = await createAssignment(lessonId, payload);

            // Date should be preserved in ISO format
            expect(created.dueDate).toBe(isoDate);
            expect(new Date(created.dueDate).toISOString()).toBe(isoDate);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: Assignment-Lesson Association', () => {
    it('should maintain assignment-lesson relationship', () => {
      // Property: Every assignment must be associated with exactly one lesson
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 200 }),
            instructions: fc.string({ minLength: 1, maxLength: 1000 }),
            dueDate: fc.date({ min: new Date() }).map(d => d.toISOString()),
          }),
          async (lessonId, payload: CreateAssignmentPayload) => {
            const mockAssignment: Assignment = {
              id: 'assignment-123',
              lessonId,
              ...payload,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            mockedAxios.post.mockResolvedValueOnce({
              data: { assignment: mockAssignment },
            });

            const created = await createAssignment(lessonId, payload);

            // Assignment must have the correct lessonId
            expect(created.lessonId).toBe(lessonId);
            expect(created.lessonId).toBeDefined();
            expect(created.lessonId.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should retrieve assignment by lesson ID consistently', () => {
      // Property: getAssignmentByLesson should return assignment with matching lessonId
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          async (lessonId) => {
            const mockAssignment: Assignment = {
              id: 'assignment-123',
              lessonId,
              title: 'Test Assignment',
              instructions: 'Test instructions',
              dueDate: new Date(Date.now() + 86400000).toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            mockedAxios.get.mockResolvedValueOnce({
              data: { assignment: mockAssignment },
            });

            const retrieved = await getAssignmentByLesson(lessonId);

            if (retrieved) {
              expect(retrieved.lessonId).toBe(lessonId);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 4: Assignment Update Persistence', () => {
    it('should persist all updated fields', () => {
      // Property: Any field updated should be reflected in subsequent retrieval
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }), // assignmentId
          fc.record({
            title: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
            instructions: fc.option(fc.string({ minLength: 1, maxLength: 5000 })),
            dueDate: fc.option(fc.date({ min: new Date() }).map(d => d.toISOString())),
          }),
          async (assignmentId, updates) => {
            // Filter out null values
            const payload: Partial<CreateAssignmentPayload> = {};
            if (updates.title !== null) payload.title = updates.title;
            if (updates.instructions !== null) payload.instructions = updates.instructions;
            if (updates.dueDate !== null) payload.dueDate = updates.dueDate;

            // Skip if no updates
            if (Object.keys(payload).length === 0) return;

            const mockUpdatedAssignment: Assignment = {
              id: assignmentId,
              lessonId: 'lesson-123',
              title: payload.title || 'Original Title',
              instructions: payload.instructions || 'Original Instructions',
              dueDate: payload.dueDate || new Date(Date.now() + 86400000).toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            mockedAxios.put.mockResolvedValueOnce({
              data: { assignment: mockUpdatedAssignment },
            });

            const updated = await updateAssignment(assignmentId, payload);

            // Verify updated fields match
            if (payload.title) expect(updated.title).toBe(payload.title);
            if (payload.instructions) expect(updated.instructions).toBe(payload.instructions);
            if (payload.dueDate) expect(updated.dueDate).toBe(payload.dueDate);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update timestamp on every update', () => {
      // Property: updatedAt should change with each update
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 200 }),
          async (assignmentId, newTitle) => {
            const originalTime = new Date('2024-01-01T00:00:00Z').toISOString();
            const updatedTime = new Date().toISOString();

            const mockUpdatedAssignment: Assignment = {
              id: assignmentId,
              lessonId: 'lesson-123',
              title: newTitle,
              instructions: 'Instructions',
              dueDate: new Date(Date.now() + 86400000).toISOString(),
              createdAt: originalTime,
              updatedAt: updatedTime,
            };

            mockedAxios.put.mockResolvedValueOnce({
              data: { assignment: mockUpdatedAssignment },
            });

            const updated = await updateAssignment(assignmentId, { title: newTitle });

            // updatedAt should be more recent than createdAt
            expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
              new Date(updated.createdAt).getTime()
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve non-updated fields', () => {
      // Property: Fields not in the update payload should remain unchanged
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 200 }),
          async (assignmentId, newTitle) => {
            const originalInstructions = 'Original Instructions';
            const originalDueDate = new Date(Date.now() + 86400000).toISOString();

            const mockUpdatedAssignment: Assignment = {
              id: assignmentId,
              lessonId: 'lesson-123',
              title: newTitle,
              instructions: originalInstructions,
              dueDate: originalDueDate,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            mockedAxios.put.mockResolvedValueOnce({
              data: { assignment: mockUpdatedAssignment },
            });

            const updated = await updateAssignment(assignmentId, { title: newTitle });

            // Only title should change
            expect(updated.title).toBe(newTitle);
            expect(updated.instructions).toBe(originalInstructions);
            expect(updated.dueDate).toBe(originalDueDate);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Student Assignments List', () => {
    it('should return array of assignments for student', () => {
      // Property: getStudentAssignments should always return an array
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 50 }),
              lessonId: fc.string({ minLength: 1, maxLength: 50 }),
              title: fc.string({ minLength: 1, maxLength: 200 }),
              instructions: fc.string({ minLength: 1, maxLength: 1000 }),
              dueDate: fc.date({ min: new Date() }).map(d => d.toISOString()),
            }),
            { maxLength: 20 }
          ),
          async (mockAssignments) => {
            const assignments: Assignment[] = mockAssignments.map(a => ({
              ...a,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }));

            mockedAxios.get.mockResolvedValueOnce({
              data: { assignments },
            });

            const result = await getStudentAssignments();

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(assignments.length);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
