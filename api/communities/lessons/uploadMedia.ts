import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export const uploadLessonMedia = async (
  lessonId: string,
  mediaOrUrl: string | {
    uri: string;
    name: string;
    type: string;
  } | null, // ✅ Can be YouTube URL string, file object, or null
  text?: string, // ✅ Add text parameter
) => {
  try {
    const formData = new FormData();
    const token = await AsyncStorage.getItem('authToken');
    const apiURL = process.env.EXPO_PUBLIC_API_URL;

    if (!apiURL) {
      throw new Error('API URL is not configured. Please check your environment variables.');
    }

    if (!token) {
      throw new Error('You are not logged in. Please log in and try again.');
    }

    if (!lessonId) {
      throw new Error('Lesson ID is missing. Cannot update lesson.');
    }

    // ✅ Append text content if provided
    if (text) {
      formData.append('text', text);
    }

    // ✅ Handle media: can be YouTube URL (string) or file object
    if (mediaOrUrl) {
      if (typeof mediaOrUrl === 'string') {
        // YouTube URL - send as 'media' field
        formData.append('media', mediaOrUrl);
      } else {
        // File object - send as multipart file
        formData.append('media', {
          uri: mediaOrUrl.uri,
          name: mediaOrUrl.name,
          type:
            mediaOrUrl.type === 'video'
              ? 'video/mp4'
              : mediaOrUrl.type === 'audio'
                ? 'audio/mpeg'
                : 'application/octet-stream',
        } as any);
      }
    }

    const response = await axios.put(
      `${apiURL}/v1/api/lessons/${lessonId}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout for large video uploads
      },
    );

    return response.data;
  } catch (error: any) {
    console.error('Upload lesson media error:', error?.response?.data || error?.message || error);
    
    // Provide user-friendly error messages
    if (error.code === 'ECONNABORTED') {
      throw new Error('Upload timed out. The video file might be too large. Please try a smaller file.');
    }
    
    if (error.response) {
      // Server responded with error
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.error;
      
      if (status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      } else if (status === 413) {
        throw new Error('The file is too large. Please upload a smaller video.');
      } else if (status === 400) {
        throw new Error(message || 'Invalid request. Please check your input and try again.');
      } else if (status >= 500) {
        throw new Error('Server error. Please try again later or contact support.');
      } else if (message) {
        throw new Error(message);
      }
    }
    
    if (error.message) {
      throw error; // Re-throw with existing message
    }
    
    throw new Error('Failed to upload lesson. Please check your internet connection and try again.');
  }
};