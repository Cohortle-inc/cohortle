/**
 * Testimonial Collection Link — public API functions
 * Used by the learner-facing submission page at /testimonial/[token]
 */

import apiClient from './client';

export interface CollectionLinkInfo {
  cohort_name: string | null;
  programme_name: string | null;
  programme_description: string | null;
  programme_thumbnail: string | null;
  auto_approve: boolean;
}

export interface SubmitTestimonialPayload {
  quote: string;
  rating: number;
  displayName?: string;
}

/**
 * Validate a collection link token and return cohort/programme info.
 * Returns null if the token is not found (404) or expired (410).
 * Throws with a `status` property so callers can distinguish 404 vs 410.
 */
export async function validateCollectionLink(token: string): Promise<CollectionLinkInfo> {
  const res = await apiClient.get<{ error: boolean } & CollectionLinkInfo>(
    `/v1/api/testimonial-links/${token}`
  );
  if (res.data.error) throw new Error('Invalid collection link');
  return {
    cohort_name: res.data.cohort_name,
    programme_name: res.data.programme_name,
    programme_description: res.data.programme_description ?? null,
    programme_thumbnail: res.data.programme_thumbnail ?? null,
    auto_approve: res.data.auto_approve,
  };
}

/**
 * Submit a testimonial via a collection link token.
 * Requires the learner to be authenticated (JWT cookie).
 */
export async function submitTestimonial(
  token: string,
  payload: SubmitTestimonialPayload
): Promise<{ testimonial_id: number }> {
  const res = await apiClient.post<{ error: boolean; testimonial_id: number }>(
    `/v1/api/testimonial-links/${token}/submit`,
    {
      quote: payload.quote,
      rating: payload.rating,
      display_name: payload.displayName,
    }
  );
  if (res.data.error) throw new Error('Failed to submit testimonial');
  return { testimonial_id: res.data.testimonial_id };
}
