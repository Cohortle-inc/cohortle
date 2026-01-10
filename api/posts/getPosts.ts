import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const apiURL = process.env.EXPO_PUBLIC_API_URL;
const getPosts = async () => {
    const token = await AsyncStorage.getItem('authToken');
    try {
        const response = await axios.get(`${apiURL}/v1/api/posts`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return response.data.posts;
    } catch (error) {
        console.error('Error fetching posts:', error);
        return [];
    }
};

export const useGetPosts = () => {
    return useQuery({
        queryKey: ["posts"],
        queryFn: getPosts,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}