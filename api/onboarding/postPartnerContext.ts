import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export interface PostPartnerContextPayload {
    learner_types: string[];
    biggest_challenges: string[];
}

const postPartnerContext = async (payload: PostPartnerContextPayload) => {
    const apiURL = process.env.EXPO_PUBLIC_API_URL || 'https://cohortle-api.onrender.com';
    const token = await AsyncStorage.getItem('authToken');

    const response = await axios.post(`${apiURL}/v1/api/onboarding/partner-context`, payload, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
}

export const usePostPartnerContext = () => {
    return useMutation({
        mutationFn: (payload: PostPartnerContextPayload) => postPartnerContext(payload),
        onSuccess: (data) => {
            console.log('Partner context stored successfully:', data);
        }
    })
}
