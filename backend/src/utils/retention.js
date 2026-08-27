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

// GDPR: "Kontaktai/Pagalba" pranešimų IP adresas — tik piktnaudžiavimo aptikimui
// trumpu laikotarpiu, todėl išvalomas po 90 d. Pati žinutė/statusas IŠLIEKA
// (admin istorijai), tik `sender_ip` išnyksta. `blocked_senders` NELIEČIAMA —
// tai saugumo priemonė, laikoma neribotai.
const SUPPORT_IP_RETENTION_DAYS = 90;

function purgeOldSupportIps() {
  const result = db.prepare(`
    UPDATE admin_support_messages SET sender_ip = NULL
    WHERE sender_ip IS NOT NULL AND created_at < datetime('now', '-${SUPPORT_IP_RETENTION_DAYS} days')
  `).run();
  if (result.changes > 0) {
    console.log(`[retention] Išvalyta ${result.changes} senesnių nei ${SUPPORT_IP_RETENTION_DAYS} d. pranešimų IP adresų (GDPR).`);
  }
  return result.changes;
}

function startRetentionSchedule() {
  purgeOldMessages();
  purgeOldSupportIps();
  setInterval(purgeOldMessages, 24 * 60 * 60 * 1000);
  setInterval(purgeOldSupportIps, 24 * 60 * 60 * 1000);
}

module.exports = { purgeOldMessages, purgeOldSupportIps, startRetentionSchedule, RETENTION_DAYS, SUPPORT_IP_RETENTION_DAYS };
