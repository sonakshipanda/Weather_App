import { Router } from 'express';
import { parseNL, travelTip } from '../controllers/aiController.js';

const router = Router();
router.post('/parse', parseNL);
router.post('/tip', travelTip);
export default router;
