const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

const router = express.Router();

function publicService(row) {
  if (!row) return row;
  const { password_hash, ...rest } = row;
  return rest;
}

function publicClient(row) {
  if (!row) return row;
  const { password_hash, ...rest } = row;
  return rest;
}

// ── SERVISO REGISTRACIJA ──
router.post('/service/register', authLimiter, (req, res) => {
  const {
    name, ownerFirstName, ownerLastName, email, phone, password,
    city, address, serviceType, mechanicCount, description,
    workStart, workEnd, categoryIds,
  } = req.body;

  if (!name || !email || !password || !city) {
    return res.status(400).json({ error: 'Trūksta privalomų laukų (pavadinimas, el. paštas, slaptažodis, miestas)' });
  }

  const existing = db.prepare('SELECT id FROM services WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Servisas su tokiu el. paštu jau egzistuoja' });

  const passwordHash = bcrypt.hashSync(password, 10);
  const insert = db.prepare(`
    INSERT INTO services (name, owner_first_name, owner_last_name, email, password_hash, phone, city, address, service_type, mechanic_count, description, work_start, work_end, status, is_bot)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0)
  `);
  const info = insert.run(
    name, ownerFirstName || null, ownerLastName || null, email, passwordHash, phone || null,
    city, address || null, serviceType || null, mechanicCount || null, description || null,
    workStart || '08:00', workEnd || '18:00'
  );

  if (Array.isArray(categoryIds) && categoryIds.length) {
    const insertCat = db.prepare('INSERT OR IGNORE INTO service_categories (service_id, category_id) VALUES (?, ?)');
    categoryIds.forEach((catId) => insertCat.run(info.lastInsertRowid, catId));
  }

  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(info.lastInsertRowid);
  const token = signToken({ id: service.id, role: 'service' });
  res.status(201).json({ token, service: publicService(service) });
});

// ── SERVISO PRISIJUNGIMAS ──
router.post('/service/login', authLimiter, (req, res) => {
  const { email, password } = req.body;
  const service = db.prepare('SELECT * FROM services WHERE email = ?').get(email);
  if (!service || !service.password_hash || !bcrypt.compareSync(password, service.password_hash)) {
    return res.status(401).json({ error: 'Neteisingas el. paštas arba slaptažodis' });
  }
  if (service.status === 'banned') {
    return res.status(403).json({ error: 'Šis servisas yra užblokuotas' });
  }
  const token = signToken({ id: service.id, role: 'service' });
  res.json({ token, service: publicService(service) });
});

// ── KLIENTO REGISTRACIJA ──
router.post('/client/register', authLimiter, (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Trūksta el. pašto arba slaptažodžio' });

  const existing = db.prepare('SELECT id FROM clients WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Klientas su tokiu el. paštu jau egzistuoja' });

  const passwordHash = bcrypt.hashSync(password, 10);
  const info = db.prepare(`
    INSERT INTO clients (first_name, last_name, email, password_hash, phone, is_guest, status)
    VALUES (?, ?, ?, ?, ?, 0, 'active')
  `).run(firstName || null, lastName || null, email, passwordHash, phone || null);

  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(info.lastInsertRowid);
  const token = signToken({ id: client.id, role: 'client' });
  res.status(201).json({ token, client: publicClient(client) });
});

// ── KLIENTO PRISIJUNGIMAS ──
router.post('/client/login', authLimiter, (req, res) => {
  const { email, password } = req.body;
  const client = db.prepare('SELECT * FROM clients WHERE email = ?').get(email);
  if (!client || !client.password_hash || !bcrypt.compareSync(password, client.password_hash)) {
    return res.status(401).json({ error: 'Neteisingas el. paštas arba slaptažodis' });
  }
  if (client.status === 'banned') {
    return res.status(403).json({ error: 'Ši paskyra yra užblokuota' });
  }
  const token = signToken({ id: client.id, role: 'client' });
  res.json({ token, client: publicClient(client) });
});

// ── SVEČIO REŽIMAS (be paskyros) ──
router.post('/guest', (req, res) => {
  const { firstName, lastName, phone, email } = req.body;
  if (!firstName || !phone) return res.status(400).json({ error: 'Trūksta vardo arba telefono numerio' });

  try {
    const info = db.prepare(`
      INSERT INTO clients (first_name, last_name, email, phone, is_guest, status)
      VALUES (?, ?, ?, ?, 1, 'active')
    `).run(firstName, lastName || null, email || null, phone);

    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(info.lastInsertRowid);
    const token = signToken({ id: client.id, role: 'client', guest: true });
    res.status(201).json({ token, client: publicClient(client) });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Šis el. paštas jau turi paskyrą — prisijunkite vietoj to' });
    }
    throw err;
  }
});

module.exports = router;
