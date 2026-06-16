const mongoose = require('mongoose');

const successStorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, default: 'Human Welfare' },
    summary: { type: String, default: '' },
    content: { type: String, default: '' },
    impact: { type: String, default: '' },
    color: { type: String, default: '#117A4B' },
    imageUrl: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SuccessStory', successStorySchema);
