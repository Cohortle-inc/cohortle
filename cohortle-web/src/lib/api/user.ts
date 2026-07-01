/**
 * User data API functions
 * Handles fetching user profile and enrolled communities
 */

import apiClient from './client';

/**
 * User profile data
 */
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  name: string;
  profilePicture?: string;
  createdAt: string;
}

/**
 * Community/Programme data
 */
export interface Community {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  moduleCount: number;
  completedLessons: number;
  totalLessons: number;
  enrolledAt: string;
}

/**
 * Get current user's profile
 * @returns User profile data
 */
export async function getUserProfile(): Promise<UserProfile> {
  const response = await apiClient.get('/v1/api/profile');
  
  // Backend returns { error, message } where message contains user data
  if (response.data.error) {
    throw new Error(response.data.message);
  }
  
  const user = response.data.message;
  return {
    id: user.id.toString(),
    email: user.email,
    username: user.username || user.email.split('@')[0],
    name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
    profilePicture: user.profile_image,
    createdAt: user.created_at,
  };
}

/**
 * Get user's enrolled communities/programmes
 * @returns Array of enrolled communities
 */
export async function getUserCommunities(): Promise<Community[]> {
  const response = await apiClient.get('/v1/api/communities/joined');
  
  // Backend returns { error, message, communities }
  if (response.data.error) {
    throw new Error(response.data.message);
  }
  
  // Transform backend data to match frontend interface
  return response.data.communities.map((community: { 
    id: number; 
    name: string; 
    description?: string; 
    thumbnail?: string; 
    programme_count?: number; 
    joined_at?: string; 
    created_at?: string; 
  }) => ({
    id: community.id.toString(),
    name: community.name,
    description: community.description || '',
    thumbnail: community.thumbnail,
    moduleCount: community.programme_count || 0,
    completedLessons: 0, // TODO: Calculate from progress data
    totalLessons: 0, // TODO: Calculate from programme data
    enrolledAt: community.joined_at || community.created_at,
  }));
}
