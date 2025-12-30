export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  carServiceUrl: process.env.CAR_SERVICE_URL || 'http://localhost:3002',
  jwtSecret: process.env.JWT_SECRET || 'default-secret-key'
};