'use client';

import { useState } from 'react';

interface ProfileEditFormProps {
  initialName: string;
  initialProfilePicture?: string;
  initialBio?: string;
  initialLinkedinUsername?: string;
  onSubmit: (data: { 
    name: string; 
    profilePicture?: string;
    bio?: string;
    linkedinUsername?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export default function ProfileEditForm({
  initialName,
  initialProfilePicture,
  initialBio,
  initialLinkedinUsername,
  onSubmit,
  onCancel,
}: ProfileEditFormProps) {
  const [name, setName] = useState(initialName);
  const [profilePicture, setProfilePicture] = useState(initialProfilePicture || '');
  const [bio, setBio] = useState(initialBio || '');
  const [linkedinUsername, setLinkedinUsername] = useState(initialLinkedinUsername || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(false);
      
      await onSubmit({
        name: name.trim(),
        profilePicture: profilePicture.trim() || undefined,
        bio: bio.trim() || undefined,
        linkedinUsername: linkedinUsername.trim() || undefined,
      });
      
      setSuccess(true);
      setTimeout(() => {
        onCancel();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Edit Profile</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-base"
            required
          />
        </div>

        {/* Profile picture URL field */}
        <div>
          <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700 mb-1">
            Profile Picture URL
          </label>
          <input
            type="url"
            id="profilePicture"
            value={profilePicture}
            onChange={(e) => setProfilePicture(e.target.value)}
            disabled={isLoading}
            placeholder="https://example.com/avatar.jpg"
            className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-base"
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to use your initial as avatar
          </p>
        </div>

        {/* Bio field */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={isLoading}
            placeholder="Tell us a bit about yourself..."
            rows={4}
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-base resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            {bio.length}/500 characters
          </p>
        </div>

        {/* LinkedIn username field */}
        <div>
          <label htmlFor="linkedinUsername" className="block text-sm font-medium text-gray-700 mb-1">
            <span className="inline-flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn Username
            </span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-base">
              linkedin.com/in/
            </span>
            <input
              type="text"
              id="linkedinUsername"
              value={linkedinUsername}
              onChange={(e) => setLinkedinUsername(e.target.value)}
              disabled={isLoading}
              placeholder="your-username"
              className="w-full pl-[140px] pr-3 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-base"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enter only your username, not the full URL
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div 
            className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        {/* Success message */}
        {success && (
          <div 
            className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-800 text-sm"
            role="status"
            aria-live="polite"
          >
            Profile updated successfully!
          </div>
        )}

        {/* Action buttons - Stack on mobile, side by side on desktop */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="w-full sm:flex-1 px-4 py-2 min-h-[44px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2 min-h-[44px] border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
