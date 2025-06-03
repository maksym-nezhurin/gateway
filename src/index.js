require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const session = require('express-session');
const cors = require('cors');
const Keycloak = require('keycloak-connect');

const app = express();
const port = process.env.PORT;
const authTarget = process.env.AUTH_SERVICE_URL;
const carTarget = process.env.CAR_SERVICE_URL;

const keycloakConfig = {
  clientId: process.env.KEYCLOAK_CLIENT_ID,
  bearerOnly: false,
  serverUrl: process.env.KEYCLOAK_SERVER_URL,
  realm: process.env.KEYCLOAK_REALM_NAME,
  'ssl-required': 'external',
  resource: 'api-client',
  credentials: {
    secret: process.env.KEYCLOAK_CLIENT_SECRET,
  },
  'confidential-port': 0,
};

const memoryStore = new session.MemoryStore();
app.use(session({
  secret: 'some-secret',
  resave: false,
  saveUninitialized: true,
  store: memoryStore,
}));

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://admin-liard-pi-71.vercel.app'
  ],
  credentials: true,
}));

const keycloak = new Keycloak({ store: memoryStore }, keycloakConfig);

app.use(keycloak.middleware());

app.get('/', (req, res) => {
  res.json({ status: 'Gateway is ready! Happy coding...' });
}
);

app.use('/auth', createProxyMiddleware({
  target: authTarget,
  changeOrigin: true,
  pathRewrite: {
    '^/auth': '/api/auth',
  }
}));

app.use('/verify', createProxyMiddleware({
  target: authTarget,
  changeOrigin: true,
  pathRewrite: {
    '^/verify': '/api/auth/verify',
  },
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.method = req.method;
  }
}));

app.use('/cars/characteristics', createProxyMiddleware({
  target: carTarget,
  changeOrigin: true,
  pathRewrite: {
    '^/cars/characteristics/brands': '/api/brands',
    '^/cars/characteristics/models': '/api/models',
    '^/cars/characteristics/variants': '/api/variants',
  },
  onProxyReq: (proxyReq, req) => {
    proxyReq.method = req.method;
  }
}));

app.get('/cars', (req, res, next) => {
  console.log('get cars');
  next();
}, createProxyMiddleware({
  target: carTarget,
  changeOrigin: true,
  pathRewrite: {
    '^/cars': '/api/cars',
  },
}));

app.get('/cars/:id', (req, res, next) => {
  console.log(`get car by id: ${req.params.id}`);
  next();
}, createProxyMiddleware({
  target: carTarget,
  changeOrigin: true,
  pathRewrite: {
    '^/cars': '/api/cars',
  },
}));

app.use('/cars', keycloak.protect(), (req, res, next) => {
  const user = req.kauth?.grant?.access_token?.content;
  req.userId = user?.sub;
  next();
}, createProxyMiddleware({
  target: carTarget,
  changeOrigin: true,
  pathRewrite: {
    '^/cars': '/api/cars',
  },
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.method = req.method;
    if (req.userId) {
      proxyReq.setHeader('x-user-id', req.userId);
    }
  }
}));

app.listen(port, '0.0.0.0', () => {
  console.log(`Gateway running at ${port}`);
});

