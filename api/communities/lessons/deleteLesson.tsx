import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const deleteLesson = async (module_id: number, id: number) => {
  const apiURL = process.env.EXPO_PUBLIC_API_URL;
  const token = await AsyncStorage.getItem('authToken');

  try {
    return await axios.delete(
      `${apiURL}/v1/api/modules/${module_id}/lessons/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  } catch (error: any) {
    console.error(
      'Error deleting lesson:',
      error?.response?.data || error.message,
    );
    throw new Error(`Failed to delete lesson ${id}`);
  }
};

export const useDeleteLesson = (module_id: number) => {
  return {
    mutateAsync: (id: number) => deleteLesson(module_id, id),
  };
};
