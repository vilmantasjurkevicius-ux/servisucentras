const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const categories = db.prepare('SELECT id, label FROM categories ORDER BY sort_order').all();
  res.json(categories);
});

module.exports = router;
