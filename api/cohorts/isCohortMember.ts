import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { requireApiBaseUrl } from '../apiConfig';

interface MemberCheckResult {
  isMember: boolean;
  role: string | null;
  memberId: number | null;
}

export const checkCohortMembership = async (cohortId: number, userId: number): Promise<MemberCheckResult> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const apiURL = requireApiBaseUrl();

    if (!token) {
      return { isMember: false, role: null, memberId: null };
    }

    // Call the existing members endpoint
    const response = await axios.get(
      `${apiURL}/v1/api/cohorts/${cohortId}/members`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const members = response.data.members || [];

    // Find if current user is in the members list
    const member = members.find((m: any) => m.id === userId);

    if (member) {
      return {
        isMember: true,
        role: member.role || null,
        memberId: member.member_id || null,
      };
    }

    return { isMember: false, role: null, memberId: null };
  } catch (error: any) {
    console.log('Cohort membership check error:', error?.response?.status);
    return { isMember: false, role: null, memberId: null };
  }
};
