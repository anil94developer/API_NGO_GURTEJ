const express = require('express');
const User = require('../models/User');
const Donation = require('../models/Donation');
const Query = require('../models/Query');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalCustomers,
      totalDonations,
      pendingDonations,
      totalQueries,
      newQueries,
      recentDonations,
      recentQueries,
    ] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      Donation.countDocuments(),
      Donation.countDocuments({ status: 'pending' }),
      Query.countDocuments(),
      Query.countDocuments({ status: 'new' }),
      Donation.find().populate('donor', 'name email').sort({ createdAt: -1 }).limit(5),
      Query.find().sort({ createdAt: -1 }).limit(5),
    ]);

    res.json({
      success: true,
      stats: {
        totalCustomers,
        totalDonations,
        pendingDonations,
        collectedDonations: await Donation.countDocuments({ status: 'collected' }),
        distributedDonations: await Donation.countDocuments({ status: 'distributed' }),
        totalQueries,
        newQueries,
      },
      recentDonations,
      recentQueries,
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to load dashboard' });
  }
});

// Users
router.get('/users', async (req, res) => {
  try {
    const { q } = req.query;
    const filter = { role: 'customer' };
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const donations = await Donation.find({ donor: user._id }).sort({ createdAt: -1 });
    res.json({ success: true, user, donations });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
});

router.patch('/users/:id', async (req, res) => {
  try {
    const { isLocked, isActive } = req.body;
    const update = {};
    if (typeof isLocked === 'boolean') update.isLocked = isLocked;
    if (typeof isActive === 'boolean') update.isActive = isActive;
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

// Donations
router.get('/donations-list', async (req, res) => {
  try {
    const { status, q } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (q) filter.itemName = { $regex: q, $options: 'i' };
    const donations = await Donation.find(filter)
      .populate('donor', 'name email phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, donations });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch donations' });
  }
});

router.get('/donations-list/:id', async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id).populate('donor', 'name email phone');
    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' });
    res.json({ success: true, donation });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch donation' });
  }
});

router.patch('/donations-list/:id', async (req, res) => {
  try {
    const donation = await Donation.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('donor', 'name email phone');
    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' });
    res.json({ success: true, donation });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update donation' });
  }
});

module.exports = router;
