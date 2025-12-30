import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { showMessage } from 'react-native-flash-message';

const apiURL = process.env.EXPO_PUBLIC_API_URL;

export interface User {
    first_name: string;
    last_name: string;
    profile_image?: string;
}

export interface Discussion {
    id: number;
    programme_id?: number;
    cohort_id?: number;
    lesson_id?: number;
    title: string;
    description: string;
    created_by: number;
    created_at: string;
    user?: User;
}

export interface DiscussionComment {
    id: number;
    discussion_id: number;
    user_id: number;
    comment_text: string;
    parent_comment_id?: number;
    user?: User;
    created_at: string;
}

// Fetch discussions
const getDiscussions = async (params: { programme_id?: number; cohort_id?: number; lesson_id?: number }) => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await axios.get(`${apiURL}/v1/api/discussions`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
    });
    console.log(response.data)
    return response.data.discussions as Discussion[];
};

export const useGetDiscussions = (params: { programme_id?: number; cohort_id?: number; lesson_id?: number }) => {
    return useQuery({
        queryKey: ['discussions', params],
        queryFn: () => getDiscussions(params),
        refetchInterval: 10000
    });
};

// Create discussion
const postDiscussion = async (data: any) => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await axios.post(`${apiURL}/v1/api/discussions`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const usePostDiscussion = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: postDiscussion,
        onSuccess: () => {
            showMessage({ message: 'Success', description: 'Discussion created successfully', type: 'success' });
            queryClient.invalidateQueries({ queryKey: ['discussions'] });
        },
    });
};

// Fetch comments for discussion
const getDiscussionComments = async (discussionId: number) => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await axios.get(`${apiURL}/v1/api/discussions/${discussionId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.comments as DiscussionComment[];
};

export const useGetDiscussionComments = (discussionId: number) => {
    return useQuery({
        queryKey: ['discussion_comments', discussionId],
        queryFn: () => getDiscussionComments(discussionId),
        enabled: !!discussionId,
        refetchInterval: 3000
    });
};

// Add comment to discussion
const postDiscussionComment = async ({ discussionId, data }: { discussionId: number; data: any }) => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await axios.post(`${apiURL}/v1/api/discussions/${discussionId}/comments`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const usePostDiscussionComment = (discussionId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => postDiscussionComment({ discussionId, data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['discussion_comments', discussionId] });
        },
    });
};
