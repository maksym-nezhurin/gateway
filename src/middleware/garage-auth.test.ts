import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Request } from 'express';
import {
  createPartnerMembershipStep,
  isPartnerGarageRoute,
  isPublicGarageRoute,
  stripClientIdentityHeaders,
} from './garage-auth.middleware';
import { MembershipUnavailableError } from '../services/organization-membership';

function mockReq(method: string, path: string): Request {
  return { method, path } as Request;
}

describe('isPublicGarageRoute', () => {
  it('allows GET public listings', () => {
    assert.equal(isPublicGarageRoute(mockReq('GET', '/public-listings')), true);
    assert.equal(isPublicGarageRoute(mockReq('GET', '/public-listings/abc')), true);
  });

  it('denies mutations and private paths', () => {
    assert.equal(isPublicGarageRoute(mockReq('POST', '/public-listings')), false);
    assert.equal(isPublicGarageRoute(mockReq('GET', '/vehicles')), false);
    assert.equal(isPublicGarageRoute(mockReq('GET', '/vehicles/1')), false);
  });
});

describe('stripClientIdentityHeaders', () => {
  it('removes client-sent x-user-id and x-user-roles, keeping other headers', () => {
    const req = {
      headers: {
        'x-user-id': 'spoofed-user',
        'x-user-roles': 'ADMIN,SUPER_ADMIN',
        authorization: 'Bearer token',
      },
    } as unknown as Request;

    stripClientIdentityHeaders(req);

    assert.equal(req.headers['x-user-id'], undefined);
    assert.equal(req.headers['x-user-roles'], undefined);
    assert.equal(req.headers.authorization, 'Bearer token');
  });
});

describe('workshop routes (AUT-81)', () => {
  it('recognises /partner and below only', () => {
    assert.equal(isPartnerGarageRoute({ path: '/partner' } as Request), true);
    assert.equal(isPartnerGarageRoute({ path: '/partner/organizations/o-1' } as Request), true);
    assert.equal(isPartnerGarageRoute({ path: '/partners' } as Request), false);
    assert.equal(isPartnerGarageRoute({ path: '/vehicles/1' } as Request), false);
  });

  it('strips a client-sent x-organization-ids on every garage route', () => {
    const req = { headers: { 'x-organization-ids': 'org-evil', accept: 'json' } } as unknown as Request;
    stripClientIdentityHeaders(req);
    assert.equal(req.headers['x-organization-ids'], undefined);
    assert.equal(req.headers.accept, 'json');
  });

  type Captured = { status?: number; body?: unknown; nextCalled: boolean; nextArg?: unknown };

  async function run(
    resolve: (userId: string, auth: string) => Promise<string[]>,
    req: Record<string, unknown>,
  ): Promise<Captured & { req: Record<string, unknown> }> {
    const captured: Captured = { nextCalled: false };
    const res = {
      status(code: number) {
        captured.status = code;
        return this;
      },
      json(body: unknown) {
        captured.body = body;
        return this;
      },
    };
    await createPartnerMembershipStep(resolve)(
      req as never,
      res as never,
      ((arg?: unknown) => {
        captured.nextCalled = true;
        captured.nextArg = arg;
      }) as never,
    );
    return { ...captured, req };
  }

  const authed = () => ({ userId: 'user-1', headers: { authorization: 'Bearer t' } });

  it('passes the resolved organizations on to the proxy', async () => {
    const out = await run(async (userId, auth) => {
      assert.equal(userId, 'user-1');
      assert.equal(auth, 'Bearer t');
      return ['org-1', 'org-2'];
    }, authed());
    assert.equal(out.nextCalled, true);
    assert.deepEqual(out.req.organizationIds, ['org-1', 'org-2']);
  });

  it('answers 403 when the user acts for no workshop', async () => {
    const out = await run(async () => [], authed());
    assert.equal(out.status, 403);
    assert.equal(out.nextCalled, false);
  });

  it('answers 503 when user-service cannot be reached', async () => {
    const out = await run(async () => {
      throw new MembershipUnavailableError();
    }, authed());
    assert.equal(out.status, 503);
    assert.equal(out.nextCalled, false);
  });

  it('answers 401 without a verified user', async () => {
    const out = await run(async () => ['org-1'], { headers: {} });
    assert.equal(out.status, 401);
  });
});
