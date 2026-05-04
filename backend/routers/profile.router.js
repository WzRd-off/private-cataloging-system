import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import profileController from '../controllers/profile.controller.js';

const router = Router();

router.use(authMiddleware);

// Отримати свої дані
router.get('/', profileController.getProfile);

// Оновити свої дані
router.put('/', profileController.updateProfile);

// Змінити пароль
router.put('/password', profileController.changePassword);

// Отримати статистику читача
router.get('/stats', profileController.getProfileStats);

// Експорт статистики
router.get('/export-stats', profileController.exportStats);

// Експорт книг
router.get('/export', profileController.exportBooks);

export default router;