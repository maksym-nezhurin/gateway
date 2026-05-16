import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { ROUTES } from '../constants/routes';
import { config } from '../config/env';

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
  onError(err, req, res) {
    console.error('[Gateway] Auth service error:', err.message);

    if (!res.headersSent) {
      res.status(503).json({
        error: 'Auth service unavailable',
        message: 'Service is waking up, please retry in 20–30 seconds',
      });
    }
  }
});
