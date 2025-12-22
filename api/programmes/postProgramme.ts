import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export interface PostProgrammePayload {
    name: string;
    description: string;
    type: string;
}
const postProgramme = async (community_id: number, payload: PostProgrammePayload) => {
    const apiURL = process.env.EXPO_PUBLIC_API_URL;
    const token = await AsyncStorage.getItem('authToken')

    const response = await axios.post(`${apiURL}/v1/api/communities/${community_id}/programmes`, payload, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    console.log(response.data);
    return response.data;
}

export const usePostProgramme = (community_id: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: PostProgrammePayload) => postProgramme(community_id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['programmes', community_id.toString()],
            });
        }
    })
}
