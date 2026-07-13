const express = require('express');
const db = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');
const { trialEndDate } = require('../utils/commission');

const router = express.Router();

function withCategories(service) {
  if (!service) return service;
  const cats = db.prepare(`
    SELECT c.id, c.label FROM service_categories sc
    JOIN categories c ON c.id = sc.category_id
    WHERE sc.service_id = ? AND sc.active = 1
  `).all(service.id);
  const { password_hash, work_hours, ...rest } = service;
  let parsedHours = null;
  if (work_hours) {
    try { parsedHours = JSON.parse(work_hours); } catch (e) { parsedHours = null; }
  }
  return { ...rest, work_hours: parsedHours, categories: cats };
}

// ── VIEŠAS SĄRAŠAS (pagal miestą / kategoriją) ──
router.get('/', (req, res) => {
  const { city, category, status = 'active' } = req.query;
  let sql = 'SELECT DISTINCT s.* FROM services s';
  const where = [];
  const params = [];

  if (category) {
    sql += ' JOIN service_categories sc ON sc.service_id = s.id';
    where.push('sc.category_id = ? AND sc.active = 1');
    params.push(category);
  }
  if (city) { where.push('s.city = ?'); params.push(city); }
  if (status) { where.push('s.status = ?'); params.push(status); }

  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY s.is_bot ASC, s.rating DESC';

  const services = db.prepare(sql).all(...params);
  res.json(services.map(withCategories));
});

router.get('/me', authRequired, requireRole('service'), (req, res) => {
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.user.id);
  if (!service) return res.status(404).json({ error: 'Servisas nerastas' });
  res.json(withCategories(service));
});

router.patch('/me', authRequired, requireRole('service'), (req, res) => {
  const allowed = ['name', 'email', 'phone', 'address', 'service_type', 'mechanic_count', 'description', 'work_start', 'work_end'];
  const fields = [];
  const params = [];
  for (const key of allowed) {
    const bodyKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (req.body[bodyKey] !== undefined) {
      fields.push(`${key} = ?`);
      params.push(req.body[bodyKey]);
    }
  }
  if (Array.isArray(req.body.workHours) && req.body.workHours.length === 7) {
    fields.push('work_hours = ?');
    params.push(JSON.stringify(req.body.workHours));
  }
  if (fields.length) {
    params.push(req.user.id);
    try {
      db.prepare(`UPDATE services SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    } catch (err) {
      if (String(err.message).includes('UNIQUE')) {
        return res.status(409).json({ error: 'Šis el. paštas jau naudojamas kito serviso' });
      }
      throw err;
    }
  }
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.user.id);
  res.json(withCategories(service));
});

// ── PASLAUGOS: visos 12 kategorijų + šio serviso kaina/aktyvumas kiekvienai ──
function getOfferings(serviceId) {
  const rows = db.prepare(`
    SELECT c.id AS category_id, c.label, sc.price_from AS priceFrom, COALESCE(sc.active, 0) AS active
    FROM categories c
    LEFT JOIN service_categories sc ON sc.category_id = c.id AND sc.service_id = ?
    ORDER BY c.sort_order
  `).all(serviceId);
  return rows.map((r) => ({ ...r, active: !!r.active }));
}

router.get('/me/offerings', authRequired, requireRole('service'), (req, res) => {
  res.json(getOfferings(req.user.id));
});

router.put('/me/offerings', authRequired, requireRole('service'), (req, res) => {
  const offerings = Array.isArray(req.body.offerings) ? req.body.offerings : [];
  db.exec('BEGIN');
  try {
    db.prepare('DELETE FROM service_categories WHERE service_id = ?').run(req.user.id);
    const insert = db.prepare('INSERT INTO service_categories (service_id, category_id, price_from, active) VALUES (?, ?, ?, ?)');
    offerings.forEach((o) => {
      if (!o.categoryId) return;
      insert.run(req.user.id, o.categoryId, o.priceFrom != null && o.priceFrom !== '' ? o.priceFrom : null, o.active ? 1 : 0);
    });
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  res.json(getOfferings(req.user.id));
});

// ── ATSILIEPIMAI (viešas sąrašas konkrečiam servisui) ──
router.get('/:id/reviews', (req, res) => {
  const reviews = db.prepare(`
    SELECT r.id, r.rating, r.comment, r.created_at, c.first_name AS clientFirstName
    FROM reviews r
    LEFT JOIN clients c ON c.id = r.client_id
    WHERE r.service_id = ?
    ORDER BY r.created_at DESC
  `).all(req.params.id);
  res.json(reviews);
});

router.get('/:id', (req, res) => {
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  if (!service) return res.status(404).json({ error: 'Servisas nerastas' });
  const settings = db.prepare('SELECT trial_months FROM admin_settings WHERE id = 1').get();
  const result = withCategories(service);
  result.trialEndsAt = trialEndDate(service.registered_at, settings.trial_months).toISOString();
  res.json(result);
});

module.exports = router;
