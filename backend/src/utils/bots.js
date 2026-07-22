const db = require('../db');

// Realiam servisui pradėjus veikti (užsiregistravus arba admin patvirtinus),
// atitinkami bot servisai tame pačiame mieste ir kategorijose nebereikalingi —
// automatiškai išjungiami (status='inactive').
function disableOverlappingBots(serviceId) {
  const real = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId);
  if (!real) return 0;

  const realCats = db.prepare(
    'SELECT category_id FROM service_categories WHERE service_id = ? AND active = 1'
  ).all(real.id).map((r) => r.category_id);

  if (!real.city || !realCats.length) return 0;

  const placeholders = realCats.map(() => '?').join(',');
  const matchingBots = db.prepare(`
    SELECT DISTINCT s.id FROM services s
    JOIN service_categories sc ON sc.service_id = s.id
    WHERE s.is_bot = 1 AND s.status = 'active' AND s.city = ? AND sc.category_id IN (${placeholders})
  `).all(real.city, ...realCats);

  matchingBots.forEach((b) => db.prepare("UPDATE services SET status = 'inactive' WHERE id = ?").run(b.id));
  return matchingBots.length;
}

module.exports = { disableOverlappingBots };
