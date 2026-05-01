import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import bookRouter from './routers/book.router.js'
import profileRouter from './routers/profile.router.js'
import authRouter from './routers/auth.router.js'

const app = express()
const PORT = 8000
const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173']; 

app.use(express.static('public'))
app.use(express.json())
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}))
app.use(cookieParser())

app.use('/api/profile', profileRouter)
app.use('/api/auth', authRouter)
app.use('/api/books', bookRouter)

app.listen(PORT, () => {
    console.log(`Server start at http://localhost:${PORT}`)
})