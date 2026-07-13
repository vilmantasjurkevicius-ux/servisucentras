// Trial ir God Mode komisinio skaičiavimas — žr. servisucentras-santrauka.md
// SQLite datetime('now') grąžina 'YYYY-MM-DD HH:MM:SS' (UTC, be zonos ženklo)
function parseSqliteDate(value) {
  return new Date(value.replace(' ', 'T') + 'Z');
}

function trialEndDate(registeredAt, trialMonths) {
  const d = parseSqliteDate(registeredAt);
  d.setUTCMonth(d.getUTCMonth() + trialMonths);
  return d;
}

function isInTrial(registeredAt, trialMonths, now = new Date()) {
  return now.getTime() < trialEndDate(registeredAt, trialMonths).getTime();
}

// Grąžina komisinio sumą už patvirtintą darbą, atsižvelgiant į God Mode master
// jungiklį ir individualų kiekvieno serviso trial laikotarpį.
function calculateCommission({ price, service, settings, now = new Date() }) {
  if (!price || price <= 0) return 0;
  if (!settings.commission_master_enabled) return 0;
  if (isInTrial(service.registered_at, settings.trial_months, now)) return 0;
  return Math.round(price * settings.commission_percent * 100) / 10000;
}

module.exports = { trialEndDate, isInTrial, calculateCommission };
