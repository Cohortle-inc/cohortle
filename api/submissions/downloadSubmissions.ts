import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

/**
 * Downloads a single student's submission files
 * @param submissionId - The ID of the submission to download
 * @returns Blob containing the submission files
 */
export const downloadSubmission = async (
  submissionId: string
): Promise<Blob> => {
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

    const response = await axios.get(
      `${apiURL}/v1/api/submissions/${submissionId}/download`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
        timeout: 60000, // 60 second timeout for large downloads
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Download submission error:', error?.response?.data || error?.message || error);

    if (error.code === 'ECONNABORTED') {
      throw new Error('Download timed out. Please check your internet connection and try again.');
    }

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.error;

      if (status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      } else if (status === 403) {
        throw new Error('You do not have permission to download this submission.');
      } else if (status === 404) {
        throw new Error('Submission not found or has no files to download.');
      } else if (status === 400) {
        throw new Error(message || 'Invalid request. Please check your input and try again.');
      } else if (status >= 500) {
        throw new Error('Server error. Please try again later or contact support.');
      } else if (message) {
        throw new Error(message);
      }
    }

    if (error.message) {
      throw error;
    }

    throw new Error('Failed to download submission. Please check your internet connection and try again.');
  }
};

/**
 * Downloads all submissions for an assignment as a packaged file
 * @param assignmentId - The ID of the assignment
 * @returns Blob containing all submission files organized by student
 */
export const downloadAllSubmissions = async (
  assignmentId: string
): Promise<Blob> => {
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

    const response = await axios.get(
      `${apiURL}/v1/api/assignments/${assignmentId}/download-all`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
        timeout: 120000, // 120 second timeout for bulk downloads
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Download all submissions error:', error?.response?.data || error?.message || error);

    if (error.code === 'ECONNABORTED') {
      throw new Error('Download timed out. The package might be too large. Please try again or download submissions individually.');
    }

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.error;

      if (status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      } else if (status === 403) {
        throw new Error('You do not have permission to download submissions for this assignment.');
      } else if (status === 404) {
        throw new Error('Assignment not found or has no submissions to download.');
      } else if (status === 400) {
        throw new Error(message || 'Invalid request. Please check your input and try again.');
      } else if (status >= 500) {
        throw new Error('Server error. Please try again later or contact support.');
      } else if (message) {
        throw new Error(message);
      }
    }

    if (error.message) {
      throw error;
    }

    throw new Error('Failed to download submissions. Please check your internet connection and try again.');
  }
};
