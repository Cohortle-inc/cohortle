'use client';

/**
 * OnboardingTips Component
 * Dismissible tips and first-visit detection with user preference storage
 * Requirements: 5.1, 5.2, 5.3, 5.4, 1.6, 7.1, 7.2, 7.3, 7.4, 7.5
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { Icon } from '@phosphor-icons/react';
import { Target, BookOpen, TrendUp, Lightbulb } from '@phosphor-icons/react/dist/ssr';

export interface OnboardingTip {
  id: string;
  title: string;
  content: string;
  icon: Icon;
  action?: {
    label: string;
    href: string;
  };
}

export interface OnboardingTipsProps {
  tips: OnboardingTip[];
  userId: string;
  onDismiss?: (tipId: string) => void;
  onComplete?: () => void;
  className?: string;
}

// Storage keys for user preferences
const STORAGE_KEYS = {
  dismissedTips: (userId: string) => `onboarding_dismissed_${userId}`,
  firstVisit: (userId: string) => `first_visit_${userId}`,
  lastVisit: (userId: string) => `last_visit_${userId}`,
  onboardingCompleted: (userId: string) => `onboarding_completed_${userId}`,
} as const;

// Default onboarding tips — icons are Phosphor components (duotone, Brand_Purple)
export const DEFAULT_ONBOARDING_TIPS: OnboardingTip[] = [
  {
    id: 'welcome',
    title: 'Welcome to your learning dashboard!',
    content: 'This is your central hub for tracking progress, accessing lessons, and connecting with your learning community.',
    icon: Target,
  },
  {
    id: 'join-programmes',
    title: 'Join programmes easily',
    content: 'Use an enrollment code from your instructor or discover open programmes that match your interests.',
    icon: BookOpen,
    action: {
      label: 'Discover Programmes',
      href: '/discover',
    },
  },
  {
    id: 'track-progress',
    title: 'Track your learning journey',
    content: 'Monitor your progress, view upcoming sessions, and see recent activity all in one place.',
    icon: TrendUp,
  },
  {
    id: 'get-help',
    title: "Need help? We're here for you",
    content: 'Access help resources, contact support, or revisit these tips anytime from your dashboard.',
    icon: Lightbulb,
  },
];

// Check if user is new (first visit)
function isFirstVisit(userId: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const firstVisitKey = STORAGE_KEYS.firstVisit(userId);
  const hasVisited = localStorage.getItem(firstVisitKey);
  
  if (!hasVisited) {
    localStorage.setItem(firstVisitKey, new Date().toISOString());
    return true;
  }
  
  return false;
}

// Check if user has been inactive for more than 7 days
function isInactiveUser(userId: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const lastVisitKey = STORAGE_KEYS.lastVisit(userId);
  const lastVisit = localStorage.getItem(lastVisitKey);
  
  if (!lastVisit) return false;
  
  const lastVisitDate = new Date(lastVisit);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  return lastVisitDate < sevenDaysAgo;
}

// Get dismissed tips for user
function getDismissedTips(userId: string): string[] {
  if (typeof window === 'undefined') return [];
  
  const dismissedKey = STORAGE_KEYS.dismissedTips(userId);
  const dismissed = localStorage.getItem(dismissedKey);
  
  return dismissed ? JSON.parse(dismissed) : [];
}

// Save dismissed tip
function saveDismissedTip(userId: string, tipId: string): void {
  if (typeof window === 'undefined') return;
  
  const dismissedKey = STORAGE_KEYS.dismissedTips(userId);
  const dismissed = getDismissedTips(userId);
  
  if (!dismissed.includes(tipId)) {
    dismissed.push(tipId);
    localStorage.setItem(dismissedKey, JSON.stringify(dismissed));
  }
}

// Check if onboarding is completed
function isOnboardingCompleted(userId: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const completedKey = STORAGE_KEYS.onboardingCompleted(userId);
  return localStorage.getItem(completedKey) === 'true';
}

// Mark onboarding as completed
function markOnboardingCompleted(userId: string): void {
  if (typeof window === 'undefined') return;
  
  const completedKey = STORAGE_KEYS.onboardingCompleted(userId);
  localStorage.setItem(completedKey, 'true');
}

// Update last visit timestamp
function updateLastVisit(userId: string): void {
  if (typeof window === 'undefined') return;
  
  const lastVisitKey = STORAGE_KEYS.lastVisit(userId);
  localStorage.setItem(lastVisitKey, new Date().toISOString());
}

export function OnboardingTips({
  tips = DEFAULT_ONBOARDING_TIPS,
  userId,
  onDismiss,
  onComplete,
  className = '',
}: OnboardingTipsProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [showTips, setShowTips] = useState(false);
  const [dismissedTips, setDismissedTips] = useState<string[]>([]);
  const shouldReduceMotion = useReducedMotion();

  // Initialize component state
  useEffect(() => {
    if (!userId) return;

    // Update last visit
    updateLastVisit(userId);

    // Check if we should show onboarding
    const isFirst = isFirstVisit(userId);
    const isInactive = isInactiveUser(userId);
    const isCompleted = isOnboardingCompleted(userId);
    const dismissed = getDismissedTips(userId);

    setDismissedTips(dismissed);

    // Show tips for first-time users or inactive users who haven't completed onboarding
    if ((isFirst || isInactive) && !isCompleted) {
      // Find first non-dismissed tip
      const firstAvailableTip = tips.findIndex(tip => !dismissed.includes(tip.id));
      if (firstAvailableTip !== -1) {
        setCurrentTipIndex(firstAvailableTip);
        setShowTips(true);
      }
    }
  }, [userId, tips]);

  // Handle tip dismissal
  const handleDismissTip = (tipId: string) => {
    saveDismissedTip(userId, tipId);
    setDismissedTips(prev => [...prev, tipId]);
    onDismiss?.(tipId);
    
    // Move to next tip or close
    handleNextTip();
  };

  // Handle next tip
  const handleNextTip = () => {
    const nextIndex = currentTipIndex + 1;
    
    // Find next non-dismissed tip
    let nextTipIndex = -1;
    for (let i = nextIndex; i < tips.length; i++) {
      if (!dismissedTips.includes(tips[i].id)) {
        nextTipIndex = i;
        break;
      }
    }
    
    if (nextTipIndex !== -1) {
      setCurrentTipIndex(nextTipIndex);
    } else {
      // No more tips, complete onboarding
      handleCompleteOnboarding();
    }
  };

  // Handle onboarding completion
  const handleCompleteOnboarding = () => {
    markOnboardingCompleted(userId);
    setShowTips(false);
    onComplete?.();
  };

  // Handle skip all tips
  const handleSkipAll = () => {
    // Mark all tips as dismissed
    tips.forEach(tip => {
      if (!dismissedTips.includes(tip.id)) {
        saveDismissedTip(userId, tip.id);
      }
    });
    handleCompleteOnboarding();
  };

  // Don't render if no tips to show
  if (!showTips || currentTipIndex >= tips.length) {
    return null;
  }

  const currentTip = tips[currentTipIndex];
  const remainingTips = tips.filter(tip => !dismissedTips.includes(tip.id));
  const isLastTip = remainingTips.length <= 1;

  const iconTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 300, damping: 22 };

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${className}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      aria-describedby="onboarding-description"
    >
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Tip content */}
        <div className="text-center">
          {/* Animated Phosphor icon */}
          <div className="flex justify-center mb-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTip.id}
                initial={shouldReduceMotion ? {} : { scale: 0.7, opacity: 0 }}
                animate={shouldReduceMotion ? {} : { scale: 1, opacity: 1 }}
                exit={shouldReduceMotion ? {} : { scale: 0.7, opacity: 0 }}
                transition={iconTransition}
              >
                <currentTip.icon
                  weight="duotone"
                  size={48}
                  color="#391D65"
                  aria-hidden="true"
                />
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Title */}
          <h3 id="onboarding-title" className="text-xl font-semibold text-gray-900 mb-3">
            {currentTip.title}
          </h3>
          
          {/* Content */}
          <p id="onboarding-description" className="text-gray-600 mb-6 leading-relaxed">
            {currentTip.content}
          </p>
          
          {/* Action button if available */}
          {currentTip.action && (
            <div className="mb-6">
              <a
                href={currentTip.action.href}
                className="inline-flex items-center px-4 py-2 bg-[#391D65]/10 text-[#391D65] rounded-lg hover:bg-[#391D65]/20 transition-colors font-medium"
                onClick={() => handleDismissTip(currentTip.id)}
              >
                {currentTip.action.label}
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          )}
          
          {/* Progress indicators */}
          <div className="flex items-center justify-center space-x-2 mb-6">
            {tips.map((tip, index) => (
              <div
                key={tip.id}
                className={`w-2 h-2 rounded-full transition-colors ${
                  dismissedTips.includes(tip.id)
                    ? 'bg-green-400'
                    : index === currentTipIndex
                    ? 'bg-[#391D65]'
                    : 'bg-gray-300'
                }`}
                aria-hidden="true"
              />
            ))}
          </div>
          
          {/* Action buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleSkipAll}
              className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-700 font-medium transition-colors"
            >
              Skip All
            </button>
            <button
              onClick={() => handleDismissTip(currentTip.id)}
              className="flex-1 px-4 py-2 bg-[#391D65] text-white rounded-lg hover:bg-[#391D65]/90 transition-colors font-medium"
            >
              {isLastTip ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
        
        {/* Close button */}
        <button
          onClick={handleSkipAll}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close onboarding tips"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Hook for managing onboarding state
export function useOnboardingTips(userId: string) {
  const [shouldShowTips, setShouldShowTips] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const isFirst = isFirstVisit(userId);
    const isInactive = isInactiveUser(userId);
    const isCompleted = isOnboardingCompleted(userId);

    setShouldShowTips((isFirst || isInactive) && !isCompleted);
  }, [userId]);

  const resetOnboarding = () => {
    if (typeof window === 'undefined') return;
    
    const completedKey = STORAGE_KEYS.onboardingCompleted(userId);
    const dismissedKey = STORAGE_KEYS.dismissedTips(userId);
    
    localStorage.removeItem(completedKey);
    localStorage.removeItem(dismissedKey);
    setShouldShowTips(true);
  };

  return {
    shouldShowTips,
    resetOnboarding,
  };
}
