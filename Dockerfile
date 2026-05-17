# ---------- Builder ----------
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Render sets NODE_ENV=production globally; devDeps are required for `tsc`
ENV NODE_ENV=development
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

# ---------- Runtime ----------
FROM node:22-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/server.js"]
