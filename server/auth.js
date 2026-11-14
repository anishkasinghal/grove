const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function createToken(user, secret) {
  return jwt.sign({ sub: user.id, email: user.email || null }, secret, { expiresIn: '30d' });
}

function verifyToken(token, secret) {
  return jwt.verify(token, secret);
}

function requireAuth({ secret, findUser }) {
  return async (req, res, next) => {
    const header = req.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    try {
      const payload = verifyToken(token, secret);
      req.user = await findUser(payload.sub);
      if (!req.user) return res.status(401).json({ error: 'Account not found' });
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}

module.exports = { hashPassword, verifyPassword, createToken, verifyToken, requireAuth };
