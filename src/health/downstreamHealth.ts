export type DownstreamStatus = 'ok' | 'unhealthy' | 'unknown';

export interface DownstreamHealthResult {
  name: string;
  status: DownstreamStatus;
  url: string;
  healthUrl: string;
  httpStatus?: number;
  responseTimeMs: number;
  version?: string;
  buildAt?: string;
  message?: string;
}

export interface MonitoredServiceConfig {
  name: string;
  baseUrl: string;
  healthPath: string;
  /** When true, HTTP 2xx is enough (no JSON body validation) */
  httpOkOnly?: boolean;
}

const HEALTHY_VALUES = new Set(['ok', 'healthy', 'up', 'pass', 'ready']);
const DEFAULT_TIMEOUT_MS = 5000;

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

function buildHealthUrl(baseUrl: string, healthPath: string): string {
  const path = healthPath.startsWith('/') ? healthPath : `/${healthPath}`;
  return `${normalizeBaseUrl(baseUrl)}${path}`;
}

function unwrapPayload(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') return payload;
  const record = payload as Record<string, unknown>;
  if (record.data && typeof record.data === 'object') return record.data;
  return payload;
}

function isHealthyBody(body: string, httpOkOnly: boolean): {
  healthy: boolean;
  version?: string;
  buildAt?: string;
} {
  const trimmed = body.trim();
  if (httpOkOnly) return { healthy: true };
  if (!trimmed) return { healthy: true };

  if (HEALTHY_VALUES.has(trimmed.toLowerCase())) {
    return { healthy: true };
  }

  try {
    const payload = unwrapPayload(JSON.parse(trimmed) as unknown);
    if (!payload || typeof payload !== 'object') {
      return { healthy: false };
    }
    const record = payload as Record<string, unknown>;
    const status = record.status ?? record.health ?? record.state;
    if (typeof status === 'string' && HEALTHY_VALUES.has(status.toLowerCase())) {
      const version = record.version;
      const buildAt = record.buildAt ?? record.build_at ?? record.timestamp;
      return {
        healthy: true,
        version: typeof version === 'string' ? version : undefined,
        buildAt: typeof buildAt === 'string' ? buildAt : undefined,
      };
    }
    if (record.ok === true) {
      return { healthy: true };
    }
    return { healthy: false };
  } catch {
    return { healthy: false };
  }
}

export async function checkDownstreamService(
  service: MonitoredServiceConfig,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<DownstreamHealthResult> {
  const baseUrl = normalizeBaseUrl(service.baseUrl);
  const healthUrl = buildHealthUrl(baseUrl, service.healthPath);
  const startedAt = performance.now();

  try {
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: { Accept: 'application/json, text/plain;q=0.9, */*;q=0.8' },
      signal: AbortSignal.timeout(timeoutMs),
    });

    const responseTimeMs = Math.round(performance.now() - startedAt);
    const body = await response.text();
    const { healthy, version, buildAt } = isHealthyBody(
      body,
      service.httpOkOnly === true,
    );

    if (!response.ok) {
      return {
        name: service.name,
        status: 'unhealthy',
        url: baseUrl,
        healthUrl,
        httpStatus: response.status,
        responseTimeMs,
        message: `HTTP ${response.status}`,
      };
    }

    if (!healthy) {
      return {
        name: service.name,
        status: 'unhealthy',
        url: baseUrl,
        healthUrl,
        httpStatus: response.status,
        responseTimeMs,
        version,
        buildAt,
        message: 'Invalid health response body',
      };
    }

    return {
      name: service.name,
      status: 'ok',
      url: baseUrl,
      healthUrl,
      httpStatus: response.status,
      responseTimeMs,
      version,
      buildAt,
    };
  } catch (error) {
    const message =
      error instanceof Error && error.name === 'AbortError'
        ? 'Timeout'
        : error instanceof Error
          ? error.message
          : 'Unknown error';

    return {
      name: service.name,
      status: 'unknown',
      url: baseUrl,
      healthUrl,
      responseTimeMs: Math.round(performance.now() - startedAt),
      message,
    };
  }
}

export async function checkAllDownstreamServices(
  services: MonitoredServiceConfig[],
  timeoutMs?: number,
): Promise<DownstreamHealthResult[]> {
  return Promise.all(
    services.map((service) => checkDownstreamService(service, timeoutMs)),
  );
}
