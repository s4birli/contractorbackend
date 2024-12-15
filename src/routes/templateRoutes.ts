import { Router } from 'express';
import { TemplateController } from '../controllers/TemplateController';

const router = Router();
const templateController = new TemplateController();

router.post('/', templateController.createTemplate);
router.put('/:id', templateController.updateTemplate);
router.get('/names', templateController.getTemplateNames);
router.get('/:id', templateController.getTemplateById);

export default router; 