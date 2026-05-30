import { CorsOptions } from 'cors';

const DEFAULT_ORIGINS = [
  'http://localhost:3000', // local backend dev
  'http://localhost:3005', // Next.js client
  'http://localhost:5173', // Vite admin (default)
  'https://autivo.pl',
  'https://www.autivo.pl',
  'https://admin-reelo.vercel.app',
  'https://autivo-market.vercel.app',
];

function parseExtraOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw) return [];
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const corsOptions: CorsOptions = {
  origin: [...new Set([...DEFAULT_ORIGINS, ...parseExtraOrigins()])],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
  credentials: true,
  optionsSuccessStatus: 200,
};
