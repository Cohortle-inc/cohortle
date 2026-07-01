'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import NotificationSettings from '@/components/profile/NotificationSettings';
import LearningGoals from '@/components/profile/LearningGoals';
import PasswordChangeForm from '@/components/profile/PasswordChangeForm';
import GenerateAvatarButton from '@/components/profile/GenerateAvatarButton';
import AvatarPreview from '@/components/profile/AvatarPreview';
import { 
  getPreferences, 
  updatePreferences, 
  getLearningGoal, 
  setLearningGoal,
  changePassword,
  getUserProfile,
  updateProfile
} from '@/lib/api/profile';
import { checkOrganisationSlug } from '@/lib/api/applications';

interface NotificationPreferences {
  emailLessonReminders: boolean;
  emailCommunityActivity: boolean;
  emailProgrammeUpdates: boolean;
  emailWeeklyDigest: boolean;
}

interface LearningGoal {
  type: 'lessons_per_week' | 'hours_per_week';
  target: number;
  current: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  const [avatarRefreshKey, setAvatarRefreshKey] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailLessonReminders: true,
    emailCommunityActivity: true,
    emailProgrammeUpdates: true,
    emailWeeklyDigest: false,
  });
  const [learningGoal, setLearningGoalState] = useState<LearningGoal | undefined>(undefined);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // Initial data load
    const loadData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        setError(null);
        
        // Load user profile to get current avatar
        const profileData = await getUserProfile();
        if (profileData.user.profilePicture) {
          setAvatarUrl(profileData.user.profilePicture);
        }
        
        // Load user preferences
        const prefs = await getPreferences();
        if (prefs) {
          setPreferences({
            emailLessonReminders: prefs.emailLessonReminders ?? true,
            emailCommunityActivity: prefs.emailCommunityActivity ?? true,
            emailProgrammeUpdates: prefs.emailProgrammeUpdates ?? true,
            emailWeeklyDigest: prefs.emailWeeklyDigest ?? false,
          });
        }

        // Load learning goal
        const goal = await getLearningGoal();
        if (goal) {
          setLearningGoalState(goal);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user, authLoading, router]);

  const handleUpdatePreferences = async (newPreferences: NotificationPreferences) => {
    await updatePreferences(newPreferences);
    setPreferences(newPreferences);
  };

  const handleSetGoal = async (goal: LearningGoal) => {
    const updatedGoal = await setLearningGoal(goal);
    setLearningGoalState(updatedGoal);
  };

  const handleChangePassword = async (data: { currentPassword: string; newPassword: string }) => {
    await changePassword(data);
  };

  const handleAvatarGenerated = async (newAvatarUrl: string) => {
    // Avatar is already saved by the generate endpoint — just update the preview
    setAvatarUrl(newAvatarUrl);
    setAvatarRefreshKey(k => k + 1);
  };

  // Loading state — use a skeleton matching the page structure to avoid CLS
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-24 mb-6" />
          <div className="h-8 bg-gray-200 rounded w-48 mb-8" />
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-10 bg-gray-200 rounded w-32 mt-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              Error Loading Settings
            </h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with navigation */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => router.push('/profile')}
            className="text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1 min-h-[44px]"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Profile
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your preferences and account settings</p>
        </div>

        {/* Settings sections */}
        <div className="space-y-4 sm:space-y-6">
          {/* Profile Avatar */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
              Profile Avatar
            </h2>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              {/* Avatar Preview */}
              <div className="flex-shrink-0">
                <AvatarPreview
                  avatarUrl={avatarUrl}
                  userName={user?.name || 'User'}
                  size="large"
                  isLoading={isAvatarLoading}
                  refreshKey={avatarRefreshKey}
                />
              </div>
              
              {/* Avatar Generation Controls */}
              <div className="flex-1 w-full sm:w-auto">
                <p className="text-sm text-gray-600 mb-3">
                  Generate a unique avatar for your profile. Your avatar will appear throughout the platform.
                </p>
                <GenerateAvatarButton
                  currentAvatarUrl={avatarUrl}
                  onAvatarGenerated={handleAvatarGenerated}
                  disabled={isAvatarLoading}
                />
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
              Notification Preferences
            </h2>
            <NotificationSettings 
              preferences={preferences}
              onUpdate={handleUpdatePreferences}
            />
          </div>

          {/* Learning Goals */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
              Learning Goals
            </h2>
            <LearningGoals 
              currentGoal={learningGoal}
              onSetGoal={handleSetGoal}
            />
          </div>

          {/* Password Change */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
              Change Password
            </h2>
            <PasswordChangeForm onSubmit={handleChangePassword} />
          </div>

          {/* Organisation Settings — conveners only. Requirements: 13.6, 13.7 */}
          {(user as any)?.role === 'convener' && (
            <OrgSlugSection />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * OrgSlugSection — inline component for convener organisation settings.
 * Requirements: 13.6, 13.7
 */
function OrgSlugSection() {
  const [slug, setSlug] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgDesc, setOrgDesc] = useState('');
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const SLUG_RE = /^[a-z0-9-]{3,50}$/;

  const handleSlugBlur = async () => {
    if (!slug) { setSlugStatus('idle'); return; }
    if (!SLUG_RE.test(slug)) { setSlugStatus('invalid'); return; }
    setSlugStatus('checking');
    try {
      const result = await checkOrganisationSlug(slug);
      setSlugStatus(result.available ? 'available' : 'taken');
    } catch {
      setSlugStatus('idle');
    }
  };

  const handleSave = async () => {
    if (!SLUG_RE.test(slug)) return;
    setIsSaving(true);
    setSaveMsg(null);
    try {
      await updateProfile({ organisation_slug: slug, organisation_name: orgName, organisation_description: orgDesc } as any);
      setSaveMsg('Organisation settings saved.');
    } catch (err: any) {
      setSaveMsg(err?.message || 'Failed to save.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
        Organisation Settings
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Set your organisation slug to enable your public organisation page at{' '}
        <span className="font-mono text-indigo-600">/org/[slug]</span>.
      </p>

      <div className="space-y-4">
        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Organisation slug <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => { setSlug(e.target.value.toLowerCase()); setSlugStatus('idle'); }}
            onBlur={handleSlugBlur}
            placeholder="e.g. wecareforng"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-400">
            Lowercase letters, numbers, and hyphens only. 3–50 characters.
          </p>
          {slugStatus === 'checking' && <p className="text-xs text-gray-500 mt-1">Checking availability…</p>}
          {slugStatus === 'available' && <p className="text-xs text-green-600 mt-1">✓ Available</p>}
          {slugStatus === 'taken' && <p className="text-xs text-red-600 mt-1">✗ Already taken</p>}
          {slugStatus === 'invalid' && <p className="text-xs text-red-600 mt-1">✗ Invalid format (lowercase alphanumeric + hyphens, 3–50 chars)</p>}
        </div>

        {/* Org name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Organisation name</label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="e.g. WeCare Foundation Nigeria"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Org description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Organisation description</label>
          <textarea
            value={orgDesc}
            onChange={(e) => setOrgDesc(e.target.value)}
            rows={3}
            placeholder="Brief description shown on your organisation page"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {saveMsg && (
          <p className={`text-sm ${saveMsg.includes('saved') ? 'text-green-600' : 'text-red-600'}`}>
            {saveMsg}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={isSaving || slugStatus === 'taken' || slugStatus === 'invalid' || !slug}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving…' : 'Save Organisation Settings'}
        </button>
      </div>
    </div>
  );
}
