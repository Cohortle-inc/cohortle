import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Submission } from '@/types/assignments';

/**
 * Gets all submissions for an assignment (convener view)
 * @param assignmentId - The ID of the assignment
 * @returns Array of submissions with student information
 */
export const getSubmissionsByAssignment = async (assignmentId: string): Promise<Submission[]> => {
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
      `${apiURL}/v1/api/assignments/${assignmentId}/submissions`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        },
        timeout: 10000,
      }
    );

    const submissions = response.data?.submissions || response.data || [];

    if (!Array.isArray(submissions)) {
      console.warn('Expected submissions array, got:', typeof submissions);
      return [];
    }

    return submissions;
  } catch (error: any) {
    console.error('Get submissions by assignment error:', error?.response?.data || error?.message || error);

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.error;

      if (status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      } else if (status === 403) {
        throw new Error('You do not have permission to view submissions for this assignment.');
      } else if (status === 404) {
        throw new Error('Assignment not found.');
      } else if (status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else if (message) {
        throw new Error(message);
      }
    }

    if (error.message) {
      throw error;
    }

    throw new Error('Failed to load submissions. Please check your internet connection and try again.');
  }
};

/**
 * Gets the current student's submission for an assignment
 * @param assignmentId - The ID of the assignment
 * @returns The student's submission or null if not submitted
 */
export const getMySubmission = async (assignmentId: string): Promise<Submission | null> => {
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
      `${apiURL}/v1/api/assignments/${assignmentId}/my-submission`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        },
        timeout: 10000,
      }
    );

    const submission = response.data?.submission || response.data || null;

    if (!submission) {
      return null;
    }

    return submission;
  } catch (error: any) {
    console.error('Get my submission error:', error?.response?.data || error?.message || error);

    if (error.response) {
      const status = error.response.status;

      // 404 is expected when no submission exists
      if (status === 404) {
        return null;
      }

      const message = error.response.data?.message || error.response.data?.error;

      if (status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      } else if (status === 403) {
        throw new Error('You do not have permission to view this submission.');
      } else if (status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else if (message) {
        throw new Error(message);
      }
    }

    if (error.message) {
      throw error;
    }

    throw new Error('Failed to load your submission. Please check your internet connection and try again.');
  }
};

/**
 * Gets a specific submission by ID
 * @param submissionId - The ID of the submission
 * @returns The submission with full details
 */
export const getSubmissionById = async (submissionId: string): Promise<Submission> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const apiURL = process.env.EXPO_PUBLIC_API_URL;

    if (!apiURL) {
      throw new Error('API URL is not configured. Please check your environment variables.');
    }

    if (!token) {
      throw new Error('You are not logged in. Please log in again.');
    }

    if (!submissionId) {
      throw new Error('Submission ID is required.');
    }

    const response = await axios.get(
      `${apiURL}/v1/api/submissions/${submissionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        },
        timeout: 10000,
      }
    );

    return response.data.submission || response.data;
  } catch (error: any) {
    console.error('Get submission by ID error:', error?.response?.data || error?.message || error);

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.error;

      if (status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      } else if (status === 403) {
        throw new Error('You do not have permission to view this submission.');
      } else if (status === 404) {
        throw new Error('Submission not found.');
      } else if (status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else if (message) {
        throw new Error(message);
      }
    }

    if (error.message) {
      throw error;
    }

    throw new Error('Failed to load submission. Please check your internet connection and try again.');
  }
};
