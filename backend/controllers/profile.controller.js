import { db } from '../database/database.js'
import bcrypt from 'bcrypt'

class ProfileController {
    async getProfile(req, res) {
        try {
            const userId = req.user.id

            const { rows } = await db.query(
                `SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at,
                        r.name as role
                 FROM users u
                 LEFT JOIN roles r ON u.role_id = r.id
                 WHERE u.id = $1`,
                [userId]
            )

            if (rows.length === 0) {
                return res.status(404).json({ message: 'Користувача не знайдено' })
            }

            res.json(rows[0])
        } catch (error) {
            console.error('Помилка отримання профілю:', error)
            res.status(500).json({ message: 'Внутрішня помилка сервера' })
        }
    }

    async updateProfile(req, res) {
        try {
            const userId = req.user.id
            const { name, email, phone } = req.body

            console.log('Отримані дані для оновлення профілю:', { name, email, phone });

            const { rows: conflict } = await db.query(
                'SELECT id FROM users WHERE (email = $1 OR phone = $2) AND id != $3',
                [email, phone, userId]
            )
            if (conflict.length > 0) {
                return res.status(400).json({ message: 'Email або номер телефону вже використовується іншим користувачем' })
            }

            const { rows } = await db.query(
                `UPDATE users SET name = $1, email = $2, phone = $3
                 WHERE id = $4
                 RETURNING id, name, email, phone`,
                [name, email, phone, userId]
            )

            res.json({ message: 'Профіль успішно оновлено', user: rows[0] })
        } catch (error) {
            console.error('Помилка оновлення профілю:', error)
            res.status(500).json({ message: 'Внутрішня помилка сервера' })
        }
    }

    async changePassword(req, res) {
        try {
            const userId = req.user.id
            const { oldPassword, newPassword } = req.body

            const { rows } = await db.query(
                'SELECT password_hash FROM users WHERE id = $1',
                [userId]
            )
            if (rows.length === 0) {
                return res.status(404).json({ message: 'Користувача не знайдено' })
            }

            const isMatch = await bcrypt.compare(oldPassword, rows[0].password_hash)
            if (!isMatch) {
                return res.status(400).json({ message: 'Невірний старий пароль' })
            }

            const newHash = await bcrypt.hash(newPassword, 10)
            await db.query(
                'UPDATE users SET password_hash = $1 WHERE id = $2',
                [newHash, userId]
            )

            res.json({ message: 'Пароль успішно змінено' })
        } catch (error) {
            console.error('Помилка зміни пароля:', error)
            res.status(500).json({ message: 'Внутрішня помилка сервера' })
        }
    }

    async getProfileStats(req, res) {
        try {
            const userId = req.user.id

            const { rows } = await db.query(
                `SELECT
                    COUNT(ub.id) AS total_books,
                    COUNT(CASE WHEN bs.name = 'Прочитано' THEN 1 END) AS read_books,
                    COUNT(CASE WHEN bs.name = 'Читаю' THEN 1 END) AS reading_books,
                    COUNT(CASE WHEN bs.name = 'Не читав' THEN 1 END) AS unread_books,
                    COUNT(CASE WHEN ub.lent_to_contact_id IS NOT NULL THEN 1 END) AS borrowed_books,
                    COUNT(CASE WHEN ub.is_favorite = true THEN 1 END) AS favorite_books
                 FROM user_books ub
                 LEFT JOIN book_statuses bs ON ub.status_id = bs.id
                 WHERE ub.user_id = $1`,
                [userId]
            )

            const { rows: noteRows } = await db.query(
                `SELECT COUNT(n.id) AS total_notes
                 FROM notes n
                 JOIN user_books ub ON n.user_book_id = ub.id
                 WHERE ub.user_id = $1`,
                [userId]
            )

            const r = rows[0]
            res.json({
                totalBooks: parseInt(r.total_books, 10),
                readBooks: parseInt(r.read_books, 10),
                readingBooks: parseInt(r.reading_books, 10),
                unreadBooks: parseInt(r.unread_books, 10),
                borrowedBooks: parseInt(r.borrowed_books, 10),
                favoriteBooks: parseInt(r.favorite_books, 10),
                totalNotes: parseInt(noteRows[0].total_notes, 10)
            })
        } catch (error) {
            console.error('Помилка отримання статистики:', error)
            res.status(500).json({ message: 'Внутрішня помилка сервера' })
        }
    }
}

export default new ProfileController()
