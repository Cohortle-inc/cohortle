import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const apiURL = process.env.EXPO_PUBLIC_API_URL;

export interface UpdateCommunityPayload {
    id?: string | number
    name?: string;
    type?: string;
    sub_type?: string;
    description?: string;
    status?: string;
    thumbnail?: string;
    // Extra fields from UI that might be needed or ignored by backend
    goal?: string;
    referral?: string;
    revenue?: string;
}

interface UpdateCommunityParams {
    id: string | number;
    data: UpdateCommunityPayload;
}

const updateCommunity = async ({ id, data }: UpdateCommunityParams) => {
    const token = await AsyncStorage.getItem('authToken');
    try {
        const response = await axios.put(
            `${apiURL}/v1/api/communities/${id}`,
            data,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error updating community:', error);
        throw error;
    }
}

export const useUpdateCommunity = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateCommunity,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['communities'] });
        },
        onError: (error: Error) => {
            console.error('Error updating community:', error);
        },
    });
}