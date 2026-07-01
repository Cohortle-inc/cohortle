'use client';

/**
 * EnhancedEmptyState Component
 * Improved empty state with onboarding guidance and clear call-to-actions
 * Requirements: 2.1, 2.2, 2.3, 5.1, 5.2, 5.3, 5.4, 1.6, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Target,
  BookOpen,
  TrendUp,
  Star,
  Hand,
  MapTrifold,
  Student,
  Flag,
} from '@phosphor-icons/react/dist/ssr';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'convener';
  createdAt: Date;
  lastLoginAt: Date;
  onboardingCompleted: boolean;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  showOnboardingTips: boolean;
  preferredLoadingStyle: 'skeleton' | 'spinner';
  dismissedMessages: string[];
}

export interface OnboardingState {
  isFirstVisit: boolean;
  hasSeenTips: boolean;
  lastVisitDate: Date | null;
}

export interface EnhancedEmptyStateProps {
  userProfile: UserProfile;
  onJoinWithCode: () => void;
  onBrowseProgrammes: () => void;
  onDismissOnboarding?: () => void;
  showOnboarding?: boolean;
  type?: 'programmes' | 'cohorts' | 'learners';
}

// Check if user is inactive (more than 7 days since last login)
function isUserInactive(lastLoginAt: Date): boolean {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return lastLoginAt < sevenDaysAgo;
}

// Check if user is new (created within last 24 hours)
function isNewUser(createdAt: Date): boolean {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  return createdAt > oneDayAgo;
}

// Onboarding tips with Phosphor icon components
const ONBOARDING_TIPS = [
  {
    title: "Welcome to your learning journey!",
    content: "This is your personal dashboard where you'll track progress, access lessons, and connect with your learning community.",
    icon: Target,
  },
  {
    title: "Join programmes with ease",
    content: "Use an enrollment code from your instructor to join programmes, or browse available options to find what interests you.",
    icon: BookOpen,
  },
  {
    title: "Track your progress",
    content: "Once enrolled, you'll see your progress, upcoming sessions, and recent activity right here on your dashboard.",
    icon: TrendUp,
  },
];

export function EnhancedEmptyState({
  userProfile,
  onJoinWithCode,
  onBrowseProgrammes,
  onDismissOnboarding,
  showOnboarding = true,
  type = 'programmes',
}: EnhancedEmptyStateProps) {
  const router = useRouter();
  const [showTips, setShowTips] = useState(showOnboarding);
  const [currentTip, setCurrentTip] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  const isNew = isNewUser(userProfile.createdAt);
  const isInactive = isUserInactive(userProfile.lastLoginAt);
  const shouldShowEncouragement = isInactive && !isNew;

  const nextTip = () => {
    if (currentTip < ONBOARDING_TIPS.length - 1) {
      setCurrentTip(currentTip + 1);
    } else {
      setShowTips(false);
      onDismissOnboarding?.();
    }
  };

  const skipTips = () => {
    setShowTips(false);
    onDismissOnboarding?.();
  };

  const handleJoinWithCode = () => {
    onJoinWithCode();
    router.push('/join');
  };

  const handleBrowseProgrammes = () => {
    onBrowseProgrammes();
    router.push('/discover');
  };

  // Render onboarding tips overlay
  if (showTips && isNew && ONBOARDING_TIPS.length > 0) {
    const tip = ONBOARDING_TIPS[currentTip];
    const TipIcon = tip.icon;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
        <div className="bg-white rounded-lg max-w-md mx-4 p-6 shadow-xl">
          <div className="text-center">
            <div className="flex justify-center mb-4" aria-hidden="true">
              <TipIcon weight="duotone" size={48} color="#391D65" aria-hidden="true" />
            </div>
            <h3 id="onboarding-title" className="text-xl font-semibold text-gray-900 mb-3">
              {tip.title}
            </h3>
            <p className="text-gray-600 mb-6">
              {tip.content}
            </p>
            <div className="flex items-center justify-center space-x-2 mb-6">
              {ONBOARDING_TIPS.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentTip ? 'bg-[#391D65]' : 'bg-gray-300'
                  }`}
                  aria-hidden="true"
                />
              ))}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={skipTips}
                className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-700 font-medium"
              >
                Skip
              </button>
              <button
                onClick={nextTip}
                className="flex-1 px-4 py-2 bg-[#391D65] text-white rounded-lg hover:bg-[#391D65]/90 transition-colors font-medium"
              >
                {currentTip === ONBOARDING_TIPS.length - 1 ? 'Get Started' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const illustrationTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.4, ease: 'easeOut' as const };

  return (
    <div className="text-center py-12 px-4 max-w-2xl mx-auto">
      {/* "Path ahead" illustration — composed Phosphor icons */}
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 16 }}
        animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
        transition={illustrationTransition}
        className="inline-flex items-center justify-center mb-6"
      >
        <div
          className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#ECDCFF] to-[#D4C5F9]"
          aria-hidden="true"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <MapTrifold weight="duotone" size={40} color="#391D65" aria-hidden="true" />
          </div>
          <div className="absolute -left-3 bottom-1">
            <Student weight="duotone" size={24} color="#391D65" aria-hidden="true" />
          </div>
          <div className="absolute -right-3 top-1">
            <Flag weight="duotone" size={24} color="#391D65" aria-hidden="true" />
          </div>
        </div>
      </motion.div>

      {/* Dynamic messaging based on user state */}
      {isNew ? (
        <>
          <h2 className="text-2xl font-bold text-gray-900 mb-3 flex items-center justify-center gap-2">
            Welcome to your learning dashboard, {userProfile.name}!{' '}
            <Star weight="fill" size={22} color="#F59E0B" aria-hidden="true" />
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            You're all set up and ready to begin your learning journey. Let's get you enrolled in your first programme.
          </p>
        </>
      ) : shouldShowEncouragement ? (
        <>
          <h2 className="text-2xl font-bold text-gray-900 mb-3 flex items-center justify-center gap-2">
            Welcome back, {userProfile.name}!{' '}
            <Hand weight="fill" size={22} color="#391D65" aria-hidden="true" />
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            It's great to see you again! Ready to continue your learning journey? Join a programme to get started.
          </p>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            You're not enrolled in any programmes yet
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Join a programme using an enrollment code from your instructor, or explore available programmes to find what interests you.
          </p>
        </>
      )}

      {/* Contextual help text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-sm font-medium text-blue-900 mb-1">How to get started:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Ask your instructor for an enrollment code</li>
              <li>• Browse available programmes in our catalogue</li>
              <li>• Join programmes that match your learning goals</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Call-to-action buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
        <button
          onClick={handleJoinWithCode}
          className="inline-flex items-center justify-center px-8 py-4 min-h-[52px] bg-[#391D65] text-white rounded-lg hover:bg-[#391D65]/90 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          Join with Code
        </button>
        <button
          onClick={handleBrowseProgrammes}
          className="inline-flex items-center justify-center px-8 py-4 min-h-[52px] bg-white text-[#391D65] border-2 border-[#391D65] rounded-lg hover:bg-[#391D65] hover:text-white transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Discover Programmes
        </button>
      </div>

      {/* Additional help section */}
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-2">Need help getting started?</p>
        <button
          onClick={() => setShowTips(true)}
          className="text-[#391D65] hover:text-[#391D65]/80 font-medium text-sm underline"
        >
          Show me around the platform
        </button>
      </div>

      {/* Encouraging message for inactive users */}
      {shouldShowEncouragement && (
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium flex items-center justify-center gap-2">
            <Star weight="fill" size={18} color="#16A34A" aria-hidden="true" />
            Ready to continue your learning journey? There might be new programmes available since your last visit!
          </p>
        </div>
      )}
    </div>
  );
}
