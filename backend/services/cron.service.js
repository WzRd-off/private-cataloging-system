import cron from 'node-cron';
import { db } from '../database/database.js';

class CronService {
    start() {
        cron.schedule('0 9 * * *', async () => {
            await this.checkBorrowReminders();
        });
    }

    // 1. Нагадування про повернення книг
    async checkBorrowReminders() {
        try {
            const stmt = `
                SELECT c.user_id, c.name as contact_name, ub.title 
                FROM contacts c
                JOIN user_books ub ON ub.lent_to_contact_id = c.id
                WHERE c.expected_return_date = CURRENT_DATE + INTERVAL '1 day'
            `;
            const { rows } = await db.query(stmt);

            for (const row of rows) {
                await db.query(
                    `INSERT INTO notifications (user_id, title, message)
                     VALUES ($1, $2, $3)`,
                    [
                        row.user_id,
                        'Нагадування про повернення',
                        `Завтра ${row.contact_name} має повернути вам книгу "${row.title}".`,
                    ]
                )
            }
            
            if (rows.length > 0) {
            } else {
            }
        } catch (error) {
            console.error('Помилка в checkBorrowReminders:', error);
        }
    }
}

export default new CronService();