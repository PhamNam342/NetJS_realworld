import type { Request } from 'express';
import type { AuthenticatedUser } from './authenticated-user.interface';

export interface OptionalAuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
