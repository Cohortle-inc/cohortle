// api/posts/createPost.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export interface CreatePostParams {
  text: string;
  can_reply: string;
  community_ids?: string;
}

export const createPost = async ({ text, can_reply, community_ids }: CreatePostParams) => {
  const token = await AsyncStorage.getItem('authToken');
  try {
    const response = await axios.post(
      `${API_URL}/v1/api/posts`,
      { text, can_reply, community_ids },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );
    console.log(response.data);
  }
  catch {
  }
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePostParams) => createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};