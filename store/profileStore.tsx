// stores/profileStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProfileState {
  firstName: string;
  lastName: string;
  username: string;
  location: string;
  socials: string;
  profileImage: string;
  isLoading: boolean;
  error: string | null;
  setProfile: (
    profile: Partial<{
      firstName: string;
      lastName: string;
      username: string;
      location: string;
      socials: string;
      profileImage: string;
    }>,
  ) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      firstName: '',
      lastName: '',
      username: '',
      location: '',
      socials: '',
      profileImage: '',
      isLoading: false,
      error: null,
      setProfile: (profile) => set((state) => ({ ...state, ...profile })),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      clearProfile: () =>
        set({
          firstName: '',
          lastName: '',
          username: '',
          location: '',
          socials: '',
          profileImage: '',
        }),
    }),
    {
      name: 'profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        firstName: state.firstName,
        lastName: state.lastName,
        username: state.username,
        location: state.location,
        socials: state.socials,
        profileImage: state.profileImage,
      }),
    },
  ),
);
