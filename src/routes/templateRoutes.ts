import { Router } from 'express';
import { TemplateController } from '../controllers/TemplateController';
import upload from '../utils/fileUpload';

const router = Router();
const templateController = new TemplateController();

router.get('/search/templates', templateController.searchTemplates);
router.get('/stats/overview', templateController.getTemplateStats);
router.get('/names', templateController.getTemplateNames);
router.post('/', upload.single('attachment'), templateController.createTemplate);
router.put('/:id', upload.single('attachment'), templateController.updateTemplate);
router.get('/:id', templateController.getTemplateById);
router.get('/:id/download', templateController.downloadAttachment);

export default router; 