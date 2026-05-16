import { Router } from 'express';
import authRoutes from './auth.routes';
import carRoutes from './cars.routes';

const router = Router();
router.use(authRoutes);
router.use(carRoutes);
router.get('/', (req, res) => {
    res.json({ status: 'Gateway is ready! Happy coding...' });
});

export default router;