import { useQuery } from '@tanstack/react-query';
import { getProfile } from '@/api/getProfile';
import { checkCohortMembershipInProgramme } from '@/api/programmes/checkMembership';

interface MembershipResult {
    isMember: boolean;
    cohortId: number | null;
    role: string | null;
    cohorts?: any[];
}

const checkMembership = async (programmeId: number): Promise<MembershipResult> => {
    try {
        // Get current user ID from profile
        const profileData = await getProfile();
        const user = profileData.user || profileData.message || profileData;
        
        if (!user || !user.id) {
            return { isMember: false, cohortId: null, role: null, cohorts: [] };
        }

        const userId = user.id;

        // Check cohort membership using the new endpoint
        const result = await checkCohortMembershipInProgramme(programmeId, userId);

        return {
            isMember: result.isMember,
            cohortId: result.cohortId,
            role: null,
            cohorts: result.cohorts,
        };
    } catch (error: any) {
        console.error('Membership check error:', error?.message);
        return { isMember: false, cohortId: null, role: null, cohorts: [] };
    }
};

export const useProgrammeMembership = (programmeId: number) => {
    return useQuery({
        queryKey: ['programmeMembership', programmeId],
        queryFn: () => checkMembership(programmeId),
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!programmeId,
    });
};
