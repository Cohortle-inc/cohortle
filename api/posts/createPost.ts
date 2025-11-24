// api/posts/createPost.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export interface CreatePostParams {
  text: string;
  can_reply: string;
}

export const createPost = async ({ text, can_reply }: CreatePostParams) => {
  const token = await AsyncStorage.getItem('authToken');
  const response = await axios.post(
    `${API_URL}/v1/api/posts`,
    { text, can_reply },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );
  console.log(response.data);
  return response.data;
};

export const useCreatePost = () => {
  return useMutation({
    mutationFn: (data: CreatePostParams) => createPost(data),
  });
};
