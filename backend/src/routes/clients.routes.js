const express = require('express');
const db = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

function publicClient(row) {
  if (!row) return row;
  const { password_hash, ...rest } = row;
  return rest;
}

router.get('/me', authRequired, requireRole('client'), (req, res) => {
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.user.id);
  if (!client) return res.status(404).json({ error: 'Klientas nerastas' });
  res.json(publicClient(client));
});

router.patch('/me', authRequired, requireRole('client'), (req, res) => {
  const allowed = ['first_name', 'last_name', 'phone'];
  const fields = [];
  const params = [];
  for (const key of allowed) {
    const bodyKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (req.body[bodyKey] !== undefined) {
      fields.push(`${key} = ?`);
      params.push(req.body[bodyKey]);
    }
  }
  if (fields.length) {
    params.push(req.user.id);
    db.prepare(`UPDATE clients SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  }
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.user.id);
  res.json(publicClient(client));
});

router.get('/me/orders', authRequired, requireRole('client'), (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, s.name AS service_name FROM orders o
    LEFT JOIN services s ON s.id = o.service_id
    WHERE o.client_id = ? ORDER BY o.created_at DESC
  `).all(req.user.id);
  res.json(orders);
});

module.exports = router;
