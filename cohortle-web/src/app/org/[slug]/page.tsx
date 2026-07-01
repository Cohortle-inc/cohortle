import type { Metadata } from 'next';
import OrgPageClient from './OrgPageClient';

/**
 * Public Organisation Page — Server Component
 * Generates dynamic metadata per organisation for SEO/social sharing.
 * The interactive UI is handled by OrgPageClient.
 */

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params;

  try {
    // Fetch org data server-side for metadata only
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.cohortle.com';
    const res = await fetch(`${apiUrl}/v1/api/org/${slug}`, {
      next: { revalidate: 3600 }, // cache for 1 hour
    });

    if (!res.ok) {
      return {
        title: 'Organisation Not Found',
        description: 'The organisation page you are looking for does not exist.',
      };
    }

    const data = await res.json();
    const convener = data.convener;
    const orgName = convener?.organisation_name || convener?.name || 'Organisation';
    const description =
      convener?.organisation_description ||
      convener?.organisation_tagline ||
      `Explore programmes and apply to join ${orgName}'s learning community on Cohortle.`;

    const logoUrl = convener?.organisation_logo_url || convener?.hero_image_url;

    return {
      title: orgName,
      description,
      openGraph: {
        title: `${orgName} — Programmes on Cohortle`,
        description,
        type: 'website',
        ...(logoUrl && {
          images: [{ url: logoUrl, width: 1200, height: 630, alt: orgName }],
        }),
      },
      twitter: {
        card: 'summary_large_image',
        title: `${orgName} — Programmes on Cohortle`,
        description,
        ...(logoUrl && { images: [logoUrl] }),
      },
    };
  } catch {
    return {
      title: 'Organisation',
      description: 'Explore programmes and apply on Cohortle.',
    };
  }
}

export default function OrgPage({ params }: Props) {
  return <OrgPageClient slug={params.slug} />;
}
