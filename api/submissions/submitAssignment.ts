import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Submission, LocalFile } from '@/types/assignments';

/**
 * Submits an assignment with text answer and/or files
 * @param assignmentId - The ID of the assignment to submit
 * @param textAnswer - Optional text answer
 * @param files - Array of files to upload
 * @returns The created submission
 */
export const submitAssignment = async (
  assignmentId: string,
  textAnswer: string | null,
  files: LocalFile[]
): Promise<Submission> => {
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

    // Validate that submission has either text or files
    const hasText = textAnswer && textAnswer.trim().length > 0;
    const hasFiles = files && files.length > 0;

    if (!hasText && !hasFiles) {
      throw new Error('Submission must include either a text answer or at least one file.');
    }

    // Create FormData for multipart upload
    const formData = new FormData();

    // Add text answer if provided
    if (hasText) {
      formData.append('textAnswer', textAnswer);
    }

    // Add files if provided
    if (hasFiles) {
      files.forEach((file, index) => {
        formData.append('files', {
          uri: file.uri,
          name: file.name,
          type: file.type,
        } as any);
      });
    }

    const response = await axios.post(
      `${apiURL}/v1/api/assignments/${assignmentId}/submissions`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minute timeout for file uploads
      }
    );

    return response.data.submission || response.data;
  } catch (error: any) {
    console.error('Submit assignment error:', error?.response?.data || error?.message || error);

    // Provide user-friendly error messages
    if (error.code === 'ECONNABORTED') {
      throw new Error('Upload timed out. Your files might be too large. Please try with smaller files or fewer files.');
    }

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.error;

      if (status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      } else if (status === 403) {
        throw new Error('You do not have permission to submit this assignment.');
      } else if (status === 404) {
        throw new Error('Assignment not found. Please refresh and try again.');
      } else if (status === 413) {
        throw new Error('Files are too large. Please reduce file sizes and try again.');
      } else if (status === 400) {
        throw new Error(message || 'Invalid submission data. Please check your input and try again.');
      } else if (status === 409) {
        throw new Error('You have already submitted this assignment. You cannot submit again after the due date.');
      } else if (status >= 500) {
        throw new Error('Server error. Please try again later or contact support.');
      } else if (message) {
        throw new Error(message);
      }
    }

    if (error.message) {
      throw error;
    }

    throw new Error('Failed to submit assignment. Please check your internet connection and try again.');
  }
};
