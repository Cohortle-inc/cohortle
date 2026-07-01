import type { Metadata } from 'next';
import ApplyPageClient from './ApplyPageClient';

/**
 * Public Application Form Page — Server Component
 * Generates dynamic metadata per programme for SEO/social sharing.
 */

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params;

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.cohortle.com';
    const res = await fetch(`${apiUrl}/v1/api/programmes/${slug}/application-form`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return {
        title: 'Application Form',
        description: 'Apply to join a programme on Cohortle.',
      };
    }

    const data = await res.json();
    const programme = data.programme;
    const programmeName = programme?.name || 'Programme';
    const description =
      programme?.description ||
      `Apply to join ${programmeName} on Cohortle.`;

    return {
      title: `Apply — ${programmeName}`,
      description,
      openGraph: {
        title: `Apply to ${programmeName}`,
        description,
        type: 'website',
      },
      twitter: {
        card: 'summary',
        title: `Apply to ${programmeName}`,
        description,
      },
      robots: {
        index: false, // application forms shouldn't be indexed
        follow: false,
      },
    };
  } catch {
    return {
      title: 'Application Form',
      description: 'Apply to join a programme on Cohortle.',
    };
  }
}

export default function ApplicationFormPage({ params }: Props) {
  return <ApplyPageClient slug={params.slug} />;
}
