import { createProxyMiddleware } from 'http-proxy-middleware';
import { ROUTES } from '../constants/routes';
import { config } from '../config/env';

export const authProxy = createProxyMiddleware({
  target: config.authServiceUrl,
  changeOrigin: true,
  pathRewrite: {
    [`^${ROUTES.AUTH}`]: '/api/v1/auth',
  },
  timeout: 30_000,
  proxyTimeout: 30_000,
  onProxyReq: (proxyReq, req) => {
    if (req.body) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
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
