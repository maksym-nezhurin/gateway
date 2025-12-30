import { CorsOptions } from 'cors';

export const corsOptions: CorsOptions = {
  origin: [
    'http://localhost:5173',                 // Frontend (Next.js)
    'http://localhost:3005',                 // React admin
    'https://admin-liard-pi-71.vercel.app'  // Production admin
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
  credentials: true, // Allow cookies / authorization headers
  optionsSuccessStatus: 200, // For legacy browsers
};