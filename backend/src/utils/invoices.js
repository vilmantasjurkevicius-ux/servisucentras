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
// jau apskaičiuotu orders.contact_fee_amount (kuris pats savaime jau atsižvelgė į God Mode
// jungiklį ir individualų trial'ą "Priimti klientą" metu) — čia nekartojame tos logikos,
// tiesiog agreguojame tai, kas jau realiai priskaičiuota. Laikotarpis skaičiuojamas pagal
// PRIĖMIMO (client_accepted_at), ne darbo užbaigimo, datą — mokestis juk atsiranda priėmimo
// momentu, nepriklausomai nuo to, ar/kada darbas bus užbaigtas. work_total čia — priimtų
// klientų SKAIČIUS (ne pinigų suma), nes fiksuoto mokesčio modelyje nebėra "darbų sumos".
// PASTABA: sumuojami ir order_declines įrašai (servisai, kurie priėmė, bet VĖLIAU atsisakė) —
// tas mokestis NEGRĄŽINAMAS, tad be šio sudėjimo jis niekada nepatektų į sąskaitą ir liktų
// nesurinktas (žr. "Serviso atsisakymas PO priėmimo" santrauka.md).
function refreshInvoices(period) {
  const rows = db.prepare(`
    SELECT s.id AS service_id,
      COALESCE(active.cnt, 0) + COALESCE(declined.cnt, 0) AS work_total,
      COALESCE(active.fee, 0) + COALESCE(declined.fee, 0) AS amount_due
    FROM services s
    LEFT JOIN (
      SELECT service_id, COUNT(id) AS cnt, SUM(contact_fee_amount) AS fee
      FROM orders WHERE client_accepted_at IS NOT NULL AND strftime('%Y-%m', client_accepted_at) = ?
      GROUP BY service_id
    ) active ON active.service_id = s.id
    LEFT JOIN (
      SELECT service_id, COUNT(id) AS cnt, SUM(fee_amount) AS fee
      FROM order_declines WHERE strftime('%Y-%m', declined_at) = ?
      GROUP BY service_id
    ) declined ON declined.service_id = s.id
    WHERE s.is_bot = 0 AND (active.cnt IS NOT NULL OR declined.cnt IS NOT NULL)
      AND (COALESCE(active.fee, 0) + COALESCE(declined.fee, 0)) > 0
  `).all(period, period);

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
