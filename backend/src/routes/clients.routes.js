const express = require('express');
const bcrypt = require('bcryptjs');
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
  // El. paštas — UNIQUE stulpelis IR prisijungimo kredencialas, tad tvarkomas atskirai nuo
  // likusių laukų: tikrinamas laisvumas (neskaitant paties savęs) prieš keičiant, o tuščia
  // reikšmė atmetama (registruotas klientas negali likti be el. pašto — juo prisijungiama).
  if (req.body.email !== undefined) {
    const email = (req.body.email || '').trim();
    if (!email) return res.status(400).json({ error: 'El. paštas privalomas' });
    const existing = db.prepare('SELECT id FROM clients WHERE email = ? AND id != ?').get(email, req.user.id);
    if (existing) return res.status(409).json({ error: 'Šis el. paštas jau naudojamas kito kliento' });
    db.prepare('UPDATE clients SET email = ? WHERE id = ?').run(email, req.user.id);
  }

  const allowed = ['first_name', 'last_name', 'phone', 'address'];
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

router.patch('/me/password', authRequired, requireRole('client'), (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Naujas slaptažodis per trumpas (min. 8 simboliai)' });
  }
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.user.id);
  if (!client.password_hash || !bcrypt.compareSync(currentPassword || '', client.password_hash)) {
    return res.status(400).json({ error: 'Neteisingas dabartinis slaptažodis' });
  }
  db.prepare('UPDATE clients SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 10), req.user.id);
  res.json({ message: 'Slaptažodis pakeistas' });
});

// Užsakymų istorija (Serviso knyga, Žingsnis 3/7) — jei servisas atsisakė šios užklausos
// PO priėmimo (žr. order_declines, "Serviso atsisakymas PO priėmimo"), klientas turi matyti
// PASKUTINĘ atsisakymo priežastį — net jei užklausa vėliau vėl atiteko kitam servisui (tada
// order.service_id/status jau rodo NAUJĄ būseną, o last_decline_* laukai lieka istoriniu įrašu).
router.get('/me/orders', authRequired, requireRole('client'), (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, s.name AS service_name, s.address AS service_address, s.city AS service_city,
      s.street AS service_street, s.house_number AS service_house_number,
      s.settlement AS service_settlement, s.municipality AS service_municipality,
      s.postal_code AS service_postal_code,
      (SELECT reason FROM order_declines WHERE order_id = o.id ORDER BY declined_at DESC LIMIT 1) AS last_decline_reason,
      (SELECT ds.name FROM order_declines od JOIN services ds ON ds.id = od.service_id WHERE od.order_id = o.id ORDER BY od.declined_at DESC LIMIT 1) AS last_decline_service_name,
      (SELECT declined_at FROM order_declines WHERE order_id = o.id ORDER BY declined_at DESC LIMIT 1) AS last_decline_at,
      (SELECT created_at FROM order_messages WHERE order_id = o.id ORDER BY created_at DESC LIMIT 1) AS last_message_at,
      (SELECT sender_type FROM order_messages WHERE order_id = o.id ORDER BY created_at DESC LIMIT 1) AS last_message_sender
    FROM orders o
    LEFT JOIN services s ON s.id = o.service_id
    WHERE o.client_id = ? ORDER BY o.created_at DESC
  `).all(req.user.id);
  res.json(orders);
});

module.exports = router;
