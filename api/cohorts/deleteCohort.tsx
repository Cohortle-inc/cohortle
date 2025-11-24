import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const deleteCohort = async (cohort_id: string) => {
  const apiURL = process.env.EXPO_PUBLIC_API_URL;
  const token = await AsyncStorage.getItem('authToken');

  try {
    return await axios.delete(`${apiURL}/v1/api/cohorts/${cohort_id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error: any) {
    console.error(
      'Error deleting cohort:',
      error?.response?.data || error.message,
    );
    throw new Error(`Failed to delete cohort ${cohort_id}`);
  }
};

export const useDeleteCohort = () => {
  return {
    mutateAsync: (cohort_id: string) => deleteCohort(cohort_id),
  };
};
