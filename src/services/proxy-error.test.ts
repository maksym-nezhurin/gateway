import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isLocalTarget, proxyErrorBody } from './proxy-error';

const refused = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:3003'), { code: 'ECONNREFUSED' });
const dnsFailure = Object.assign(new Error('getaddrinfo ENOTFOUND auth.example.com'), { code: 'ENOTFOUND' });

describe('isLocalTarget', () => {
  it('treats localhost, loopback and Docker Compose service names as local', () => {
    assert.equal(isLocalTarget('http://localhost:3003'), true);
    assert.equal(isLocalTarget('http://127.0.0.1:3003'), true);
    assert.equal(isLocalTarget('http://auth-service:3003'), true);
  });

  it('treats hosted services as remote', () => {
    assert.equal(isLocalTarget('https://reelo-auth.fly.dev'), false);
    assert.equal(isLocalTarget('not a url'), false);
  });
});

describe('proxyErrorBody', () => {
  it('names the local target instead of claiming a cold start', () => {
    const body = proxyErrorBody('Auth', 'http://localhost:3003', refused);
    assert.equal(body.code, 'ECONNREFUSED');
    assert.match(body.message, /nothing answered at http:\/\/localhost:3003 \(ECONNREFUSED\)/);
    assert.doesNotMatch(body.message, /waking up/);
  });

  it('keeps the waking-up message for a refused connection to a remote service', () => {
    const body = proxyErrorBody('Auth', 'https://reelo-auth.fly.dev', refused);
    assert.equal(body.message, 'Service is waking up, please retry in 20–30 seconds');
  });

  it('does not blame a cold start for a DNS failure, and hides the remote target', () => {
    const body = proxyErrorBody('Auth', 'https://reelo-auth.fly.dev', dnsFailure);
    assert.equal(body.message, 'Auth service unavailable. Please try again later.');
    assert.doesNotMatch(body.message, /fly\.dev/);
  });

  it('always says "unavailable", which apps/admin uses to detect outages', () => {
    for (const [target, err] of [
      ['http://localhost:3003', refused],
      ['https://reelo-auth.fly.dev', refused],
      ['https://reelo-auth.fly.dev', dnsFailure],
    ] as const) {
      const body = proxyErrorBody('Auth', target, err);
      assert.match(`${body.error} ${body.message}`.toLowerCase(), /unavailable|waking up/);
      assert.match(body.error, /unavailable/);
    }
  });
});
