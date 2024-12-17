import { Router } from 'express';
import { TemplateController } from '../controllers/TemplateController';
import upload from '../utils/fileUpload';

const router = Router();
const templateController = new TemplateController();

// Tüm template'leri listele
router.get('/', templateController.getAllTemplates);

// Template isimleri ve ID'lerini listele
router.get('/names', templateController.getTemplateNames);

// ID'ye göre tek bir template getir
router.get('/:id', templateController.getTemplateById);

// Yeni template oluştur
router.post('/', upload.single('attachment'), templateController.createTemplate);

// Template güncelle
router.put('/:id', upload.single('attachment'), templateController.updateTemplate);

// Template sil
router.delete('/:id', templateController.deleteTemplate);

export default router; 