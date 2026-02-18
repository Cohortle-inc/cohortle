import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Assignment } from '@/types/assignments';

/**
 * Gets the assignment for a specific lesson
 * @param lessonId - The ID of the lesson
 * @returns The assignment or null if none exists
 */
export const getAssignmentByLesson = async (lessonId: string): Promise<Assignment | null> => {
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
      throw new Error('Lesson ID is required.');
    }

    const response = await axios.get(
      `${apiURL}/v1/api/lessons/${lessonId}/assignments`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        },
        timeout: 10000,
      }
    );

    const assignment = response.data?.assignment || response.data || null;

    if (!assignment) {
      return null;
    }

    return assignment;
  } catch (error: any) {
    console.error('Get assignment by lesson error:', error?.response?.data || error?.message || error);

    if (error.response) {
      const status = error.response.status;

      // 404 is expected when no assignment exists
      if (status === 404) {
        return null;
      }

      const message = error.response.data?.message || error.response.data?.error;

      if (status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      } else if (status === 403) {
        throw new Error('You do not have permission to view this assignment.');
      } else if (status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else if (message) {
        throw new Error(message);
      }
    }

    if (error.message) {
      throw error;
    }

    throw new Error('Failed to load assignment. Please check your internet connection and try again.');
  }
};

/**
 * Gets all assignments for the current student
 * Includes submission status and grading information
 * @returns Array of assignments with student's submission data
 */
export const getStudentAssignments = async (): Promise<Assignment[]> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const apiURL = process.env.EXPO_PUBLIC_API_URL;

    if (!apiURL) {
      throw new Error('API URL is not configured. Please check your environment variables.');
    }

    if (!token) {
      throw new Error('You are not logged in. Please log in and try again.');
    }

    const response = await axios.get(
      `${apiURL}/v1/api/assignments/my-assignments`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        },
        timeout: 10000,
      }
    );

    const assignments = response.data?.assignments || response.data || [];

    // Ensure it's an array
    if (!Array.isArray(assignments)) {
      console.warn('Expected assignments array, got:', typeof assignments);
      return [];
    }

    return assignments;
  } catch (error: any) {
    console.error('Get student assignments error:', error?.response?.data || error?.message || error);

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.error;

      if (status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      } else if (status === 403) {
        throw new Error('You do not have permission to view assignments.');
      } else if (status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else if (message) {
        throw new Error(message);
      }
    }

    if (error.message) {
      throw error;
    }

    throw new Error('Failed to load assignments. Please check your internet connection and try again.');
  }
};


/**
 * Gets a single assignment by ID
 * Includes submission status and grading information for the current student
 * @param assignmentId - The ID of the assignment
 * @returns The assignment with student's submission data
 */
export const getAssignmentById = async (assignmentId: string): Promise<Assignment> => {
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
      `${apiURL}/v1/api/assignments/${assignmentId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        },
        timeout: 10000,
      }
    );

    const assignment = response.data?.assignment || response.data;

    if (!assignment) {
      throw new Error('Assignment not found.');
    }

    return assignment;
  } catch (error: any) {
    console.error('Get assignment by ID error:', error?.response?.data || error?.message || error);

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.error;

      if (status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      } else if (status === 403) {
        throw new Error('You do not have permission to view this assignment.');
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

    throw new Error('Failed to load assignment. Please check your internet connection and try again.');
  }
};
