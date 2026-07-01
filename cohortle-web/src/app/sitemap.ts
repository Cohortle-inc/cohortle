import type { MetadataRoute } from 'next';
import type { DiscoverProgrammesResponse } from '@/lib/api/programmes';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cohortle.com';

async function getDiscoverProgrammes() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.cohortle.com';
    const res = await fetch(`${apiUrl}/v1/api/programmes/discover`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as DiscoverProgrammesResponse;
    return data.programmes || [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const programmes = await getDiscoverProgrammes();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/discover`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/apply`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Add org pages for programmes that have an org slug
  const orgSlugs = new Set<string>();
  const orgRoutes: MetadataRoute.Sitemap = [];

  for (const programme of programmes) {
    // Extract slug from organisation_url if it's an internal /org/ path
    if (programme.organisation_url) {
      try {
        const url = new URL(programme.organisation_url);
        const match = url.pathname.match(/^\/org\/([^/]+)/);
        if (match && !orgSlugs.has(match[1])) {
          orgSlugs.add(match[1]);
          orgRoutes.push({
            url: `${BASE_URL}/org/${match[1]}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
          });
        }
      } catch {
        // Not a parseable URL — skip
      }
    }
  }

  return [...staticRoutes, ...orgRoutes];
}
