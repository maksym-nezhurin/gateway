# API Gateway

Центральна точка входу для клієнтських запитів (admin, client). Express + TypeScript, проксування до auth і car/garage сервісів, CORS, стандартизований health check.

**Production:** https://gateway-17ki.onrender.com  
**Repository:** https://github.com/maksym-nezhurin/gateway

## Можливості

- Проксі до **authz / user-service** (`/v1/auth` → `/api/v1/auth` на Nest user-service)
- Проксі до **cars** (`/v1/cars` → car service `/api/cars`)
- Проксі до **garage** (`/v1/garage` → car service `/api/garage`)
- **CORS** для локальної розробки та Vercel admin/client
- Обгортка відповідей `{ data: ... }` (health endpoints — без обгортки)
- **Health:** `GET /api/health` (liveness), `GET /api/health/services` (gateway + downstream, server-side)
- **Admin System** — один запит на gateway, без CORS до user/auth/scrapper

## API

### Health

**Liveness (лише gateway):**

```http
GET /api/health
GET /health   # deprecated
```

**Aggregated (для admin / моніторингу):**

```http
GET /api/health/services
```

Gateway сам перевіряє backends (fetch з сервера, CORS не потрібен):

```json
{
  "status": "ok",
  "version": "1.0.1",
  "buildAt": "2026-05-16T12:55:28.701Z",
  "aggregateStatus": "ok",
  "services": [
    {
      "name": "user",
      "status": "ok",
      "url": "https://user-service-nest-1.onrender.com",
      "healthUrl": "https://user-service-nest-1.onrender.com/api/v1/health",
      "responseTimeMs": 120,
      "version": "0.0.1",
      "buildAt": "..."
    }
  ]
}
```

`aggregateStatus`: `ok` | `degraded` (частина down) | `unhealthy`.

`buildAt` — з `BUILD_AT` (CI/deploy) або час старту процесу.

### Проксі-маршрути

| Gateway | Backend |
|---------|---------|
| `GET/POST /v1/auth/*` | `{AUTH_SERVICE_URL}/api/v1/auth/*` |
| `GET/POST /v1/cars/*` | `{CAR_SERVICE_URL}/api/cars/*` |
| `GET/POST /v1/garage/*` | `{CAR_SERVICE_URL}/api/garage/*` |

### Інше

```http
GET /
```

Відповідь (через `wrapDataMiddleware`):

```json
{
  "data": {
    "status": "Gateway is ready! Happy coding..."
  }
}
```

## Змінні середовища

| Змінна | Опис | Default (local) |
|--------|------|-----------------|
| `PORT` | HTTP порт | `3000` |
| `NODE_ENV` | `development` / `production` | `development` |
| `AUTH_SERVICE_URL` | Nest authz (user-service), proxy + health `user` | `http://localhost:3003` |
| `EXPRESS_AUTH_SERVICE_URL` | Express/Keycloak auth (опційно), health `auth` | — |
| `CAR_SERVICE_URL` | Car/garage, health `car` (`GET /api`, 2xx) | `http://localhost:3002` |
| `JWT_SECRET` | Секрет для JWT middleware (зарезервовано) | — |
| `BUILD_AT` | ISO timestamp збірки для health | час старту |

Приклад `.env`:

```env
PORT=3000
AUTH_SERVICE_URL=http://localhost:3003
CAR_SERVICE_URL=http://localhost:3002
JWT_SECRET=your-secret
```

## Локальна розробка

```bash
pnpm install
pnpm dev
# http://localhost:3000
```

Збірка та запуск production-режиму:

```bash
pnpm build
node dist/server.js
```

## Docker

```bash
docker build -t api-gateway .
docker run -p 8080:8080 \
  -e PORT=8080 \
  -e AUTH_SERVICE_URL=http://host.docker.internal:3001 \
  -e CAR_SERVICE_URL=http://host.docker.internal:3002 \
  api-gateway
```

## Деплой

### Render (production)

Сервіс: **gateway-17ki** на Render, Docker, гілка `master` (або `new-master` у `render.yaml`).

Після push у GitHub Render збирає образ з `Dockerfile` і деплоїть автоматично.

У Dashboard перевір env (пріоритет над `render.yaml`):

- `AUTH_SERVICE_URL` → `https://user-service-nest-1.onrender.com`
- `CAR_SERVICE_URL` → `https://car-service-jiwj.onrender.com`
- `PORT` → `3000` (Render)

### Fly.io (опційно)

```bash
fly deploy --app reelo-api
```

Конфіг: `fly.toml` (`reelo-api`, порт `8080`, регіон `fra`).

## CORS

Дозволені origins (`src/config/cors.config.ts`):

- `http://localhost:3000` — client (Next.js)
- `http://localhost:5173` — admin (Vite)
- `https://autivo.pl`, `https://www.autivo.pl` — prod client
- `https://admin-reelo.vercel.app`, `https://reelo-market.vercel.app`

Додаткові origins через env **`CORS_ORIGINS`** (comma-separated), напр. preview Vercel.

Після змін — redeploy gateway на Render. Див. [`docs/F0_LAUNCH_RUNBOOK.md`](../../docs/F0_LAUNCH_RUNBOOK.md).

## Структура проєкту

```
src/
  app.ts                 # Express app, middleware order
  server.ts              # Entry point
  config/                # env, CORS
  constants/routes.ts    # /v1/auth, /v1/cars, /v1/garage
  health/                # createHealthResponse()
  routes/
    health.routes.ts     # /api/health, /health (before wrap)
    index.ts             # /v1/auth, /v1/cars, /v1/garage proxies
  services/              # http-proxy-middleware
  middleware/            # wrapData, error, jwt (optional)
```

## Admin / моніторинг

Admin System page — `GET {VITE_GATEWAY_URL}/api/health/services` для gateway/auth/user; scrapper окремо через `VITE_SCRAPPER_URL`.

```env
VITE_GATEWAY_URL=https://gateway-17ki.onrender.com
```

## Релізи

Використовується [semantic-release](https://github.com/semantic-release/semantic-release) (див. `RELEASES.md`, `CHANGELOG.md`).
