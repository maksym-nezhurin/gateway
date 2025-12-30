import { Router } from 'express';
import { jwtMiddleware } from '../middleware/jwt.middleware';
import { ROUTES } from '../constants/routes';
import { carProxy } from '../services/car.proxy';

const router = Router();
router.use(ROUTES.CARS, carProxy);
// router.use(ROUTES.CARS, jwtMiddleware, carProxy);
export default router;