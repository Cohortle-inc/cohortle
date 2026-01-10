import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

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

    const res = await axios.post(
      `${API_BASE_URL}/v1/api/cohorts/${cohortId}/schedule`,
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
    console.error(error?.message || error.message);
    throw error;
  }
};

export const getCohortSchedule = async (
  cohortId: string,
  params?: { start_date?: string; end_date?: string },
) => {
  const token = await AsyncStorage.getItem('authToken');
  const res = await axios.get(
    `${API_BASE_URL}/v1/api/cohorts/${cohortId}/schedule`,
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
    mutationFn: (payload: SchedulePayload) =>
      createCohortSchedule(cohortId as string, payload),
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
