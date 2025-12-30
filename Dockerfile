# Stage 1: Build
FROM node:18 AS builder

WORKDIR /app

# Copy only package.json + lockfile
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Compile TypeScript to JS
RUN npm run build  # uses "build": "tsc"

# Stage 2: Production image
FROM node:18-alpine

WORKDIR /app

# Copy only compiled JS + node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Start the compiled JS
CMD ["node", "dist/server.js"]
