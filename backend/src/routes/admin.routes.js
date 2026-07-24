const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authRequired, requireRole, signToken } = require('../middleware/auth');
const { trialEndDate } = require('../utils/commission');
const { authLimiter } = require('../middleware/rateLimit');
const { refreshInvoices, currentPeriod, periodLabelLt } = require('../utils/invoices');
const { disableOverlappingBots } = require('../utils/bots');

const router = express.Router();

// ── ADMIN PRISIJUNGIMAS ──
router.post('/login', authLimiter, (req, res) => {
  const { username, password } = req.body;
  const settings = db.prepare('SELECT * FROM admin_settings WHERE id = 1').get();
  if (!settings || username !== settings.admin_username || !bcrypt.compareSync(password || '', settings.admin_password_hash)) {
    return res.status(401).json({ error: 'Neteisingi duomenys' });
  }
  const token = signToken({ id: 1, role: 'admin' });
  res.json({ token });
});

router.use(authRequired, requireRole('admin'));

// ── DASHBOARD ──
router.get('/dashboard', (req, res) => {
  const totalClients = db.prepare('SELECT COUNT(*) AS n FROM clients').get().n;
  const activeServices = db.prepare("SELECT COUNT(*) AS n FROM services WHERE status = 'active'").get().n;
  const ordersToday = db.prepare("SELECT COUNT(*) AS n FROM orders WHERE date(created_at) = date('now')").get().n;
  const monthIncome = db.prepare(`
    SELECT COALESCE(SUM(commission_amount), 0) AS total FROM orders
    WHERE status = 'done' AND strftime('%Y-%m', completed_at) = strftime('%Y-%m', 'now')
  `).get().total;
  const totalIncome = db.prepare("SELECT COALESCE(SUM(commission_amount), 0) AS total FROM orders WHERE status = 'done'").get().total;
  const newOrders = db.prepare(`
    SELECT o.*, c.first_name, c.last_name FROM orders o
    JOIN clients c ON c.id = o.client_id
    ORDER BY o.created_at DESC LIMIT 10
  `).all();
  const newServices = db.prepare("SELECT * FROM services WHERE is_bot = 0 ORDER BY created_at DESC LIMIT 10")
    .all()
    .map(({ password_hash, ...rest }) => rest);

  res.json({ totalClients, activeServices, ordersToday, monthIncome, totalIncome, newOrders, newServices });
});

// ── KLIENTAI ──
router.get('/clients', (req, res) => {
  const { status } = req.query;
  const sql = status ? 'SELECT * FROM clients WHERE status = ? ORDER BY created_at DESC' : 'SELECT * FROM clients ORDER BY created_at DESC';
  const clients = status ? db.prepare(sql).all(status) : db.prepare(sql).all();
  res.json(clients.map(({ password_hash, ...rest }) => rest));
});

router.patch('/clients/:id/ban', (req, res) => {
  db.prepare("UPDATE clients SET status = 'banned' WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

router.patch('/clients/:id/unban', (req, res) => {
  db.prepare("UPDATE clients SET status = 'active' WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// Visiškas ištrynimas — skirtas testinių/klaidingų įrašų (pvz. typo el. paštu)
// tvarkymui. Saugumo sumetimais atsisako trinti, jei klientas jau turi bent
// vieną užklausą — tokiu atveju geriau naudoti ban, kad neprarastume realių
// verslo duomenų (užklausų/pokalbių istorijos).
router.delete('/clients/:id', (req, res) => {
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!client) return res.status(404).json({ error: 'Klientas nerastas' });

  const orderCount = db.prepare('SELECT COUNT(*) AS n FROM orders WHERE client_id = ?').get(client.id).n;
  if (orderCount > 0) {
    return res.status(409).json({ error: 'Šis klientas turi užklausų — naudokite užblokavimą (ban), ne ištrynimą' });
  }

  db.prepare('DELETE FROM clients WHERE id = ?').run(client.id);
  res.json({ ok: true });
});

// ── SERVISAI ──
router.get('/services', (req, res) => {
  const services = db.prepare('SELECT * FROM services ORDER BY created_at DESC').all();
  const settings = db.prepare('SELECT trial_months FROM admin_settings WHERE id = 1').get();
  const withStats = services.map((s) => {
    const { password_hash, ...rest } = s;
    const orderCount = db.prepare('SELECT COUNT(*) AS n FROM orders WHERE service_id = ?').get(s.id).n;
    const commissionTotal = db.prepare("SELECT COALESCE(SUM(commission_amount), 0) AS total FROM orders WHERE service_id = ? AND status = 'done'").get(s.id).total;
    return {
      ...rest,
      orderCount,
      commissionTotal,
      trialEndsAt: trialEndDate(s.registered_at, settings.trial_months).toISOString(),
    };
  });
  res.json(withStats);
});

// Registracija dabar iškart nustato 'active' (žr. auth.routes.js), tad šis
// endpoint'as realiai naudojamas retai (pvz. jei kada nors atsirastų servisas
// su 'pending' statusu iš kito šaltinio) — paliktas dėl suderinamumo/saugumo.
router.patch('/services/:id/approve', (req, res) => {
  db.prepare("UPDATE services SET status = 'active' WHERE id = ?").run(req.params.id);
  const botsDisabled = disableOverlappingBots(req.params.id);
  res.json({ ok: true, botsDisabled });
});

router.patch('/services/:id/ban', (req, res) => {
  db.prepare("UPDATE services SET status = 'banned' WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

router.patch('/services/:id/unban', (req, res) => {
  db.prepare("UPDATE services SET status = 'active' WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// ── UŽKLAUSOS ──
router.get('/orders', (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, c.first_name, c.last_name, s.name AS service_name FROM orders o
    JOIN clients c ON c.id = o.client_id
    LEFT JOIN services s ON s.id = o.service_id
    ORDER BY o.created_at DESC
  `).all();
  res.json(orders);
});

// ── NUSTATYMAI (God Mode) ──
router.get('/settings', (req, res) => {
  const { admin_password_hash, ...settings } = db.prepare('SELECT * FROM admin_settings WHERE id = 1').get();
  res.json(settings);
});

router.patch('/settings', (req, res) => {
  const {
    platformName, commissionMasterEnabled, commissionPercent, trialMonths, adminPassword,
    collectionMode, bankReceiver, bankIban,
  } = req.body;
  const fields = [];
  const params = [];
  if (platformName !== undefined) { fields.push('platform_name = ?'); params.push(platformName); }
  if (commissionMasterEnabled !== undefined) { fields.push('commission_master_enabled = ?'); params.push(commissionMasterEnabled ? 1 : 0); }
  if (commissionPercent !== undefined) { fields.push('commission_percent = ?'); params.push(commissionPercent); }
  if (trialMonths !== undefined) { fields.push('trial_months = ?'); params.push(trialMonths); }
  if (collectionMode !== undefined) { fields.push('collection_mode = ?'); params.push(collectionMode); }
  if (bankReceiver !== undefined) { fields.push('bank_receiver = ?'); params.push(bankReceiver); }
  if (bankIban !== undefined) { fields.push('bank_iban = ?'); params.push(bankIban); }
  if (adminPassword) { fields.push('admin_password_hash = ?'); params.push(bcrypt.hashSync(adminPassword, 10)); }

  if (fields.length) {
    db.prepare(`UPDATE admin_settings SET ${fields.join(', ')} WHERE id = 1`).run(...params);
  }
  const { admin_password_hash, ...settings } = db.prepare('SELECT * FROM admin_settings WHERE id = 1').get();
  res.json(settings);
});

// ── SĄSKAITOS (rankinis komisinio surinkimas, kol nėra Stripe) ──
router.get('/invoices', (req, res) => {
  const period = req.query.period || currentPeriod();
  res.json(refreshInvoices(period));
});

router.patch('/invoices/:id/pay', (req, res) => {
  const invoice = db.prepare('SELECT * FROM service_invoices WHERE id = ?').get(req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Sąskaita nerasta' });
  db.prepare("UPDATE service_invoices SET status = 'paid', paid_at = datetime('now') WHERE id = ?").run(invoice.id);
  res.json(db.prepare('SELECT * FROM service_invoices WHERE id = ?').get(invoice.id));
});

router.post('/invoices/generate-messages', (req, res) => {
  const period = req.body.period || currentPeriod();
  const invoices = refreshInvoices(period).filter((i) => i.status === 'unpaid');
  const settings = db.prepare('SELECT * FROM admin_settings WHERE id = 1').get();
  const receiver = settings.bank_receiver || '[ĮRAŠYKITE GAVĖJĄ Nustatymuose]';
  const iban = settings.bank_iban || '[ĮRAŠYKITE IBAN Nustatymuose]';
  const label = periodLabelLt(period);

  const messages = invoices.map((inv) => ({
    invoiceId: inv.id,
    serviceId: inv.service_id,
    serviceName: inv.service_name,
    message: `Sveiki, ${inv.service_name}!

Informuojame, kad ${label} mėn. patvirtintų darbų suma ServisuCentras.lt platformoje sudarė ${inv.work_total.toFixed(2)}€, o priskaičiuotas komisinis mokestis (${settings.commission_percent}% tarifu) sudaro ${inv.amount_due.toFixed(2)}€.

Prašome pervesti sumą:
Gavėjas: ${receiver}
IBAN: ${iban}
Mokėjimo paskirtis: ServisuCentras komisinis — ${inv.service_name}, ${period}

Klausimų atveju — susisiekite su mumis.

Ačiū už bendradarbiavimą!
ServisuCentras.lt`,
  }));
  res.json(messages);
});

// ── BOT SERVISAI (visi miestai) ──
router.get('/bots', (req, res) => {
  const bots = db.prepare("SELECT * FROM services WHERE is_bot = 1 ORDER BY id").all();
  const withCats = bots.map(({ password_hash, ...b }) => {
    const cats = db.prepare(`
      SELECT c.label FROM service_categories sc JOIN categories c ON c.id = sc.category_id WHERE sc.service_id = ?
    `).all(b.id);
    return { ...b, categories: cats.map((c) => c.label) };
  });
  res.json(withCats);
});

router.patch('/bots/:id/toggle', (req, res) => {
  const bot = db.prepare('SELECT * FROM services WHERE id = ? AND is_bot = 1').get(req.params.id);
  if (!bot) return res.status(404).json({ error: 'Bot servisas nerastas' });
  const newStatus = bot.status === 'active' ? 'inactive' : 'active';
  db.prepare('UPDATE services SET status = ? WHERE id = ?').run(newStatus, bot.id);
  res.json({ ok: true, status: newStatus });
});

router.post('/bots/toggle-all', (req, res) => {
  const anyActive = db.prepare("SELECT COUNT(*) AS n FROM services WHERE is_bot = 1 AND status = 'active'").get().n > 0;
  const newStatus = anyActive ? 'inactive' : 'active';
  db.prepare('UPDATE services SET status = ? WHERE is_bot = 1').run(newStatus);
  res.json({ ok: true, status: newStatus });
});

// Kai tikras servisas užsiregistruoja mieste+kategorijoje, atitinkamas bot servisas išjungiamas
router.post('/bots/replace', (req, res) => {
  const { botServiceId, realServiceId } = req.body;
  const bot = db.prepare('SELECT * FROM services WHERE id = ? AND is_bot = 1').get(botServiceId);
  const real = db.prepare('SELECT * FROM services WHERE id = ?').get(realServiceId);
  if (!bot || !real) return res.status(404).json({ error: 'Bot arba tikras servisas nerastas' });

  db.prepare("UPDATE services SET status = 'inactive' WHERE id = ?").run(bot.id);
  res.json({ ok: true });
});

module.exports = router;
