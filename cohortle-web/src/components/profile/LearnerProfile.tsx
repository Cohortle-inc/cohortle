'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getUserProfile,
  updateProfile,
  getUserAchievements,
  getLearningGoal,
  setLearningGoal,
  type LearningGoal,
} from '@/lib/api/profile';
import ProfileHeader from './ProfileHeader';
import LearningStats from './LearningStats';
import EnrolledProgrammesList from './EnrolledProgrammesList';
import AchievementsBadges from './AchievementsBadges';
import LearningGoals from './LearningGoals';
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
}

interface EnrolledProgramme {
  id: number;
  name: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
}

export default function LearnerProfile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [enrolledProgrammes, setEnrolledProgrammes] = useState<EnrolledProgramme[]>([]);
  const [goal, setGoal] = useState<LearningGoal | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { getEnrolledProgrammes } = await import('@/lib/api/programmes');

        const [profileData, achievementsData, programmesData, goalData] = await Promise.all([
          getUserProfile(),
          getUserAchievements(),
          getEnrolledProgrammes(),
          getLearningGoal().catch(() => null),
        ]);

        setUser(profileData.user);
        setStats(profileData.stats);
        setGoal(goalData);

        const transformedProgrammes = programmesData.map(prog => ({
          id: prog.id,
          name: prog.name,
          progress:
            prog.currentWeek && prog.totalWeeks
              ? Math.round((prog.currentWeek / prog.totalWeeks) * 100)
              : 0,
          totalLessons: 0,
          completedLessons: 0,
        }));

        setEnrolledProgrammes(transformedProgrammes);
        setAchievements(achievementsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleUpdateProfile = async (data: {
    name: string;
    profilePicture?: string;
    bio?: string;
    linkedinUsername?: string;
  }) => {
    const updatedUser = await updateProfile(data);
    setUser(updatedUser);
  };

  const handleSetGoal = async (newGoal: LearningGoal) => {
    const saved = await setLearningGoal(newGoal);
    setGoal(saved);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Profile header skeleton */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
        {/* Stats skeleton */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="h-5 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-200 rounded-lg" />)}
          </div>
        </div>
        {/* Content skeleton */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="h-5 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !user || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-800">{error || 'Failed to load profile'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
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
        <>
          <ProfileHeader
            name={user.name}
            email={user.email}
            profilePicture={user.profilePicture}
            bio={user.bio}
            linkedinUsername={user.linkedinUsername}
            joinedAt={user.joinedAt}
            onEditClick={() => setIsEditing(true)}
          />
          <div className="flex justify-end">
            <Link
              href="/profile/settings"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Settings
            </Link>
          </div>
        </>
      )}

      <LearningStats
        totalProgrammes={stats.totalProgrammes}
        completedProgrammes={stats.completedProgrammes}
        totalLessonsCompleted={stats.totalLessonsCompleted}
        currentStreak={stats.currentStreak}
        longestStreak={stats.longestStreak}
      />

      <LearningGoals currentGoal={goal ?? undefined} onSetGoal={handleSetGoal} />

      <EnrolledProgrammesList programmes={enrolledProgrammes} />

      <AchievementsBadges achievements={achievements} />
    </div>
  );
}
