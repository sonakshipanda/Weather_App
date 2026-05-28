import { Router } from 'express';
import * as ctrl from '../controllers/weatherController.js';

const router = Router();

router.get('/lookup', ctrl.lookup);
router.post('/', ctrl.create);
router.get('/', ctrl.list);
router.get('/:id', ctrl.readOne);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

export default router;
