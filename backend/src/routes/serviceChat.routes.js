const express = require('express');
const db = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired, requireRole('service'));

// Normalizuota pora — visada mažesnis ID kaip service_a_id, kad ta pati dviejų servisų
// pora niekada negautų dviejų atskirų pokalbio įrašų (žr. schema.sql komentarą).
function pairIds(a, b) {
  return a < b ? [a, b] : [b, a];
}

// ── PAIEŠKA — kitų aktyvių, ne-bot servisų sąrašas naujam pokalbiui pradėti ──
router.get('/search', (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);
  const like = `%${q}%`;
  const rows = db.prepare(`
    SELECT id, name, city, service_type FROM services
    WHERE id != ? AND is_bot = 0 AND status = 'active' AND (name LIKE ? OR city LIKE ?)
    ORDER BY name LIMIT 20
  `).all(req.user.id, like, like);
  res.json(rows);
});

// ── POKALBIŲ SĄRAŠAS — TIK tie, kuriuose dalyvauja prisijungęs servisas ──
router.get('/conversations', (req, res) => {
  const myId = req.user.id;
  const rows = db.prepare(`
    SELECT c.id, c.created_at,
      CASE WHEN c.service_a_id = ? THEN c.service_b_id ELSE c.service_a_id END AS other_service_id,
      s.name AS other_service_name, s.city AS other_service_city,
      (SELECT message FROM service_chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC, id DESC LIMIT 1) AS last_message,
      (SELECT created_at FROM service_chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC, id DESC LIMIT 1) AS last_message_at,
      (SELECT sender_service_id FROM service_chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC, id DESC LIMIT 1) AS last_sender_service_id
    FROM service_conversations c
    JOIN services s ON s.id = (CASE WHEN c.service_a_id = ? THEN c.service_b_id ELSE c.service_a_id END)
    WHERE c.service_a_id = ? OR c.service_b_id = ?
    ORDER BY last_message_at IS NULL, last_message_at DESC
  `).all(myId, myId, myId, myId);
  res.json(rows);
});

// ── RASTI ARBA SUKURTI POKALBĮ SU KONKREČIU SERVISU ──
router.post('/start', (req, res) => {
  const { otherServiceId } = req.body;
  if (!otherServiceId) return res.status(400).json({ error: 'Trūksta serviso ID' });
  if (otherServiceId === req.user.id) return res.status(400).json({ error: 'Negalima pradėti pokalbio su savimi' });

  const other = db.prepare('SELECT id FROM services WHERE id = ? AND is_bot = 0').get(otherServiceId);
  if (!other) return res.status(404).json({ error: 'Servisas nerastas' });

  const [a, b] = pairIds(req.user.id, otherServiceId);
  let conv = db.prepare('SELECT * FROM service_conversations WHERE service_a_id = ? AND service_b_id = ?').get(a, b);
  if (!conv) {
    const info = db.prepare('INSERT INTO service_conversations (service_a_id, service_b_id) VALUES (?, ?)').run(a, b);
    conv = db.prepare('SELECT * FROM service_conversations WHERE id = ?').get(info.lastInsertRowid);
  }
  res.json(conv);
});

// Patikrina, kad prisijungęs servisas TIKRAI yra vienas iš dviejų šio pokalbio dalyvių —
// tai VIENINTELĖ, bet pakankama apsauga, užtikrinanti, kad pokalbis matomas TIK jo dviem
// dalyviams (žr. "Privatumas ir apsauga" — servisucentras-santrauka.md).
function requireParticipant(req, res, next) {
  const conv = db.prepare('SELECT * FROM service_conversations WHERE id = ?').get(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Pokalbis nerastas' });
  if (conv.service_a_id !== req.user.id && conv.service_b_id !== req.user.id) {
    return res.status(403).json({ error: 'Šis pokalbis jums nepriklauso' });
  }
  req.conversation = conv;
  next();
}

router.get('/:id/messages', requireParticipant, (req, res) => {
  const messages = db.prepare('SELECT * FROM service_chat_messages WHERE conversation_id = ? ORDER BY created_at ASC, id ASC').all(req.params.id);
  res.json(messages);
});

router.post('/:id/messages', requireParticipant, (req, res) => {
  const message = (req.body.message || '').trim();
  if (!message) return res.status(400).json({ error: 'Tuščia žinutė' });
  db.prepare('INSERT INTO service_chat_messages (conversation_id, sender_service_id, message) VALUES (?, ?, ?)').run(req.params.id, req.user.id, message);
  const messages = db.prepare('SELECT * FROM service_chat_messages WHERE conversation_id = ? ORDER BY created_at ASC, id ASC').all(req.params.id);
  res.status(201).json(messages);
});

module.exports = router;
