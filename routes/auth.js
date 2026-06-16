const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const MAX_LOGIN_ATTEMPTS = 5;

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, phone } = req.body;

    try {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists' });
      }

      const user = await User.create({
        name,
        email,
        password,
        phone: phone || '',
        role: 'customer',
      });

      req.session.userId = user._id.toString();
      req.session.role = user.role;

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
        },
      });
    } catch {
      res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
    }
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      if (user.isLocked) {
        return res.status(403).json({ success: false, message: 'Account locked due to multiple failed attempts' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        user.loginAttempts += 1;
        if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
          user.isLocked = true;
        }
        await user.save();
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      user.loginAttempts = 0;
      user.isLocked = false;
      user.lastLogin = new Date();
      await user.save();

      req.session.userId = user._id.toString();
      req.session.role = user.role;

      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
        },
      });
    } catch {
      res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
    }
  }
);

const { sessionCookieOptions } = require('../config/env');

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.clearCookie('connect.sid', sessionCookieOptions);
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      phone: req.user.phone,
      lastLogin: req.user.lastLogin,
    },
  });
});

module.exports = router;
