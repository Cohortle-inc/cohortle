import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export interface PostProgrammeIntentPayload {
    programme_type: string;
    expected_cohort_size: string;
    programme_duration: string;
    mode: string;
}

const postProgrammeIntent = async (payload: PostProgrammeIntentPayload) => {
    const apiURL = process.env.EXPO_PUBLIC_API_URL || 'https://cohortle-api.onrender.com';
    const token = await AsyncStorage.getItem('authToken');

    const response = await axios.post(`${apiURL}/v1/api/onboarding/programme-intent`, payload, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    console.log(response.data);
    return response.data;
}

export const usePostProgrammeIntent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: PostProgrammeIntentPayload) => postProgrammeIntent(payload),
        onSuccess: (data) => {
            console.log('Programme intent stored successfully:', data);
            // You can invalidate queries here if needed
        }
    })
}
