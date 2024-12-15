import { Router } from 'express';
import { AIPromptTemplateController } from '../controllers/AIPromptTemplateController';
import upload from '../utils/fileUpload';

const router = Router();
const aiPromptTemplateController = new AIPromptTemplateController();

// Temel işlemler
router.get('/', aiPromptTemplateController.listTemplates);
router.get('/names', aiPromptTemplateController.getTemplateNames);
router.post('/', aiPromptTemplateController.upsertTemplate);
router.post('/file', upload.single('file'), aiPromptTemplateController.upsertTemplateWithFile);
router.delete('/:id', aiPromptTemplateController.deleteTemplate);

export default router; 