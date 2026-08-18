import { Request, Response } from 'express';
import { config } from '../config/env';

const CAR_STATS_TIMEOUT_MS = 5_000;
const AUTH_OVERVIEW_TIMEOUT_MS = 10_000;

type CarGarageOverview = {
  vehicles: { total: number; last7Days: number; last30Days: number };
  garage: { entriesTotal: number; last7Days: number; last30Days: number };
  saleListings: { active: number };
};

function unwrapCarServicePayload<T>(body: unknown): T | null {
  if (!body || typeof body !== 'object') return null;
  if ('data' in body && (body as { data: unknown }).data !== undefined) {
    return (body as { data: T }).data;
  }
  return body as T;
}

/**
 * Garage/vehicle counts live in car-service's own DB, so the gateway — which already
 * holds both AUTH_SERVICE_URL and CAR_SERVICE_URL — composes them into the admin overview
 * here rather than having auth-service reach across services for it. Degrades gracefully
 * (garageAvailable: false) so a car-service outage never breaks the rest of the overview.
 */
export async function fetchCarGarageOverview(): Promise<{
  garage: CarGarageOverview | null;
  garageAvailable: boolean;
}> {
  const base = config.carServiceUrl.replace(/\/$/, '');
  try {
    const res = await fetch(`${base}/api/admin/stats`, {
      headers: config.internalGatewaySecret
        ? { 'x-internal-gateway-secret': config.internalGatewaySecret }
        : undefined,
      signal: AbortSignal.timeout(CAR_STATS_TIMEOUT_MS),
    });
    if (!res.ok) {
      return { garage: null, garageAvailable: false };
    }
    const json: unknown = await res.json();
    const data = unwrapCarServicePayload<CarGarageOverview>(json);
    if (!data?.vehicles || !data?.garage) {
      return { garage: null, garageAvailable: false };
    }
    return { garage: data, garageAvailable: true };
  } catch {
    return { garage: null, garageAvailable: false };
  }
}

/** Pure merge so the composition logic is testable without a network call. */
export function mergeAdminOverview(
  authOverview: Record<string, unknown>,
  garageResult: { garage: CarGarageOverview | null; garageAvailable: boolean },
): Record<string, unknown> {
  return { ...authOverview, ...garageResult };
}

/**
 * GET /v1/admin/overview — composes auth-service's user/company overview with
 * car-service's garage stats into one response, matching the shape the admin frontend
 * already expects. Auth/role checks are delegated to auth-service's own
 * JwtAuthGuard/RolesGuard — its response is forwarded verbatim on failure rather than
 * re-implemented here.
 */
export async function adminOverviewHandler(req: Request, res: Response): Promise<void> {
  const authHeader = req.headers.authorization;
  const base = config.authServiceUrl.replace(/\/$/, '');

  let upstream: globalThis.Response;
  try {
    upstream = await fetch(`${base}/api/v1/admin/overview`, {
      headers: authHeader ? { Authorization: authHeader } : undefined,
      signal: AbortSignal.timeout(AUTH_OVERVIEW_TIMEOUT_MS),
    });
  } catch {
    res.status(502).json({ message: 'Cannot reach auth service.' });
    return;
  }

  const bodyText = await upstream.text();
  if (!upstream.ok) {
    res
      .status(upstream.status)
      .type(upstream.headers.get('content-type') ?? 'application/json')
      .send(bodyText);
    return;
  }

  let authOverview: Record<string, unknown>;
  try {
    authOverview = JSON.parse(bodyText) as Record<string, unknown>;
  } catch {
    res.status(502).json({ message: 'Invalid response from auth service.' });
    return;
  }

  const garageResult = await fetchCarGarageOverview();
  res.json(mergeAdminOverview(authOverview, garageResult));
}
