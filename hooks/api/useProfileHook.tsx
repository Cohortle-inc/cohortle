// hooks/api/useProfileHook.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UpdateProfileResponse, updateProfile } from '@/api/profile';
import { getProfile } from '@/api/getProfile';
import ProfileProp from '@/types/profileType';

// GET profile hook
export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

interface UpdateProfileVariables {
  data: ProfileProp;
  tokenType?: 'authToken' | 'initialToken';
}

// Update profile hook
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateProfileResponse, Error, UpdateProfileVariables>({
    mutationFn: async ({ data, tokenType }: UpdateProfileVariables) =>
      updateProfile(data, tokenType),

    onSuccess: () => {
      // ✅ Automatically refetch profile after successful update
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

// Optional manual refresher
export const useRefreshProfile = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['profile'] });
};
