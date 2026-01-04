# ---------- Builder ----------
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Увімкнути corepack (pnpm)
RUN corepack enable && corepack prepare pnpm@latest --activate

# 2. Копіюємо тільки manifests
COPY package.json pnpm-lock.yaml ./

# 3. Встановлюємо залежності (dev потрібні)
RUN pnpm install --frozen-lockfile

# 4. Копіюємо код
COPY . .

# 5. Білд (Nest / Express)
RUN pnpm run build


# ---------- Runtime ----------
FROM node:20-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/src/main.js"]
