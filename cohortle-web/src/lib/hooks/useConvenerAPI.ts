import apiClient from '@/lib/api/client';
import * as api from '@/lib/api/convener';

export interface LearnerFilters {
  search: string;
  programme_id: string;
  cohort_id: string;
  status: string;
}

export function useConvenerAPI() {
  const getLearners = async (filters: LearnerFilters) => {
    const response = await apiClient.get('/v1/api/convener/learners', { params: filters });
    return response.data;
  };

  const updateEnrollmentStatus = async (enrollmentId: number, status: string) => {
    const response = await apiClient.patch(`/v1/api/enrollments/${enrollmentId}/status`, { status });
    return response.data;
  };

  const getGlobalLearnerProfile = (learnerId: string) => api.getGlobalLearnerProfile(learnerId);
  const getLearnerActivity = (learnerId: string, params?: { programme_id?: string; limit?: number }) =>
    api.getLearnerActivity(learnerId, params);

  return {
    getLearners,
    updateEnrollmentStatus,
    getGlobalLearnerProfile,
    getLearnerActivity
  };
}
