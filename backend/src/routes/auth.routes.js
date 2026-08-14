const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const { disableOverlappingBots } = require('../utils/bots');
const { sendServiceRegistrationEmail, sendPasswordResetEmail } = require('../email');
const { generateResetToken, hashToken, RESET_TOKEN_TTL_MINUTES } = require('../utils/passwordReset');

const RESET_URL_BASE = 'https://servisucentras.lt/automeistrai-login.html';

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
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 0)
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

  // Servisas iškart aktyvus registracijos metu (be admin patvirtinimo žingsnio) —
  // admin bet kada gali jį išjungti (banService) Admin skydelyje. Kadangi
  // registracija pati prilygsta anksčiau buvusiam "approve" žingsniui, iškart
  // išjungiami ir tos pačios kategorijos/miesto bot placeholder'iai.
  disableOverlappingBots(info.lastInsertRowid);

  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(info.lastInsertRowid);
  const token = signToken({ id: service.id, role: 'service' });
  res.status(201).json({ token, service: publicService(service) });

  // Fire-and-forget — laiško siuntimas niekada neturi vėlinti/sugriauti registracijos atsakymo.
  sendServiceRegistrationEmail(service);
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

// ── PAMIRŠAU SLAPTAŽODĮ ──
function findAccountForReset(role, email) {
  if (role === 'service') return db.prepare('SELECT id, email FROM services WHERE email = ?').get(email);
  if (role === 'client') return db.prepare('SELECT id, email FROM clients WHERE email = ?').get(email);
  if (role === 'admin') {
    const settings = db.prepare('SELECT admin_email FROM admin_settings WHERE id = 1').get();
    return settings && settings.admin_email && settings.admin_email === email
      ? { id: 1, email: settings.admin_email }
      : null;
  }
  return null;
}

router.post('/forgot-password', authLimiter, (req, res) => {
  const { role, email } = req.body;
  if (!['service', 'client', 'admin'].includes(role) || !email) {
    return res.status(400).json({ error: 'Trūksta rolės arba el. pašto' });
  }

  // Visada ta pati žinutė, nepriklausomai ar paskyra rasta — apsauga nuo el. pašto
  // adresų "enumeration" (kad negalima būtų sužinoti, ar adresas registruotas,
  // stebint atsakymo skirtumus).
  const response = { message: 'Jei toks el. paštas registruotas, netrukus gausite laišką su nuoroda slaptažodžiui atstatyti.' };

  const account = findAccountForReset(role, email);
  if (!account) return res.json(response);

  const token = generateResetToken();
  db.prepare(`
    INSERT INTO password_reset_tokens (role, account_id, token_hash, expires_at)
    VALUES (?, ?, ?, datetime('now', '+${RESET_TOKEN_TTL_MINUTES} minutes'))
  `).run(role, account.id, hashToken(token));

  const resetLink = `${RESET_URL_BASE}?resetToken=${token}&role=${role}`;
  sendPasswordResetEmail({ to: account.email, resetLink }); // fire-and-forget

  res.json(response);
});

router.post('/reset-password', authLimiter, (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Trūksta tokeno arba slaptažodis per trumpas (min. 8 simboliai)' });
  }

  const record = db.prepare(`
    SELECT * FROM password_reset_tokens
    WHERE token_hash = ? AND used_at IS NULL AND expires_at > datetime('now')
  `).get(hashToken(token));
  if (!record) return res.status(400).json({ error: 'Nuoroda negalioja arba pasibaigusi — paprašykite naujos' });

  const passwordHash = bcrypt.hashSync(newPassword, 10);
  if (record.role === 'service') {
    db.prepare('UPDATE services SET password_hash = ? WHERE id = ?').run(passwordHash, record.account_id);
  } else if (record.role === 'client') {
    db.prepare('UPDATE clients SET password_hash = ? WHERE id = ?').run(passwordHash, record.account_id);
  } else if (record.role === 'admin') {
    db.prepare('UPDATE admin_settings SET admin_password_hash = ? WHERE id = 1').run(passwordHash);
  }
  db.prepare("UPDATE password_reset_tokens SET used_at = datetime('now') WHERE id = ?").run(record.id);

  res.json({ message: 'Slaptažodis sėkmingai pakeistas — galite prisijungti.' });
});

module.exports = router;
