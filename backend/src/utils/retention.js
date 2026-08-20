const db = require('../db');

// Susirašinėjimų (chat žinučių) saugojimo politika — 3 mėnesiai (90 dienų).
// Trinamos TIK žinučių eilutės (order_messages / service_chat_messages) — pati
// užklausa (orders) ar pokalbio įrašas (service_conversations) IŠLIEKA (istorijai,
// serviso knygai, atsiliepimams, admin "egzistavimo" peržiūrai), tik chat tekstas
// išnyksta. Veikia VISIEMS pokalbiams vienodai — nepriklausomai, ar rašė svečias,
// registruotas klientas, ar servisas (klientui ARBA kitam servisui).
const RETENTION_DAYS = 90;

function purgeOldMessages() {
  const orderMsgs = db.prepare(`DELETE FROM order_messages WHERE created_at < datetime('now', '-${RETENTION_DAYS} days')`).run();
  const serviceMsgs = db.prepare(`DELETE FROM service_chat_messages WHERE created_at < datetime('now', '-${RETENTION_DAYS} days')`).run();
  const total = orderMsgs.changes + serviceMsgs.changes;
  if (total > 0) {
    console.log(`[retention] Pašalinta ${total} senesnių nei ${RETENTION_DAYS} d. chat žinučių (${orderMsgs.changes} kliento, ${serviceMsgs.changes} servisų tarpusavio).`);
  }
  return total;
}

function startRetentionSchedule() {
  purgeOldMessages();
  setInterval(purgeOldMessages, 24 * 60 * 60 * 1000);
}

module.exports = { purgeOldMessages, startRetentionSchedule, RETENTION_DAYS };
