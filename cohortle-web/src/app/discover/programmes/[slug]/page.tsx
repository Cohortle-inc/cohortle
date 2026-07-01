import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { DiscoverProgramme } from '@/lib/api/programmes';
import { OperatorCTA } from '@/components/discovery/OperatorCTA';
import { OpportunityAlertsForm } from '@/components/discovery/OpportunityAlertsForm';
import { DetailPageSaveButton } from '@/components/discovery/DetailPageSaveButton';

export const revalidate = 300;

const formatLabels: Record<string, string> = {
  online: 'Online',
  'in-person': 'In-person',
  hybrid: 'Hybrid',
};

function deadlineLabel(deadline: string | null) {
  if (!deadline) return null;
  const d = new Date(deadline + 'T00:00:00');
  const days = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  if (days <= 0) return { text: `Applications closed ${date}`, urgent: false, closed: true };
  if (days <= 7) return { text: `Closing soon — ${date}`, urgent: true, closed: false };
  return { text: `Application deadline: ${date}`, urgent: false, closed: false };
}

async function getProgramme(slug: string): Promise<DiscoverProgramme | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.cohortle.com';
    const res = await fetch(`${apiUrl}/v1/api/programmes/discover`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const programmes: DiscoverProgramme[] = data.programmes || [];
    return programmes.find((p) => p.application_form_slug === slug) || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const prog = await getProgramme(params.slug);
  if (!prog) return { title: 'Programme Not Found | Cohortle' };

  return {
    title: `${prog.name} — ${prog.organisation_name} | Cohortle`,
    description: prog.description || `Apply for ${prog.name} by ${prog.organisation_name} on Cohortle.`,
    openGraph: {
      title: `${prog.name} — ${prog.organisation_name}`,
      description: prog.description || `Apply for ${prog.name} on Cohortle.`,
      images: prog.thumbnail_url ? [{ url: prog.thumbnail_url }] : [],
      type: 'website',
    },
  };
}

export default async function DiscoverProgrammeDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const prog = await getProgramme(params.slug);
  if (!prog) notFound();

  const deadline = deadlineLabel(prog.application_deadline);
  const applyHref = prog.apply_url
    ? `${prog.apply_url}${prog.apply_url.includes('?') ? '&' : '?'}ref=discover`
    : `/apply/${prog.application_form_slug}?ref=discover`;

  return (
    <main className="min-h-screen bg-gray-50 pt-16 md:pt-24">
      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/discover" className="hover:text-[#391D65] transition-colors">Discover</Link>
          <span>/</span>
          <span className="text-gray-700 truncate max-w-xs">{prog.name}</span>
        </nav>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

          {/* Main content */}
          <div className="space-y-6">
            {/* Hero card */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              {prog.thumbnail_url && (
                <div className="relative h-56 bg-gray-100">
                  <Image
                    src={prog.thumbnail_url}
                    alt={prog.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 700px"
                    priority
                  />
                </div>
              )}
              <div className="p-6 md:p-8">
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2.5 py-1 rounded bg-[#391D65]/10 text-[#391D65] text-xs font-medium border border-[#391D65]/20">
                    Hosted on Cohortle
                  </span>
                  {prog.format && (
                    <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium">
                      {formatLabels[prog.format] || prog.format}
                    </span>
                  )}
                  {prog.price_info && (
                    <span className="px-2.5 py-1 rounded bg-green-50 text-green-700 text-xs font-medium">
                      {prog.price_info}
                    </span>
                  )}
                  {prog.duration && (
                    <span className="px-2.5 py-1 rounded bg-gray-100 text-gray-700 text-xs font-medium">
                      {prog.duration}
                    </span>
                  )}
                </div>

                <p className="text-sm font-medium text-gray-500 mb-1">{prog.organisation_name}</p>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-950 leading-tight mb-4">
                  {prog.name}
                </h1>

                {deadline && (
                  <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium mb-4 ${
                    deadline.closed
                      ? 'bg-gray-100 text-gray-600'
                      : deadline.urgent
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-blue-50 text-blue-800'
                  }`}>
                    <svg className="w-4 h-4 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {deadline.text}
                  </div>
                )}

                {prog.description && (
                  <p className="text-gray-700 leading-7 whitespace-pre-line">{prog.description}</p>
                )}
              </div>
            </div>

            {/* Highlights */}
            {prog.highlights && prog.highlights.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-950 mb-4">Programme highlights</h2>
                <ul className="space-y-3">
                  {prog.highlights.map((h, i) => (
                    <li key={i} className="flex gap-3 text-gray-700">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#391D65] flex-none" aria-hidden="true" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Learning outcomes */}
            {prog.learning_outcomes && prog.learning_outcomes.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-950 mb-4">What you&apos;ll learn</h2>
                <ul className="space-y-3">
                  {prog.learning_outcomes.map((o, i) => (
                    <li key={i} className="flex gap-3 text-gray-700">
                      <svg className="w-5 h-5 text-[#391D65] flex-none mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Prerequisites */}
            {prog.prerequisites && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-950 mb-3">Prerequisites</h2>
                <p className="text-gray-700 leading-7">{prog.prerequisites}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Apply CTA */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm sticky top-24">
              <h2 className="text-base font-semibold text-gray-950 mb-1">Apply for this programme</h2>
              <p className="text-sm text-gray-500 mb-4">
                Applications are managed on Cohortle. Create a free account to apply.
              </p>

              {!deadline?.closed ? (
                <Link
                  href={applyHref}
                  className="flex items-center justify-center w-full px-5 py-3 rounded-lg bg-[#391D65] text-white text-sm font-semibold hover:bg-[#5B3A8F] transition-colors"
                >
                  Apply on Cohortle
                </Link>
              ) : (
                <div className="w-full px-5 py-3 rounded-lg bg-gray-100 text-gray-500 text-sm font-medium text-center">
                  Applications closed
                </div>
              )}

              {/* Save button — prompts unauthenticated users to sign up */}
              <div className="mt-3">
                <DetailPageSaveButton
                  id={prog.id}
                  title={prog.name}
                  organisationName={prog.organisation_name}
                  applyUrl={prog.apply_url}
                />
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-3">New to Cohortle?</p>
                <Link
                  href="/signup"
                  className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg border border-[#391D65] text-[#391D65] text-sm font-semibold hover:bg-[#391D65] hover:text-white transition-colors"
                >
                  Create a free account
                </Link>
              </div>

              <div className="mt-3">
                <Link
                  href="/discover"
                  className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Browse all opportunities
                </Link>
              </div>
            </div>

            {/* Quick facts */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick facts</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Organisation</dt>
                  <dd className="font-medium text-gray-900 text-right">{prog.organisation_name}</dd>
                </div>
                {prog.format && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Format</dt>
                    <dd className="font-medium text-gray-900">{formatLabels[prog.format] || prog.format}</dd>
                  </div>
                )}
                {prog.duration && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Duration</dt>
                    <dd className="font-medium text-gray-900">{prog.duration}</dd>
                  </div>
                )}
                {prog.price_info && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Funding</dt>
                    <dd className="font-medium text-green-700">{prog.price_info}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-500">Platform</dt>
                  <dd className="font-medium text-[#391D65]">Cohortle</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Cohortle CTAs */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-4">
        <OperatorCTA />
        <OpportunityAlertsForm />
      </div>
    </main>
  );
}
