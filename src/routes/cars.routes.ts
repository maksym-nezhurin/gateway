import { Router } from 'express';
import { jwtMiddleware } from '../middleware/jwt.middleware';
import { ROUTES } from '../constants/routes';
import { carProxy } from '../services/car.proxy';
import { garageProxy } from '../services/garage.proxy';

const router = Router();
router.use(ROUTES.CARS, carProxy);
router.use(ROUTES.GARAGE, garageProxy);
// router.use(ROUTES.CARS, jwtMiddleware, carProxy);
// router.use(ROUTES.GARAGE, jwtMiddleware, garageProxy);
export default router;