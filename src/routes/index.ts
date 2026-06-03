import { Router } from 'express';
import { ROUTES } from '../constants/routes';
import { authProxy } from '../services/auth.proxy';
import { carProxy } from '../services/car.proxy';
import { garageProxy } from '../services/garage.proxy';
import { garageAuthMiddleware } from '../middleware/garage-auth.middleware';
import { communityProxy } from '../services/community.proxy';

const router = Router();

router.use(ROUTES.AUTH, authProxy);
router.use(ROUTES.COMMUNITY, communityProxy);
router.use(ROUTES.CARS, carProxy);
router.use(ROUTES.GARAGE, garageAuthMiddleware, garageProxy);

router.get('/', (_req, res) => {
  res.json({ status: 'Gateway is ready! Happy coding...' });
});

export default router;
