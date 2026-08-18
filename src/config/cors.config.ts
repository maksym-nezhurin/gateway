import { CorsOptions } from 'cors';

const DEFAULT_ORIGINS = [
  'http://localhost:3000', // local backend dev
  'http://localhost:3005', // Next.js client
  'http://localhost:5173', // Vite admin (default)
  'https://autivo.com.pl',
  'https://www.autivo.com.pl',
  'https://admin-reelo.vercel.app',
  'https://autivo-market.vercel.app',
];

/** Vercel preview: client-<hash>-maksym-nezhurins-projects.vercel.app */
const DEFAULT_VERCEL_PROJECT_PREFIX = 'client';
const DEFAULT_VERCEL_PREVIEW_SUFFIX = 'maksym-nezhurins-projects.vercel.app';

function parseExtraOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw) return [];
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isAllowedVercelPreviewHostname(hostname: string): boolean {
  const prefix =
    process.env.CORS_VERCEL_PROJECT_PREFIX?.trim() || DEFAULT_VERCEL_PROJECT_PREFIX;
  const suffix =
    process.env.CORS_VERCEL_PREVIEW_SUFFIX?.trim() || DEFAULT_VERCEL_PREVIEW_SUFFIX;
  const pattern = new RegExp(
    `^${escapeRegex(prefix)}[a-z0-9-]*-${escapeRegex(suffix)}$`,
    'i',
  );
  return pattern.test(hostname);
}

const STATIC_ORIGINS = new Set([...DEFAULT_ORIGINS, ...parseExtraOrigins()]);

function isOriginAllowed(origin: string): boolean {
  if (STATIC_ORIGINS.has(origin)) return true;
  try {
    const { hostname, protocol } = new URL(origin);
    return protocol === 'https:' && isAllowedVercelPreviewHostname(hostname);
  } catch {
    return false;
  }
}

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Same-origin or server-to-server (no Origin header)
    if (!origin) {
      callback(null, true);
      return;
    }
    if (isOriginAllowed(origin)) {
      callback(null, origin);
      return;
    }
    callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
};
