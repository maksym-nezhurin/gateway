import { createProxyMiddleware } from 'http-proxy-middleware';
import { ROUTES } from '../constants/routes';
import { config } from '../config/env';

export const carProxy = createProxyMiddleware({
  target: config.carServiceUrl,
  changeOrigin: true,
  pathRewrite: { [`^${ROUTES.CARS}`]: '/api/cars' },
  onProxyReq: (proxyReq, req) => {
    const userId = (req as any).userId;
    if (userId) proxyReq.setHeader('x-user-id', userId);
  },
});