import { useQuery } from '@tanstack/react-query';
import { getProfile } from '@/api/getProfile';
import { useGetCohortsByProgramme } from '@/api/cohorts/getCohortsByProgramme';
import { getCohortMembers } from '@/api/cohorts/getCohortMembers';

interface MembershipResult {
    isMember: boolean;
    cohortId: number | null;
    role: string | null;
}

export const useProgrammeMembership = (programmeId: number) => {
    const { data: cohortsData, isLoading: isLoadingCohorts } = useGetCohortsByProgramme(programmeId);

    return useQuery({
        queryKey: ['programmeMembership', programmeId, cohortsData?.cohorts?.length],
        queryFn: async (): Promise<MembershipResult> => {
            try {
                // 1. Get User Profile (for ID)
                const profileData = await getProfile();

                console.log("Profile Data received:", profileData);

                // Handle different possible response structures
                // structure might be { message: User } or { user: User } or just User
                const user = profileData.user || profileData.message || profileData;
                console.log(user)
                if (!user || !user.email) {
                    console.error("Could not find user email. Profile Data keys:", Object.keys(profileData));
                    throw new Error("User email not found in profile data");
                }
                const userEmail = user.email;
                console.log("User Email received:", userEmail);

                // 2. Get Cohorts (already fetched via hook, but we need the array here)
                // If the hook assumes we pass data in, we might rely on 'enabled'
                const cohorts = cohortsData?.cohorts || [];

                if (cohorts.length === 0) {
                    return { isMember: false, cohortId: null, role: null };
                }

                // 3. Check membership in each cohort
                // We use Promise.all to fetch in parallel
                const checks = await Promise.all(
                    cohorts.map(async (cohort: any) => {
                        try {
                            const membersData = await getCohortMembers(cohort.id);
                            const members = membersData.members || [];

                            // Check if user is in members list
                            // Assuming members have 'email' matching user.email
                            const memberRec = members.find((m: any) => m.email === userEmail);

                            if (memberRec) {
                                return { isMember: true, cohortId: cohort.id, role: memberRec.role };
                            }
                            return null;
                        } catch (err) {
                            console.log(`Failed to fetch members for cohort ${cohort.id}`, err);
                            return null;
                        }
                    })
                );

                const match = checks.find(c => c !== null);

                if (match) {
                    return match;
                }

                return { isMember: false, cohortId: null, role: null };

            } catch (error) {
                console.error("Error checking programme membership:", error);
                return { isMember: false, cohortId: null, role: null };
            }
        },
        enabled: !!programmeId && !!cohortsData?.cohorts,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
