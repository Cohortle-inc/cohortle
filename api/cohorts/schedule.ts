import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { requireApiBaseUrl } from "@/api/apiConfig";

export interface SchedulePayload {
  title: string;
  meeting_link?: string;
  scheduled_date: string; // YYYY-MM-DD
  scheduled_time?: string;
  duration_minutes?: number;
}

export const createCohortSchedule = async (
  cohortId: string,
  payload: SchedulePayload,
) => {
  const token = await AsyncStorage.getItem('authToken');
  try {
    const apiBaseUrl = requireApiBaseUrl();
    const res = await axios.post(
      `${apiBaseUrl}/v1/api/cohorts/${cohortId}/schedule`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      }
    );
    return res.data;
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to create schedule.');
    console.error(error?.message || error.message);
    throw error;
  }
};

export const getCohortSchedule = async (
  cohortId: string,
  params?: { start_date?: string; end_date?: string },
) => {
  const token = await AsyncStorage.getItem('authToken');
  const apiBaseUrl = requireApiBaseUrl();
  const res = await axios.get(
    `${apiBaseUrl}/v1/api/cohorts/${cohortId}/schedule`,
    {
      params,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    },

  );
  return res.data.schedule;
};

export const useCreateSchedule = (cohortId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SchedulePayload) => {
      if (!cohortId) {
        Alert.alert('Error', 'Missing cohort information.');
        throw new Error('Missing cohortId for schedule creation.');
      }
      return createCohortSchedule(cohortId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cohort-schedule", cohortId] });
    },
  });
};

export const useGetSchedule = (
  cohortId?: string,
  params?: { start_date?: string; end_date?: string },
) =>
  useQuery({
    queryKey: ["cohort-schedule", cohortId, params],
    queryFn: () => getCohortSchedule(cohortId as string, params),
    enabled: !!cohortId,
  });

export default {
  createCohortSchedule,
  getCohortSchedule,
  useCreateSchedule,
  useGetSchedule,
};
