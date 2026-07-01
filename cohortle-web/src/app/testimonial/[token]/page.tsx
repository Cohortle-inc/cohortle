'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/contexts/AuthContext';
import { validateCollectionLink, type CollectionLinkInfo } from '@/lib/api/testimonials';
import TestimonialSubmissionForm from '@/components/testimonial/TestimonialSubmissionForm';

type PageState = 'loading' | 'ready' | 'not_found' | 'expired' | 'error';

export default function TestimonialPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const token = params.token as string;

  const [pageState, setPageState] = useState<PageState>('loading');
  const [linkInfo, setLinkInfo] = useState<CollectionLinkInfo | null>(null);

  useEffect(() => {
    if (!token) return;

    validateCollectionLink(token)
      .then((info) => {
        setLinkInfo(info);
        setPageState('ready');
      })
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) setPageState('not_found');
        else if (status === 410) setPageState('expired');
        else setPageState('error');
      });
  }, [token]);

  if (pageState === 'loading' || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (pageState === 'not_found') {
    return <ErrorState title="Link not found" message="This testimonial link is invalid or has been revoked." />;
  }

  if (pageState === 'expired') {
    return <ErrorState title="Link expired" message="This testimonial collection link has expired." />;
  }

  if (pageState === 'error') {
    return <ErrorState title="Something went wrong" message="We couldn't load this page. Please try again later." />;
  }

  // Not logged in — show a clear message with a login button
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pt-16">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in to leave a testimonial</h2>
          {linkInfo?.programme_name && (
            <p className="text-sm text-gray-500 mb-4">
              You&apos;ve been invited to share your experience with <span className="font-medium text-gray-700">{linkInfo.programme_name}</span>.
            </p>
          )}
          <p className="text-sm text-gray-500 mb-6">
            Please log in to verify your identity before submitting.
          </p>
          <button
            onClick={() => router.push(`/login?redirect=/testimonial/${token}`)}
            className="w-full px-4 py-2 bg-[#391D65] text-white rounded-md font-medium hover:bg-[#391D65]/90 transition-colors"
          >
            Log in to continue
          </button>
        </div>
      </div>
    );
  }

  const hasProgrammeInfo = linkInfo?.programme_description || linkInfo?.programme_thumbnail;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 pt-20">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Programme context card — only shown if info exists */}
        {hasProgrammeInfo && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {linkInfo?.programme_thumbnail && (
              <div className="relative h-32 w-full">
                <Image
                  src={linkInfo.programme_thumbnail}
                  alt={linkInfo.programme_name ?? 'Programme'}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-5">
              {linkInfo?.programme_name && (
                <h2 className="text-base font-semibold text-gray-900 mb-1">{linkInfo.programme_name}</h2>
              )}
              {linkInfo?.cohort_name && (
                <p className="text-xs text-indigo-600 font-medium mb-2">{linkInfo.cohort_name}</p>
              )}
              {linkInfo?.programme_description && (
                <p className="text-sm text-gray-600 line-clamp-3">{linkInfo.programme_description}</p>
              )}
            </div>
          </div>
        )}

        {/* Submission form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Leave a Testimonial</h1>
          <p className="text-sm text-gray-500 mb-6">
            Share your experience to help others learn about this programme.
          </p>
          <TestimonialSubmissionForm
            token={token}
            cohortName={linkInfo?.cohort_name ?? null}
            programmeName={linkInfo?.programme_name ?? null}
          />
        </div>
      </div>
    </div>
  );
}

function ErrorState({ title, message }: { title: string; message: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pt-16">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
}
