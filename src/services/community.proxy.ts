import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { ROUTES } from '../constants/routes';
import { config } from '../config/env';

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
  onError(err, _req, res) {
    console.error('[Gateway] Community service error:', err.message);
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Community service unavailable',
        message: 'Service is waking up, please retry in 20–30 seconds',
      });
    }
  },
});
