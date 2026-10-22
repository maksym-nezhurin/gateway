import { Request, Response, NextFunction } from 'express';
import { jwtMiddleware } from './jwt.middleware';

/** GET /v1/garage/public-listings and /public-listings/:id — no auth */
export function isPublicGarageRoute(req: Request): boolean {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return false;
  }
  const path = req.path ?? '';
  return path === '/public-listings' || path.startsWith('/public-listings/');
}

/**
 * car-service trusts identity headers verbatim, and the garage proxy forwards client
 * headers as-is. x-user-id is re-set from the verified token; x-user-roles is never
 * set for garage routes, so a client-sent value must not reach car-service either.
 */
export function stripClientIdentityHeaders(req: Pick<Request, 'headers'>): void {
  delete req.headers['x-user-id'];
  delete req.headers['x-user-roles'];
}

/**
 * Authenticated garage routes require Bearer JWT.
 * userId for downstream car service is set only from verified token (jwtMiddleware).
 */
export function garageAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  stripClientIdentityHeaders(req);

  if (isPublicGarageRoute(req)) {
    return next();
  }

  return jwtMiddleware(req, res, next);
}
