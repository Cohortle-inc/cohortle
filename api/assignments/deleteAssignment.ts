import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

/**
 * Deletes an assignment
 * @param assignmentId - The ID of the assignment to delete
 * @returns Success confirmation
 */
export const deleteAssignment = async (assignmentId: string): Promise<void> => {
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

    await axios.delete(
      `${apiURL}/v1/api/assignments/${assignmentId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      }
    );

    // Success - no return value needed
  } catch (error: any) {
    console.error('Delete assignment error:', error?.response?.data || error?.message || error);

    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please check your internet connection and try again.');
    }

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.error;

      if (status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      } else if (status === 403) {
        throw new Error('You do not have permission to delete this assignment.');
      } else if (status === 404) {
        throw new Error('Assignment not found. It may have already been deleted.');
      } else if (status === 409) {
        throw new Error('Cannot delete assignment. Students have already submitted work.');
      } else if (status >= 500) {
        throw new Error('Server error. Please try again later or contact support.');
      } else if (message) {
        throw new Error(message);
      }
    }

    if (error.message) {
      throw error;
    }

    throw new Error('Failed to delete assignment. Please check your internet connection and try again.');
  }
};
