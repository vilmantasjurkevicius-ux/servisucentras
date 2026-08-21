const express = require('express');
const bcrypt = require('bcryptjs');
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
  // Pasirinkus miestą, rodomi TIEK to miesto (s.city), TIEK to paties pavadinimo
  // savivaldybės/rajono (s.municipality) servisai — dauguma Lietuvos savivaldybių
  // pavadintos savo centro miestu, tad kaimo servisas "Ukmergės r." turi atsirasti,
  // kai klientas ieško "Ukmergė" (žr. santrauka.md "Struktūrizuotas adresas").
  if (city) { where.push('(s.city = ? OR s.municipality = ?)'); params.push(city, city); }
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
  const allowed = ['name', 'email', 'phone', 'city', 'street', 'house_number', 'settlement', 'municipality', 'postal_code', 'service_type', 'mechanic_count', 'description', 'work_start', 'work_end', 'temp_closed', 'vacation_until'];
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

router.patch('/me/password', authRequired, requireRole('service'), (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Naujas slaptažodis per trumpas (min. 8 simboliai)' });
  }
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.user.id);
  if (!service.password_hash || !bcrypt.compareSync(currentPassword || '', service.password_hash)) {
    return res.status(400).json({ error: 'Neteisingas dabartinis slaptažodis' });
  }
  db.prepare('UPDATE services SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 10), req.user.id);
  res.json({ message: 'Slaptažodis pakeistas' });
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

// ── VIEŠAS LAISVŲ/UŽIMTŲ LAIKŲ TVARKARAŠTIS (tiesioginei rezervacijai) ──
// Grąžina TIK laisva/užimta — jokių kliento duomenų, saugu rodyti bet kam be prisijungimo.
router.get('/:id/availability', (req, res) => {
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  if (!service) return res.status(404).json({ error: 'Servisas nerastas' });

  const days = Math.min(parseInt(req.query.days, 10) || 14, 30);
  let workHours = null;
  if (service.work_hours) {
    try { workHours = JSON.parse(service.work_hours); } catch (e) { workHours = null; }
  }

  // Užimta laikoma tik PATVIRTINTA (in_progress/done) užklausa su šiuo laiku —
  // dar nepatvirtinta 'direct' rezervacija slotą užrakina tik confirm'inimo metu.
  const busyRows = db.prepare(`
    SELECT scheduled_time FROM orders
    WHERE service_id = ? AND scheduled_time IS NOT NULL AND status IN ('in_progress', 'done')
  `).all(service.id);
  const busySet = new Set(busyRows.map((r) => r.scheduled_time));

  const now = new Date();
  const result = [];
  for (let d = 0; d < days; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    date.setHours(0, 0, 0, 0);
    const dow = (date.getDay() + 6) % 7; // 0=Pirmadienis..6=Sekmadienis, sutampa su work_hours indeksu
    const dayCfg = (workHours && workHours[dow])
      ? workHours[dow]
      : { open: true, start: service.work_start || '08:00', end: service.work_end || '18:00' };

    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const slots = [];
    if (dayCfg.open) {
      const startH = parseInt((dayCfg.start || '08:00').split(':')[0], 10);
      const endH = parseInt((dayCfg.end || '18:00').split(':')[0], 10);
      for (let h = startH; h < endH; h++) {
        const timeStr = `${dateStr}T${String(h).padStart(2, '0')}:00`;
        if (new Date(`${timeStr}:00`).getTime() < now.getTime()) continue; // praeities valandos praleidžiamos
        slots.push({ time: timeStr, busy: busySet.has(timeStr) });
      }
    }
    result.push({ date: dateStr, slots });
  }

  res.json({ serviceId: service.id, serviceName: service.name, days: result });
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
