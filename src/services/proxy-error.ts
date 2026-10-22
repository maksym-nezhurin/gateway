import type { Response } from 'express';

type ProxyError = Error & { code?: string };

/** Error codes that a cold-starting remote service (e.g. a Fly machine scaled down) produces. */
const COLD_START_CODES = new Set(['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ESOCKETTIMEDOUT', 'EPIPE']);

/**
 * Local targets (localhost, loopback, or a bare Docker Compose service name) never cold-start,
 * so "waking up" would be misleading there: the service is simply not running.
 */
export function isLocalTarget(target: string): boolean {
  let hostname: string;
  try {
    hostname = new URL(target).hostname;
  } catch {
    return false;
  }
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname === '0.0.0.0' ||
    !hostname.includes('.')
  );
}

export type ProxyErrorBody = { error: string; message: string; code?: string };

/**
 * 503 body for a proxied service that could not be reached. Always contains "unavailable":
 * apps/admin detects outages by that word (services/notification.ts isServiceAvailable).
 */
export function proxyErrorBody(service: string, target: string, err: ProxyError): ProxyErrorBody {
  const code = err.code;
  const error = `${service} service unavailable`;

  if (isLocalTarget(target)) {
    return {
      error,
      code,
      message: `${service} service unavailable: nothing answered at ${target}${code ? ` (${code})` : ''}. Is it running?`,
    };
  }
  if (code && COLD_START_CODES.has(code)) {
    return { error, code, message: 'Service is waking up, please retry in 20–30 seconds' };
  }
  return { error, code, message: `${service} service unavailable. Please try again later.` };
}

/** onError handler for http-proxy-middleware: logs the cause and answers 503 with a specific message. */
export function respondProxyUnavailable(service: string, target: string) {
  return (err: ProxyError, _req: unknown, res: Response) => {
    console.error(`[Gateway] ${service} service error (${target}):`, err.code ?? '', err.message);
    if (res.headersSent) return;
    const body = proxyErrorBody(service, target, err);
    if (body.message.startsWith('Service is waking up')) res.setHeader('Retry-After', '30');
    res.status(503).json(body);
  };
}
