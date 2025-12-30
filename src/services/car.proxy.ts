import { createProxyMiddleware } from 'http-proxy-middleware';
import { ROUTES } from '../constants/routes';

export const carProxy = createProxyMiddleware({
  target: process.env.CAR_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { [`^${ROUTES.CARS}`]: '/api/cars' },
  onProxyReq: (proxyReq, req) => {
    const userId = (req as any).userId;
    if (userId) proxyReq.setHeader('x-user-id', userId);
  },
});