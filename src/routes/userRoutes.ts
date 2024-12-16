import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import upload from '../utils/fileUpload';

const router = Router();
const userController = new UserController();

// Auth routes
router.post('/register', upload.single('profileImage'), userController.register);
router.post('/login', userController.login);

// Profile image routes
router.post('/:userId/profile-image', upload.single('profileImage'), userController.updateProfileImage);
router.get('/:userId/profile-image', userController.getProfileImage);

export default router; 