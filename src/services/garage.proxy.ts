import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { ROUTES } from '../constants/routes';
import { config } from '../config/env';
import { respondProxyUnavailable } from './proxy-error';

export const garageProxy = createProxyMiddleware({
  target: config.carServiceUrl,
  changeOrigin: true,
  pathRewrite: { [`^${ROUTES.GARAGE}`]: '/api/garage' },
  onProxyReq: (proxyReq, req) => {
    const userId = (req as { userId?: string }).userId;
    if (proxyReq.headersSent) {
      fixRequestBody(proxyReq, req);
      return;
    }
    if (userId) {
      proxyReq.setHeader('x-user-id', userId);
    }
    // Workshop routes only (set by garageAuthMiddleware from user-service, AUT-81).
    const organizationIds = (req as { organizationIds?: string[] }).organizationIds;
    if (organizationIds?.length) {
      proxyReq.setHeader('x-organization-ids', organizationIds.join(','));
    }
    if (config.internalGatewaySecret) {
      proxyReq.setHeader('x-internal-gateway-secret', config.internalGatewaySecret);
    }
    fixRequestBody(proxyReq, req);
  },
  onError: respondProxyUnavailable('Garage', config.carServiceUrl),
});
