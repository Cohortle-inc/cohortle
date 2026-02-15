import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { requireApiBaseUrl } from '../apiConfig';

interface CheckResult {
  isCommunityMember: boolean;
  isInAnyCohort: boolean;
  cohortId?: number | null;
  programmeId?: number | null;
}

export const checkCommunityMemberNotInCohorts = async (
  communityId: number,
  userId: number,
): Promise<CheckResult> => {
  const apiURL = requireApiBaseUrl();
  const token = await AsyncStorage.getItem('authToken');

  if (!token) {
    return { isCommunityMember: false, isInAnyCohort: false };
  }

  try {
    // 1) Check community membership
    const communityResp = await axios.get(
      `${apiURL}/v1/api/communities/${communityId}/members`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    const communityMembers = communityResp.data?.members || [];
    const isCommunityMember = communityMembers.some((m: any) => m.id === userId);

    if (!isCommunityMember) {
      return { isCommunityMember: false, isInAnyCohort: false };
    }

    // 2) Get programmes for this community
    const programmesResp = await axios.get(
      `${apiURL}/v1/api/communities/${communityId}/programmes`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    const programmes = programmesResp.data?.programmes || [];

    // 3) For each programme, list cohorts and check cohort members
    for (const programme of programmes) {
      const cohortsResp = await axios.get(
        `${apiURL}/v1/api/programmes/${programme.id}/cohorts`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const cohorts = cohortsResp.data?.cohorts || [];

      for (const cohort of cohorts) {
        const membersResp = await axios.get(
          `${apiURL}/v1/api/cohorts/${cohort.id}/members`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        const members = membersResp.data?.members || [];
        const isInCohort = members.some((m: any) => m.id === userId);

        if (isInCohort) {
          return {
            isCommunityMember: true,
            isInAnyCohort: true,
            cohortId: cohort.id,
            programmeId: programme.id,
          };
        }
      }
    }

    // Not found in any cohort
    return { isCommunityMember: true, isInAnyCohort: false };
  } catch (error: any) {
    console.error('checkCommunityMemberNotInCohorts error', error?.response?.data || error?.message);
    // On error, conservatively return not a member
    return { isCommunityMember: false, isInAnyCohort: false };
  }
};

export default checkCommunityMemberNotInCohorts;
