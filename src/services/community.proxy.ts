import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { ROUTES } from '../constants/routes';
import { config } from '../config/env';
import { respondProxyUnavailable } from './proxy-error';

/** Nest user-service: /api/v1/community/* */
export const communityProxy = createProxyMiddleware({
  target: config.authServiceUrl,
  changeOrigin: true,
  pathRewrite: {
    [`^${ROUTES.COMMUNITY}`]: '/api/v1/community',
  },
  timeout: 30_000,
  proxyTimeout: 30_000,
  onProxyReq: (proxyReq, req) => {
    fixRequestBody(proxyReq, req);
  },
  onProxyRes: (proxyRes, req) => {
    console.log(
      `[Gateway] Community → ${proxyRes.statusCode} ${req.method} ${req.originalUrl}`,
    );
  },
  onError: respondProxyUnavailable('Community', config.authServiceUrl),
});
