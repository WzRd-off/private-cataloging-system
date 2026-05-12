import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import bookRouter from './routers/book.router.js'
import profileRouter from './routers/profile.router.js'
import authRouter from './routers/auth.router.js'
import recomendationRouter from './routers/recomendation.router.js'
import cronService from './services/cron.service.js';

const app = express()
const PORT = process.env.PORT || 8000
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5173']

app.use(express.static('public'))
app.use('/images', express.static('images'))
app.use(express.json())
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true
}))
app.use(cookieParser())

app.use('/api/profile', profileRouter)
app.use('/api/auth', authRouter)
app.use('/api/books', bookRouter)
app.use('/api/recommendations', recomendationRouter)

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`)
    cronService.start();
})