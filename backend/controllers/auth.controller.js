import { db } from '../database/database.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

class AuthController {
    async registerUser(req, res) {
        try {
            const { name, email, phone, password } = req.body

            const { rows: existing } = await db.query(
                'SELECT id FROM users WHERE email = $1',
                [email]
            )
            if (existing.length > 0) {
                return res.status(400).json({ status: 'error', message: 'Такий користувач вже існує' })
            }

            const hashedPassword = await bcrypt.hash(password, 10)
            await db.query(
                'INSERT INTO users (name, email, phone, role_id, password_hash) VALUES ($1, $2, $3, $4, $5)',
                [name, email, phone, 1, hashedPassword]
            )

            res.status(201).json({ status: 'success', message: 'Користувача успішно зареєстровано' })
        } catch (error) {
            console.error(error)
            res.status(500).json({ status: 'error', message: 'Помилка сервера' })
        }
    }

    async loginUser(req, res) {
        try {
            const { email, password } = req.body

            const { rows } = await db.query(
                'SELECT * FROM users WHERE email = $1',
                [email]
            )
            if (rows.length === 0) {
                return res.status(404).json({ status: 'error', message: 'Користувача не знайдено' })
            }

            const user = rows[0]
            const isMatch = await bcrypt.compare(password, user.password_hash)
            if (!isMatch) {
                return res.status(401).json({ status: 'error', message: 'Невірний email або пароль' })
            }

            const token = jwt.sign(
                { id: user.id, role_id: user.role_id },
                JWT_SECRET,
                { expiresIn: '24h' }
            )

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000,
                sameSite: 'strict'
            })

            res.status(200).json({ status: 'success', message: 'Успішний вхід' })
        } catch (error) {
            console.error(error)
            res.status(500).json({ status: 'error', message: 'Помилка сервера' })
        }
    }

    async logoutUser(req, res) {
        res.clearCookie('token')
        res.status(200).json({ status: 'success', message: 'Успішний вихід' })
    }
}

export default new AuthController()
