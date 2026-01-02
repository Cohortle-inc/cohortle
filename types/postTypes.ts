export interface Posts {
  id: string;
  posted_by: {
    first_name: string;
    last_name: string;
    email: string;
    role?: string;
  } | null;
  text: string;
  created_at?: string;
  updated_at?: string;
  community_names?: string[];
}
