# ---------- Builder ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json ./

# Install pnpm and dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# ---------- Runtime ----------
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install pnpm and production dependencies only
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --prod

# Copy built application
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/server.js"]
