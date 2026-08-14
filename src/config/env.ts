export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  /** Nest authz (user-service) — proxied as /v1/auth */
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3003',
  /** Optional Express/Keycloak auth (Fly) — monitored only, not proxied */
  expressAuthServiceUrl: process.env.EXPRESS_AUTH_SERVICE_URL || '',
  carServiceUrl: process.env.CAR_SERVICE_URL || 'http://localhost:3002',
  /** Must match user-service JWT_ACCESS_SECRET (access token signing). */
  jwtSecret:
    process.env.JWT_SECRET ||
    process.env.JWT_ACCESS_SECRET ||
    'default-secret-key',
  /**
   * Attached to every proxied car-service request so car-service's admin routes can
   * require it in addition to the role header — defense in depth in case car-service's
   * own URL is ever reachable directly, bypassing this gateway's auth entirely. Must
   * match car-service's GATEWAY_INTERNAL_SECRET. Empty in dev = header omitted.
   */
  internalGatewaySecret: process.env.GATEWAY_INTERNAL_SECRET || '',
};