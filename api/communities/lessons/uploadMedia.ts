import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
export const uploadLessonMedia = async (
  moduleId: string,
  lessonId: string,
  media: {
    uri: string;
    name: string;
    type: string; // "image", "video", "audio", "document"
  },
) => {
  const formData = new FormData();
  const token = await AsyncStorage.getItem('authToken');
  const apiURL = process.env.EXPO_PUBLIC_API_URL;

  // 🔥 ONLY append the file
  formData.append('media', {
    uri: media.uri,
    name: media.name,
    type:
      media.type === 'image'
        ? 'image/jpeg'
        : media.type === 'video'
          ? 'video/mp4'
          : media.type === 'audio'
            ? 'audio/mpeg'
            : 'application/octet-stream',
  } as any);

  const response = await axios.put(
    `${apiURL}/v1/api/modules/${moduleId}/lessons/${lessonId}`,
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
