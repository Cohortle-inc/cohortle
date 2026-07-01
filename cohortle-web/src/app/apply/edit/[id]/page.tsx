'use client';

/**
 * Draft Application Edit Page
 * Allows a learner to edit and submit a draft application.
 * Requirements: 9.3, 9.4
 */

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getApplication, getApplicationForm, type ApplicationFormData } from '@/lib/api/applications';
import apiClient from '@/lib/api/client';
import ApplicationForm from '@/components/application/ApplicationForm';

export default function EditApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params.id as string;

  const [formData, setFormData] = useState<ApplicationFormData | null>(null);
  const [existingResponses, setExistingResponses] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { application } = await getApplication(appId);

        if (application.status !== 'draft') {
          setError('This application has already been submitted and cannot be edited.');
          setIsLoading(false);
          return;
        }

        const form = await getApplicationForm(application.programme_id);
        setFormData(form);
        setExistingResponses(application.responses || {});
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load application');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [appId]);

  const handleSubmit = async (values: { name: string; email: string; responses: Record<string, unknown> }) => {
    setIsSubmitting(true);
    setError(null);
    try {
      // Update draft responses
      await apiClient.put(`/v1/api/applications/${appId}`, { responses: values.responses });
      setSubmitted(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save application');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading application…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-[#391D65] text-white rounded-md text-sm font-medium hover:bg-[#391D65]/90"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg border border-gray-200">
          <div className="text-4xl mb-3">✅</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Application saved</h1>
          <p className="text-gray-600">Redirecting to your dashboard…</p>
        </div>
      </div>
    );
  }

  if (!formData) return null;

  // Pre-populate responses by mapping question IDs to existing answers
  const questionsWithDefaults = formData.questions.map(q => ({
    ...q,
    defaultValue: existingResponses[q.id],
  }));

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push('/dashboard')}
          className="mb-6 text-sm text-gray-600 hover:text-gray-900 flex items-center"
        >
          ← Back to Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Edit Application</h1>
          <p className="mt-1 text-gray-600">{formData.programme.name}</p>
          <p className="mt-2 text-sm text-amber-600 font-medium">
            This is a draft — your changes will be saved but not submitted until you click Save.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        <ApplicationForm
          questions={formData.questions}
          initialResponses={existingResponses}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel="Save Application"
        />
      </div>
    </main>
  );
}
