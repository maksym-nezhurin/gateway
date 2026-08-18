import { Router } from 'express';
import { ROUTES } from '../constants/routes';
import { authProxy } from '../services/auth.proxy';
import { carProxy } from '../services/car.proxy';
import { garageProxy } from '../services/garage.proxy';
import { garageAuthMiddleware } from '../middleware/garage-auth.middleware';
import { carsAuthMiddleware } from '../middleware/cars-auth.middleware';
import { communityProxy } from '../services/community.proxy';
import { companiesProxy, draftCompaniesProxy, partnersProxy } from '../services/b2b.proxy';
import { adminProxy } from '../services/admin.proxy';
import { adminOverviewHandler } from '../services/admin-overview';

const router = Router();

router.use(ROUTES.AUTH, authProxy);
router.use(ROUTES.COMMUNITY, communityProxy);
router.use(ROUTES.COMPANIES, companiesProxy);
router.use(ROUTES.DRAFT_COMPANIES, draftCompaniesProxy);
router.use(ROUTES.PARTNERS, partnersProxy);
router.get(`${ROUTES.ADMIN}/overview`, adminOverviewHandler);
router.use(ROUTES.ADMIN, adminProxy);
router.use(ROUTES.CARS, carsAuthMiddleware, carProxy);
router.use(ROUTES.GARAGE, garageAuthMiddleware, garageProxy);

router.get('/', (_req, res) => {
  res.json({ status: 'Gateway is ready! Happy coding...' });
});

export default router;
