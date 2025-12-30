import dotenv from 'dotenv';
dotenv.config(); // Load .env variables

import app from './app';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Gateway running at http://localhost:${PORT}`);
  console.log('AUTH_SERVICE_URL:', process.env.AUTH_SERVICE_URL);
  console.log('CAR_SERVICE_URL:', process.env.CAR_SERVICE_URL);
}).on('error', (err) => {
  console.error('Failed to start API Gateway:', err);
  process.exit(1);
});
