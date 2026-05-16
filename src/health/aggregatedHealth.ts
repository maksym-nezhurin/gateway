import { createHealthResponse, type ServiceHealthResponse } from './healthResponse';
import {
  checkAllDownstreamServices,
  type DownstreamHealthResult,
} from './downstreamHealth';
import { getMonitoredServices } from './monitoredServices';

export type AggregatedStatus = 'ok' | 'degraded' | 'unhealthy';

export interface AggregatedHealthResponse extends ServiceHealthResponse {
  /** ok = all downstream ok; degraded = some down; unhealthy reserved for gateway itself */
  aggregateStatus: AggregatedStatus;
  services: DownstreamHealthResult[];
}

function computeAggregateStatus(
  downstream: DownstreamHealthResult[],
): AggregatedStatus {
  if (downstream.length === 0) return 'ok';
  if (downstream.every((s) => s.status === 'ok')) return 'ok';
  if (downstream.some((s) => s.status === 'ok')) return 'degraded';
  return 'unhealthy';
}

export async function buildAggregatedHealthResponse(): Promise<AggregatedHealthResponse> {
  const monitored = getMonitoredServices();
  const services = await checkAllDownstreamServices(monitored);
  const aggregateStatus = computeAggregateStatus(services);

  return {
    ...createHealthResponse(),
    aggregateStatus,
    services,
  };
}
