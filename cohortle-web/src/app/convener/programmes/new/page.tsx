'use client';

/**
 * Create Programme Page
 * Page for creating a new programme
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { ProgrammeForm } from '@/components/convener/ProgrammeForm';
import { createProgramme, ProgrammeFormData } from '@/lib/api/convener';

export default function NewProgrammePage() {
  const router = useRouter();

  const handleSubmit = async (data: ProgrammeFormData) => {
    try {
      const programme = await createProgramme(data);
      const needsFormSetup = data.onboarding_mode === 'application' || data.onboarding_mode === 'hybrid';
      router.push(`/convener/programmes/${programme.id}${needsFormSetup ? '?setup_form=1' : ''}`);
    } catch (error) {
      throw error;
    }
  };

  const handleCancel = () => {
    router.push('/convener/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Programme</h1>
          <p className="mt-2 text-gray-600">
            Set up a new learning programme for your cohorts
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
          <ProgrammeForm mode="create" onSubmit={handleSubmit} onCancel={handleCancel} />
        </div>
      </div>
    </div>
  );
}
