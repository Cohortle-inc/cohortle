import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const getProgrammes = async (community: string) => {
    const apiURL = process.env.EXPO_PUBLIC_API_URL;
    const token = await AsyncStorage.getItem('authToken')

    const response = await axios.get(`${apiURL}/v1/api/communities/${community}/programmes`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    console.log(response.data.programmes);
    return response.data.programmes;
}

export const useGetProgrammes = (community: string) => {
    return useQuery({
        queryKey: ['programmes', community],
        queryFn: () => getProgrammes(community),
        refetchOnReconnect: true,
        refetchInterval: 6000
    });
}