const db = require('../db');

// Susirašinėjimų (chat žinučių) saugojimo politika — 3 mėnesiai (90 dienų).
// Trinamos TIK order_messages eilutės (pati žinutės žinutė) — pati užklausa
// (orders) IŠLIEKA (istorijai, serviso knygai, atsiliepimams), tik chat tekstas
// išnyksta. Veikia VISIEMS pokalbiams vienodai — nepriklausomai, ar rašė
// svečias, registruotas klientas, ar servisas.
const RETENTION_DAYS = 90;

function purgeOldMessages() {
  const info = db.prepare(`DELETE FROM order_messages WHERE created_at < datetime('now', '-${RETENTION_DAYS} days')`).run();
  if (info.changes > 0) {
    console.log(`[retention] Pašalinta ${info.changes} senesnių nei ${RETENTION_DAYS} d. chat žinučių.`);
  }
  return info.changes;
}

function startRetentionSchedule() {
  purgeOldMessages();
  setInterval(purgeOldMessages, 24 * 60 * 60 * 1000);
}

module.exports = { purgeOldMessages, startRetentionSchedule, RETENTION_DAYS };
