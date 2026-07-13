const express = require('express');
const db = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');
const { calculateCommission } = require('../utils/commission');

const router = express.Router();

function getOrder(id) {
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
}

// ── SUKURTI UŽKLAUSĄ (klientas aprašo bėdą) ──
router.post('/', authRequired, requireRole('client'), (req, res) => {
  const { categoryId, city, description, carInfo } = req.body;
  if (!description || !city) return res.status(400).json({ error: 'Trūksta miesto arba aprašymo' });

  const info = db.prepare(`
    INSERT INTO orders (client_id, category_id, city, description, car_info, status)
    VALUES (?, ?, ?, ?, ?, 'new')
  `).run(req.user.id, categoryId || null, city, description, carInfo || null);

  res.status(201).json(getOrder(info.lastInsertRowid));
});

// ── SERVISO SĄRAŠAS: naujos užklausos jo mieste/kategorijose + jam priskirtos ──
router.get('/', authRequired, requireRole('service'), (req, res) => {
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.user.id);
  const orders = db.prepare(`
    SELECT DISTINCT o.*, c.first_name, c.last_name, c.phone FROM orders o
    JOIN clients c ON c.id = o.client_id
    LEFT JOIN service_categories sc ON sc.category_id = o.category_id AND sc.service_id = ?
    WHERE o.service_id = ?
       OR (o.status IN ('new', 'pending') AND o.city = ? AND (o.category_id IS NULL OR sc.service_id IS NOT NULL))
    ORDER BY o.created_at DESC
  `).all(req.user.id, req.user.id, service.city);
  res.json(orders);
});

router.get('/:id', authRequired, (req, res) => {
  const order = getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Užklausa nerasta' });
  if (req.user.role === 'client' && order.client_id !== req.user.id) {
    return res.status(403).json({ error: 'Ši užklausa jums nepriklauso' });
  }
  res.json(order);
});

// ── SERVISAS SIŪLO KAINĄ (chat žinutė su kainos pasiūlymu) ──
router.post('/:id/quote', authRequired, requireRole('service'), (req, res) => {
  const { price, message } = req.body;
  const order = getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Užklausa nerasta' });
  if (order.status !== 'new' && order.status !== 'pending') {
    return res.status(400).json({ error: 'Ši užklausa jau nebepriima pasiūlymų' });
  }

  db.prepare(`
    INSERT INTO order_messages (order_id, sender_type, sender_id, message, price_quote)
    VALUES (?, 'service', ?, ?, ?)
  `).run(order.id, req.user.id, message || null, price || null);

  if (order.status === 'new') {
    db.prepare("UPDATE orders SET status = 'pending' WHERE id = ?").run(order.id);
  }
  res.status(201).json(getOrder(order.id));
});

// ── KLIENTAS PRIIMA SERVISO PASIŪLYMĄ ──
router.post('/:id/accept', authRequired, requireRole('client'), (req, res) => {
  const { serviceId } = req.body;
  const order = getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Užklausa nerasta' });
  if (order.client_id !== req.user.id) return res.status(403).json({ error: 'Ši užklausa jums nepriklauso' });

  const service = db.prepare('SELECT id FROM services WHERE id = ?').get(serviceId);
  if (!service) return res.status(404).json({ error: 'Servisas nerastas' });

  db.prepare("UPDATE orders SET service_id = ?, status = 'in_progress' WHERE id = ?").run(serviceId, order.id);
  res.json(getOrder(order.id));
});

// ── SERVISAS PRISKIRIA/KEIČIA VIZITO LAIKĄ (Kalendorius) ──
router.patch('/:id/schedule', authRequired, requireRole('service'), (req, res) => {
  const { scheduledTime } = req.body;
  const order = getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Užklausa nerasta' });
  if (order.service_id !== req.user.id) return res.status(403).json({ error: 'Ši užklausa nepriskirta jūsų servisui' });

  db.prepare('UPDATE orders SET scheduled_time = ? WHERE id = ?').run(scheduledTime || null, order.id);
  res.json(getOrder(order.id));
});

// ── UŽKLAUSOS ŽINUTĖS (WhatsApp stiliaus chatas) ──
router.get('/:id/messages', authRequired, (req, res) => {
  const messages = db.prepare('SELECT * FROM order_messages WHERE order_id = ? ORDER BY created_at ASC').all(req.params.id);
  res.json(messages);
});

router.post('/:id/messages', authRequired, (req, res) => {
  const { message } = req.body;
  const order = getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Užklausa nerasta' });
  const info = db.prepare(`
    INSERT INTO order_messages (order_id, sender_type, sender_id, message)
    VALUES (?, ?, ?, ?)
  `).run(order.id, req.user.role, req.user.id, message);
  res.status(201).json(db.prepare('SELECT * FROM order_messages WHERE id = ?').get(info.lastInsertRowid));
});

// ── DARBO PATVIRTINIMAS (užbaigimas) — čia skaičiuojamas komisinis ──
router.post('/:id/complete', authRequired, requireRole('service'), (req, res) => {
  const { price } = req.body;
  const order = getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Užklausa nerasta' });
  if (order.service_id !== req.user.id) return res.status(403).json({ error: 'Ši užklausa nepriskirta jūsų servisui' });

  const finalPrice = price != null ? price : order.price;
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.user.id);
  const settings = db.prepare('SELECT * FROM admin_settings WHERE id = 1').get();
  const commission = calculateCommission({ price: finalPrice, service, settings });

  db.prepare(`
    UPDATE orders SET status = 'done', price = ?, commission_amount = ?, completed_at = datetime('now')
    WHERE id = ?
  `).run(finalPrice, commission, order.id);

  res.json(getOrder(order.id));
});

// ── ATSILIEPIMAS (klientas įvertina užbaigtą darbą) ──
router.post('/:id/review', authRequired, requireRole('client'), (req, res) => {
  const { rating, comment } = req.body;
  const order = getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Užklausa nerasta' });
  if (order.client_id !== req.user.id) return res.status(403).json({ error: 'Ši užklausa jums nepriklauso' });
  if (order.status !== 'done') return res.status(400).json({ error: 'Atsiliepimą galima palikti tik užbaigtai užklausai' });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Įvertinimas turi būti sveikas skaičius nuo 1 iki 5' });
  }
  const existing = db.prepare('SELECT id FROM reviews WHERE order_id = ?').get(order.id);
  if (existing) return res.status(409).json({ error: 'Šiai užklausai atsiliepimas jau paliktas' });

  const info = db.prepare(`
    INSERT INTO reviews (service_id, client_id, order_id, rating, comment)
    VALUES (?, ?, ?, ?, ?)
  `).run(order.service_id, req.user.id, order.id, rating, comment || null);

  const avg = db.prepare('SELECT AVG(rating) AS avg FROM reviews WHERE service_id = ?').get(order.service_id).avg;
  db.prepare('UPDATE services SET rating = ? WHERE id = ?').run(+avg.toFixed(1), order.service_id);

  res.status(201).json(db.prepare('SELECT * FROM reviews WHERE id = ?').get(info.lastInsertRowid));
});

router.post('/:id/cancel', authRequired, (req, res) => {
  const order = getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Užklausa nerasta' });
  const isOwnerClient = req.user.role === 'client' && order.client_id === req.user.id;
  const isOwnerService = req.user.role === 'service' && order.service_id === req.user.id;
  if (!isOwnerClient && !isOwnerService) return res.status(403).json({ error: 'Neturite teisių atšaukti šią užklausą' });

  db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?").run(order.id);
  res.json(getOrder(order.id));
});

module.exports = router;
