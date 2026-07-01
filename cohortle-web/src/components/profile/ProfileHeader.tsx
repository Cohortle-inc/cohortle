'use client';

import { formatDistanceToNow } from 'date-fns';
import { sanitizeName } from '@/lib/utils/sanitize';
import { memo, useState } from 'react';

interface ProfileHeaderProps {
  name: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  linkedinUsername?: string;
  joinedAt: string;
  onEditClick: () => void;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

function ProfileHeaderComponent({
  name,
  email,
  profilePicture,
  bio,
  linkedinUsername,
  joinedAt,
  onEditClick,
  isLoading = false,
  error = null,
  onRetry
}: ProfileHeaderProps) {
  const [imageError, setImageError] = useState(false);

  const getInitial = (name: string) => name.charAt(0).toUpperCase();
  const linkedinUrl = linkedinUsername ? `https://linkedin.com/in/${linkedinUsername}` : null;

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-full"></div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-6 bg-gray-200 rounded w-48"></div>
                <div className="h-4 bg-gray-200 rounded w-64"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
            <div className="w-full sm:w-auto h-10 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="text-center py-6">
          <div className="w-12 h-12 mx-auto mb-4 text-red-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Unable to load profile</h3>
          <p className="text-xs text-gray-600 mb-4">{error.message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-[#391D65] rounded hover:bg-[#391D65]/90 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      {/* Mobile: Stack vertically, Desktop: Side by side */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Profile section */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Profile picture or initial */}
          {profilePicture && !imageError ? (
            <img
              src={profilePicture}
              alt={`${name}'s profile`}
              title={`${name}'s profile picture`}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover flex-shrink-0"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-500 text-white rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold flex-shrink-0">
              {getInitial(name)}
            </div>
          )}

          {/* User info */}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{sanitizeName(name)}</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-0.5 sm:mt-1 truncate">{email}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
              Joined {formatDistanceToNow(new Date(joinedAt), { addSuffix: true })}
            </p>

            {/* LinkedIn link */}
            {linkedinUrl && (
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-sm text-blue-600 hover:text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded transition-colors"
                aria-label={`Visit ${name}'s LinkedIn profile`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn Profile
              </a>
            )}
          </div>
        </div>

        {/* Edit button - Full width on mobile, auto on desktop */}
        <button
          onClick={onEditClick}
          className="w-full sm:w-auto px-4 py-2 sm:py-2 min-h-[44px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Edit profile"
        >
          Edit Profile
        </button>
      </div>

      {/* Bio section */}
      {bio && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">About</h2>
          <p className="text-sm sm:text-base text-gray-600 whitespace-pre-wrap">{bio}</p>
        </div>
      )}
    </div>
  );
}

export default function ProfileHeader({ 
  name, 
  email, 
  profilePicture,
  bio,
  linkedinUsername,
  joinedAt,
  onEditClick 
}: ProfileHeaderProps) {
  const getInitial = (name: string) => name.charAt(0).toUpperCase();
  const linkedinUrl = linkedinUsername ? `https://linkedin.com/in/${linkedinUsername}` : null;

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      {/* Mobile: Stack vertically, Desktop: Side by side */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Profile section */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Profile picture or initial */}
          {profilePicture ? (
            <img
              src={profilePicture}
              alt={`${name}'s profile`}
              title={`${name}'s profile picture`}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-500 text-white rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold flex-shrink-0">
              {getInitial(name)}
            </div>
          )}

          {/* User info */}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{sanitizeName(name)}</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-0.5 sm:mt-1 truncate">{email}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
              Joined {formatDistanceToNow(new Date(joinedAt), { addSuffix: true })}
            </p>
            
            {/* LinkedIn link */}
            {linkedinUrl && (
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-sm text-blue-600 hover:text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                aria-label={`Visit ${name}'s LinkedIn profile`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn Profile
              </a>
            )}
          </div>
        </div>

        {/* Edit button - Full width on mobile, auto on desktop */}
        <button
          onClick={onEditClick}
          className="w-full sm:w-auto px-4 py-2 sm:py-2 min-h-[44px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Edit profile"
        >
          Edit Profile
        </button>
      </div>

      {/* Bio section */}
      {bio && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">About</h2>
          <p className="text-sm sm:text-base text-gray-600 whitespace-pre-wrap">{bio}</p>
        </div>
      )}
    </div>
  );
}
