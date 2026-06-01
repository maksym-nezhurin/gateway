import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Request } from 'express';
import { isPublicGarageRoute } from './garage-auth.middleware';

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
