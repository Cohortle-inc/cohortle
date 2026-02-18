// Unit Tests for Assignment API Error Handling
// Feature: assignment-submission-system
// Validates: Requirements 10.1, 11.2

import { createAssignment } from '@/api/assignments/createAssignment';
import { getAssignmentByLesson, getStudentAssignments } from '@/api/assignments/getAssignments';
import { updateAssignment } from '@/api/assignments/updateAssignment';
import { deleteAssignment } from '@/api/assignments/deleteAssignment';
import { CreateAssignmentPayload } from '@/types/assignments';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

jest.mock('axios');
jest.mock('@react-native-async-storage/async-storage');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('Assignment API - Error Handling', () => {
  const mockToken = 'mock-auth-token';
  const mockApiUrl = 'https://api.cohortle.com';

  beforeEach(() => {
    mockedAsyncStorage.getItem.mockResolvedValue(mockToken);
    process.env.EXPO_PUBLIC_API_URL = mockApiUrl;
    jest.clearAllMocks();
  });

  describe('Authentication Errors (401)', () => {
    it('should handle 401 error on createAssignment', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: { status: 401, data: { message: 'Unauthorized' } },
      });

      const payload: CreateAssignmentPayload = {
        title: 'Test',
        instructions: 'Test',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      };

      await expect(createAssignment('lesson-1', payload)).rejects.toThrow(
        'Your session has expired'
      );
    });

    it('should handle 401 error on getAssignmentByLesson', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: { status: 401, data: { message: 'Unauthorized' } },
      });

      await expect(getAssignmentByLesson('lesson-1')).rejects.toThrow(
        'Your session has expired'
      );
    });

    it('should handle 401 error on updateAssignment', async () => {
      mockedAxios.put.mockRejectedValueOnce({
        response: { status: 401, data: { message: 'Unauthorized' } },
      });

      await expect(updateAssignment('assignment-1', { title: 'New Title' })).rejects.toThrow(
        'Your session has expired'
      );
    });

    it('should handle 401 error on deleteAssignment', async () => {
      mockedAxios.delete.mockRejectedValueOnce({
        response: { status: 401, data: { message: 'Unauthorized' } },
      });

      await expect(deleteAssignment('assignment-1')).rejects.toThrow(
        'Your session has expired'
      );
    });

    it('should handle missing auth token', async () => {
      mockedAsyncStorage.getItem.mockResolvedValueOnce(null);

      const payload: CreateAssignmentPayload = {
        title: 'Test',
        instructions: 'Test',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      };

      await expect(createAssignment('lesson-1', payload)).rejects.toThrow(
        'You are not logged in'
      );
    });
  });

  describe('Validation Errors (400)', () => {
    it('should handle 400 error with custom message', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { message: 'Due date must be in the future' },
        },
      });

      const payload: CreateAssignmentPayload = {
        title: 'Test',
        instructions: 'Test',
        dueDate: new Date(Date.now() - 86400000).toISOString(), // Past date
      };

      await expect(createAssignment('lesson-1', payload)).rejects.toThrow(
        'Due date must be in the future'
      );
    });

    it('should validate empty title', async () => {
      const payload: CreateAssignmentPayload = {
        title: '',
        instructions: 'Test',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      };

      await expect(createAssignment('lesson-1', payload)).rejects.toThrow(
        'Assignment title is required'
      );
    });

    it('should validate empty instructions', async () => {
      const payload: CreateAssignmentPayload = {
        title: 'Test',
        instructions: '',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      };

      await expect(createAssignment('lesson-1', payload)).rejects.toThrow(
        'Assignment instructions are required'
      );
    });

    it('should validate missing due date', async () => {
      const payload = {
        title: 'Test',
        instructions: 'Test',
      } as CreateAssignmentPayload;

      await expect(createAssignment('lesson-1', payload)).rejects.toThrow(
        'Due date is required'
      );
    });

    it('should validate invalid due date format', async () => {
      const payload: CreateAssignmentPayload = {
        title: 'Test',
        instructions: 'Test',
        dueDate: 'invalid-date',
      };

      await expect(createAssignment('lesson-1', payload)).rejects.toThrow(
        'Invalid due date format'
      );
    });

    it('should validate missing lesson ID', async () => {
      const payload: CreateAssignmentPayload = {
        title: 'Test',
        instructions: 'Test',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      };

      await expect(createAssignment('', payload)).rejects.toThrow(
        'Lesson ID is required'
      );
    });
  });

  describe('Network Timeout Scenarios', () => {
    it('should handle timeout on createAssignment', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        code: 'ECONNABORTED',
        message: 'timeout of 10000ms exceeded',
      });

      const payload: CreateAssignmentPayload = {
        title: 'Test',
        instructions: 'Test',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      };

      await expect(createAssignment('lesson-1', payload)).rejects.toThrow(
        'Request timed out'
      );
    });

    it('should handle timeout on updateAssignment', async () => {
      mockedAxios.put.mockRejectedValueOnce({
        code: 'ECONNABORTED',
        message: 'timeout exceeded',
      });

      await expect(updateAssignment('assignment-1', { title: 'New' })).rejects.toThrow(
        'Request timed out'
      );
    });

    it('should handle timeout on deleteAssignment', async () => {
      mockedAxios.delete.mockRejectedValueOnce({
        code: 'ECONNABORTED',
        message: 'timeout exceeded',
      });

      await expect(deleteAssignment('assignment-1')).rejects.toThrow(
        'Request timed out'
      );
    });
  });

  describe('Permission Errors (403)', () => {
    it('should handle 403 on createAssignment', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: { status: 403, data: { message: 'Forbidden' } },
      });

      const payload: CreateAssignmentPayload = {
        title: 'Test',
        instructions: 'Test',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      };

      await expect(createAssignment('lesson-1', payload)).rejects.toThrow(
        'You do not have permission'
      );
    });

    it('should handle 403 on updateAssignment', async () => {
      mockedAxios.put.mockRejectedValueOnce({
        response: { status: 403, data: { message: 'Forbidden' } },
      });

      await expect(updateAssignment('assignment-1', { title: 'New' })).rejects.toThrow(
        'You do not have permission'
      );
    });

    it('should handle 403 on deleteAssignment', async () => {
      mockedAxios.delete.mockRejectedValueOnce({
        response: { status: 403, data: { message: 'Forbidden' } },
      });

      await expect(deleteAssignment('assignment-1')).rejects.toThrow(
        'You do not have permission'
      );
    });
  });

  describe('Not Found Errors (404)', () => {
    it('should return null for 404 on getAssignmentByLesson', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: { status: 404, data: { message: 'Not found' } },
      });

      const result = await getAssignmentByLesson('lesson-1');
      expect(result).toBeNull();
    });

    it('should handle 404 on updateAssignment', async () => {
      mockedAxios.put.mockRejectedValueOnce({
        response: { status: 404, data: { message: 'Not found' } },
      });

      await expect(updateAssignment('assignment-1', { title: 'New' })).rejects.toThrow(
        'Assignment not found'
      );
    });

    it('should handle 404 on deleteAssignment', async () => {
      mockedAxios.delete.mockRejectedValueOnce({
        response: { status: 404, data: { message: 'Not found' } },
      });

      await expect(deleteAssignment('assignment-1')).rejects.toThrow(
        'Assignment not found'
      );
    });
  });

  describe('Conflict Errors (409)', () => {
    it('should handle 409 on updateAssignment (students submitted)', async () => {
      mockedAxios.put.mockRejectedValueOnce({
        response: {
          status: 409,
          data: { message: 'Cannot update - submissions exist' },
        },
      });

      await expect(updateAssignment('assignment-1', { title: 'New' })).rejects.toThrow(
        'Cannot update assignment'
      );
    });

    it('should handle 409 on deleteAssignment (students submitted)', async () => {
      mockedAxios.delete.mockRejectedValueOnce({
        response: {
          status: 409,
          data: { message: 'Cannot delete - submissions exist' },
        },
      });

      await expect(deleteAssignment('assignment-1')).rejects.toThrow(
        'Cannot delete assignment'
      );
    });
  });

  describe('Server Errors (500+)', () => {
    it('should handle 500 error on createAssignment', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: { status: 500, data: { message: 'Internal server error' } },
      });

      const payload: CreateAssignmentPayload = {
        title: 'Test',
        instructions: 'Test',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      };

      await expect(createAssignment('lesson-1', payload)).rejects.toThrow(
        'Server error'
      );
    });

    it('should handle 503 error on getStudentAssignments', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: { status: 503, data: { message: 'Service unavailable' } },
      });

      await expect(getStudentAssignments()).rejects.toThrow('Server error');
    });
  });

  describe('Missing Configuration', () => {
    it('should handle missing API URL', async () => {
      delete process.env.EXPO_PUBLIC_API_URL;

      const payload: CreateAssignmentPayload = {
        title: 'Test',
        instructions: 'Test',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      };

      await expect(createAssignment('lesson-1', payload)).rejects.toThrow(
        'API URL is not configured'
      );

      // Restore
      process.env.EXPO_PUBLIC_API_URL = mockApiUrl;
    });
  });

  describe('Network Errors', () => {
    it('should handle network error without response', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network Error'));

      const payload: CreateAssignmentPayload = {
        title: 'Test',
        instructions: 'Test',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      };

      await expect(createAssignment('lesson-1', payload)).rejects.toThrow('Network Error');
    });

    it('should handle generic error on getStudentAssignments', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Unknown error'));

      await expect(getStudentAssignments()).rejects.toThrow('Unknown error');
    });
  });

  describe('Response Data Handling', () => {
    it('should handle missing assignment in response', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: {} });

      const result = await getAssignmentByLesson('lesson-1');
      expect(result).toBeNull();
    });

    it('should handle non-array response for getStudentAssignments', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { assignments: null } });

      const result = await getStudentAssignments();
      expect(result).toEqual([]);
    });

    it('should handle empty assignments array', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { assignments: [] } });

      const result = await getStudentAssignments();
      expect(result).toEqual([]);
    });
  });

  describe('Update Validation', () => {
    it('should reject empty title in update', async () => {
      await expect(updateAssignment('assignment-1', { title: '' })).rejects.toThrow(
        'Assignment title cannot be empty'
      );
    });

    it('should reject empty instructions in update', async () => {
      await expect(
        updateAssignment('assignment-1', { instructions: '' })
      ).rejects.toThrow('Assignment instructions cannot be empty');
    });

    it('should reject invalid due date in update', async () => {
      await expect(
        updateAssignment('assignment-1', { dueDate: 'invalid' })
      ).rejects.toThrow('Invalid due date format');
    });

    it('should require assignment ID for update', async () => {
      await expect(updateAssignment('', { title: 'New' })).rejects.toThrow(
        'Assignment ID is required'
      );
    });
  });

  describe('Delete Validation', () => {
    it('should require assignment ID for delete', async () => {
      await expect(deleteAssignment('')).rejects.toThrow('Assignment ID is required');
    });
  });
});
