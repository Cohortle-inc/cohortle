import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { requireApiBaseUrl } from "@/api/apiConfig";

export const completeLesson = async (
  lessonId: number,
  body: { cohort_id: number },
) => {
  const apiBaseUrl = requireApiBaseUrl();
  const token = await AsyncStorage.getItem('authToken');

  if (!token) {
    Alert.alert('Session Expired', 'Please log in again.');
    throw new Error('Authentication token missing');
  }

  const res = await axios.post(
    `${apiBaseUrl}/v1/api/lessons/${lessonId}/complete`,
    body,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );
  return res.data;
};

export const useCompleteLesson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      lessonId,
      cohort_id,
    }: {
      lessonId: number;
      cohort_id: number;
    }) => completeLesson(lessonId, { cohort_id }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cohort-progress", variables.cohort_id] });
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      queryClient.invalidateQueries({ queryKey: ["published-lessons"] });
      queryClient.invalidateQueries({ queryKey: ["lesson-completion", variables.lessonId, variables.cohort_id] });
    },
  });
};

export default {
  completeLesson,
  useCompleteLesson,
};
