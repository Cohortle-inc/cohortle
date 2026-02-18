import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Submission, GradeSubmissionPayload } from '@/types/assignments';

/**
 * Grades a student's submission
 * @param submissionId - The ID of the submission to grade
 * @param payload - Grading data (status: passed/failed, optional feedback)
 * @returns The graded submission
 */
export const gradeSubmission = async (
  submissionId: string,
  payload: GradeSubmissionPayload
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

    if (!payload.status) {
      throw new Error('Grading status (passed/failed) is required.');
    }

    if (payload.status !== 'passed' && payload.status !== 'failed') {
      throw new Error('Grading status must be either "passed" or "failed".');
    }

    const response = await axios.post(
      `${apiURL}/v1/api/submissions/${submissionId}/grade`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    return response.data.submission || response.data;
  } catch (error: any) {
    console.error('Grade submission error:', error?.response?.data || error?.message || error);

    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please check your internet connection and try again.');
    }

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.error;

      if (status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      } else if (status === 403) {
        throw new Error('You do not have permission to grade this submission.');
      } else if (status === 404) {
        throw new Error('Submission not found.');
      } else if (status === 400) {
        throw new Error(message || 'Invalid grading data. Please check your input and try again.');
      } else if (status === 409) {
        throw new Error('This submission has already been graded.');
      } else if (status >= 500) {
        throw new Error('Server error. Please try again later or contact support.');
      } else if (message) {
        throw new Error(message);
      }
    }

    if (error.message) {
      throw error;
    }

    throw new Error('Failed to grade submission. Please check your internet connection and try again.');
  }
};
