// "Kontaktai/Pagalba" plaukiojantis burbulas — vienpusis pranešimų kanalas admin'ui,
// BE boto/AI atsakymo. Pasiekiamas iš bet kurio puslapio, tiek prisijungus (klientas/
// servisas), tiek svečiui pagrindiniame puslapyje — žr. middleware/auth.js optionalAuth().
//
// Apsauga nuo piktnaudžiavimo (žr. santrauka.md): rankinis blokavimas (vartotojo ID
// arba IP), ribojimas 5 žin./val., min. 30 s tarpas tarp žinučių, pasikartojančio
// teksto filtras — visi trys sluoksniai raktuojami PAGAL VARTOTOJO ID prisijungusiems
// (client/service), o svečiams (be paskyros) — PAGAL IP, nes neturi jokio kito
// patvaraus identifikatoriaus. Papildomai: jei tuo pačiu IP per valandą rašo 2+ KITI
// skirtingi registruoti vartotojai, žinutė pažymima flagged=1 (matoma tik admin'ui).
const express = require('express');
const db = require('../db');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

const RATE_LIMIT_PER_HOUR = 5;
const MIN_GAP_SECONDS = 30;
const SUSPICIOUS_OTHER_ACCOUNTS = 2; // + ši žinutė = 3 skirtingi iš vieno IP per valandą

function isBlocked(type, value) {
  if (value === null || value === undefined || value === '') return false;
  return !!db.prepare('SELECT 1 FROM blocked_senders WHERE type = ? AND value = ?').get(type, String(value));
}

function normalizeText(s) {
  return String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

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

  const ip = req.ip;

  if ((senderId && isBlocked(senderType, senderId)) || isBlocked('ip', ip)) {
    return res.status(403).json({ error: 'Laikinai negalite siųsti žinučių' });
  }

  // Identiteto raktas ribojimams: prisijungusiems — sender_type+sender_id; svečiams — IP.
  const identityWhere = senderId ? 'sender_type = ? AND sender_id = ?' : "sender_type = 'guest' AND sender_ip = ?";
  const identityArgs = senderId ? [senderType, senderId] : [ip];

  const recentCount = db.prepare(`
    SELECT COUNT(*) AS n FROM admin_support_messages
    WHERE ${identityWhere} AND created_at > datetime('now', '-1 hour')
  `).get(...identityArgs).n;
  if (recentCount >= RATE_LIMIT_PER_HOUR) {
    return res.status(429).json({ error: 'Per daug žinučių — pabandykite vėliau' });
  }

  const tooSoon = db.prepare(`
    SELECT 1 FROM admin_support_messages
    WHERE ${identityWhere} AND created_at > datetime('now', '-${MIN_GAP_SECONDS} seconds')
    LIMIT 1
  `).get(...identityArgs);
  if (tooSoon) {
    return res.status(429).json({ error: 'Palaukite prieš siųsdami kitą žinutę' });
  }

  const lastMessage = db.prepare(`
    SELECT message FROM admin_support_messages
    WHERE ${identityWhere}
    ORDER BY created_at DESC LIMIT 1
  `).get(...identityArgs);
  if (lastMessage && normalizeText(lastMessage.message) === normalizeText(message)) {
    return res.status(429).json({ error: 'Ši žinutė jau buvo išsiųsta' });
  }

  let flagged = 0;
  if (senderId && ip) {
    const otherAccounts = db.prepare(`
      SELECT COUNT(DISTINCT sender_type || ':' || sender_id) AS n
      FROM admin_support_messages
      WHERE sender_ip = ? AND sender_id IS NOT NULL
        AND NOT (sender_type = ? AND sender_id = ?)
        AND created_at > datetime('now', '-1 hour')
    `).get(ip, senderType, senderId).n;
    if (otherAccounts >= SUSPICIOUS_OTHER_ACCOUNTS) flagged = 1;
  }

  db.prepare(`
    INSERT INTO admin_support_messages (sender_type, sender_id, sender_name, sender_email, sender_phone, sender_ip, flagged, message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(senderType, senderId, senderName, senderEmail, senderPhone, ip, flagged, message);

  res.status(201).json({ message: 'Žinutė gauta' });
});

module.exports = router;
