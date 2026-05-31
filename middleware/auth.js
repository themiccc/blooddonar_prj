const jwt = require('jsonwebtoken');

// Verify JWT token in Cookies or Auth Headers
const protect = (req, res, next) => {
  let token;

  // Check cookies or Authorization header
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorised, token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey_blood_donor_finder_2026');
    req.user = decoded; // Contains id, role (donor/admin), email
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorised, invalid token' });
  }
};

// Check if user is a registered donor
const donorOnly = (req, res, next) => {
  if (req.user && req.user.role === 'donor') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied, donor role required' });
  }
};

// Check if user is an admin
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied, admin role required' });
  }
};

module.exports = {
  protect,
  donorOnly,
  adminOnly
};
