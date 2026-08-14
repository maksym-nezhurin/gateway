import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { ROUTES } from '../constants/routes';
import { config } from '../config/env';

export const carProxy = createProxyMiddleware({
  target: config.carServiceUrl,
  changeOrigin: true,
  pathRewrite: { [`^${ROUTES.CARS}`]: '/api/cars' },
  onProxyReq: (proxyReq, req) => {
    const userId = (req as any).userId;
    const roles = (req as any).userRoles as string[] | undefined;
    if (proxyReq.headersSent) {
      fixRequestBody(proxyReq, req);
      return;
    }
    if (userId) {
      proxyReq.setHeader('x-user-id', userId);
    }
    if (roles?.length) {
      proxyReq.setHeader('x-user-roles', roles.join(','));
    }
    if (config.internalGatewaySecret) {
      proxyReq.setHeader('x-internal-gateway-secret', config.internalGatewaySecret);
    }
    fixRequestBody(proxyReq, req);
  },
});