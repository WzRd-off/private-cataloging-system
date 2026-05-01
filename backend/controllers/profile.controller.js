import { db } from '../database/database.js'
import bcrypt from 'bcrypt';

class ProfileController {
// Отримати дані профілю поточного користувача
    async getProfile(req, res) {
        try {
            const userId = req.user.id;

            const stmt = `
                SELECT 
                    u.id, u.name, u.email, u.phone, u.status, u.created_at,
                    r.name as role
                FROM users u
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE u.id = $1
            `;
            const { rows } = await db.query(stmt, [userId]);

            if (rows.length === 0) {
                return res.status(404).json({ message: 'Користувача не знайдено' });
            }

            res.json(rows[0]);
        } catch (error) {
            console.error('Помилка отримання профілю:', error);
            res.status(500).json({ message: 'Внутрішня помилка сервера' });
        }
    }

    // Оновити загальну інформацію профілю
    async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const { name, email, phone } = req.body;

            // 1. Перевіряємо, чи не зайнятий email або телефон іншим користувачем
            const checkStmt = `
                SELECT id FROM users 
                WHERE (email = $1 OR phone = $2) AND id != $3
            `;
            const checkResult = await db.query(checkStmt, [email, phone, userId]);

            if (checkResult.rows.length > 0) {
                return res.status(400).json({ message: 'Email або номер телефону вже використовується іншим користувачем' });
            }

            // 2. Оновлюємо дані
            const updateStmt = `
                UPDATE users 
                SET name = $1, email = $2, phone = $3
                WHERE id = $4
                RETURNING id, name, email, phone
            `;
            const { rows } = await db.query(updateStmt, [name, email, phone, userId]);

            res.json({ 
                message: 'Профіль успішно оновлено',
                user: rows[0] 
            });
        } catch (error) {
            console.error('Помилка оновлення профілю:', error);
            res.status(500).json({ message: 'Внутрішня помилка сервера' });
        }
    }

    // Зміна пароля
    async changePassword(req, res) {
        try {
            const userId = req.user.id;
            const { oldPassword, newPassword } = req.body;

            // 1. Отримуємо поточний хеш пароля з БД
            const { rows } = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
            if (rows.length === 0) {
                return res.status(404).json({ message: 'Користувача не знайдено' });
            }

            const currentHash = rows[0].password_hash;

            // 2. Перевіряємо старий пароль
            const isMatch = await bcrypt.compare(oldPassword, currentHash);
            if (!isMatch) {
                return res.status(400).json({ message: 'Невірний старий пароль' });
            }

            const newHash = await bcrypt.hash(newPassword, 10);

            await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);

            res.json({ message: 'Пароль успішно змінено' });
        } catch (error) {
            console.error('Помилка зміни пароля:', error);
            res.status(500).json({ message: 'Внутрішня помилка сервера' });
        }
    }

    // Отримати статистику користувача
    async getProfileStats(req, res) {
        try {
            const userId = req.user.id;

            const stmt = `
                SELECT 
                    COUNT(id) as total_books,
                    COUNT(CASE WHEN is_favorite = true THEN 1 END) as favorite_books,
                    COUNT(CASE WHEN lent_to_contact_id IS NOT NULL THEN 1 END) as borrowed_books
                FROM user_books
                WHERE user_id = $1
            `;
            
            const { rows } = await db.query(stmt, [userId]);

            const stats = {
                total_books: parseInt(rows[0].total_books, 10),
                favorite_books: parseInt(rows[0].favorite_books, 10),
                borrowed_books: parseInt(rows[0].borrowed_books, 10)
            };

            res.json(stats);
        } catch (error) {
            console.error('Помилка отримання статистики:', error);
            res.status(500).json({ message: 'Внутрішня помилка сервера' });
        }
    }
}

export default new ProfileController();