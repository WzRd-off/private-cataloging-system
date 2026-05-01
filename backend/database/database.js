import { Pool } from 'pg'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/library_db', // тут необходимо заменить на process.env.DATABASE_URL
    })

pool.on('connect', () => {
    console.log('Успішне підключення до бази даних')
})

pool.on('error', (err) => {
    console.log('Помилка при підключення до бази данних')
    process.exit(-1)
})

export const db = {
    query: (text, params) => {
        return pool.query(text, params)
    }
}

export default db
