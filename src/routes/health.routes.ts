import { Router } from 'express';
import { createHealthResponse } from '../health/healthResponse';
import { buildAggregatedHealthResponse } from '../health/aggregatedHealth';

const router = Router();

/** Gateway liveness only */
router.get('/api/health', (_req, res) => {
  res.json(createHealthResponse());
});

/**
 * Gateway + server-side checks of configured backends (no browser CORS).
 * Admin System page should use this endpoint only.
 */
router.get('/api/health/services', async (_req, res) => {
  try {
    const payload = await buildAggregatedHealthResponse();
    res.json(payload);
  } catch (error) {
    console.error('[Gateway] Aggregated health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      message: 'Failed to run downstream health checks',
    });
  }
});

/** @deprecated Use GET /api/health */
router.get('/health', (_req, res) => {
  res.json(createHealthResponse());
});

export default router;
