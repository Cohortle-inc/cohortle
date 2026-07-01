'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getApplicationForm, submitApplication, ApplicationFormData } from '@/lib/api/applications';
import ApplicationForm from '@/components/application/ApplicationForm';

const ATTRIBUTION_KEY = 'cohortle_application_source';

interface Props {
  slug: string;
}

export default function ApplyPageClient({ slug }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState<ApplicationFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Capture attribution source from ?ref= query param and persist to sessionStorage
  useEffect(() => {
    const ref = searchParams?.get('ref');
    if (ref) {
      try {
        sessionStorage.setItem(ATTRIBUTION_KEY, ref);
      } catch {
        // sessionStorage unavailable — fail silently
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!slug) return;

    const fetchForm = async () => {
      try {
        setIsLoading(true);
        const data = await getApplicationForm(slug);
        setFormData(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Form not found';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchForm();
  }, [slug]);

  const handleSubmit = async (values: { name: string; email: string; responses: Record<string, unknown> }) => {
    if (!formData) return;
    try {
      setIsSubmitting(true);
      setError(null);

      // Read attribution source captured from ?ref= param
      let source: string | undefined;
      try {
        source = sessionStorage.getItem(ATTRIBUTION_KEY) ?? undefined;
      } catch {
        // sessionStorage unavailable
      }

      await submitApplication(formData.programme.id, {
        ...values,
        ...(source ? { source } : {}),
      });

      // Clear attribution after successful submission
      try {
        sessionStorage.removeItem(ATTRIBUTION_KEY);
      } catch {
        // ignore
      }

      router.push('/apply/confirmation');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Submission failed. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading application form...</div>
      </div>
    );
  }

  if (error || !formData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Form not available</h1>
          <p className="text-gray-500">{error || 'This application form could not be found.'}</p>
        </div>
      </div>
    );
  }

  const { programme, questions } = formData;

  const isClosed =
    programme.lifecycle_status !== 'recruiting' ||
    (programme.application_deadline && new Date() > new Date(programme.application_deadline));

  if (isClosed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{programme.name}</h1>
          <p className="text-gray-500 mt-4">
            {programme.lifecycle_status !== 'recruiting'
              ? 'This programme is not currently accepting applications.'
              : 'The application deadline for this programme has passed.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{programme.name}</h1>
          {programme.description && (
            <p className="mt-2 text-gray-600">{programme.description}</p>
          )}
          {programme.application_deadline && (
            <p className="mt-3 text-sm text-amber-600 font-medium">
              Application deadline:{' '}
              {new Date(programme.application_deadline).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        <ApplicationForm
          questions={questions}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </main>
  );
}
