import { Router } from 'express';
import { exportAll } from '../controllers/exportController.js';

const router = Router();
router.get('/', exportAll);
export default router;
