/**
 * Profile API functions
 * Handles user profile, preferences, learning goals, and achievements
 */

import apiClient from './client';

// ============================================================================
// Profile Types
// ============================================================================

/**
 * User profile data
 */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  linkedinUsername?: string;
  joinedAt: string;
  organisationSlug?: string | null;
  organisationName?: string | null;
  organisationDescription?: string | null;
}

/**
 * Learning statistics
 */
export interface LearningStats {
  totalProgrammes: number;
  completedProgrammes: number;
  totalLessonsCompleted: number;
  currentStreak: number; // days
  longestStreak: number; // days
}

/**
 * Achievement data
 */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  category?: string;
}

/**
 * Profile update data
 */
export interface ProfileUpdate {
  name?: string;
  profilePicture?: string;
  bio?: string;
  linkedinUsername?: string;
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  emailLessonReminders: boolean;
  emailCommunityActivity: boolean;
  emailProgrammeUpdates: boolean;
  emailWeeklyDigest: boolean;
}

/**
 * Learning goal data
 */
export interface LearningGoal {
  type: 'lessons_per_week' | 'hours_per_week';
  target: number;
  current: number;
}

/**
 * User profile response
 */
export interface UserProfileResponse {
  error: boolean;
  message: string;
  user: UserProfile;
  stats: LearningStats;
}

/**
 * Profile update response
 */
export interface ProfileUpdateResponse {
  error: boolean;
  message: string;
  user: UserProfile;
}

/**
 * Achievements response
 */
export interface AchievementsResponse {
  error: boolean;
  message: string;
  achievements: Achievement[];
}

/**
 * Preferences response
 */
export interface PreferencesResponse {
  error: boolean;
  message: string;
  preferences: NotificationPreferences;
}

/**
 * Learning goal response
 */
export interface LearningGoalResponse {
  error: boolean;
  message: string;
  goal: LearningGoal | null;
}

/**
 * Avatar generation response
 */
export interface AvatarGenerationResponse {
  error: boolean;
  avatarUrl?: string;
  message: string;
}

// ============================================================================
// Profile API Functions
// ============================================================================

/**
 * Get user profile with learning statistics
 * @returns User profile and stats
 * @throws Error if request fails
 */
export async function getUserProfile(): Promise<{ user: UserProfile; stats: LearningStats }> {
  const response = await apiClient.get<UserProfileResponse>('/v1/api/profile');
  
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to fetch user profile');
  }
  
  return {
    user: response.data.user,
    stats: response.data.stats,
  };
}

/**
 * Update user profile
 * @param data - Profile update data (name and/or profile picture)
 * @returns Updated user profile
 * @throws Error if request fails or validation fails
 */
export async function updateProfile(data: ProfileUpdate): Promise<UserProfile> {
  const response = await apiClient.put<ProfileUpdateResponse>('/v1/api/profile', data);
  
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to update profile');
  }
  
  return response.data.user;
}

/**
 * Get user achievements
 * @returns Array of earned achievements
 * @throws Error if request fails
 */
export async function getUserAchievements(): Promise<Achievement[]> {
  const response = await apiClient.get<AchievementsResponse>('/v1/api/profile/achievements');
  
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to fetch achievements');
  }
  
  return response.data.achievements;
}

/**
 * Get notification preferences
 * @returns User notification preferences
 * @throws Error if request fails
 */
export async function getPreferences(): Promise<NotificationPreferences> {
  const response = await apiClient.get<PreferencesResponse>('/v1/api/profile/preferences');
  
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to fetch preferences');
  }
  
  return response.data.preferences;
}

/**
 * Update notification preferences
 * @param preferences - New notification preferences
 * @returns Updated preferences
 * @throws Error if request fails
 */
export async function updatePreferences(
  preferences: NotificationPreferences
): Promise<NotificationPreferences> {
  const response = await apiClient.put<PreferencesResponse>(
    '/v1/api/profile/preferences',
    preferences
  );
  
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to update preferences');
  }
  
  return response.data.preferences;
}

/**
 * Get current learning goal
 * @returns Learning goal or null if not set
 * @throws Error if request fails
 */
export async function getLearningGoal(): Promise<LearningGoal | null> {
  const response = await apiClient.get<LearningGoalResponse>('/v1/api/profile/goals');
  
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to fetch learning goal');
  }
  
  return response.data.goal;
}

/**
 * Set or update learning goal
 * @param goal - Learning goal data
 * @returns Updated learning goal
 * @throws Error if request fails
 */
export async function setLearningGoal(goal: LearningGoal): Promise<LearningGoal> {
  const response = await apiClient.put<LearningGoalResponse>('/v1/api/profile/goals', goal);
  
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to set learning goal');
  }
  
  if (!response.data.goal) {
    throw new Error('Failed to set learning goal: No goal returned');
  }
  
  return response.data.goal;
}

/**
 * Change user password
 * @param data - Current and new password
 * @throws Error if request fails or current password is incorrect
 */
export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  const response = await apiClient.put('/v1/api/profile/password', data);
  
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to change password');
  }
}

/**
 * Generate a new avatar for the user
 * @returns Generated avatar URL
 * @throws Error if request fails or avatar generation fails
 */
export async function generateAvatar(): Promise<string> {
  const response = await apiClient.post<AvatarGenerationResponse>('/v1/api/profile/avatar/generate');
  
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to generate avatar');
  }
  
  if (!response.data.avatarUrl) {
    throw new Error('Avatar generation succeeded but no URL was returned');
  }
  
  return response.data.avatarUrl;
}
