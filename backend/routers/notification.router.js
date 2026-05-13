import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import notificationController from '../controllers/notification.controller.js'

const router = Router()
router.use(authMiddleware)

router.get('/', notificationController.list)
router.patch('/mark-all-read', notificationController.markAllRead)
router.patch('/:id/read', notificationController.markRead)

export default router
