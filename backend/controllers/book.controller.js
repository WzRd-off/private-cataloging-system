import { db } from '../database/database.js'

class BookController {
    // Отримати всі книги поточного користувача
    async getAllBooks(req, res) {
        try {
            const userId = req.user.id;
            const { author, genre, status } = req.query;

            let stmt = `
                SELECT 
                    ub.id as user_book_id, b.title, b.isbn, b.cover_url,
                    a.name as author, g.name as genre, bs.name as status, 
                    ub.rating, ub.is_favorite
                FROM user_books ub
                JOIN books b ON ub.book_id = b.id
                LEFT JOIN authors a ON b.author_id = a.id
                LEFT JOIN genres g ON b.genre_id = g.id
                LEFT JOIN book_statuses bs ON ub.status_id = bs.id
                WHERE ub.user_id = $1
            `;
            const values = [userId];
            let counter = 2;

            if (author) {
                stmt += ` AND a.name ILIKE $${counter}`;
                values.push(`%${author}%`);
                counter++;
            }
            if (genre) {
                stmt += ` AND g.name ILIKE $${counter}`;
                values.push(`%${genre}%`);
                counter++;
            }
            if (status) {
                stmt += ` AND bs.name ILIKE $${counter}`;
                values.push(`%${status}%`);
                counter++;
            }

            const { rows } = await db.query(stmt, values);
            res.json(rows);
        } catch (error) {
            console.error('Помилка отримання книг:', error);
            res.status(500).json({ message: 'Внутрішня помилка сервера' });
        }
    }

    // Отримати деталі конкретної книги
    async getBookById(req, res) {
        try {
            const userId = req.user.id;
            const userBookId = req.params.id;

            const stmt = `
                SELECT 
                    ub.id as user_book_id, b.title, b.isbn, b.description, b.cover_url,
                    a.name as author, g.name as genre, bs.name as status, 
                    ub.rating, ub.is_favorite, c.name as lent_to_name
                FROM user_books ub
                JOIN books b ON ub.book_id = b.id
                LEFT JOIN authors a ON b.author_id = a.id
                LEFT JOIN genres g ON b.genre_id = g.id
                LEFT JOIN book_statuses bs ON ub.status_id = bs.id
                LEFT JOIN contacts c ON ub.lent_to_contact_id = c.id
                WHERE ub.id = $1 AND ub.user_id = $2
            `;
            const { rows } = await db.query(stmt, [userBookId, userId]);

            if (rows.length === 0) {
                return res.status(404).json({ message: 'Книгу не знайдено' });
            }

            res.json(rows[0]);
        } catch (error) {
            console.error('Помилка отримання книги:', error);
            res.status(500).json({ message: 'Внутрішня помилка сервера' });
        }
    }

    // Додати книгу у свою бібліотеку (якщо її немає в глобальному реєстрі - створюємо)
    async createBook(req, res) {
        try {
            const userId = req.user.id;
            // Приймаємо глобальні дані книги та дані примірника користувача
            const { title, isbn, description, cover_url, author_id, genre_id, status_id, rating, is_favorite } = req.body;

            // 1. Шукаємо книгу в глобальному реєстрі за ISBN або Назвою
            let bookId;
            const checkBookStmt = 'SELECT id FROM books WHERE isbn = $1 OR title = $2 LIMIT 1';
            const { rows: existingBooks } = await db.query(checkBookStmt, [isbn, title]);

            if (existingBooks.length > 0) {
                bookId = existingBooks[0].id;
            } else {
                // Якщо книги немає, додаємо її в глобальний реєстр
                const insertBookStmt = `
                    INSERT INTO books (title, isbn, description, cover_url, author_id, genre_id)
                    VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
                `;
                const newBook = await db.query(insertBookStmt, [title, isbn, description, cover_url, author_id, genre_id]);
                bookId = newBook.rows[0].id;
            }

            // 2. Додаємо книгу до персональної бібліотеки користувача
            const insertUserBookStmt = `
                INSERT INTO user_books (user_id, book_id, status_id, rating, is_favorite)
                VALUES ($1, $2, $3, $4, $5) RETURNING id
            `;
            const newUserBook = await db.query(insertUserBookStmt, [userId, bookId, status_id, rating, is_favorite || false]);

            res.status(201).json({ message: 'Книга успішно додана', user_book_id: newUserBook.rows[0].id });
        } catch (error) {
            console.error('Помилка створення книги:', error);
            res.status(500).json({ message: 'Внутрішня помилка сервера' });
        }
    }

    // Оновити дані персонального примірника
    async updateBook(req, res) {
        try {
            const userId = req.user.id;
            const userBookId = req.params.id;
            const { status_id, rating } = req.body;

            const stmt = `
                UPDATE user_books 
                SET status_id = $1, rating = $2 
                WHERE id = $3 AND user_id = $4
                RETURNING id
            `;
            const { rows } = await db.query(stmt, [status_id, rating, userBookId, userId]);

            if (rows.length === 0) {
                return res.status(404).json({ message: 'Книгу не знайдено або немає прав для редагування' });
            }

            res.json({ message: 'Дані примірника оновлено' });
        } catch (error) {
            console.error('Помилка оновлення книги:', error);
            res.status(500).json({ message: 'Внутрішня помилка сервера' });
        }
    }

    // Маркерувати книгу як позичену та додати контакти позичальника
    async borrowBook(req, res) {
        try {
            const userId = req.user.id;
            const userBookId = req.params.id;
            const { contact_name, contact_email, contact_phone } = req.body; 

            if (!contact_name) {
                return res.status(400).json({ message: 'Ім\'я контакту обов\'язкове' });
            }

            // 1. Отримуємо поточний статус книги
            const bookCheck = await db.query('SELECT status_id FROM user_books WHERE id = $1 AND user_id = $2', [userBookId, userId]);
            if (bookCheck.rows.length === 0) {
                return res.status(404).json({ message: 'Книгу не знайдено' });
            }
            const currentStatusId = bookCheck.rows[0].status_id;

            // Отримуємо ID статусу "В займах" (можна захардкодити ID, якщо він статичний, наприклад 4)
            const statusRes = await db.query('SELECT id FROM book_statuses WHERE name = $1', ['В займах']);
            const borrowedStatusId = statusRes.rows[0].id;

            if (currentStatusId === borrowedStatusId) {
                return res.status(400).json({ message: 'Книга вже позичена' });
            }

            // 2. Створюємо новий контакт у базі
            const contactInsert = `
                INSERT INTO contacts (user_id, name, email, phone) 
                VALUES ($1, $2, $3, $4) RETURNING id
            `;
            const newContact = await db.query(contactInsert, [userId, contact_name, contact_email, contact_phone]);
            const contactId = newContact.rows[0].id;

            // 3. Оновлюємо книгу: ставимо статус "В займах", запам'ятовуємо старий статус, прив'язуємо контакт
            const updateBookStmt = `
                UPDATE user_books 
                SET lent_to_contact_id = $1, previous_status_id = $2, status_id = $3
                WHERE id = $4 AND user_id = $5
            `;
            await db.query(updateBookStmt, [contactId, currentStatusId, borrowedStatusId, userBookId, userId]);

            res.json({ message: 'Книгу успішно передано позичальнику' });
        } catch (error) {
            console.error('Помилка позичання книги:', error);
            res.status(500).json({ message: 'Внутрішня помилка сервера' });
        }
    }

    // Повернути книгу (видалити контакт та відновити попередній статус)
    async returnBook(req, res) {
        try {
            const userId = req.user.id;
            const userBookId = req.params.id;

            // 1. Знаходимо книгу та дізнаємося контакт і попередній статус
            const bookCheck = await db.query(
                'SELECT lent_to_contact_id, previous_status_id FROM user_books WHERE id = $1 AND user_id = $2', 
                [userBookId, userId]
            );

            if (bookCheck.rows.length === 0) {
                return res.status(404).json({ message: 'Книгу не знайдено' });
            }

            const { lent_to_contact_id, previous_status_id } = bookCheck.rows[0];

            if (!lent_to_contact_id) {
                return res.status(400).json({ message: 'Ця книга зараз не позичена' });
            }

            // Якщо попередній статус чомусь не зберігся, ставимо за замовчуванням "Прочитано" або "Не читав"
            // Рекомендую дістати дефолтний статус з БД, або якщо ми впевнені у логіці - використовуємо previous_status_id
            const newStatusId = previous_status_id || 1; // 1 - наприклад, ID статусу "Не читав"

            // 2. Видаляємо контакт (завдяки ON DELETE SET NULL в user_books, поле lent_to_contact_id стане NULL автоматично)
            await db.query('DELETE FROM contacts WHERE id = $1', [lent_to_contact_id]);

            // 3. Відновлюємо статус книги та очищуємо previous_status_id
            const updateBookStmt = `
                UPDATE user_books 
                SET status_id = $1, previous_status_id = NULL
                WHERE id = $2 AND user_id = $3
            `;
            await db.query(updateBookStmt, [newStatusId, userBookId, userId]);

            res.json({ message: 'Книгу успішно повернуто, контакт видалено' });
        } catch (error) {
            console.error('Помилка повернення книги:', error);
            res.status(500).json({ message: 'Внутрішня помилка сервера' });
        }
    }

    // Додати/видалити з обраного
    async toggleFavorite(req, res) {
        try {
            const userId = req.user.id;
            const userBookId = req.params.id;
            const { is_favorite } = req.body;

            const stmt = `
                UPDATE user_books 
                SET is_favorite = $1 
                WHERE id = $2 AND user_id = $3
                RETURNING id, is_favorite
            `;
            const { rows } = await db.query(stmt, [is_favorite, userBookId, userId]);

            if (rows.length === 0) {
                return res.status(404).json({ message: 'Книгу не знайдено' });
            }

            res.json({ message: 'Статус обраного оновлено', is_favorite: rows[0].is_favorite });
        } catch (error) {
            console.error('Помилка оновлення статусу:', error);
            res.status(500).json({ message: 'Внутрішня помилка сервера' });
        }
    }
}

export default new BookController();