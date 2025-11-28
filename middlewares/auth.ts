const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

export const authMiddleware = (req: any, res: any, next: any) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (err) {
        return res.status(401).json({ msg: 'Invalid token' });
    }
}