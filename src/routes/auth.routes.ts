import { Router } from 'express';
import { ROUTES } from '../constants/routes';
import { authProxy } from '../services/auth.proxy';

const router = Router();
router.use(ROUTES.AUTH, authProxy);
export default router;