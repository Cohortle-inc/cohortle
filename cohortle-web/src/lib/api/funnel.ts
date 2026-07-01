/**
 * Funnel API client
 * Handles lead submission for the marketing funnel
 */

import apiClient from './client';

export type ProgrammeType = 'fellowship' | 'training' | 'bootcamp' | 'community' | 'other';

export interface LeadPayload {
  organisation_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  website?: string;
  programme_type: ProgrammeType;
  participant_count?: number;
  current_tools?: string;
  pain_points?: string;
  cohort_start_date?: string;
  demo_scheduled_at?: string; // ISO 8601
}

interface SubmitLeadResponse {
  id: string;
}

/**
 * Submit a new lead to the funnel API
 * @param payload - Lead data from the interest form
 * @returns The created lead's ID
 * @throws Error if the request fails or validation errors are returned
 */
export async function submitLead(payload: LeadPayload): Promise<SubmitLeadResponse> {
  const response = await apiClient.post<SubmitLeadResponse & { error?: boolean; message?: string }>(
    '/v1/api/funnel/leads',
    payload
  );

  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to submit lead');
  }

  return { id: response.data.id };
}
