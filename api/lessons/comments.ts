import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { requireApiBaseUrl } from '@/api/apiConfig';

const apiURL = process.env.EXPO_PUBLIC_API_URL;

// GET Comments
const getLessonComments = async (lessonId: number, cohortId?: number) => {
    const token = await AsyncStorage.getItem('authToken');
    const apiBaseUrl = requireApiBaseUrl();

    const params: any = {};
    if (cohortId) params.cohort_id = cohortId;
    try {
        const response = await axios.get(
            `${apiBaseUrl}/v1/api/lessons/${lessonId}/comments`,
            {
                headers: { Authorization: `Bearer ${token}` },
                params
            }
        );
        console.log(response.data)
        console.log('ror')
        return response.data
    } catch (error) {
        console.error('Failed to fetch lesson comments:', error);
        return [];
    }
};

export const useGetLessonComments = (lessonId: number, cohortId?: number) => {
    return useQuery({
        queryKey: ['lesson-comments', lessonId, cohortId],
        queryFn: () => getLessonComments(lessonId, cohortId),
        enabled: !!lessonId,
    });
};

// POST Comment
const postLessonComment = async ({
    lessonId,
    cohortId,
    commentText,
    parentCommentId
}: {
    lessonId: number;
    cohortId?: number;
    commentText: string;
    parentCommentId?: number;
}) => {
    const token = await AsyncStorage.getItem('authToken');
    const apiBaseUrl = requireApiBaseUrl();

    try {

        const response = await axios.post(
            `${apiBaseUrl}/v1/api/lessons/${lessonId}/comments`,
            {
                comment_text: commentText,
                cohort_id: cohortId,
                parent_comment_id: parentCommentId,
            },
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        return response.data;
    } catch (error) {
        console.error('Failed to post lesson comment:', error);
        return [];
    }
};

export const usePostLessonComment = (lessonId: number, cohortId?: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { commentText: string; parentCommentId?: number }) =>
            postLessonComment({
                lessonId,
                cohortId,
                commentText: data.commentText,
                parentCommentId: data.parentCommentId
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lesson-comments', lessonId, cohortId] });
        },
    });
};
