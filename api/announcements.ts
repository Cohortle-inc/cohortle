import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { showMessage } from 'react-native-flash-message';

const apiURL = process.env.EXPO_PUBLIC_API_URL;

export interface Announcement {
    id: number;
    programme_id?: number;
    cohort_id?: number;
    title: string;
    content: string;
    priority: 'low' | 'medium' | 'high';
    created_by: number;
    first_name: string;
    last_name: string;
    profile_image?: string;
    created_at: string;
}

// Fetch announcements for a programme
const getProgrammeAnnouncements = async (programmeId: number) => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await axios.get(`${apiURL}/v1/api/programmes/${programmeId}/announcements`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.announcements as Announcement[];
};

export const useGetProgrammeAnnouncements = (programmeId: number) => {
    return useQuery({
        queryKey: ['announcements', 'programme', programmeId.toString()],
        queryFn: () => getProgrammeAnnouncements(programmeId),
        enabled: !!programmeId,
    });
};

// Fetch announcements for a cohort
const getCohortAnnouncements = async (cohortId: number) => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await axios.get(`${apiURL}/v1/api/cohorts/${cohortId}/announcements`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.announcements as Announcement[];
};

export const useGetCohortAnnouncements = (cohortId: number) => {
    return useQuery({
        queryKey: ['announcements', 'cohort', cohortId.toString()],
        queryFn: () => getCohortAnnouncements(cohortId),
        enabled: !!cohortId,
    });

};

// Create programme announcement
const postProgrammeAnnouncement = async ({ programmeId, data }: { programmeId: number; data: any }) => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await axios.post(`${apiURL}/v1/api/programmes/${programmeId}/announcements`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const usePostProgrammeAnnouncement = (programmeId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => postProgrammeAnnouncement({ programmeId, data }),
        onSuccess: () => {
            showMessage({ message: 'Success', description: 'Announcement created successfully', type: 'success' });
            queryClient.invalidateQueries({ queryKey: ['announcements', 'programme', programmeId.toString()] });
        },
    });
};

// Create cohort announcement
const postCohortAnnouncement = async ({ cohortId, data }: { cohortId: number; data: any }) => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await axios.post(`${apiURL}/v1/api/cohorts/${cohortId}/announcements`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Passed")
    return response.data;
};

export const usePostCohortAnnouncement = (cohortId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => postCohortAnnouncement({ cohortId, data }),
        onSuccess: () => {
            showMessage({ message: 'Success', description: 'Announcement created successfully', type: 'success' });
            queryClient.invalidateQueries({ queryKey: ['announcements', 'cohort', cohortId.toString()] });
        },
    });
};
