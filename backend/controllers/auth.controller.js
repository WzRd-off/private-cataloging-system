import { db } from '../database/database.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
const JWT_SECRET = process.env.JWT_SECRET;

class AuthController {
    async registerUser(req, res) {
        try { 
            const {name, email, phone, password} = req.body
            const [existingUser] = await db.query('SELECT * FROM users WHERE email = ? ', [email])

            if (!existingUser) {
                return res.status(400).json({status : 'error', message: 'Такий користувач вже існує'})
            }

            const hashedPassword = await bcrypt.hash(password, 10)

            await db.query('INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)', [name, email, phone, password])

            res.status(201).json({status: 'success', message: 'Користувача успішно зареєстровано'})

        } catch (error) {
            console.error(error);
            res.status(500).json({status: 'error', message: 'Помилка сервера'})
        }
    }
    async loginUser(req, res) {
        try {
            const {email, password} = req.body
            const [existingUser] = await db.query('SELECT * FROM users WHERE email = ? ', email)

            if (!existingUser) {
                return res.status(404).json({status : 'error', message: 'Користувача не знайдено'})
            }

            const isMatch = await bcrypt.compare(password, existingUser.password_hash);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Невірний email або пароль' });
            }

            const user_data = {
                id: existingUser.id,
                role_id: existingUser.role_id
            }

            const token = jwt.sign(user_data, JWT_SECRET, { expiresIn: '24h' })

            res.cookie('token', token, {
                httpOnly: true,   
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000,
                sameSite: 'strict'
            });

            res.status(200).json({status: 'success', message: 'Hohol-style join'})
        }
        catch (error) {
            console.error(error);
            res.status(500).json({status: 'error', message: 'Помилка сервера'})  
        }
    }
    async logoutUser(req, res) {
        res.clearCookie('token');
        res.status(200).json({status: 'success', message: 'Успішний вихід'});
    }
}

export default new AuthController();