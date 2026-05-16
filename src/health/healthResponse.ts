import packageJson from '../../package.json';

export interface ServiceHealthResponse {
  status: 'ok';
  version: string;
  buildAt: string;
}

const buildAt = process.env.BUILD_AT ?? new Date().toISOString();

export function createHealthResponse(
  version: string = packageJson.version,
): ServiceHealthResponse {
  return {
    status: 'ok',
    version,
    buildAt,
  };
}
