const express = require('express');
const Category = require('../../models/Category');
const Gallery = require('../../models/Gallery');
const Event = require('../../models/Event');
const Blog = require('../../models/Blog');
const SuccessStory = require('../../models/SuccessStory');
const FAQ = require('../../models/FAQ');
const Notification = require('../../models/Notification');
const Notice = require('../../models/Notice');
const VoiceOfHope = require('../../models/VoiceOfHope');
const Query = require('../../models/Query');
const TeamMember = require('../../models/TeamMember');
const ContentPage = require('../../models/ContentPage');
const SiteSetting = require('../../models/SiteSetting');
const createCrudRouter = require('../../utils/crudRouter');
const { requireAuth, requireRole } = require('../../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

// Category tree
router.get('/categories/tree', async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1, name: 1 }).lean();
    const buildTree = (parentId = null) =>
      categories
        .filter((c) => (c.parent ? String(c.parent) : null) === (parentId ? String(parentId) : null))
        .map((c) => ({ ...c, children: buildTree(c._id) }));
    res.json({ success: true, tree: buildTree() });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to load category tree' });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const item = await Category.create(req.body);
    res.status(201).json({ success: true, item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const item = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    const childCount = await Category.countDocuments({ parent: req.params.id });
    if (childCount > 0) {
      return res.status(400).json({ success: false, message: 'Remove child categories first' });
    }
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
});

// CMS CRUD routers
router.use('/gallery', createCrudRouter(Gallery));
router.use('/events', createCrudRouter(Event));
router.use('/blogs', createCrudRouter(Blog, { searchFields: ['title', 'author'] }));
router.use('/success-stories', createCrudRouter(SuccessStory));
router.use('/faqs', createCrudRouter(FAQ, { searchFields: ['question'], defaultSort: { order: 1 } }));
router.use('/notifications', createCrudRouter(Notification));
router.use('/notices', createCrudRouter(Notice));
router.use('/voices', createCrudRouter(VoiceOfHope, { searchFields: ['name', 'role'] }));
router.use('/queries', createCrudRouter(Query, { searchFields: ['name', 'email', 'subject'] }));
router.use('/team', createCrudRouter(TeamMember, { defaultSort: { order: 1 } }));
router.use('/content-pages', createCrudRouter(ContentPage, { searchFields: ['title', 'slug'] }));

// Site settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await SiteSetting.find().sort({ group: 1, key: 1 });
    res.json({ success: true, settings });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to load settings' });
  }
});

router.get('/settings/:key', async (req, res) => {
  try {
    let setting = await SiteSetting.findOne({ key: req.params.key });
    if (!setting) {
      setting = await SiteSetting.create({ key: req.params.key, value: {}, group: req.params.key });
    }
    res.json({ success: true, setting });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to load setting' });
  }
});

router.put('/settings/:key', async (req, res) => {
  try {
    const setting = await SiteSetting.findOneAndUpdate(
      { key: req.params.key },
      { key: req.params.key, value: req.body.value, group: req.body.group || req.params.key },
      { new: true, upsert: true }
    );
    res.json({ success: true, setting });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
