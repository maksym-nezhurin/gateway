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

function stripClientUserId(req: Request): void {
  delete req.headers['x-user-id'];
}

/**
 * Authenticated garage routes require Bearer JWT.
 * userId for downstream car service is set only from verified token (jwtMiddleware).
 */
export function garageAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  stripClientUserId(req);

  if (isPublicGarageRoute(req)) {
    return next();
  }

  return jwtMiddleware(req, res, next);
}
