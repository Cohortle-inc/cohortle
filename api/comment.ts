import { CommentProp } from '@/types/commentType';
import axios from 'axios';

const apiURL = process.env.EXPO_PUBLIC_API_URL;

export async function createComment(
  payload: CommentProp,
  id: string,
  token: string,
) {
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
  return response.data;
}
