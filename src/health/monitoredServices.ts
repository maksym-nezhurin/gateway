import { config } from '../config/env';
import type { MonitoredServiceConfig } from './downstreamHealth';

function addService(
  list: MonitoredServiceConfig[],
  entry: MonitoredServiceConfig | null,
): void {
  if (entry?.baseUrl) {
    list.push(entry);
  }
}

/** Backend services probed server-side by GET /api/health/services */
export function getMonitoredServices(): MonitoredServiceConfig[] {
  const services: MonitoredServiceConfig[] = [];

  addService(services, {
    name: 'user',
    baseUrl: config.authServiceUrl,
    healthPath: '/api/v1/health',
  });

  addService(services, config.expressAuthServiceUrl
    ? {
        name: 'auth',
        baseUrl: config.expressAuthServiceUrl,
        healthPath: '/api/health',
      }
    : null);

  addService(services, {
    name: 'car',
    baseUrl: config.carServiceUrl,
    healthPath: '/api',
    httpOkOnly: true,
  });

  return services;
}
