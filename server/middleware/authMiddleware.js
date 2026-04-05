const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Токен не предоставлен' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = {
      id: decoded.userId,
      role: decoded.role || 'participant',
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Недействительный или истёкший токен' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Доступ запрещён: только для администраторов' });
  }
  next();
};

const requireParticipant = (req, res, next) => {
  if (req.user.role !== 'participant') {
    return res.status(403).json({ message: 'Доступ запрещён: только для участников' });
  }
  next();
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireParticipant,
};
