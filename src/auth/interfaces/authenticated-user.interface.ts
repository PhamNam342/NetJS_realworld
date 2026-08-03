export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  bio?: string | null;
  image?: string | null;
  jti: string;
  exp: number;
}
