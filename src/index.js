require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const session = require('express-session');
const cors = require('cors');
const Keycloak = require('keycloak-connect');

const app = express();
const port = 3000;

console.log('Gateway Environment:', {
  clientId: process.env.KEYCLOAK_CLIENT_ID,
  serverUrl: process.env.KEYCLOAK_SERVER_URL,
  realm: process.env.KEYCLOAK_REALM_NAME,
  secret: process.env.KEYCLOAK_CLIENT_SECRET,
});

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

// Проксі до auth-сервісу
app.use('/auth', createProxyMiddleware({
  target: 'http://auth-service:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/auth': '/api/auth',
  }
}));

// Проксі для верифікації токена
app.use('/verify', createProxyMiddleware({
  target: 'http://auth-service:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/verify': '/api/auth/verify',
  },
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.method = req.method;
  }
}));

// Проксі до cars-сервісу (placeholder for actual service)
app.use('/cars', keycloak.protect(), (req, res) => {
  const data = [
    {
      id: '1232-1231',
      ownerId: '1234-5678-9101',
      model: 'Volvo',
      type: 'SX50',
      engine: '2.0',
      complectation: 'basic'
    },
    {
      id: '1232-1232',
      ownerId: '1234-5678-9101',
      model: 'BMW',
      type: 'X5',
      engine: '3.0',
      complectation: 'premium'
    },
    {
      id: '1232-1233',
      ownerId: '1234-5678-9101',
      model: 'Audi',
      type: 'A6',
      engine: '2.5',
      complectation: 'luxury'
    },
    {
      id: '1232-1234',
      ownerId: '1234-5678-9101',
      model: 'Toyota',
      type: 'Camry',
      engine: '2.5',
      complectation: 'standard'
    }
  ];
  return res.json({ message: 'User data accessed', data });
})

app.listen(port, () => {
  console.log(`Gateway running at http://localhost:${port}`);
});

