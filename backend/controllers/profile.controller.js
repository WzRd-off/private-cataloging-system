import { db } from '../database/database.js'
import bcrypt from 'bcrypt'
import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Шрифт з підтримкою кирилиці. Стандартні шрифти PDFKit (Helvetica/Times) не
// підтримують Unicode, тому для коректного експорту PDF потрібен TTF-файл.
// Покладіть DejaVuSans.ttf у backend/assets/fonts/.
const CYRILLIC_FONT_PATH = path.join(__dirname, '..', 'assets', 'fonts', 'DejaVuSans.ttf')

function applyPdfFont(doc) {
    if (fs.existsSync(CYRILLIC_FONT_PATH)) {
        doc.font(CYRILLIC_FONT_PATH)
    }
}

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
            const { period } = req.query

            let dateFilter = ''
            const params = [userId]

            if (period === 'month') {
                dateFilter = ` AND ub.created_at >= CURRENT_DATE - INTERVAL '30 days'`
            } else if (period === 'year') {
                dateFilter = ` AND ub.created_at >= CURRENT_DATE - INTERVAL '365 days'`
            }

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
                 WHERE ub.user_id = $1${dateFilter}`,
                params
            )

            const { rows: noteRows } = await db.query(
                `SELECT COUNT(n.id) AS total_notes
                 FROM notes n
                 JOIN user_books ub ON n.user_book_id = ub.id
                 WHERE ub.user_id = $1${dateFilter}`,
                params
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

    async exportStats(req, res) {
        try {
            const userId = req.user.id
            const { format, period } = req.query

            let dateFilter = ''
            const params = [userId]

            if (period === 'month') {
                dateFilter = ` AND ub.created_at >= CURRENT_DATE - INTERVAL '30 days'`
            } else if (period === 'year') {
                dateFilter = ` AND ub.created_at >= CURRENT_DATE - INTERVAL '365 days'`
            }

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
                 WHERE ub.user_id = $1${dateFilter}`,
                params
            )

            const { rows: noteRows } = await db.query(
                `SELECT COUNT(n.id) AS total_notes
                 FROM notes n
                 JOIN user_books ub ON n.user_book_id = ub.id
                 WHERE ub.user_id = $1${dateFilter}`,
                params
            )

            const periodLabels = { month: 'За 30 днів', year: 'За рік' }
            const periodLabel = periodLabels[period] || 'За весь час'

            const r = rows[0]
            const stats = {
                'Період': periodLabel,
                'Всього книг': parseInt(r.total_books, 10),
                'Прочитано': parseInt(r.read_books, 10),
                'Читаю': parseInt(r.reading_books, 10),
                'У списку': parseInt(r.unread_books, 10),
                'Позичено': parseInt(r.borrowed_books, 10),
                'Улюблені': parseInt(r.favorite_books, 10),
                'Замітки': parseInt(noteRows[0].total_notes, 10)
            }

            if (format === 'csv') {
                const headers = Object.keys(stats)
                const csvHeaders = headers.join(',')
                const csvValues = headers.map(h => `"${stats[h]}"`).join(',')
                const csv = `${csvHeaders}\n${csvValues}`
                res.setHeader('Content-Type', 'text/csv; charset=utf-8')
                res.setHeader('Content-Disposition', `attachment; filename="stats_${period || 'all'}_${Date.now()}.csv"`)
                res.send(Buffer.from('﻿' + csv, 'utf8'))
            } else if (format === 'pdf') {
                const doc = new PDFDocument()
                res.setHeader('Content-Type', 'application/pdf')
                res.setHeader('Content-Disposition', `attachment; filename="stats_${period || 'all'}_${Date.now()}.pdf"`)
                doc.pipe(res)
                applyPdfFont(doc)

                doc.fontSize(16).text('Статистика читання', { align: 'center' })
                doc.moveDown()
                doc.fontSize(12).text(`Період: ${periodLabel}`)
                doc.moveDown()

                Object.entries(stats).forEach(([key, value]) => {
                    doc.fontSize(11).text(`${key}: ${value}`)
                })

                doc.end()
            } else {
                res.status(400).json({ message: 'Невідомий формат експорту' })
            }
        } catch (error) {
            console.error('Помилка експорту статистики:', error)
            res.status(500).json({ message: 'Внутрішня помилка сервера' })
        }
    }

    async exportBooks(req, res) {
        try {
            const userId = req.user.id
            const { format } = req.query

            const { rows } = await db.query(
                `SELECT
                    ub.title, a.name as author, g.name as genre, bs.name as status,
                    ub.publication_year, ub.rating, ub.is_favorite, c.name as lent_to
                 FROM user_books ub
                 LEFT JOIN authors a ON ub.author_id = a.id
                 LEFT JOIN genres g ON ub.genre_id = g.id
                 LEFT JOIN book_statuses bs ON ub.status_id = bs.id
                 LEFT JOIN contacts c ON ub.lent_to_contact_id = c.id
                 WHERE ub.user_id = $1
                 ORDER BY ub.title`,
                [userId]
            )

            const data = rows.map(row => ({
                'Назва': row.title,
                'Автор': row.author || '-',
                'Жанр': row.genre || '-',
                'Статус': row.status || '-',
                'Рік': row.publication_year || '-',
                'Рейтинг': row.rating || '-',
                'Улюблена': row.is_favorite ? 'Так' : 'Ні',
                'Позичена': row.lent_to || '-'
            }))

            if (format === 'csv') {
                const headers = data.length > 0 ? Object.keys(data[0]) : []
                const csvHeaders = headers.join(',')
                const csvRows = data.map(row =>
                    headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(',')
                ).join('\n')
                const csv = `${csvHeaders}\n${csvRows}`
                res.setHeader('Content-Type', 'text/csv; charset=utf-8')
                res.setHeader('Content-Disposition', `attachment; filename="books_${Date.now()}.csv"`)
                res.send(Buffer.from('﻿' + csv, 'utf8'))
            } else if (format === 'pdf') {
                const doc = new PDFDocument({ bufferPages: true })
                res.setHeader('Content-Type', 'application/pdf')
                res.setHeader('Content-Disposition', `attachment; filename="books_${Date.now()}.pdf"`)
                doc.pipe(res)
                applyPdfFont(doc)

                doc.fontSize(16).text('Каталог книг', { align: 'center' })
                doc.moveDown()

                const colWidth = 90
                const startY = doc.y
                const headers = Object.keys(data[0] || {})

                headers.forEach((header, i) => {
                    doc.fontSize(10).text(header, 50 + i * colWidth, startY, { width: colWidth - 5 })
                })

                doc.moveTo(50, startY + 15).lineTo(550, startY + 15).stroke()
                doc.moveDown()

                data.forEach(book => {
                    const currentY = doc.y
                    const lineHeight = 20
                    if (currentY + lineHeight > doc.page.height - 50) {
                        doc.addPage()
                    }
                    headers.forEach((header, i) => {
                        doc.fontSize(9).text(String(book[header] || ''), 50 + i * colWidth, doc.y, { width: colWidth - 5 })
                    })
                    doc.moveDown()
                })

                doc.end()
            } else {
                res.status(400).json({ message: 'Невідомий формат експорту' })
            }
        } catch (error) {
            console.error('Помилка експорту книг:', error)
            res.status(500).json({ message: 'Внутрішня помилка сервера' })
        }
    }
}

export default new ProfileController()
