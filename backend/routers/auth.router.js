import { Router } from 'express'
import authController from '../controllers/auth.controller.js'
const router = Router()

// Реєстрація
router.post('/register', authController.registerUser)
// Авторизація
router.post('/login', authController.loginUser)
// Вихід з аккаунту
router.post('/logout', authController.logoutUser)

export default router