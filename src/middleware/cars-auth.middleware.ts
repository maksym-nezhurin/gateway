import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export type VerifiedIdentity = { userId: string; roles: string[] };

const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN']);

/**
 * Ownership-scoped and admin car-service routes — everything else under /cars (catalog
 * browsing, brand/attribute lists, single-car reads) stays public. Path is relative to
 * the /v1/cars mount, matching how car-service's own controllers see it.
 */
export function isProtectedCarsRoute(req: Pick<Request, 'method' | 'path'>): boolean {
  const path = req.path ?? '';
  if (isAdminCarsRoute(req)) return true;
  if (path === '/my') return true;
  if (req.method === 'POST' && (path === '' || path === '/')) return true;
  if (
    (req.method === 'PATCH' || req.method === 'DELETE') &&
    /^\/[^/]+$/.test(path) &&
    !path.startsWith('/catalog')
  ) {
    return true;
  }
  return false;
}

/** Requires ADMIN/SUPER_ADMIN on top of a valid token — currently just catalog moderation. */
export function isAdminCarsRoute(req: Pick<Request, 'path'>): boolean {
  return (req.path ?? '').startsWith('/catalog/admin');
}

function verifyBearer(req: Request): VerifiedIdentity | null {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader?.split(' ')[1];
  if (!token) return null;

  try {
    const payload = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload & {
      sub?: string;
      roles?: unknown;
    };
    if (!payload.sub || typeof payload.sub !== 'string') return null;
    const roles = Array.isArray(payload.roles)
      ? payload.roles.filter((r): r is string => typeof r === 'string')
      : [];
    return { userId: payload.sub, roles };
  } catch {
    return null;
  }
}

/**
 * car-service trusts x-user-id / x-user-roles verbatim from whatever hits it, so this is
 * the only place those headers may be set — always stripped first, then re-set only from
 * a verified JWT. Public routes (catalog browsing, single-car reads) work anonymously;
 * ownership routes (POST/PATCH/DELETE /cars, GET /cars/my) require a valid token;
 * /cars/catalog/admin/* additionally requires the ADMIN or SUPER_ADMIN role.
 */
export function carsAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  delete req.headers['x-user-id'];
  delete req.headers['x-user-roles'];

  const identity = verifyBearer(req);

  if (isProtectedCarsRoute(req)) {
    if (!identity) {
      return res.status(401).json({ message: 'Missing or invalid authorization token' });
    }
    if (isAdminCarsRoute(req) && !identity.roles.some((r) => ADMIN_ROLES.has(r))) {
      return res.status(403).json({ message: 'Admin role required' });
    }
  }

  if (identity) {
    (req as Request & { userId?: string; userRoles?: string[] }).userId = identity.userId;
    (req as Request & { userId?: string; userRoles?: string[] }).userRoles = identity.roles;
  }

  next();
}
