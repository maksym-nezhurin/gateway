import { config } from '../config/env';

/**
 * Which organizations (verified workshops) a user acts for, for the workshop routes under
 * /v1/garage/partner/*. car-service can't know this — membership lives in user-service —
 * so the gateway resolves it and passes it on as x-organization-ids, the same trust model
 * as x-user-id. See docs/V1_4_SERVICES_AND_WORK_ORDERS.md §0a (AUT-81).
 *
 * It asks user-service's GET /v1/companies/me with the user's own token: no extra internal
 * endpoint, and user-service applies its own auth to the answer.
 */

const MEMBERSHIP_TIMEOUT_MS = 5_000;
/** Short, so a new member or a suspended company takes effect within a minute. */
export const MEMBERSHIP_CACHE_TTL_MS = 60_000;

type CompanyLike = {
  status?: unknown;
  organization?: { id?: unknown } | null;
};

/**
 * Only ACTIVE companies that have an Organization count: a draft or suspended company, or
 * one without the operational layer, can't act on work orders.
 */
export function organizationIdsFromCompanies(payload: unknown): string[] {
  const list = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)
      ? (payload as { data: unknown[] }).data
      : [];
  const ids = new Set<string>();
  for (const company of list as CompanyLike[]) {
    const id = company?.organization?.id;
    if (company?.status === 'ACTIVE' && typeof id === 'string' && id) ids.add(id);
  }
  return [...ids];
}

export class MembershipUnavailableError extends Error {
  constructor(message = 'Workshop membership could not be resolved') {
    super(message);
    this.name = 'MembershipUnavailableError';
  }
}

export type FetchCompanies = (authorization: string) => Promise<unknown>;

/** GET {user-service}/api/v1/companies/me with the caller's Authorization header. */
export const fetchMyCompanies: FetchCompanies = async (authorization) => {
  const base = config.authServiceUrl.replace(/\/$/, '');
  let res: Response;
  try {
    res = await fetch(`${base}/api/v1/companies/me`, {
      headers: { authorization },
      signal: AbortSignal.timeout(MEMBERSHIP_TIMEOUT_MS),
    });
  } catch {
    throw new MembershipUnavailableError();
  }
  if (!res.ok) throw new MembershipUnavailableError(`user-service answered ${res.status}`);
  return res.json();
};

type CacheEntry = { ids: string[]; expiresAt: number };

/**
 * Resolver with a small per-user cache. Failures are never cached, so a user-service
 * hiccup doesn't lock a workshop out for a minute.
 */
export function createMembershipResolver(
  fetchCompanies: FetchCompanies = fetchMyCompanies,
  ttlMs: number = MEMBERSHIP_CACHE_TTL_MS,
  now: () => number = Date.now,
) {
  const cache = new Map<string, CacheEntry>();
  return async function resolveOrganizationIds(userId: string, authorization: string): Promise<string[]> {
    const hit = cache.get(userId);
    if (hit && hit.expiresAt > now()) return hit.ids;
    const ids = organizationIdsFromCompanies(await fetchCompanies(authorization));
    cache.set(userId, { ids, expiresAt: now() + ttlMs });
    return ids;
  };
}

export const resolveOrganizationIds = createMembershipResolver();
