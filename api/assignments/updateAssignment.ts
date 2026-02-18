import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Assignment, CreateAssignmentPayload } from '@/types/assignments';

/**
 * Updates an existing assignment
 * @param assignmentId - The ID of the assignment to update
 * @param payload - Updated assignment data (title, instructions, dueDate)
 * @returns The updated assignment
 */
export const updateAssignment = async (
  assignmentId: string,
  payload: Partial<CreateAssignmentPayload>
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

    if (!assignmentId) {
      throw new Error('Assignment ID is required.');
    }

    // Validate payload if fields are provided
    if (payload.title !== undefined && payload.title.trim().length === 0) {
      throw new Error('Assignment title cannot be empty.');
    }

    if (payload.instructions !== undefined && payload.instructions.trim().length === 0) {
      throw new Error('Assignment instructions cannot be empty.');
    }

    if (payload.dueDate !== undefined) {
      const dueDate = new Date(payload.dueDate);
      if (isNaN(dueDate.getTime())) {
        throw new Error('Invalid due date format.');
      }
    }

    const response = await axios.put(
      `${apiURL}/v1/api/assignments/${assignmentId}`,
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
    console.error('Update assignment error:', error?.response?.data || error?.message || error);

    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please check your internet connection and try again.');
    }

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.error;

      if (status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      } else if (status === 403) {
        throw new Error('You do not have permission to update this assignment.');
      } else if (status === 404) {
        throw new Error('Assignment not found. It may have been deleted.');
      } else if (status === 400) {
        throw new Error(message || 'Invalid assignment data. Please check your input and try again.');
      } else if (status === 409) {
        throw new Error('Cannot update assignment. Students have already submitted work.');
      } else if (status >= 500) {
        throw new Error('Server error. Please try again later or contact support.');
      } else if (message) {
        throw new Error(message);
      }
    }

    if (error.message) {
      throw error;
    }

    throw new Error('Failed to update assignment. Please check your internet connection and try again.');
  }
};
