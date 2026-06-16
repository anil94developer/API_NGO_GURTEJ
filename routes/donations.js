const express = require('express');
const { body, validationResult } = require('express-validator');
const Donation = require('../models/Donation');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/',
  requireAuth,
  requireRole('customer'),
  [
    body('category')
      .isIn(['human_welfare', 'animal_welfare', 'home_support', 'environment'])
      .withMessage('Invalid donation category'),
    body('itemName').trim().notEmpty().withMessage('Item name is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('pickupAddress').trim().notEmpty().withMessage('Pickup address is required'),
    body('description').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const donation = await Donation.create({
        ...req.body,
        donor: req.user._id,
      });

      res.status(201).json({ success: true, message: 'Donation submitted successfully', donation });
    } catch {
      res.status(500).json({ success: false, message: 'Failed to submit donation' });
    }
  }
);

router.get('/my', requireAuth, requireRole('customer'), async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, donations });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch donations' });
  }
});

router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const donations = await Donation.find()
      .populate('donor', 'name email phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, donations });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch donations' });
  }
});

router.patch(
  '/:id/status',
  requireAuth,
  requireRole('admin'),
  [body('status').isIn(['pending', 'scheduled', 'collected', 'distributed', 'cancelled'])],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const donation = await Donation.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status, scheduledDate: req.body.scheduledDate },
        { new: true }
      ).populate('donor', 'name email phone');

      if (!donation) {
        return res.status(404).json({ success: false, message: 'Donation not found' });
      }

      res.json({ success: true, message: 'Donation status updated', donation });
    } catch {
      res.status(500).json({ success: false, message: 'Failed to update donation' });
    }
  }
);

module.exports = router;
