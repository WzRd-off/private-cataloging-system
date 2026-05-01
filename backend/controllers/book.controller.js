import { db } from '../database/database.js'

async function resolveStatusId({ status_id, status }) {
    if (status_id !== undefined && status_id !== null && status_id !== '') {
        return Number(status_id)
    }
    if (status) {
        const { rows } = await db.query(
            'SELECT id FROM book_statuses WHERE name = $1',
            [status]
        )
        return rows[0]?.id ?? null
    }
    return null
}

class BookController {
    async getAllBooks(req, res) {
        try {
            const userId = req.user.id
            const { author, genre, status } = req.query

            let stmt = `
                SELECT
                    ub.id as user_book_id, ub.title, ub.isbn, ub.cover_url,
                    a.name as author, g.name as genre, bs.name as status,
                    ub.rating, ub.is_favorite
                FROM user_books ub
                LEFT JOIN authors a ON ub.author_id = a.id
                LEFT JOIN genres g ON ub.genre_id = g.id
                LEFT JOIN book_statuses bs ON ub.status_id = bs.id
                WHERE ub.user_id = $1
            `
            const values = [userId]
            let counter = 2

            if (author) {
                stmt += ` AND a.name ILIKE $${counter}`
                values.push(`%${author}%`)
                counter++
            }
            if (genre) {
                stmt += ` AND g.name ILIKE $${counter}`
                values.push(`%${genre}%`)
                counter++
            }
            if (status) {
                stmt += ` AND bs.name ILIKE $${counter}`
                values.push(`%${status}%`)
            }

            const { rows } = await db.query(stmt, values)
            res.json(rows)
        } catch (error) {
            console.error('Помилка отримання книг:', error)
            res.status(500).json({ message: 'Внутрішня помилка сервера' })
        }
    }

    async getBookById(req, res) {
        try {
            const userId = req.user.id
            const userBookId = req.params.id

            const stmt = `
                SELECT
                    ub.id as user_book_id, ub.title, ub.isbn, ub.description, ub.cover_url,
                    a.name as author, g.name as genre, bs.name as status,
                    ub.rating, ub.is_favorite, c.name as lent_to_name
                FROM user_books ub
                LEFT JOIN authors a ON ub.author_id = a.id
                LEFT JOIN genres g ON ub.genre_id = g.id
                LEFT JOIN book_statuses bs ON ub.status_id = bs.id
                LEFT JOIN contacts c ON ub.lent_to_contact_id = c.id
                WHERE ub.id = $1 AND ub.user_id = $2
            `
            const { rows } = await db.query(stmt, [userBookId, userId])

            if (rows.length === 0) {
                return res.status(404).json({ message: 'Книгу не знайдено' })
            }

            res.json(rows[0])
        } catch (error) {
            console.error('Помилка отримання книги:', error)
            res.status(500).json({ message: 'Внутрішня помилка сервера' })
        }
    }

    async createBook(req, res) {
        try {
            const userId = req.user.id
            const {
                title, isbn, description,
                author_id, genre_id, status_id, status,
                rating, is_favorite
            } = req.body

            if (!title) {
                return res.status(400).json({ message: 'Назва книги обов\'язкова' })
            }

            const resolvedStatusId = await resolveStatusId({ status_id, status })
            const coverUrl = req.file
                ? `/images/${req.file.filename}`
                : (req.body.cover_url || null)

            const toInt = (v) => (v === undefined || v === null || v === '' ? null : parseInt(v, 10))
            const toBool = (v) => v === true || v === 'true' || v === '1' || v === 1

            const { rows } = await db.query(
                `INSERT INTO user_books
                 (user_id, title, isbn, description, cover_url, author_id, genre_id, status_id, rating, is_favorite)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 RETURNING id`,
                [
                    userId, title, isbn || null, description || null, coverUrl,
                    toInt(author_id), toInt(genre_id), resolvedStatusId,
                    toInt(rating), toBool(is_favorite)
                ]
            )

            res.status(201).json({ message: 'Книга успішно додана', user_book_id: rows[0].id, cover_url: coverUrl })
        } catch (error) {
            console.error('Помилка створення книги:', error)
            res.status(500).json({ message: 'Внутрішня помилка сервера' })
        }
    }

    async uploadCover(req, res) {
        try {
            const userId = req.user.id
            const userBookId = req.params.id

            if (!req.file) {
                return res.status(400).json({ message: 'Файл не надіслано' })
            }

            const coverUrl = `/images/${req.file.filename}`

            const { rows } = await db.query(
                `UPDATE user_books SET cover_url = $1
                 WHERE id = $2 AND user_id = $3
                 RETURNING cover_url`,
                [coverUrl, userBookId, userId]
            )

            if (rows.length === 0) {
                return res.status(404).json({ message: 'Книгу не знайдено' })
            }

            res.json({ message: 'Обкладинку оновлено', cover_url: rows[0].cover_url })
        } catch (error) {
            console.error('Помилка завантаження обкладинки:', error)
            res.status(500).json({ message: 'Внутрішня помилка сервера' })
        }
    }

    async updateBook(req, res) {
        try {
            const userId = req.user.id
            const userBookId = req.params.id
            const { status_id, status, rating } = req.body

            const resolvedStatusId =
                status_id !== undefined || status !== undefined
                    ? await resolveStatusId({ status_id, status })
                    : null

            const { rows } = await db.query(
                `UPDATE user_books
                 SET status_id = COALESCE($1, status_id),
                     rating = COALESCE($2, rating)
                 WHERE id = $3 AND user_id = $4
                 RETURNING id`,
                [resolvedStatusId, rating ?? null, userBookId, userId]
            )

            if (rows.length === 0) {
                return res.status(404).json({ message: 'Книгу не знайдено або немає прав для редагування' })
            }

            res.json({ message: 'Дані примірника оновлено' })
        } catch (error) {
            console.error('Помилка оновлення книги:', error)
            res.status(500).json({ message: 'Внутрішня помилка сервера' })
        }
    }

    async deleteBook(req, res) {
        try {
            const userId = req.user.id
            const userBookId = req.params.id

            const { rows } = await db.query(
                'DELETE FROM user_books WHERE id = $1 AND user_id = $2 RETURNING id',
                [userBookId, userId]
            )

            if (rows.length === 0) {
                return res.status(404).json({ message: 'Книгу не знайдено' })
            }

            res.json({ message: 'Книгу видалено' })
        } catch (error) {
            console.error('Помилка видалення книги:', error)
            res.status(500).json({ message: 'Внутрішня помилка сервера' })
        }
    }

    async borrowBook(req, res) {
        const client = await db.connect()
        try {
            const userId = req.user.id
            const userBookId = req.params.id
            const { name, email, phone } = req.body

            if (!name) {
                return res.status(400).json({ message: 'Ім\'я контакту обов\'язкове' })
            }

            await client.query('BEGIN')

            const { rows: bookRows } = await client.query(
                'SELECT status_id FROM user_books WHERE id = $1 AND user_id = $2',
                [userBookId, userId]
            )
            if (bookRows.length === 0) {
                await client.query('ROLLBACK')
                return res.status(404).json({ message: 'Книгу не знайдено' })
            }
            const currentStatusId = bookRows[0].status_id

            const { rows: statusRows } = await client.query(
                'SELECT id FROM book_statuses WHERE name = $1',
                ['В займах']
            )
            if (statusRows.length === 0) {
                await client.query('ROLLBACK')
                return res.status(500).json({ message: 'Статус "В займах" не сконфігуровано' })
            }
            const borrowedStatusId = statusRows[0].id

            if (currentStatusId === borrowedStatusId) {
                await client.query('ROLLBACK')
                return res.status(400).json({ message: 'Книга вже позичена' })
            }

            const { rows: contactRows } = await client.query(
                'INSERT INTO contacts (user_id, name, email, phone) VALUES ($1, $2, $3, $4) RETURNING id',
                [userId, name, email || null, phone || null]
            )
            const contactId = contactRows[0].id

            await client.query(
                `UPDATE user_books
                 SET lent_to_contact_id = $1, previous_status_id = $2, status_id = $3
                 WHERE id = $4 AND user_id = $5`,
                [contactId, currentStatusId, borrowedStatusId, userBookId, userId]
            )

            await client.query('COMMIT')
            res.json({ message: 'Книгу успішно передано позичальнику', status: 'В займах', lent_to_name: name })
        } catch (error) {
            await client.query('ROLLBACK')
            console.error('Помилка позичання книги:', error)
            res.status(500).json({ message: 'Внутрішня помилка сервера' })
        } finally {
            client.release()
        }
    }

    async returnBook(req, res) {
        const client = await db.connect()
        try {
            const userId = req.user.id
            const userBookId = req.params.id

            await client.query('BEGIN')

            const { rows: bookRows } = await client.query(
                'SELECT lent_to_contact_id, previous_status_id FROM user_books WHERE id = $1 AND user_id = $2',
                [userBookId, userId]
            )
            if (bookRows.length === 0) {
                await client.query('ROLLBACK')
                return res.status(404).json({ message: 'Книгу не знайдено' })
            }

            const { lent_to_contact_id, previous_status_id } = bookRows[0]
            if (!lent_to_contact_id) {
                await client.query('ROLLBACK')
                return res.status(400).json({ message: 'Ця книга зараз не позичена' })
            }

            const newStatusId = previous_status_id || 1

            await client.query(
                `UPDATE user_books
                 SET status_id = $1, previous_status_id = NULL, lent_to_contact_id = NULL
                 WHERE id = $2 AND user_id = $3`,
                [newStatusId, userBookId, userId]
            )

            await client.query('DELETE FROM contacts WHERE id = $1', [lent_to_contact_id])

            const { rows: nameRows } = await client.query(
                'SELECT name FROM book_statuses WHERE id = $1',
                [newStatusId]
            )

            await client.query('COMMIT')
            res.json({
                message: 'Книгу успішно повернуто, контакт видалено',
                status: nameRows[0]?.name ?? 'Не читав'
            })
        } catch (error) {
            await client.query('ROLLBACK')
            console.error('Помилка повернення книги:', error)
            res.status(500).json({ message: 'Внутрішня помилка сервера' })
        } finally {
            client.release()
        }
    }

    async getAuthors(req, res) {
        try {
            const { rows } = await db.query('SELECT id, name FROM authors ORDER BY name')
            res.json(rows)
        } catch (error) {
            console.error('Помилка отримання авторів:', error)
            res.status(500).json({ message: 'Внутрішня помилка сервера' })
        }
    }

    async getGenres(req, res) {
        try {
            const { rows } = await db.query('SELECT id, name FROM genres ORDER BY name')
            res.json(rows)
        } catch (error) {
            console.error('Помилка отримання жанрів:', error)
            res.status(500).json({ message: 'Внутрішня помилка сервера' })
        }
    }

    async getStatuses(req, res) {
        try {
            const { rows } = await db.query('SELECT id, name FROM book_statuses ORDER BY id')
            res.json(rows)
        } catch (error) {
            console.error('Помилка отримання статусів:', error)
            res.status(500).json({ message: 'Внутрішня помилка сервера' })
        }
    }

    async toggleFavorite(req, res) {
        try {
            const userId = req.user.id
            const userBookId = req.params.id
            const { is_favorite } = req.body

            const { rows } = await db.query(
                `UPDATE user_books
                 SET is_favorite = $1
                 WHERE id = $2 AND user_id = $3
                 RETURNING id, is_favorite`,
                [is_favorite, userBookId, userId]
            )

            if (rows.length === 0) {
                return res.status(404).json({ message: 'Книгу не знайдено' })
            }

            res.json({ message: 'Статус обраного оновлено', is_favorite: rows[0].is_favorite })
        } catch (error) {
            console.error('Помилка оновлення статусу:', error)
            res.status(500).json({ message: 'Внутрішня помилка сервера' })
        }
    }

    async getNotes(req, res) {
        try {
            const userId = req.user.id
            const userBookId = req.params.id

            const { rows: bookRows } = await db.query(
                'SELECT id FROM user_books WHERE id = $1 AND user_id = $2',
                [userBookId, userId]
            )
            if (bookRows.length === 0) {
                return res.status(404).json({ message: 'Книгу не знайдено' })
            }

            const { rows } = await db.query(
                `SELECT id, content as text, created_at
                 FROM notes
                 WHERE user_book_id = $1
                 ORDER BY created_at DESC`,
                [userBookId]
            )
            res.json(rows)
        } catch (error) {
            console.error('Помилка отримання заміток:', error)
            res.status(500).json({ message: 'Внутрішня помилка сервера' })
        }
    }

    async addNote(req, res) {
        try {
            const userId = req.user.id
            const userBookId = req.params.id
            const { text } = req.body

            if (!text || !text.trim()) {
                return res.status(400).json({ message: 'Текст замітки обов\'язковий' })
            }

            const { rows: bookRows } = await db.query(
                'SELECT id FROM user_books WHERE id = $1 AND user_id = $2',
                [userBookId, userId]
            )
            if (bookRows.length === 0) {
                return res.status(404).json({ message: 'Книгу не знайдено' })
            }

            const { rows } = await db.query(
                `INSERT INTO notes (user_book_id, content)
                 VALUES ($1, $2)
                 RETURNING id, content as text, created_at`,
                [userBookId, text.trim()]
            )
            res.status(201).json(rows[0])
        } catch (error) {
            console.error('Помилка додавання замітки:', error)
            res.status(500).json({ message: 'Внутрішня помилка сервера' })
        }
    }
}

export default new BookController()
