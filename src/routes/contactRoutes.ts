import { Router } from 'express';
import { ContactController } from '../controllers/ContactController';

const router = Router();
const contactController = new ContactController();

router.get('/', contactController.getContacts);
router.get('/:id', contactController.getContact);
router.post('/upsert', contactController.upsertContact);
router.post('/upload', contactController.uploadContacts);
router.get('/export/all', contactController.exportContacts);
router.delete('/:id', contactController.deleteContact);

export default router; 