import { db } from '../database/database.js'

class NotificationController {
    async list(req, res) {
        try {
            const userId = req.user.id
            const { rows } = await db.query(
                `SELECT id, title, message, is_read, created_at
                 FROM notifications
                 WHERE user_id = $1
                 ORDER BY created_at DESC
                 LIMIT 100`,
                [userId]
            )
            res.json({ items: rows })
        } catch (error) {
            console.error('Помилка списку сповіщень:', error)
            res.status(500).json({ message: 'Внутрішня помилка сервера' })
        }
    }

    async markRead(req, res) {
        try {
            const userId = req.user.id
            const id = parseInt(req.params.id, 10)
            if (Number.isNaN(id)) {
                return res.status(400).json({ message: 'Некоректний id' })
            }
            const { rows } = await db.query(
                `UPDATE notifications SET is_read = TRUE
                 WHERE id = $1 AND user_id = $2
                 RETURNING id, is_read`,
                [id, userId]
            )
            if (rows.length === 0) {
                return res.status(404).json({ message: 'Сповіщення не знайдено' })
            }
            res.json(rows[0])
        } catch (error) {
            console.error('Помилка позначення сповіщення:', error)
            res.status(500).json({ message: 'Внутрішня помилка сервера' })
        }
    }

    async markAllRead(req, res) {
        try {
            const userId = req.user.id
            await db.query(
                `UPDATE notifications SET is_read = TRUE
                 WHERE user_id = $1 AND is_read = FALSE`,
                [userId]
            )
            res.json({ ok: true })
        } catch (error) {
            console.error('Помилка позначення всіх сповіщень:', error)
            res.status(500).json({ message: 'Внутрішня помилка сервера' })
        }
    }
}

export default new NotificationController()
