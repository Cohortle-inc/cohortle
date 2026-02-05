import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { requireApiBaseUrl } from "@/api/apiConfig";

export const getLessonCompletion = async (
    lessonId: number,
    cohortId: number,
) => {
    const apiBaseUrl = requireApiBaseUrl();
    const token = await AsyncStorage.getItem('authToken');

    if (!token) {
        throw new Error('Authentication token missing');
    }

    const res = await axios.get(
        `${apiBaseUrl}/v1/api/lessons/${lessonId}/complete?cohort_id=${cohortId}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    );
    return res.data;
};

export const useGetLessonCompletion = (lessonId: number | null, cohortId: number | null) => {
    return useQuery({
        queryKey: ["lesson-completion", lessonId, cohortId],
        queryFn: () => getLessonCompletion(lessonId!, cohortId!),
        enabled: !!lessonId && !!cohortId,
    });
};

export default {
    getLessonCompletion,
    useGetLessonCompletion,
};
