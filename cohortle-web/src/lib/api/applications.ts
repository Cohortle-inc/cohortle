/**
 * Frontend API client for the Programme Application Flow.
 * All functions route through /api/proxy which handles auth cookies.
 */

import apiClient from './client';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ApplicationFormData {
  programme: {
    id: number;
    name: string;
    description: string;
    onboarding_mode: string;
    application_deadline: string | null;
    application_form_slug: string | null;
    lifecycle_status: string;
  };
  questions: TemplateQuestion[];
}

export interface TemplateQuestion {
  id: string;
  programme_id: number;
  question_text: string;
  question_type: 'text' | 'textarea' | 'select' | 'multiselect';
  is_required: boolean;
  options: string[] | null;
  order_index: number;
}

export interface ApplicationSubmission {
  name: string;
  email: string;
  responses: Record<string, unknown>;
}

export interface Application {
  id: string;
  programme_id: number;
  cohort_id: number | null;
  applicant_name: string;
  applicant_email: string;
  status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'waitlisted';
  responses: Record<string, unknown>;
  reviewer_id: number | null;
  reviewer_notes: string | null;
  rejection_reason: string | null;
  decision_at: string | null;
  submitted_at: string;
  programme?: { id: number; name: string };
}

export interface ApplicationListResponse {
  total: number;
  page: number;
  limit: number;
  applications: Application[];
}

export interface ApplicationFilters {
  status?: string;
  sort?: 'asc' | 'desc';
  cohortId?: number;
  page?: number;
  limit?: number;
}

export interface StatusCounts {
  submitted: number;
  under_review: number;
  accepted: number;
  rejected: number;
  waitlisted: number;
}

export interface StatusTransitionData {
  status: string;
  cohortId?: number;
  rejectionReason?: string;
  notes?: string;
}

export interface BulkActionData {
  applicationIds: string[];
  status: string;
  cohortId?: number;
  rejectionReason?: string;
}

export interface OrganisationPageData {
  convener: {
    name: string;
    organisation_name: string | null;
    organisation_description: string | null;
    organisation_slug: string;
    organisation_tagline?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    website_url?: string | null;
    linkedin_url?: string | null;
    twitter_url?: string | null;
    facebook_url?: string | null;
    instagram_url?: string | null;
    organisation_logo_url?: string | null;
    hero_image_url?: string | null;
    intro_video_url?: string | null;
    tawk_property_id?: string | null;
    tawk_widget_id?: string | null;
  };
  programmes: Array<{
    id: number;
    name: string;
    description: string;
    application_deadline: string | null;
    application_form_slug: string | null;
    onboarding_mode: string;
    format?: string | null;
    duration?: string | null;
    highlights?: string[] | null;
    learning_outcomes?: string[] | null;
    prerequisites?: string | null;
    price_info?: string | null;
    intro_video_url?: string | null;
    thumbnail_url?: string | null;
  }>;
  stats?: {
    total_learners: number;
    programmes_completed: number;
    success_rate: number;
    years_experience: number;
  } | null;
  testimonials?: Array<{
    id: number;
    learner_name: string;
    learner_avatar?: string | null;
    programme_name?: string | null;
    quote: string;
    rating: number;
  }>;
  faqs?: Array<{
    id: number;
    question: string;
    answer: string;
  }>;
}

export interface RedemptionResult {
  requiresSignup?: boolean;
  prefill?: { name: string; email: string };
  cohortId?: number;
  programmeId?: number;
  enrolled?: boolean;
  enrollmentId?: string;
}

export interface CrossProgrammeFilters {
  programmeId?: number;
  status?: string;
  page?: number;
  limit?: number;
}

// ─── Organisation Page ────────────────────────────────────────────────────────

export async function getOrganisationPage(slug: string): Promise<OrganisationPageData> {
  const res = await apiClient.get(`/v1/api/org/${slug}`);
  return res.data;
}

export async function checkOrganisationSlug(slug: string): Promise<{ available: boolean }> {
  const res = await apiClient.get(`/v1/api/org/${slug}/check`);
  return res.data;
}

// ─── Application Form ─────────────────────────────────────────────────────────

export async function getApplicationForm(programmeId: number | string): Promise<ApplicationFormData> {
  const res = await apiClient.get(`/v1/api/programmes/${programmeId}/application-form`);
  return res.data;
}

export async function submitApplication(programmeId: number, data: ApplicationSubmission): Promise<void> {
  await apiClient.post(`/v1/api/programmes/${programmeId}/applications`, data);
}

// ─── Convener — Applications Management ──────────────────────────────────────

export async function getProgrammeApplications(
  programmeId: number,
  filters: ApplicationFilters = {}
): Promise<ApplicationListResponse> {
  const res = await apiClient.get(`/v1/api/programmes/${programmeId}/applications`, { params: filters });
  return res.data;
}

export async function getApplicationCounts(programmeId: number): Promise<StatusCounts> {
  const res = await apiClient.get(`/v1/api/programmes/${programmeId}/applications/counts`);
  return res.data.counts;
}

export async function getApplication(applicationId: string): Promise<{ application: Application; history: unknown[] }> {
  const res = await apiClient.get(`/v1/api/applications/${applicationId}`);
  return res.data;
}

export async function transitionApplicationStatus(
  applicationId: string,
  data: StatusTransitionData
): Promise<Application> {
  const res = await apiClient.patch(`/v1/api/applications/${applicationId}/status`, data);
  return res.data.application;
}

export async function addApplicationNotes(applicationId: string, notes: string): Promise<Application> {
  const res = await apiClient.patch(`/v1/api/applications/${applicationId}/notes`, { notes });
  return res.data.application;
}

export async function bulkTransitionApplications(
  applicationIds: string[],
  data: Omit<BulkActionData, 'applicationIds'>
): Promise<void> {
  await apiClient.post('/v1/api/applications/bulk-action', { applicationIds, ...data });
}

export async function exportApplicationsCsv(programmeId: number): Promise<Blob> {
  const res = await apiClient.get(`/v1/api/programmes/${programmeId}/applications/export`, {
    responseType: 'blob',
  });
  return res.data;
}

export async function getCrossProgammeApplications(
  filters: CrossProgrammeFilters = {}
): Promise<ApplicationListResponse> {
  const res = await apiClient.get('/v1/api/convener/applications', { params: filters });
  return res.data;
}

// ─── Learner ──────────────────────────────────────────────────────────────────

export async function getMyApplications(): Promise<Application[]> {
  const res = await apiClient.get('/v1/api/me/applications');
  return res.data.applications;
}

export async function redeemAcceptanceToken(token: string): Promise<RedemptionResult> {
  const res = await apiClient.post(`/v1/api/acceptance-tokens/${token}/redeem`);
  return res.data;
}

/**
 * Get total pending (submitted + under_review) application count across all
 * of the convener's programmes. Used for the nav badge.
 */
export async function getPendingApplicationsCount(): Promise<number> {
  try {
    // Fetch submitted and under_review counts separately — the backend
    // doesn't support comma-separated status values in a single query.
    const [submittedRes, underReviewRes] = await Promise.all([
      apiClient.get<{ error: boolean; total: number }>(
        '/v1/api/convener/applications',
        { params: { status: 'submitted', limit: 1 } }
      ),
      apiClient.get<{ error: boolean; total: number }>(
        '/v1/api/convener/applications',
        { params: { status: 'under_review', limit: 1 } }
      ),
    ]);
    return ((submittedRes.data as any).total ?? 0) + ((underReviewRes.data as any).total ?? 0);
  } catch {
    return 0;
  }
}

// ─── Application Template ─────────────────────────────────────────────────────

export interface TemplateQuestionInput {
  id?: string;
  question_text: string;
  question_type: 'text' | 'textarea' | 'select' | 'multiselect';
  is_required: boolean;
  options?: string[];
  order_index: number;
}

export async function getApplicationTemplate(programmeId: number | string): Promise<TemplateQuestion[]> {
  const res = await apiClient.get<ApplicationFormData>(`/v1/api/programmes/${programmeId}/application-form`);
  return res.data.questions ?? [];
}

export async function saveApplicationTemplate(
  programmeId: number | string,
  questions: TemplateQuestionInput[]
): Promise<void> {
  await apiClient.put(`/v1/api/programmes/${programmeId}/application-template`, { questions });
}
