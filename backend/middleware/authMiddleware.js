const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No authorization token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cybercrime_super_secret_jwt_key_2026');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Session expired or invalid token. Please log in again.' });
  }
};

const requireCitizen = (req, res, next) => {
  if (!req.user || req.user.role !== 'citizen') {
    return res.status(403).json({ success: false, message: 'Access restricted to authorized citizens only.' });
  }
  next();
};

const requireOfficer = (req, res, next) => {
  if (!req.user || req.user.role !== 'officer') {
    return res.status(403).json({ success: false, message: 'Access restricted to authorized cybercrime personnel only.' });
  }
  next();
};

module.exports = {
  protect,
  requireCitizen,
  requireOfficer
};
