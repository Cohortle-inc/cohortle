'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getUserProfile, updateProfile, getUserAchievements } from '@/lib/api/profile';
import EnhancedProfileHeader from './EnhancedProfileHeader';
import EnhancedLearningStats from './EnhancedLearningStats';
import EnhancedEnrolledProgrammesList from './EnhancedEnrolledProgrammesList';
import EnhancedAchievementsBadges from './EnhancedAchievementsBadges';
import ProfileEditForm from './ProfileEditForm';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  linkedinUsername?: string;
  joinedAt: string;
}

interface LearningStats {
  totalProgrammes: number;
  completedProgrammes: number;
  totalLessonsCompleted: number;
  currentStreak: number;
  longestStreak: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  category?: string;
}

interface EnrolledProgramme {
  id: number;
  name: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  lastAccessed?: string;
  status?: 'active' | 'completed' | 'paused';
}

interface LoadingStates {
  profile: boolean;
  stats: boolean;
  programmes: boolean;
  achievements: boolean;
}

interface ErrorStates {
  profile: Error | null;
  stats: Error | null;
  programmes: Error | null;
  achievements: Error | null;
}

export default function EnhancedLearnerProfile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [enrolledProgrammes, setEnrolledProgrammes] = useState<EnrolledProgramme[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  
  const [loading, setLoading] = useState<LoadingStates>({
    profile: true,
    stats: true,
    programmes: true,
    achievements: true,
  });
  
  const [errors, setErrors] = useState<ErrorStates>({
    profile: null,
    stats: null,
    programmes: null,
    achievements: null,
  });

  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Memoized loading state
  const isInitialLoading = useMemo(() => 
    loading.profile || loading.stats || loading.programmes || loading.achievements,
    [loading]
  );

  // Fetch profile data
  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, profile: true, stats: true }));
      setErrors(prev => ({ ...prev, profile: null, stats: null }));
      
      const profileData = await getUserProfile();
      setUser(profileData.user);
      setStats(profileData.stats);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load profile');
      setErrors(prev => ({ ...prev, profile: error, stats: error }));
    } finally {
      setLoading(prev => ({ ...prev, profile: false, stats: false }));
    }
  }, []);

  // Fetch achievements
  const fetchAchievements = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, achievements: true }));
      setErrors(prev => ({ ...prev, achievements: null }));
      
      const achievementsData = await getUserAchievements();
      setAchievements(achievementsData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load achievements');
      setErrors(prev => ({ ...prev, achievements: error }));
    } finally {
      setLoading(prev => ({ ...prev, achievements: false }));
    }
  }, []);

  // Fetch enrolled programmes
  const fetchEnrolledProgrammes = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, programmes: true }));
      setErrors(prev => ({ ...prev, programmes: null }));
      
      // Import getEnrolledProgrammes dynamically to avoid circular dependency
      const { getEnrolledProgrammes } = await import('@/lib/api/programmes');
      const programmesData = await getEnrolledProgrammes();
      
      // Transform enrolled programmes data to match component interface
      const transformedProgrammes = programmesData.map(prog => ({
        id: prog.id,
        name: prog.name,
        progress: prog.currentWeek && prog.totalWeeks 
          ? Math.round((prog.currentWeek / prog.totalWeeks) * 100) 
          : 0,
        totalLessons: 0, // This would need to be calculated from weeks/lessons
        completedLessons: 0, // This would need to be fetched from progress API
        lastAccessed: prog.enrolledAt,
        status: 'active' as const,
      }));
      
      setEnrolledProgrammes(transformedProgrammes);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load programmes');
      setErrors(prev => ({ ...prev, programmes: error }));
    } finally {
      setLoading(prev => ({ ...prev, programmes: false }));
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    const fetchAllData = async () => {
      await Promise.all([
        fetchProfileData(),
        fetchAchievements(),
        fetchEnrolledProgrammes(),
      ]);
      setLastRefresh(new Date());
    };

    fetchAllData();
  }, [fetchProfileData, fetchAchievements, fetchEnrolledProgrammes]);

  // Handle profile update
  const handleUpdateProfile = useCallback(async (data: { 
    name: string; 
    profilePicture?: string;
    bio?: string;
    linkedinUsername?: string;
  }) => {
    try {
      const updatedUser = await updateProfile(data);
      setUser(updatedUser);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      throw err; // Let the form handle the error
    }
  }, []);

  // Retry handlers
  const retryProfile = useCallback(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const retryAchievements = useCallback(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const retryProgrammes = useCallback(() => {
    fetchEnrolledProgrammes();
  }, [fetchEnrolledProgrammes]);

  const refreshAll = useCallback(() => {
    fetchProfileData();
    fetchAchievements();
    fetchEnrolledProgrammes();
    setLastRefresh(new Date());
  }, [fetchProfileData, fetchAchievements, fetchEnrolledProgrammes]);

  // Show loading skeleton for initial load
  if (isInitialLoading && !user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
        <EnhancedProfileHeader
          name=""
          email=""
          joinedAt=""
          onEditClick={() => {}}
          isLoading={true}
        />
        <EnhancedLearningStats
          totalProgrammes={0}
          completedProgrammes={0}
          totalLessonsCompleted={0}
          currentStreak={0}
          longestStreak={0}
          isLoading={true}
        />
        <EnhancedEnrolledProgrammesList
          programmes={[]}
          isLoading={true}
        />
        <EnhancedAchievementsBadges
          achievements={[]}
          isLoading={true}
        />
      </div>
    );
  }

  // Show error if critical data failed to load
  if (errors.profile && !user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 text-red-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-2">Unable to load profile</h3>
          <p className="text-red-600 mb-4">{errors.profile.message}</p>
          <button
            onClick={retryProfile}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user || !stats) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* Refresh indicator */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>
        <button
          onClick={refreshAll}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          disabled={isInitialLoading}
        >
          <svg 
            className={`w-4 h-4 ${isInitialLoading ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh All
        </button>
      </div>

      {/* Profile Header */}
      {isEditing ? (
        <ProfileEditForm
          initialName={user.name}
          initialProfilePicture={user.profilePicture}
          initialBio={user.bio}
          initialLinkedinUsername={user.linkedinUsername}
          onSubmit={handleUpdateProfile}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <EnhancedProfileHeader
          name={user.name}
          email={user.email}
          profilePicture={user.profilePicture}
          bio={user.bio}
          linkedinUsername={user.linkedinUsername}
          joinedAt={user.joinedAt}
          onEditClick={() => setIsEditing(true)}
          isLoading={loading.profile}
          error={errors.profile}
          onRetry={retryProfile}
        />
      )}

      {/* Learning Statistics */}
      <EnhancedLearningStats
        totalProgrammes={stats.totalProgrammes}
        completedProgrammes={stats.completedProgrammes}
        totalLessonsCompleted={stats.totalLessonsCompleted}
        currentStreak={stats.currentStreak}
        longestStreak={stats.longestStreak}
        isLoading={loading.stats}
        error={errors.stats}
        onRetry={retryProfile} // Stats are fetched with profile
      />

      {/* Enrolled Programmes */}
      <EnhancedEnrolledProgrammesList 
        programmes={enrolledProgrammes}
        isLoading={loading.programmes}
        error={errors.programmes}
        onRetry={retryProgrammes}
      />

      {/* Achievements */}
      <EnhancedAchievementsBadges 
        achievements={achievements}
        isLoading={loading.achievements}
        error={errors.achievements}
        onRetry={retryAchievements}
      />
    </div>
  );
}