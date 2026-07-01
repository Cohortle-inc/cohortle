'use client';

import { useState } from 'react';

interface NotificationPreferences {
  emailLessonReminders: boolean;
  emailCommunityActivity: boolean;
  emailProgrammeUpdates: boolean;
  emailWeeklyDigest: boolean;
}

interface NotificationSettingsProps {
  preferences: NotificationPreferences;
  onUpdate: (preferences: NotificationPreferences) => Promise<void>;
}

export default function NotificationSettings({ preferences, onUpdate }: NotificationSettingsProps) {
  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleToggle = async (key: keyof NotificationPreferences) => {
    const newPreferences = {
      ...localPreferences,
      [key]: !localPreferences[key],
    };
    
    setLocalPreferences(newPreferences);
    
    try {
      setIsSaving(true);
      setSaveMessage(null);
      await onUpdate(newPreferences);
      setSaveMessage('Preferences saved');
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (err) {
      setSaveMessage('Failed to save preferences');
      // Revert on error
      setLocalPreferences(localPreferences);
    } finally {
      setIsSaving(false);
    }
  };

  const settings = [
    {
      key: 'emailLessonReminders' as keyof NotificationPreferences,
      label: 'Lesson Reminders',
      description: 'Get reminders about upcoming lessons and sessions',
    },
    {
      key: 'emailCommunityActivity' as keyof NotificationPreferences,
      label: 'Community Activity',
      description: 'Notifications about posts, comments, and likes',
    },
    {
      key: 'emailProgrammeUpdates' as keyof NotificationPreferences,
      label: 'Programme Updates',
      description: 'Updates about your enrolled programmes',
    },
    {
      key: 'emailWeeklyDigest' as keyof NotificationPreferences,
      label: 'Weekly Digest',
      description: 'Weekly summary of your learning progress',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Notification Settings</h2>
        {saveMessage && (
          <span 
            className={`text-sm ${saveMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}
            role={saveMessage.includes('Failed') ? 'alert' : 'status'}
            aria-live="polite"
          >
            {saveMessage}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {settings.map((setting) => (
          <div key={setting.key} className="flex items-start justify-between py-3 border-b border-gray-200 last:border-0">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{setting.label}</h3>
              <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
            </div>
            <button
              onClick={() => handleToggle(setting.key)}
              disabled={isSaving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                localPreferences[setting.key] ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              role="switch"
              aria-checked={localPreferences[setting.key]}
              aria-label={`Toggle ${setting.label}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localPreferences[setting.key] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
