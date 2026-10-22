import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { ROUTES } from '../constants/routes';
import { config } from '../config/env';
import { respondProxyUnavailable } from './proxy-error';

/** Admin panel API: /api/v1/admin/* */
export const adminProxy = createProxyMiddleware({
  target: config.authServiceUrl,
  changeOrigin: true,
  pathRewrite: {
    [`^${ROUTES.ADMIN}`]: '/api/v1/admin',
  },
  timeout: 30_000,
  proxyTimeout: 30_000,
  onProxyReq: (proxyReq, req) => {
    fixRequestBody(proxyReq, req);
  },
  onError: respondProxyUnavailable('Admin', config.authServiceUrl),
});
