import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { ROUTES } from '../constants/routes';
import { config } from '../config/env';
import { respondProxyUnavailable } from './proxy-error';

/** Nest authz (user-service): /api/v1/auth/* — matches admin `v1/auth/*` via gateway */
export const authProxy = createProxyMiddleware({
  target: config.authServiceUrl,
  changeOrigin: true,
  pathRewrite: {
    [`^${ROUTES.AUTH}`]: '/api/v1/auth',
  },
  timeout: 30_000,
  proxyTimeout: 30_000,
  onProxyReq: (proxyReq, req) => {
    fixRequestBody(proxyReq, req);
  },
  onProxyRes: (proxyRes, req) => {
    console.log(
      `[Gateway] Auth → ${proxyRes.statusCode} ${req.method} ${req.originalUrl}`,
    );
  },
  onError: respondProxyUnavailable('Auth', config.authServiceUrl),
});
