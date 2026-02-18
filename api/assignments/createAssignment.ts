import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Assignment, CreateAssignmentPayload } from '@/types/assignments';

/**
 * Creates a new assignment for a lesson
 * @param lessonId - The ID of the lesson to attach the assignment to
 * @param payload - Assignment data (title, instructions, dueDate)
 * @returns The created assignment
 */
export const createAssignment = async (
  lessonId: string,
  payload: CreateAssignmentPayload
): Promise<Assignment> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const apiURL = process.env.EXPO_PUBLIC_API_URL;

    if (!apiURL) {
      throw new Error('API URL is not configured. Please check your environment variables.');
    }

    if (!token) {
      throw new Error('You are not logged in. Please log in and try again.');
    }

    if (!lessonId) {
      throw new Error('Lesson ID is required to create an assignment.');
    }

    // Validate payload
    if (!payload.title || payload.title.trim().length === 0) {
      throw new Error('Assignment title is required.');
    }

    if (!payload.instructions || payload.instructions.trim().length === 0) {
      throw new Error('Assignment instructions are required.');
    }

    if (!payload.dueDate) {
      throw new Error('Due date is required.');
    }

    // Validate due date is in the future
    const dueDate = new Date(payload.dueDate);
    if (isNaN(dueDate.getTime())) {
      throw new Error('Invalid due date format.');
    }

    const response = await axios.post(
      `${apiURL}/v1/api/lessons/${lessonId}/assignments`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    return response.data.assignment || response.data;
  } catch (error: any) {
    console.error('Create assignment error:', error?.response?.data || error?.message || error);

    // Provide user-friendly error messages
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please check your internet connection and try again.');
    }

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.error;

      if (status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      } else if (status === 403) {
        throw new Error('You do not have permission to create assignments for this lesson.');
      } else if (status === 404) {
        throw new Error('Lesson not found. Please refresh and try again.');
      } else if (status === 400) {
        throw new Error(message || 'Invalid assignment data. Please check your input and try again.');
      } else if (status >= 500) {
        throw new Error('Server error. Please try again later or contact support.');
      } else if (message) {
        throw new Error(message);
      }
    }

    if (error.message) {
      throw error;
    }

    throw new Error('Failed to create assignment. Please check your internet connection and try again.');
  }
};
