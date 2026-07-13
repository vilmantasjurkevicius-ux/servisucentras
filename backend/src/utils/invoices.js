const db = require('../db');

const LT_MONTHS = [
  'sausio', 'vasario', 'kovo', 'balandžio', 'gegužės', 'birželio',
  'liepos', 'rugpjūčio', 'rugsėjo', 'spalio', 'lapkričio', 'gruodžio',
];

function currentPeriod() {
  return new Date().toISOString().slice(0, 7); // 'YYYY-MM'
}

function periodLabelLt(period) {
  const [year, month] = period.split('-');
  return `${LT_MONTHS[parseInt(month, 10) - 1]} ${year}`;
}

// Perskaičiuoja ir įrašo/atnaujina service_invoices eilutes duotam laikotarpiui, remiantis
// jau apskaičiuotu orders.commission_amount (kuris pats savaime jau atsižvelgė į God Mode
// jungiklį ir individualų trial'ą užsakymo užbaigimo metu) — čia nekartojame tos logikos,
// tiesiog agreguojame tai, kas jau realiai priskaičiuota.
function refreshInvoices(period) {
  const rows = db.prepare(`
    SELECT s.id AS service_id,
      COALESCE(SUM(o.price), 0) AS work_total,
      COALESCE(SUM(o.commission_amount), 0) AS amount_due
    FROM services s
    JOIN orders o ON o.service_id = s.id AND o.status = 'done' AND strftime('%Y-%m', o.completed_at) = ?
    WHERE s.is_bot = 0
    GROUP BY s.id
    HAVING amount_due > 0
  `).all(period);

  const upsert = db.prepare(`
    INSERT INTO service_invoices (service_id, period, work_total, amount_due, status)
    VALUES (?, ?, ?, ?, 'unpaid')
    ON CONFLICT(service_id, period) DO UPDATE SET
      work_total = excluded.work_total,
      amount_due = excluded.amount_due
    WHERE service_invoices.status = 'unpaid'
  `);
  rows.forEach((r) => upsert.run(r.service_id, period, r.work_total, r.amount_due));

  return db.prepare(`
    SELECT si.*, s.name AS service_name, s.email AS service_email, s.owner_first_name
    FROM service_invoices si
    JOIN services s ON s.id = si.service_id
    WHERE si.period = ?
    ORDER BY si.amount_due DESC
  `).all(period);
}

module.exports = { refreshInvoices, currentPeriod, periodLabelLt };
