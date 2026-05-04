import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { uploadImage } from '../middleware/upload.middleware.js'
import bookController from '../controllers/book.controller.js'

const router = Router()

router.use(authMiddleware)

// Довідники — мають бути до маршруту /:id
router.get('/authors', bookController.getAuthors)
router.get('/genres', bookController.getGenres)
router.get('/statuses', bookController.getStatuses)

// Книги користувача
router.get('/', bookController.getAllBooks)
router.post('/', uploadImage.single('cover'), bookController.createBook)
router.get('/:id', bookController.getBookById)
router.put('/:id', bookController.updateBook)
router.delete('/:id', bookController.deleteBook)
router.post('/:id/cover', uploadImage.single('cover'), bookController.uploadCover)
router.put('/rating/:id', bookController.updateRating)

// Позичання та повернення
router.post('/:id/borrow', bookController.borrowBook)
router.post('/:id/return', bookController.returnBook)

// Обране
router.put('/:id/favorite', bookController.toggleFavorite)

// Замітки
router.get('/:id/notes', bookController.getNotes)
router.post('/:id/notes', bookController.addNote)

export default router
