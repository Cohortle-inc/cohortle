'use client';

import React, { useEffect, useState } from 'react';
import { getOrganisationPage, getMyApplications, OrganisationPageData, Application } from '@/lib/api/applications';
import apiClient from '@/lib/api/client';
import OrgHeader from '@/components/org/OrgHeader';
import OrgHeroSection from '@/components/org/OrgHeroSection';
import OrgProgrammeCard from '@/components/org/OrgProgrammeCard';
import OrgContactSection from '@/components/org/OrgContactSection';
import OrgStatsSection from '@/components/org/OrgStatsSection';
import OrgTestimonialsSection from '@/components/org/OrgTestimonialsSection';
import OrgFAQSection from '@/components/org/OrgFAQSection';
import OrgNewsletterSection from '@/components/org/OrgNewsletterSection';
import OrgFooter from '@/components/org/OrgFooter';
import OrgVideoIntroSection from '@/components/org/OrgVideoIntroSection';
import OrgProgrammeComparison from '@/components/org/OrgProgrammeComparison';
import OrgLiveChat from '@/components/org/OrgLiveChat';

interface Props {
  slug: string;
}

export default function OrgPageClient({ slug }: Props) {
  const [orgData, setOrgData] = useState<OrganisationPageData | null>(null);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<Set<number>>(new Set());
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await getOrganisationPage(slug);
        setOrgData(data);

        // Track page view (fire and forget)
        apiClient.post(`/v1/api/org/${slug}/view`).catch(() => {});

        // Try to fetch learner's own applications (authenticated only — graceful failure)
        try {
          const apps = await getMyApplications();
          setMyApplications(apps);
        } catch {
          // Not authenticated — that's fine
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Organisation not found';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#391D65] mx-auto mb-4" />
          <p className="text-gray-500">Loading organisation...</p>
        </div>
      </div>
    );
  }

  if (error || !orgData) {
    return (
      <>
        <OrgHeader />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="mb-6">
              <svg className="w-20 h-20 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Organisation Not Found</h1>
            <p className="text-gray-500 mb-6">
              The organisation page you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <a
              href="/"
              className="inline-flex items-center px-4 py-2 bg-[#391D65] text-white rounded-md hover:bg-[#5B3A8F] transition-colors font-medium"
            >
              Return to Home
            </a>
          </div>
        </div>
      </>
    );
  }

  const orgName = orgData.convener.organisation_name || orgData.convener.name;
  const appliedProgrammeIds = new Set(myApplications.map((a) => a.programme_id));

  const handleCompare = (id: number) => {
    setCompareIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 3) {
        next.add(id);
      }
      return next;
    });
  };

  const compareProgrammes = orgData.programmes.filter(p => compareIds.has(p.id));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Skip link for keyboard/screen reader users */}
      <a
        href="#programmes"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#391D65] focus:text-white focus:rounded-md focus:text-sm focus:font-medium"
      >
        Skip to programmes
      </a>

      {/* JSON-LD structured data for SEO — Organisation */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'EducationalOrganization',
            name: orgName,
            description: orgData.convener.organisation_description || undefined,
            url: typeof window !== 'undefined' ? window.location.href : undefined,
            logo: orgData.convener.organisation_logo_url || undefined,
            contactPoint: orgData.convener.contact_email
              ? { '@type': 'ContactPoint', email: orgData.convener.contact_email, contactType: 'customer service' }
              : undefined,
          }),
        }}
      />

      {/* JSON-LD structured data — one Course per programme */}
      {orgData.programmes.map(p => (
        <script
          key={p.id}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Course',
              name: p.name,
              description: p.description || undefined,
              provider: {
                '@type': 'EducationalOrganization',
                name: orgName,
              },
              ...(p.application_deadline && {
                courseSchedule: {
                  '@type': 'Schedule',
                  endDate: p.application_deadline,
                },
              }),
              ...(p.price_info && {
                offers: {
                  '@type': 'Offer',
                  price: p.price_info,
                  priceCurrency: 'GBP',
                },
              }),
            }),
          }}
        />
      ))}
      <OrgHeader />

      <OrgHeroSection
        organisationName={orgData.convener.organisation_name || orgData.convener.name}
        organisationDescription={orgData.convener.organisation_description}
        organisationTagline={orgData.convener.organisation_tagline}
        logoUrl={orgData.convener.organisation_logo_url}
        profilePicture={null}
        convenerName={orgData.convener.name}
      />

      <OrgStatsSection stats={orgData.stats} />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8" id="programmes">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Available Programmes
            </h2>
            <p className="text-gray-600">
              Explore our programmes and apply to join our learning community
            </p>
            {orgData.programmes.length > 1 && (
              <p className="text-xs text-gray-400 mt-1">
                Select up to 3 programmes to compare side-by-side.
              </p>
            )}
          </div>

          {orgData.programmes.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="mb-4">
                <svg className="w-16 h-16 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No Programmes Available
              </h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                There are currently no programmes accepting applications. Check back later for new opportunities.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {orgData.programmes.map((programme) => (
                <OrgProgrammeCard
                  key={programme.id}
                  programme={programme}
                  applied={appliedProgrammeIds.has(programme.id)}
                  onCompare={orgData.programmes.length > 1 ? handleCompare : undefined}
                  compareSelected={compareIds.has(programme.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <OrgTestimonialsSection testimonials={orgData.testimonials || []} />

      {orgData.convener.intro_video_url && (
        <OrgVideoIntroSection
          videoUrl={orgData.convener.intro_video_url}
          organisationName={orgName}
        />
      )}

      <OrgFAQSection faqs={orgData.faqs || []} />

      <OrgContactSection
        contactEmail={orgData.convener.contact_email}
        contactPhone={orgData.convener.contact_phone}
        websiteUrl={orgData.convener.website_url}
        linkedinUrl={orgData.convener.linkedin_url}
        twitterUrl={orgData.convener.twitter_url}
        facebookUrl={orgData.convener.facebook_url}
        instagramUrl={orgData.convener.instagram_url}
      />

      <OrgNewsletterSection organisationSlug={slug} />

      <OrgFooter
        organisationName={orgData.convener.organisation_name || orgData.convener.name}
        organisationDescription={orgData.convener.organisation_description}
        linkedinUrl={orgData.convener.linkedin_url}
        twitterUrl={orgData.convener.twitter_url}
        facebookUrl={orgData.convener.facebook_url}
        instagramUrl={orgData.convener.instagram_url}
        websiteUrl={orgData.convener.website_url}
      />

      {/* Comparison modal */}
      {showComparison && compareProgrammes.length >= 2 && (
        <OrgProgrammeComparison
          programmes={compareProgrammes}
          onClose={() => setShowComparison(false)}
        />
      )}

      {/* Floating compare bar */}
      {compareIds.size >= 2 && !showComparison && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#391D65] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4">
          <span className="text-sm font-medium">{compareIds.size} programmes selected</span>
          <button
            onClick={() => setShowComparison(true)}
            className="px-4 py-1.5 bg-white text-[#391D65] text-sm font-semibold rounded-full hover:bg-gray-100 transition-colors"
          >
            Compare Now
          </button>
          <button
            onClick={() => setCompareIds(new Set())}
            className="text-white/70 hover:text-white text-sm"
            aria-label="Clear comparison"
          >
            ✕
          </button>
        </div>
      )}

      {/* Live chat */}
      {orgData.convener.tawk_property_id && orgData.convener.tawk_widget_id && (
        <OrgLiveChat
          propertyId={orgData.convener.tawk_property_id}
          widgetId={orgData.convener.tawk_widget_id}
        />
      )}
    </div>
  );
}
