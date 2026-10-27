import { Request, Response, NextFunction } from 'express';
import { jwtMiddleware } from './jwt.middleware';
import {
  MembershipUnavailableError,
  resolveOrganizationIds,
} from '../services/organization-membership';

/** GET /v1/garage/public-listings and /public-listings/:id — no auth */
export function isPublicGarageRoute(req: Request): boolean {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return false;
  }
  const path = req.path ?? '';
  return path === '/public-listings' || path.startsWith('/public-listings/');
}

/** Workshop routes (AUT-81): /v1/garage/partner and below. */
export function isPartnerGarageRoute(req: Pick<Request, 'path'>): boolean {
  const path = req.path ?? '';
  return path === '/partner' || path.startsWith('/partner/');
}

/**
 * car-service trusts identity headers verbatim, and the garage proxy forwards client
 * headers as-is. x-user-id is re-set from the verified token; x-organization-ids is
 * re-set from user-service on workshop routes only; x-user-roles is never set for garage
 * routes. A client-sent value of any of them must not reach car-service.
 */
export function stripClientIdentityHeaders(req: Pick<Request, 'headers'>): void {
  delete req.headers['x-user-id'];
  delete req.headers['x-user-roles'];
  delete req.headers['x-organization-ids'];
}

type ResolveOrganizationIds = (userId: string, authorization: string) => Promise<string[]>;

/**
 * Workshop routes need at least one organization the user acts for. The ids ride on
 * the request to the proxy, which sets x-organization-ids; car-service then checks the
 * organization in the path against them.
 */
export function createPartnerMembershipStep(resolve: ResolveOrganizationIds = resolveOrganizationIds) {
  return async function partnerMembershipStep(req: Request, res: Response, next: NextFunction) {
    const userId = (req as Request & { userId?: string }).userId;
    const authorization = req.headers.authorization;
    if (!userId || !authorization) {
      return res.status(401).json({ message: 'Missing authorization token' });
    }
    try {
      const organizationIds = await resolve(userId, authorization);
      if (organizationIds.length === 0) {
        return res.status(403).json({ message: 'Not a member of any verified workshop' });
      }
      (req as Request & { organizationIds?: string[] }).organizationIds = organizationIds;
      return next();
    } catch (err) {
      if (err instanceof MembershipUnavailableError) {
        return res.status(503).json({ message: 'Workshop membership is temporarily unavailable' });
      }
      return next(err);
    }
  };
}

const partnerMembershipStep = createPartnerMembershipStep();

/**
 * Authenticated garage routes require Bearer JWT.
 * userId for downstream car service is set only from verified token (jwtMiddleware).
 */
export function garageAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  stripClientIdentityHeaders(req);

  if (isPublicGarageRoute(req)) {
    return next();
  }

  if (isPartnerGarageRoute(req)) {
    return jwtMiddleware(req, res, () => void partnerMembershipStep(req, res, next));
  }

  return jwtMiddleware(req, res, next);
}
