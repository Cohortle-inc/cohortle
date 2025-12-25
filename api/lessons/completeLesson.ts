import axios from "axios";
import { useMutation } from "@tanstack/react-query";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export const completeLesson = async (
  lessonId: number,
  body: { cohort_id: number },
) => {
  const res = await axios.post(
    `${API_BASE_URL}/v1/api/lessons/${lessonId}/complete`,
    body,
  );
  return res.data;
};

export const useCompleteLesson = () =>
  useMutation({
    mutationFn: ({
      lessonId,
      cohort_id,
    }: {
      lessonId: number;
      cohort_id: number;
    }) => completeLesson(lessonId, { cohort_id }),
  });

export default {
  completeLesson,
  useCompleteLesson,
};
