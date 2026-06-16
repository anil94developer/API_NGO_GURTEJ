const express = require('express');
const { body, validationResult } = require('express-validator');
const Query = require('../models/Query');

const router = express.Router();

router.post(
  '/',
  [
    body('name').trim().notEmpty(),
    body('email').isEmail(),
    body('message').trim().notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      const query = await Query.create(req.body);
      res.status(201).json({ success: true, message: 'Query submitted successfully', query });
    } catch {
      res.status(500).json({ success: false, message: 'Failed to submit query' });
    }
  }
);

module.exports = router;
