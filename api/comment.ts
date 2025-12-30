import { CommentProp } from '@/types/commentType';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const apiURL = process.env.EXPO_PUBLIC_API_URL;

export async function createComment({
  payload,
  id,
}: {
  payload: CommentProp;
  id: string;
}) {
  const token = await AsyncStorage.getItem('authToken');
  const response = await axios.post(
    `${apiURL}/v1/post/${id}/comments`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );
  console.log("Passed!")
  return response.data;
}

export const usePostComment = (postId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CommentProp) => createComment({ payload, id: postId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });
};

export const getComments = async (postId: string) => {
  const token = await AsyncStorage.getItem('authToken');
  const response = await axios.get(`${apiURL}/v1/post/${postId}/comments`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.comments;
};

export const useGetComments = (postId: string) => {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: () => getComments(postId),
    enabled: !!postId,
  });
};
