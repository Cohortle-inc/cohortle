import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { requireApiBaseUrl } from '../apiConfig';

export const checkProgrammeMembership = async (programmeId: string) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const apiURL = requireApiBaseUrl();

    if (!token) {
      console.warn('No auth token for membership check');
      return { isMember: false, cohortId: null };
    }

    const response = await axios.get(
      `${apiURL}/v1/api/programmes/${programmeId}/membership`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return {
      isMember: response.data.isMember || false,
      cohortId: response.data.cohortId || null,
    };
  } catch (error: any) {
    console.log('Membership check error:', error?.response?.status);
    // 404 or 403 means not a member, which is expected
    if (error?.response?.status === 404 || error?.response?.status === 403) {
      return { isMember: false, cohortId: null };
    }
    throw error;
  }
};

export const checkCohortMembershipInProgramme = async (
  programmeId: number,
  userId: number
): Promise<{ isMember: boolean; cohortId: number | null; cohorts: any[] }> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const apiURL = requireApiBaseUrl();

    if (!token) {
      console.warn('No auth token for cohort membership check');
      return { isMember: false, cohortId: null, cohorts: [] };
    }

    const response = await axios.post(
      `${apiURL}/v1/api/programmes/${programmeId}/check-cohort-membership`,
      { user_id: userId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const { is_member, cohorts } = response.data;

    return {
      isMember: is_member || false,
      cohortId: cohorts && cohorts.length > 0 ? cohorts[0].cohort_id : null,
      cohorts: cohorts || [],
    };
  } catch (error: any) {
    console.log('Cohort membership check error:', error?.response?.status);
    // 404, 403, or 400 means not a member or user not found
    if (
      error?.response?.status === 404 ||
      error?.response?.status === 403 ||
      error?.response?.status === 400
    ) {
      return { isMember: false, cohortId: null, cohorts: [] };
    }
    throw error;
  }
};
