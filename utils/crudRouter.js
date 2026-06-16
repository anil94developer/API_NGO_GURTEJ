const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');

const createCrudRouter = (Model, options = {}) => {
  const router = express.Router();
  const { searchFields = ['title', 'name'], defaultSort = { createdAt: -1 }, populate } = options;

  router.use(requireAuth, requireRole('admin'));

  router.get('/', async (req, res) => {
    try {
      const { q, status, page = 1, limit = 50 } = req.query;
      const filter = {};

      if (status) filter.isActive = status === 'active';
      if (q && searchFields.length) {
        filter.$or = searchFields.map((field) => ({ [field]: { $regex: q, $options: 'i' } }));
      }

      const skip = (Number(page) - 1) * Number(limit);
      let query = Model.find(filter).sort(defaultSort).skip(skip).limit(Number(limit));
      if (populate) query = query.populate(populate);

      const [items, total] = await Promise.all([query, Model.countDocuments(filter)]);
      res.json({ success: true, items, total, page: Number(page), limit: Number(limit) });
    } catch {
      res.status(500).json({ success: false, message: `Failed to fetch ${Model.modelName} list` });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      let query = Model.findById(req.params.id);
      if (populate) query = query.populate(populate);
      const item = await query;
      if (!item) return res.status(404).json({ success: false, message: 'Not found' });
      res.json({ success: true, item });
    } catch {
      res.status(500).json({ success: false, message: 'Failed to fetch item' });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const item = await Model.create(req.body);
      res.status(201).json({ success: true, message: 'Created successfully', item });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message || 'Failed to create' });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!item) return res.status(404).json({ success: false, message: 'Not found' });
      res.json({ success: true, message: 'Updated successfully', item });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message || 'Failed to update' });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const item = await Model.findByIdAndDelete(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: 'Not found' });
      res.json({ success: true, message: 'Deleted successfully' });
    } catch {
      res.status(500).json({ success: false, message: 'Failed to delete' });
    }
  });

  return router;
};

module.exports = createCrudRouter;
