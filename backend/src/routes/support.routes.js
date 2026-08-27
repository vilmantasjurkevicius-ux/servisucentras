// "Kontaktai/Pagalba" plaukiojantis burbulas — vienpusis pranešimų kanalas admin'ui,
// BE boto/AI atsakymo. Pasiekiamas iš bet kurio puslapio, tiek prisijungus (klientas/
// servisas), tiek svečiui pagrindiniame puslapyje — žr. middleware/auth.js optionalAuth().
const express = require('express');
const db = require('../db');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/messages', optionalAuth, (req, res) => {
  const message = (req.body.message || '').trim();
  if (!message) return res.status(400).json({ error: 'Žinutė negali būti tuščia' });

  let senderType = 'guest';
  let senderId = null;
  let senderName = (req.body.name || '').trim() || null;
  let senderEmail = (req.body.email || '').trim() || null;
  let senderPhone = (req.body.phone || '').trim() || null;

  if (req.user && req.user.role === 'client') {
    const client = db.prepare('SELECT first_name, last_name, email, phone FROM clients WHERE id = ?').get(req.user.id);
    if (client) {
      senderType = 'client';
      senderId = req.user.id;
      senderName = `${client.first_name || ''} ${client.last_name || ''}`.trim() || senderName;
      senderEmail = client.email || senderEmail;
      senderPhone = client.phone || senderPhone;
    }
  } else if (req.user && req.user.role === 'service') {
    const service = db.prepare('SELECT name, email, phone FROM services WHERE id = ?').get(req.user.id);
    if (service) {
      senderType = 'service';
      senderId = req.user.id;
      senderName = service.name || senderName;
      senderEmail = service.email || senderEmail;
      senderPhone = service.phone || senderPhone;
    }
  }

  db.prepare(`
    INSERT INTO admin_support_messages (sender_type, sender_id, sender_name, sender_email, sender_phone, message)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(senderType, senderId, senderName, senderEmail, senderPhone, message);

  res.status(201).json({ message: 'Žinutė gauta' });
});

module.exports = router;
