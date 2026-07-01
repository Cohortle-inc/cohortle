'use client';

interface AvatarPreviewProps {
  avatarUrl?: string;
  userName: string;
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  refreshKey?: number;
}

/**
 * AvatarPreview Component
 * 
 * Displays a user's avatar with proper sizing, loading states, and accessibility features.
 * Falls back to user initials if no avatar is provided.
 * 
 * Requirements:
 * - 1.3: Display avatar with loading skeleton during generation
 * - 1.4: Show avatar immediately after generation
 * - 3.2: Consistent dimensions and aspect ratio
 * - 3.4: Visual consistency across all contexts
 * - 6.4: Descriptive alt text for accessibility
 */
export default function AvatarPreview({
  avatarUrl,
  userName,
  size = 'medium',
  isLoading = false,
  refreshKey,
}: AvatarPreviewProps) {
  // Get user initials for fallback
  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Size mappings for responsive design
  const sizeClasses = {
    small: 'w-10 h-10 text-sm',
    medium: 'w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl',
    large: 'w-24 h-24 sm:w-32 sm:h-32 text-3xl sm:text-4xl',
  };

  const containerClass = `${sizeClasses[size]} rounded-full flex-shrink-0`;

  // Loading skeleton
  if (isLoading) {
    return (
      <div
        className={`${containerClass} bg-gray-200 animate-pulse`}
        role="status"
        aria-label="Loading avatar"
      >
        <span className="sr-only">Loading avatar...</span>
      </div>
    );
  }

  // Avatar image
  if (avatarUrl) {
    // Add a timestamp cache-buster so the browser always fetches the latest image
    const displayUrl = avatarUrl.includes('?')
      ? `${avatarUrl}&_t=${Date.now()}`
      : `${avatarUrl}?_t=${Date.now()}`;

    return (
      <img
        key={`${avatarUrl}-${refreshKey ?? 0}`} // force remount when URL or refreshKey changes
        src={displayUrl}
        alt={`${userName}'s profile avatar`}
        title={`${userName}'s profile picture`}
        className={`${containerClass} object-cover`}
      />
    );
  }

  // Fallback to initials
  const initials = getInitials(userName);
  return (
    <div
      className={`${containerClass} bg-blue-500 text-white flex items-center justify-center font-bold`}
      role="img"
      aria-label={`${userName}'s profile avatar showing initials ${initials}`}
    >
      {initials}
    </div>
  );
}
