import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import recomendationController from '../controllers/recomendation.controller.js'

const router = Router()

router.use(authMiddleware)
router.get('/', recomendationController.generateRecommendations)

export default router