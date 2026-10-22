import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Request } from 'express';
import {
  isAdminCarsRoute,
  isInternalCatalogExportRoute,
  isProtectedCarsRoute,
} from './cars-auth.middleware';

function mockReq(method: string, path: string): Request {
  return { method, path } as Request;
}

describe('isAdminCarsRoute', () => {
  it('matches /catalog/admin/*', () => {
    assert.equal(isAdminCarsRoute(mockReq('PATCH', '/catalog/admin/generations/g1')), true);
    assert.equal(isAdminCarsRoute(mockReq('PATCH', '/catalog/admin/trims/t1')), true);
  });

  it('matches service-history moderation under /admin/*', () => {
    assert.equal(
      isAdminCarsRoute(mockReq('GET', '/admin/service-history/change-requests')),
      true,
    );
    assert.equal(
      isAdminCarsRoute(mockReq('POST', '/admin/service-history/change-requests/r1/approve')),
      true,
    );
    assert.equal(isAdminCarsRoute(mockReq('GET', '/admin')), true);
  });

  it('does not match plain catalog browsing', () => {
    assert.equal(isAdminCarsRoute(mockReq('GET', '/catalog/makes')), false);
    assert.equal(isAdminCarsRoute(mockReq('GET', '/catalog')), false);
  });

  it('does not match paths that only start with the letters "admin"', () => {
    assert.equal(isAdminCarsRoute(mockReq('GET', '/administrator')), false);
    assert.equal(isAdminCarsRoute(mockReq('GET', '/admins/1')), false);
  });
});

describe('isInternalCatalogExportRoute', () => {
  it('matches community-seed export', () => {
    assert.equal(
      isInternalCatalogExportRoute(mockReq('GET', '/catalog/export/community-seed')),
      true,
    );
  });

  it('does not match other catalog routes', () => {
    assert.equal(isInternalCatalogExportRoute(mockReq('GET', '/catalog/makes')), false);
    assert.equal(isInternalCatalogExportRoute(mockReq('GET', '/catalog/generations')), false);
  });
});

describe('isProtectedCarsRoute', () => {
  it('requires auth for /catalog/admin/*', () => {
    assert.equal(isProtectedCarsRoute(mockReq('PATCH', '/catalog/admin/generations/g1')), true);
  });

  it('requires auth for /admin/*', () => {
    assert.equal(
      isProtectedCarsRoute(mockReq('GET', '/admin/service-history/change-requests')),
      true,
    );
    assert.equal(
      isProtectedCarsRoute(mockReq('POST', '/admin/service-history/change-requests/r1/reject')),
      true,
    );
  });

  it('requires auth for /catalog/export/*', () => {
    assert.equal(
      isProtectedCarsRoute(mockReq('GET', '/catalog/export/community-seed')),
      true,
    );
  });

  it('requires auth for GET /my', () => {
    assert.equal(isProtectedCarsRoute(mockReq('GET', '/my')), true);
  });

  it('requires auth for creating a car', () => {
    assert.equal(isProtectedCarsRoute(mockReq('POST', '')), true);
    assert.equal(isProtectedCarsRoute(mockReq('POST', '/')), true);
  });

  it('requires auth for editing or deleting a specific car', () => {
    assert.equal(isProtectedCarsRoute(mockReq('PATCH', '/abc123')), true);
    assert.equal(isProtectedCarsRoute(mockReq('DELETE', '/abc123')), true);
  });

  it('leaves catalog browsing public, including nested paths', () => {
    assert.equal(isProtectedCarsRoute(mockReq('GET', '/catalog')), false);
    assert.equal(isProtectedCarsRoute(mockReq('GET', '/catalog/makes')), false);
    assert.equal(isProtectedCarsRoute(mockReq('GET', '/catalog/generations')), false);
    assert.equal(
      isProtectedCarsRoute(mockReq('GET', '/catalog/by-path/vw/golf/golf-vii')),
      false,
    );
  });

  it('leaves generic car reads and reference lists public', () => {
    assert.equal(isProtectedCarsRoute(mockReq('GET', '')), false);
    assert.equal(isProtectedCarsRoute(mockReq('GET', '/abc123')), false);
    assert.equal(isProtectedCarsRoute(mockReq('GET', '/brands')), false);
    assert.equal(isProtectedCarsRoute(mockReq('GET', '/attributes')), false);
  });

  it('does not mistake a single-segment PATCH/DELETE on /catalog itself for an ownership route', () => {
    // No such route exists in car-service, but the regex guard must not misfire on it.
    assert.equal(isProtectedCarsRoute(mockReq('PATCH', '/catalog')), false);
  });
});
