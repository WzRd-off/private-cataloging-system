import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET;

export const authMiddleware = (req, res, next) => {

    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Токену немає' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.clearCookie('token')
        return res.status(401).json({ error: 'Некоректний токен' });
    }

}

export const adminMiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== 'Адміністратор') {
        return res.status(403).json({ error: 'Недостатньо прав' });
    }
    next();
};