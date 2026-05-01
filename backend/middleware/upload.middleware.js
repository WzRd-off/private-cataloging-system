import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

const IMAGES_DIR = path.resolve('images')
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true })

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, IMAGES_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
        const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`
        cb(null, name)
    }
})

const fileFilter = (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
        return cb(new Error('Дозволені тільки зображення (jpeg, png, webp, gif)'))
    }
    cb(null, true)
}

export const uploadImage = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
})
