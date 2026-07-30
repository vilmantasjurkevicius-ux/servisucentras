const express = require('express');
const db = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');
const { calculateCommission, calculateContactFee } = require('../utils/commission');
const { redactContacts } = require('../utils/contactFilter');
const { sendNewOrderEmail, sendQuoteEmail, sendServiceDeclinedEmail, sendOrderReopenedEmail } = require('../email');

const router = express.Router();

function getOrder(id) {
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
}

// Realūs (ne bot), aktyvūs servisai su el. paštu, tinkantys šiai užklausai —
// naudojama tik el. pašto pranešimams, ne pačiam užklausų sąrašui.
function findMatchingServices(city, categoryId) {
  if (categoryId) {
    return db.prepare(`
      SELECT DISTINCT s.* FROM services s
      JOIN service_categories sc ON sc.service_id = s.id AND sc.category_id = ? AND sc.active = 1
      WHERE s.is_bot = 0 AND s.status = 'active' AND s.city = ? AND s.email IS NOT NULL
    `).all(categoryId, city);
  }
  return db.prepare(`
    SELECT * FROM services WHERE is_bot = 0 AND status = 'active' AND city = ? AND email IS NOT NULL
  `).all(city);
}

// Automobilio pasirinkimas kuriant užklausą (Serviso knyga, Žingsnis 3/7) — registruotas
// klientas gali PASIRINKTI konkretų automobilį (carId) iš savo "Mano automobiliai" sąrašo,
// vietoj laisvo teksto. car_info išsaugomas kaip UŽRAŠYTA nuotrauka ("Markė Modelis (Metai)")
// pasirinkimo METU — nepriklauso nuo vėlesnio automobilio redagavimo/ištrynimo, tad senos
// užklausos visada rodo tai, kas buvo pasirinkta tada. Svečiai carId neturi (jų automobilių
// knygos nėra), tad jiems visada naudojamas laisvas tekstas (carInfo) — nepakitęs elgesys.
function resolveCarSelection(clientId, carId, carInfoText) {
  if (carId) {
    const car = db.prepare('SELECT * FROM cars WHERE id = ?').get(carId);
    if (!car || car.client_id !== clientId) {
      const err = new Error('Automobilis nerastas arba jums nepriklauso');
      err.status = 400;
      throw err;
    }
    const label = `${car.make} ${car.model}${car.year ? ' (' + car.year + ')' : ''}`;
    return { carId: car.id, carInfo: label };
  }
  return { carId: null, carInfo: carInfoText || null };
}

// ── SUKURTI UŽKLAUSĄ (klientas aprašo bėdą) ──
router.post('/', authRequired, requireRole('client'), (req, res) => {
  const { categoryId, city, description, carInfo, carId } = req.body;
  if (!description || !city) return res.status(400).json({ error: 'Trūksta miesto arba aprašymo' });

  let resolvedCar;
  try {
    resolvedCar = resolveCarSelection(req.user.id, carId, carInfo);
  } catch (err) {
    return res.status(err.status || 400).json({ error: err.message });
  }

  const info = db.prepare(`
    INSERT INTO orders (client_id, category_id, city, description, car_info, car_id, status)
    VALUES (?, ?, ?, ?, ?, ?, 'new')
  `).run(req.user.id, categoryId || null, city, description, resolvedCar.carInfo, resolvedCar.carId);

  const order = getOrder(info.lastInsertRowid);
  res.status(201).json(order);

  // Fire-and-forget — pranešimai atitinkamiems servisams, niekada neblokuoja atsakymo.
  findMatchingServices(order.city, order.category_id).forEach((svc) => sendNewOrderEmail(svc, order));
});

// ── TIESIOGINIS REZERVAVIMAS: registruotas klientas renkasi KONKRETŲ servisą + laisvą laiką ──
// Skirtingai nuo broadcast srauto (kur service_id lieka null kol klientas išrenka iš kelių
// pasiūlymų), čia service_id žinomas IŠKART. Statusas paliekamas 'new' (NE 'in_progress') —
// laikas TAMPA UŽIMTAS tik kai servisas paspaudžia "Priimti klientą" (žr. POST /:id/accept-client),
// kuris pakeičia statusą į 'in_progress' — tą patį statusą, kurį jau tikrina esamas
// GET /services/:id/availability busy-skaičiavimas. Jokio naujo mokėjimo/užrakinimo mechanizmo.
router.post('/direct', authRequired, requireRole('client'), (req, res) => {
  if (req.user.guest) return res.status(403).json({ error: 'Tiesioginis rezervavimas galimas tik registruotiems klientams' });

  const { serviceId, categoryId, scheduledTime, comment, carId } = req.body;
  if (!serviceId) return res.status(400).json({ error: 'Trūksta serviso' });

  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId);
  if (!service || service.status !== 'active' || service.is_bot) {
    return res.status(404).json({ error: 'Servisas nerastas arba nepriima rezervacijų' });
  }

  // Laikas neprivalomas — leidžia klientui tiesiog PARAŠYTI konkrečiam servisui
  // (žr. "Naujas pokalbis" kliento paskyroje), nebūtinai rezervuoti konkretų laiką.
  if (scheduledTime) {
    const busy = db.prepare(`
      SELECT id FROM orders WHERE service_id = ? AND scheduled_time = ? AND status IN ('in_progress', 'done')
    `).get(serviceId, scheduledTime);
    if (busy) return res.status(409).json({ error: 'Šis laikas jau užimtas — pasirinkite kitą' });
  }

  let resolvedCar;
  try {
    resolvedCar = resolveCarSelection(req.user.id, carId, null);
  } catch (err) {
    return res.status(err.status || 400).json({ error: err.message });
  }

  const info = db.prepare(`
    INSERT INTO orders (client_id, service_id, category_id, city, description, car_info, car_id, status, order_type, scheduled_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'new', 'direct', ?)
  `).run(req.user.id, serviceId, categoryId || null, service.city, comment || null, resolvedCar.carInfo, resolvedCar.carId, scheduledTime || null);

  res.status(201).json(getOrder(info.lastInsertRowid));
});

// ── SERVISO SĄRAŠAS: naujos užklausos jo mieste/kategorijose + jam priskirtos ──
router.get('/', authRequired, requireRole('service'), (req, res) => {
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.user.id);
  const orders = db.prepare(`
    SELECT DISTINCT o.*, c.first_name, c.last_name, c.phone, c.email FROM orders o
    JOIN clients c ON c.id = o.client_id
    LEFT JOIN service_categories sc ON sc.category_id = o.category_id AND sc.service_id = ?
    WHERE o.service_id = ?
       OR (o.service_id IS NULL AND o.status IN ('new', 'pending', 'declined') AND o.city = ? AND (o.category_id IS NULL OR sc.service_id IS NOT NULL))
    ORDER BY o.created_at DESC
  `).all(req.user.id, req.user.id, service.city);

  // Telefonas/el.paštas — KONTAKTAI, atskleidžiami tik priėmus klientą (client_accepted_at,
  // žr. POST /:id/accept-client). Vardas kontaktu nelaikomas — lieka matomas visada, visiems.
  const withHiddenContacts = orders.map((o) => {
    if (o.service_id === req.user.id && o.client_accepted_at) return o;
    return { ...o, phone: null, email: null };
  });
  res.json(withHiddenContacts);
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
  const { price, message, availableTime } = req.body;
  const order = getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Užklausa nerasta' });
  if (order.status !== 'new' && order.status !== 'pending' && order.status !== 'declined') {
    return res.status(400).json({ error: 'Ši užklausa jau nebepriima pasiūlymų' });
  }

  db.prepare(`
    INSERT INTO order_messages (order_id, sender_type, sender_id, message, price_quote, available_time)
    VALUES (?, 'service', ?, ?, ?, ?)
  `).run(order.id, req.user.id, message || null, price || null, availableTime || null);

  if (order.status === 'new' || order.status === 'declined') {
    db.prepare("UPDATE orders SET status = 'pending' WHERE id = ?").run(order.id);
  }
  res.status(201).json(getOrder(order.id));

  // Fire-and-forget — pranešimas klientui apie naują kainos pasiūlymą, jei turi
  // el. paštą (šiuo metu dažniausiai tik registruoti klientai, ne svečiai — žr.
  // santrauka.md dėl svečių el. pašto lauko trūkumo).
  if (price) {
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(order.client_id);
    if (client) sendQuoteEmail(client, price);
  }
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

// ── SERVISAS "PRIIMA KLIENTĄ" — čia (NE kainos pasiūlyme, NE darbo užbaigime)
// nuskaitomas fiksuotas mokestis (žr. calculateContactFee). Tik TAS servisas, kurį
// klientas jau pasirinko (order.service_id), gali tai padaryti — tai automatiškai
// užtikrina išskirtinumą: kitiems servisams, kurie siūlė kainą, bet nebuvo pasirinkti,
// šis veiksmas apskritai nepasiekiamas, tad jie niekada negali "nupirkti" tos pačios
// užklausos. Kontaktų atskleidimas — kito žingsnio darbas, čia tik pati mokesčio logika.
router.post('/:id/accept-client', authRequired, requireRole('service'), (req, res) => {
  const order = getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Užklausa nerasta' });
  if (order.service_id !== req.user.id) return res.status(403).json({ error: 'Ši užklausa nepriskirta jūsų servisui' });
  if (order.client_accepted_at) return res.status(409).json({ error: 'Šis klientas jau priimtas' });

  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.user.id);
  const settings = db.prepare('SELECT * FROM admin_settings WHERE id = 1').get();
  const fee = calculateContactFee({ service, settings });

  // status='in_progress' čia užtikrina, kad tiesioginės rezervacijos (order_type='direct',
  // kurios iki šiol buvo status='new') laikas TAMPA UŽIMTAS kalendoriuje — žr.
  // GET /services/:id/availability busy-tikrinimą ir Žingsnis 6/6 santrauka.md. Broadcast
  // užklausoms tai jau buvo in_progress (nustatyta per POST /:id/accept), tad čia — no-op.
  db.prepare(`
    UPDATE orders SET client_accepted_at = datetime('now'), contact_fee_amount = ?, status = 'in_progress' WHERE id = ?
  `).run(fee, order.id);

  res.json(getOrder(order.id));
});

// ── SERVISAS ATSISAKO JAU PRIIMTO KLIENTO — mokestis NEGRĄŽINAMAS (kontaktai jau
// perduoti, tai buvo "prekė", už kurią sumokėta). Prieš išvalant orders eilutę,
// atsisakymo faktas (kas, kada, kodėl, kiek sumokėjo) PERMANENTLY įrašomas į
// order_declines — kitaip šis servisas prarastų savo mokesčio įrašą, kai KITAS
// servisas vėliau priims tą pačią (grąžintą) užklausą (žr. schema.sql komentarą).
// status='declined' (NE 'new' tiesiogiai) — atskiras, savo verte identifikuojamas
// statusas admin matomumui, bet funkciškai ELGIASI kaip 'new'/'pending' visur, kur
// servisai mato/siūlo kainą atviroms užklausoms (žr. GET /, POST /:id/quote aukščiau).
router.post('/:id/decline', authRequired, requireRole('service'), (req, res) => {
  const { reason } = req.body;
  if (!reason || !reason.trim()) return res.status(400).json({ error: 'Būtina nurodyti atsisakymo priežastį' });

  const order = getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Užklausa nerasta' });
  if (order.service_id !== req.user.id) return res.status(403).json({ error: 'Ši užklausa nepriskirta jūsų servisui' });
  if (order.status !== 'in_progress') return res.status(400).json({ error: 'Šią užklausą galima atsisakyti tik kol ji vykdoma' });
  if (!order.client_accepted_at) return res.status(400).json({ error: 'Atsisakyti galima tik jau priimto kliento' });

  db.prepare(`
    INSERT INTO order_declines (order_id, service_id, fee_amount, reason)
    VALUES (?, ?, ?, ?)
  `).run(order.id, req.user.id, order.contact_fee_amount || 0, reason.trim());

  db.prepare(`
    UPDATE orders SET status = 'declined', service_id = NULL, client_accepted_at = NULL,
      contact_fee_amount = NULL, scheduled_time = NULL, order_type = 'broadcast'
    WHERE id = ?
  `).run(order.id);

  const updated = getOrder(order.id);
  res.json(updated);

  // Fire-and-forget — klientui pranešimas apie atsisakymą + priežastį, ir visiems
  // tinkamiems to miesto/kategorijos servisams pranešimas, kad užklausa vėl laisva.
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(order.client_id);
  const decliningService = db.prepare('SELECT * FROM services WHERE id = ?').get(req.user.id);
  if (client && decliningService) sendServiceDeclinedEmail(client, decliningService, reason.trim());
  findMatchingServices(updated.city, updated.category_id).forEach((svc) => sendOrderReopenedEmail(svc, updated));
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
  const order = getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Užklausa nerasta' });
  if (req.user.role === 'client' && order.client_id !== req.user.id) {
    return res.status(403).json({ error: 'Ši užklausa jums nepriklauso' });
  }

  let messages = db.prepare('SELECT * FROM order_messages WHERE order_id = ? ORDER BY created_at ASC').all(order.id);

  // sender_name — vien informaciniam atvaizdavimui (kas parašė), ne privatumo sprendimas:
  // servisų pavadinimai jau vieši per GET /api/services, tad tai nieko naujo neatskleidžia.
  const client = db.prepare('SELECT first_name, last_name FROM clients WHERE id = ?').get(order.client_id);
  const clientName = client ? `${client.first_name || ''} ${client.last_name || ''}`.trim() : null;
  const serviceIds = [...new Set(messages.filter((m) => m.sender_type === 'service').map((m) => m.sender_id))];
  const serviceNames = {};
  if (serviceIds.length) {
    const placeholders = serviceIds.map(() => '?').join(',');
    db.prepare(`SELECT id, name FROM services WHERE id IN (${placeholders})`).all(...serviceIds)
      .forEach((s) => { serviceNames[s.id] = s.name; });
  }
  messages = messages.map((m) => ({
    ...m,
    sender_name: m.sender_type === 'client' ? clientName : (serviceNames[m.sender_id] || null),
  }));

  // Daugiavendorinis modelis — kelis servisai gali siūlyti kainą tai pačiai (dar
  // neuždarytai) užklausai. Pokalbio TEKSTAS matomas visiems tinkamiems servisams
  // (bendras, atviras pokalbis), bet KAINA ir SIŪLOMAS LAIKAS — konkurencinė
  // informacija — lieka privatūs: servisas mato tik savo pačio kainą/laiką,
  // konkuruojančio serviso žinutėse šie laukai redaguojami (null). Klientas mato viską.
  if (req.user.role === 'service') {
    // Kontaktų (telefono/el.pašto) filtras LAISVAME kliento žinutės tekste — apsauga nuo
    // platformos apėjimo (žr. Žingsnis 4/6 santrauka.md). Taikoma tik servisui, kuris DAR
    // NEPRIĖMĖ šio kliento; priėmus (client_accepted_at) tekstas rodomas pilnas, nefiltruotas.
    const hasAcceptedClient = order.service_id === req.user.id && !!order.client_accepted_at;
    messages = messages.map((m) => {
      let result = m;
      if (m.sender_type === 'service' && m.sender_id !== req.user.id) {
        result = { ...result, price_quote: null, available_time: null };
      }
      if (!hasAcceptedClient && m.sender_type === 'client') {
        result = { ...result, message: redactContacts(result.message) };
      }
      return result;
    });
  }

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
// Paaiškinimas (work_description) PRIVALOMAS — jis tampa serviso knygos įrašo pagrindu
// (Serviso knyga, Žingsnis 5/7). Kiti nauji laukai (pakeistos dalys/rida/garantija) neprivalomi.
router.post('/:id/complete', authRequired, requireRole('service'), (req, res) => {
  const { price, explanation, partsReplaced, mileage, warrantyUntil } = req.body;
  const order = getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Užklausa nerasta' });
  if (order.service_id !== req.user.id) return res.status(403).json({ error: 'Ši užklausa nepriskirta jūsų servisui' });
  if (!explanation || !explanation.trim()) return res.status(400).json({ error: 'Būtina aprašyti atliktus darbus' });

  const finalPrice = price != null ? price : order.price;
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.user.id);
  const settings = db.prepare('SELECT * FROM admin_settings WHERE id = 1').get();
  const commission = calculateCommission({ price: finalPrice, service, settings });

  db.prepare(`
    UPDATE orders SET status = 'done', price = ?, commission_amount = ?, completed_at = datetime('now')
    WHERE id = ?
  `).run(finalPrice, commission, order.id);

  // Serviso knygos įrašas TIK jei užklausa susieta su konkrečiu kliento automobiliu
  // (car_id) — svečio/laisvo teksto užklausoms nėra prie ko įrašo susieti.
  if (order.car_id) {
    db.prepare(`
      INSERT INTO service_book (car_id, order_id, service_id, category_id, work_description, parts_replaced, mileage, price, warranty_until)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      order.car_id, order.id, req.user.id, order.category_id,
      explanation.trim(), (partsReplaced && partsReplaced.trim()) || null,
      mileage != null && mileage !== '' ? Number(mileage) : null,
      finalPrice != null ? finalPrice : null,
      warrantyUntil || null
    );
  }

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
