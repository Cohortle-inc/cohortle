import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Submission, LocalFile } from '@/types/assignments';

/**
 * Updates an existing submission (before due date)
 * @param submissionId - The ID of the submission to update
 * @param textAnswer - Updated text answer (optional)
 * @param files - Updated files array (optional)
 * @returns The updated submission
 */
export const updateSubmission = async (
  submissionId: string,
  textAnswer?: string | null,
  files?: LocalFile[]
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

    if (!submissionId) {
      throw new Error('Submission ID is required.');
    }

    // Create FormData for multipart upload
    const formData = new FormData();

    // Add text answer if provided
    if (textAnswer !== undefined) {
      formData.append('textAnswer', textAnswer || '');
    }

    // Add files if provided
    if (files && files.length > 0) {
      files.forEach((file, index) => {
        formData.append('files', {
          uri: file.uri,
          name: file.name,
          type: file.type,
        } as any);
      });
    }

    const response = await axios.put(
      `${apiURL}/v1/api/submissions/${submissionId}`,
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
    console.error('Update submission error:', error?.response?.data || error?.message || error);

    if (error.code === 'ECONNABORTED') {
      throw new Error('Upload timed out. Your files might be too large. Please try with smaller files.');
    }

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.error;

      if (status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      } else if (status === 403) {
        throw new Error('You do not have permission to update this submission.');
      } else if (status === 404) {
        throw new Error('Submission not found.');
      } else if (status === 413) {
        throw new Error('Files are too large. Please reduce file sizes and try again.');
      } else if (status === 400) {
        throw new Error(message || 'Invalid submission data. Please check your input and try again.');
      } else if (status === 409) {
        throw new Error('Cannot update submission. The due date has passed or the submission has been graded.');
      } else if (status >= 500) {
        throw new Error('Server error. Please try again later or contact support.');
      } else if (message) {
        throw new Error(message);
      }
    }

    if (error.message) {
      throw error;
    }

    throw new Error('Failed to update submission. Please check your internet connection and try again.');
  }
};
