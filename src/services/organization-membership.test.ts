import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createMembershipResolver,
  organizationIdsFromCompanies,
} from './organization-membership';

describe('organizationIdsFromCompanies', () => {
  it('keeps only ACTIVE companies that have an organization', () => {
    assert.deepEqual(
      organizationIdsFromCompanies([
        { status: 'ACTIVE', organization: { id: 'org-1' } },
        { status: 'PENDING_REVIEW', organization: { id: 'org-2' } },
        { status: 'SUSPENDED', organization: { id: 'org-3' } },
        { status: 'ACTIVE', organization: null },
        { status: 'ACTIVE' },
        { status: 'ACTIVE', organization: { id: 'org-1' } },
      ]),
      ['org-1'],
    );
  });

  it('accepts a { data } envelope and ignores anything else', () => {
    assert.deepEqual(
      organizationIdsFromCompanies({ data: [{ status: 'ACTIVE', organization: { id: 'org-9' } }] }),
      ['org-9'],
    );
    assert.deepEqual(organizationIdsFromCompanies(null), []);
    assert.deepEqual(organizationIdsFromCompanies({ message: 'nope' }), []);
  });
});

describe('createMembershipResolver', () => {
  it('caches per user until the TTL passes', async () => {
    let calls = 0;
    let clock = 1_000;
    const resolve = createMembershipResolver(
      async () => {
        calls += 1;
        return [{ status: 'ACTIVE', organization: { id: `org-${calls}` } }];
      },
      60_000,
      () => clock,
    );

    assert.deepEqual(await resolve('user-1', 'Bearer a'), ['org-1']);
    assert.deepEqual(await resolve('user-1', 'Bearer a'), ['org-1']);
    assert.equal(calls, 1);

    assert.deepEqual(await resolve('user-2', 'Bearer b'), ['org-2']);
    assert.equal(calls, 2);

    clock += 60_001;
    assert.deepEqual(await resolve('user-1', 'Bearer a'), ['org-3']);
    assert.equal(calls, 3);
  });

  it('does not cache a failure', async () => {
    let fail = true;
    const resolve = createMembershipResolver(async () => {
      if (fail) throw new Error('down');
      return [{ status: 'ACTIVE', organization: { id: 'org-1' } }];
    });
    await assert.rejects(resolve('user-1', 'Bearer a'));
    fail = false;
    assert.deepEqual(await resolve('user-1', 'Bearer a'), ['org-1']);
  });
});
