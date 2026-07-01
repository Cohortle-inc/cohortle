import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { ExternalOpportunity } from '@/lib/api/opportunities';
import { OPPORTUNITY_CATEGORY_LABELS } from '@/lib/api/opportunities';
import { OperatorCTA } from '@/components/discovery/OperatorCTA';
import { OpportunityAlertsForm } from '@/components/discovery/OpportunityAlertsForm';
import { DetailPageSaveButton } from '@/components/discovery/DetailPageSaveButton';
import { parseIdFromSlug } from '@/lib/utils/slugUtils';

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
  if (days <= 0) return { text: `Closed ${date}`, urgent: false, closed: true };
  if (days <= 7) return { text: `Closing soon — ${date}`, urgent: true, closed: false };
  return { text: `Deadline: ${date}`, urgent: false, closed: false };
}

async function getOpportunity(idSlug: string): Promise<ExternalOpportunity | null> {
  const id = parseIdFromSlug(idSlug);
  if (!id) return null;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.cohortle.com';
    const res = await fetch(`${apiUrl}/v1/api/opportunities/public`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const opportunities: ExternalOpportunity[] = data.opportunities || [];
    return opportunities.find((o) => o.id === id) || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { idSlug: string };
}): Promise<Metadata> {
  const opp = await getOpportunity(params.idSlug);
  if (!opp) return { title: 'Opportunity Not Found | Cohortle' };
  return {
    title: `${opp.title} — ${opp.organisation} | Cohortle`,
    description: opp.description || `Apply for ${opp.title} by ${opp.organisation}. Discover fellowships, scholarships, and programmes on Cohortle.`,
    openGraph: {
      title: `${opp.title} — ${opp.organisation}`,
      description: opp.description || `Apply for ${opp.title} by ${opp.organisation}.`,
      images: opp.thumbnail_url ? [{ url: opp.thumbnail_url }] : [],
      type: 'website',
    },
  };
}

export default async function OpportunityDetailPage({
  params,
}: {
  params: { idSlug: string };
}) {
  const opp = await getOpportunity(params.idSlug);
  if (!opp) notFound();

  const deadline = deadlineLabel(opp.deadline);
  const applyUrl = `${opp.apply_url}${opp.apply_url.includes('?') ? '&' : '?'}ref=discover`;
  const categoryLabel = OPPORTUNITY_CATEGORY_LABELS[opp.category] || opp.category;

  return (
    <main className="min-h-screen bg-gray-50 pt-16 md:pt-24">
      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/discover" className="hover:text-[#391D65] transition-colors">Discover</Link>
          <span>/</span>
          <span className="text-gray-700 truncate max-w-xs">{opp.title}</span>
        </nav>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

          {/* Main content */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              {opp.thumbnail_url && (
                <div className="relative h-56 bg-gray-100">
                  <Image
                    src={opp.thumbnail_url}
                    alt={opp.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 700px"
                    priority
                  />
                </div>
              )}
              <div className="p-6 md:p-8">
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2.5 py-1 rounded bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">
                    External Opportunity
                  </span>
                  <span className="px-2.5 py-1 rounded bg-purple-50 text-purple-700 text-xs font-medium">
                    {categoryLabel}
                  </span>
                  {opp.format && (
                    <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium">
                      {formatLabels[opp.format] || opp.format}
                    </span>
                  )}
                  {opp.price_info && (
                    <span className="px-2.5 py-1 rounded bg-green-50 text-green-700 text-xs font-medium">
                      {opp.price_info}
                    </span>
                  )}
                  {opp.duration && (
                    <span className="px-2.5 py-1 rounded bg-gray-100 text-gray-700 text-xs font-medium">
                      {opp.duration}
                    </span>
                  )}
                </div>

                <p className="text-sm font-medium text-gray-500 mb-1">{opp.organisation}</p>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-950 leading-tight mb-3">
                  {opp.title}
                </h1>

                {opp.location && (
                  <p className="text-sm text-gray-500 mb-4">📍 {opp.location}</p>
                )}

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

                {opp.description && (
                  <p className="text-gray-700 leading-7 whitespace-pre-line">{opp.description}</p>
                )}
              </div>
            </div>

            {opp.highlights && opp.highlights.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-950 mb-4">Programme highlights</h2>
                <ul className="space-y-3">
                  {opp.highlights.map((h, i) => (
                    <li key={i} className="flex gap-3 text-gray-700">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#391D65] flex-none" aria-hidden="true" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-gray-400 px-1">
              This opportunity is hosted externally by {opp.organisation}. Cohortle is not responsible for the application process or outcome.
            </p>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm sticky top-24 space-y-3">
              <div>
                <h2 className="text-base font-semibold text-gray-950 mb-1">Ready to apply?</h2>
                <p className="text-sm text-gray-500">
                  Applications are managed by {opp.organisation} on their own platform.
                </p>
              </div>

              {!deadline?.closed ? (
                <a
                  href={applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
                >
                  Apply on {opp.organisation}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ) : (
                <div className="w-full px-5 py-3 rounded-lg bg-gray-100 text-gray-500 text-sm font-medium text-center">
                  Applications closed
                </div>
              )}

              {/* Save button — prompts unauthenticated users to sign up */}
              <DetailPageSaveButton
                id={opp.id}
                title={opp.title}
                organisationName={opp.organisation}
                applyUrl={opp.apply_url}
              />

              <div className="pt-2 border-t border-gray-100 space-y-2">
                <Link
                  href="/discover"
                  className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg border border-[#391D65] text-[#391D65] text-sm font-semibold hover:bg-[#391D65] hover:text-white transition-colors"
                >
                  Browse all opportunities
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg bg-[#391D65]/5 text-[#391D65] text-sm font-medium hover:bg-[#391D65]/10 transition-colors"
                >
                  Join Cohortle — it&apos;s free
                </Link>
                <p className="text-xs text-gray-400 text-center">
                  Get alerts for new opportunities like this
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick facts</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Organisation</dt>
                  <dd className="font-medium text-gray-900 text-right">{opp.organisation}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Type</dt>
                  <dd className="font-medium text-gray-900">{categoryLabel}</dd>
                </div>
                {opp.format && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Format</dt>
                    <dd className="font-medium text-gray-900">{formatLabels[opp.format] || opp.format}</dd>
                  </div>
                )}
                {opp.duration && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Duration</dt>
                    <dd className="font-medium text-gray-900">{opp.duration}</dd>
                  </div>
                )}
                {opp.location && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Location</dt>
                    <dd className="font-medium text-gray-900 text-right">{opp.location}</dd>
                  </div>
                )}
                {opp.price_info && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Funding</dt>
                    <dd className="font-medium text-green-700">{opp.price_info}</dd>
                  </div>
                )}
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
