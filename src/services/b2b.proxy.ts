import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { ROUTES } from '../constants/routes';
import { config } from '../config/env';
import { respondProxyUnavailable } from './proxy-error';

/** Companies: /api/v1/companies/* */
export const companiesProxy = createProxyMiddleware({
  target: config.authServiceUrl,
  changeOrigin: true,
  pathRewrite: {
    [`^${ROUTES.COMPANIES}`]: '/api/v1/companies',
  },
  timeout: 30_000,
  proxyTimeout: 30_000,
  onProxyReq: (proxyReq, req) => {
    fixRequestBody(proxyReq, req);
  },
  onError: respondProxyUnavailable('Companies', config.authServiceUrl),
});

/** Draft companies (garage business picker): /api/v1/draft-companies/* */
export const draftCompaniesProxy = createProxyMiddleware({
  target: config.authServiceUrl,
  changeOrigin: true,
  pathRewrite: {
    [`^${ROUTES.DRAFT_COMPANIES}`]: '/api/v1/draft-companies',
  },
  timeout: 30_000,
  proxyTimeout: 30_000,
  onProxyReq: (proxyReq, req) => {
    fixRequestBody(proxyReq, req);
  },
  onError: respondProxyUnavailable('Draft companies', config.authServiceUrl),
});

/** Partners catalog + admin listings: /api/v1/partners/* */
export const partnersProxy = createProxyMiddleware({
  target: config.authServiceUrl,
  changeOrigin: true,
  pathRewrite: {
    [`^${ROUTES.PARTNERS}`]: '/api/v1/partners',
  },
  timeout: 30_000,
  proxyTimeout: 30_000,
  onProxyReq: (proxyReq, req) => {
    fixRequestBody(proxyReq, req);
  },
  onError: respondProxyUnavailable('Partners', config.authServiceUrl),
});
