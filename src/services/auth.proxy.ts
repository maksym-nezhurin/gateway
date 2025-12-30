import { createProxyMiddleware } from 'http-proxy-middleware';
import { ROUTES } from '../constants/routes';

export const authProxy = createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { [`^${ROUTES.AUTH}`]: '/api/v1/auth' },
   onProxyReq: (proxyReq, req) => {
    if (req.body) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onProxyRes: (proxyRes, req) => {
    console.log(`[Gateway] Response from service: ${proxyRes.statusCode} for ${req.originalUrl}`);
  },
});
