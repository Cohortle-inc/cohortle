'use client';

/**
 * Role Selection Page
 * Allows new users to select their role after registration
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api/client';
import { trackRoleSelection } from '@/lib/utils/analytics';

export default function SelectRolePage() {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const roles = [
    {
      id: 'student',
      title: 'Student',
      description: 'I want to join and learn from courses and communities',
      icon: '🎓',
    },
    {
      id: 'convener',
      title: 'Convener',
      description: 'I want to create and manage courses and communities',
      icon: '👨‍🏫',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await apiClient.patch('/v1/api/profile/set-role', {
        role: selectedRole,
      });

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      // Token is already in httpOnly cookie, no need to update it
      // Track role selection
      trackRoleSelection(selectedRole as 'student' | 'convener');

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: unknown) {
      console.error('Role selection error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to set role. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Choose Your Role
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Select how you&apos;d like to use Cohortle
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {roles.map((role) => (
              <label
                key={role.id}
                className={`
                  relative flex cursor-pointer rounded-lg border p-4 focus:outline-none
                  ${
                    selectedRole === role.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  }
                `}
              >
                <input
                  type="radio"
                  name="role"
                  value={role.id}
                  checked={selectedRole === role.id}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-center">
                  <div className="text-2xl mr-4">{role.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">
                        {role.title}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500">{role.description}</p>
                  </div>
                </div>
                {selectedRole === role.id && (
                  <div className="absolute -inset-px rounded-lg border-2 border-blue-600 pointer-events-none" />
                )}
              </label>
            ))}
          </div>

          <button
            type="submit"
            disabled={!selectedRole || isSubmitting}
            className="
              group relative w-full flex justify-center py-2 px-4 border border-transparent
              text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {isSubmitting ? 'Setting up your account...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}