import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import bookController from '../controllers/book.controller.js'

const router = Router()

router.use(authMiddleware);

// Отримати всі книги користувача (з підтримкою фільтрів у query параметрах)
router.get('/', bookController.getAllBooks)

// Отримати конкретну книгу по id з бібліотеки користувача
router.get('/:id', bookController.getBookById) 

// Додати книгу в свою бібліотеку
router.post('/', bookController.createBook) 

// Редагувати дані примірника (рейтинг, статус)
router.put('/:id', bookController.updateBook) 

// Маркерувати книгу як позичену (створює контакт)
router.post('/:id/borrow', bookController.borrowBook)

// Повернути книгу (видаляє контакт і повертає старий статус)
router.post('/:id/return', bookController.returnBook)

// Додати або видалити з обраного
router.put('/:id/favorite', bookController.toggleFavorite)

export default router