const User = require('../models/User');

const requireAuth = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Please log in to continue' });
  }

  try {
    const user = await User.findById(req.session.userId);
    if (!user || !user.isActive) {
      req.session.destroy(() => {});
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again' });
    }
    if (user.isLocked) {
      return res.status(403).json({ success: false, message: 'Your account has been locked. Contact support.' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(500).json({ success: false, message: 'Authentication failed' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'You do not have permission for this action' });
  }
  next();
};

module.exports = { requireAuth, requireRole };
