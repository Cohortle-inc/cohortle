/**
 * Admin API client
 * All endpoints require administrator role
 */
import apiClient from './client';

export interface AdminStats {
  users: {
    total: number;
    students: number;
    conveners: number;
    administrators: number;
    unassigned: number;
    recentSignups: number;
  };
  programmes: {
    total: number;
    active: number;
  };
  cohorts: {
    total: number;
  };
  enrollments: {
    total: number;
  };
  learning: {
    totalLessonCompletions: number;
  };
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  role_id: string | null;
  joined_at: string | null;
  status: string;
  email_verified: boolean;
}

export interface AdminConvener {
  id: number;
  email: string;
  name: string;
  organisation_name: string | null;
  organisation_slug: string | null;
  joined_at: string | null;
  programme_count: number;
}

export interface AdminProgramme {
  id: number;
  name: string;
  lifecycle_status: string;
  onboarding_mode: string;
  created_at: string;
  convener: {
    id: number;
    name: string;
    organisation: string | null;
  } | null;
  enrollment_count: number;
}

export interface Pagination {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export async function getAdminStats(): Promise<AdminStats> {
  const res = await apiClient.get('/v1/api/admin/stats');
  return res.data.stats;
}

export async function getAdminUsers(params?: {
  limit?: number;
  offset?: number;
  search?: string;
  role?: string;
}): Promise<{ users: AdminUser[]; pagination: Pagination }> {
  const res = await apiClient.get('/v1/api/admin/users', { params });
  return { users: res.data.users, pagination: res.data.pagination };
}

export async function getAdminConveners(params?: {
  limit?: number;
  offset?: number;
}): Promise<{ conveners: AdminConvener[]; pagination: Pagination }> {
  const res = await apiClient.get('/v1/api/admin/conveners', { params });
  return { conveners: res.data.conveners, pagination: res.data.pagination };
}

export async function getAdminProgrammes(params?: {
  limit?: number;
  offset?: number;
}): Promise<{ programmes: AdminProgramme[]; pagination: Pagination }> {
  const res = await apiClient.get('/v1/api/admin/programmes', { params });
  return { programmes: res.data.programmes, pagination: res.data.pagination };
}

export async function updateUserRole(userId: number, role: string, reason?: string): Promise<void> {
  await apiClient.put(`/v1/api/users/${userId}/role`, { role, reason });
}

export async function updateUserStatus(userId: number, status: 'active' | 'inactive'): Promise<void> {
  await apiClient.patch(`/v1/api/admin/users/${userId}/status`, { status });
}
