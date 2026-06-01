import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { ROUTES } from '../constants/routes';
import { config } from '../config/env';

export const garageProxy = createProxyMiddleware({
  target: config.carServiceUrl,
  changeOrigin: true,
  pathRewrite: { [`^${ROUTES.GARAGE}`]: '/api/garage' },
  onProxyReq: (proxyReq, req) => {
    const userId = (req as { userId?: string }).userId;
    if (userId && !proxyReq.headersSent) {
      proxyReq.setHeader('x-user-id', userId);
    }
    fixRequestBody(proxyReq, req);
  },
});
