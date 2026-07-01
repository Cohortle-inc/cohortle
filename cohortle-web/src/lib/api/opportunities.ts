export type OpportunityCategory =
  | 'fellowship'
  | 'accelerator'
  | 'incubator'
  | 'leadership'
  | 'bootcamp'
  | 'challenge'
  | 'scholarship'
  | 'ngo_training'
  | 'other';

export type OpportunityStatus = 'draft' | 'published' | 'archived';

export const OPPORTUNITY_CATEGORY_LABELS: Record<OpportunityCategory, string> = {
  fellowship: 'Fellowship',
  accelerator: 'Accelerator',
  incubator: 'Incubator',
  leadership: 'Leadership Programme',
  bootcamp: 'Bootcamp',
  challenge: 'Innovation Challenge',
  scholarship: 'Scholarship',
  ngo_training: 'NGO Training',
  other: 'Other',
};

export interface ExternalOpportunity {
  source: 'external';
  id: number;
  title: string;
  description: string | null;
  organisation: string;
  category: OpportunityCategory;
  format: 'online' | 'in-person' | 'hybrid' | null;
  duration: string | null;
  price_info: string | null;
  highlights: string[] | null;
  thumbnail_url: string | null;
  apply_url: string;
  deadline: string | null; // ISO date string YYYY-MM-DD
  location: string | null;
  is_featured: boolean;
}

export interface AdminOpportunity extends ExternalOpportunity {
  status: OpportunityStatus;
  created_by: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  archived_at: string | null;
}

export interface CreateOpportunityInput {
  title: string;
  description?: string;
  organisation: string;
  category: OpportunityCategory;
  format?: 'online' | 'in-person' | 'hybrid';
  duration?: string;
  price_info?: string;
  highlights?: string[];
  thumbnail_url?: string;
  apply_url: string;
  deadline?: string;
  location?: string;
  tags?: string[];
  is_featured?: boolean;
}

export interface PublicOpportunitiesResponse {
  error: boolean;
  opportunities: ExternalOpportunity[];
}

export interface AdminOpportunitiesResponse {
  error: boolean;
  opportunities: AdminOpportunity[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}
