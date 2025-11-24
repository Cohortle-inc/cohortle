export interface FormData {
  firstName?: string;
  lastName?: string;
  username?: string;
  password?: string;
  location?: string;
  socials?: string;
  bio?: string;
  profileImage?: { uri: string; type: string; name: string } | null;
}

// ✅ Define backend response type
export interface UpdateProfileResponse {
  error: boolean;
  message: {
    FIRSTNAME?: string;
    LASTNAME?: string;
    USERNAME?: string;
  };
}
