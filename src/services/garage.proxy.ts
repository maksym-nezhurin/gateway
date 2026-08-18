import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { ROUTES } from '../constants/routes';
import { config } from '../config/env';

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
    if (config.internalGatewaySecret) {
      proxyReq.setHeader('x-internal-gateway-secret', config.internalGatewaySecret);
    }
    fixRequestBody(proxyReq, req);
  },
});
