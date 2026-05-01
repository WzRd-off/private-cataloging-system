import { Pool } from 'pg'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
})

pool.on('connect', () => {
    console.log('Успішне підключення до бази даних')
})

pool.on('error', (err) => {
    console.error('Помилка підключення до бази даних:', err)
    process.exit(-1)
})

export const db = {
    query: (text, params) => pool.query(text, params),
    connect: () => pool.connect()
}

export default db
