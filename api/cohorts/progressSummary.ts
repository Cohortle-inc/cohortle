import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const getCohortProgressSummary = async (cohortId: number) => {
  const token = await AsyncStorage.getItem('authToken');
  try {
    const res = await axios.get(
      `${API_BASE_URL}/v1/api/cohorts/${cohortId}/progress-summary`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    }
    );
    console.log(res.data.data)
    return res.data.data;
  } catch (error: any) {
    console.error(error?.message || error.message);
    throw error;
  }

};

export const useGetCohortProgress = (cohortId?: number) =>
  useQuery({
    queryKey: ["cohort-progress", cohortId],
    queryFn: () => getCohortProgressSummary(cohortId as number),
    enabled: !!cohortId,
    staleTime: 3,
  });

export default {
  getCohortProgressSummary,
  useGetCohortProgress,
};
