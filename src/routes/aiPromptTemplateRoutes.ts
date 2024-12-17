import { Router } from 'express';
import { AIPromptTemplateController } from '../controllers/AIPromptTemplateController';
import upload from '../utils/fileUpload';

const router = Router();
const aiPromptTemplateController = new AIPromptTemplateController();

// Tüm template'leri listele
router.get('/', aiPromptTemplateController.getAllTemplates);

// ID'ye göre tek bir template getir
router.get('/:id', aiPromptTemplateController.getTemplateById);

// Yeni template oluştur
router.post('/', upload.single('attachment'), aiPromptTemplateController.createTemplate);

// Template güncelle
router.put('/:id', upload.single('attachment'), aiPromptTemplateController.updateTemplate);

// Template sil
router.delete('/:id', aiPromptTemplateController.deleteTemplate);

export default router; 