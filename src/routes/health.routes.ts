import { Router } from 'express';
import { createHealthResponse } from '../health/healthResponse';

const router = Router();

router.get('/api/health', (_req, res) => {
  res.json(createHealthResponse());
});

/** @deprecated Use GET /api/health */
router.get('/health', (_req, res) => {
  res.json(createHealthResponse());
});

export default router;
