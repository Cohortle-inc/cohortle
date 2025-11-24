export interface Posts {
  id: string;
  posted_by: {
    first_name: string;
    last_name: string;
    email: string;
  } | null; // allow null in case user lookup fails
  text: string;
}
