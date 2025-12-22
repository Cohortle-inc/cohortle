import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export const uploadLessonMedia = async (
  lessonId: string,
  media: {
    uri: string;
    name: string;
    type: string;
  } | null, // ✅ Allow null for when only updating text
  text?: string, // ✅ Add text parameter
) => {
  const formData = new FormData();
  const token = await AsyncStorage.getItem('authToken');
  const apiURL = process.env.EXPO_PUBLIC_API_URL;

  // ✅ Append text content if provided
  if (text) {
    formData.append('text', text);
  }

  // ✅ Append media only if provided
  if (media) {
    formData.append('media', {
      uri: media.uri,
      name: media.name,
      type:
        media.type === 'video'
          ? 'video/mp4'
          : media.type === 'audio'
            ? 'audio/mpeg'
            : 'application/octet-stream',
    } as any);
  }

  const response = await axios.put(
    `${apiURL}/v1/api/lessons/${lessonId}`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data;
};