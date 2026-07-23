const rateLimit = require('express-rate-limit');

// Apsauga nuo brute-force bandymų prisijungti/registruotis — 10 bandymų per 15 min iš vieno IP.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Per daug bandymų iš šio adreso. Bandykite vėl po 15 minučių.' },
});

// Apsauga AI diagnostikos endpoint'ui — kviečia mokamą Gemini API, tad limitas griežtesnis
// nei paprastam skaitymui, bet vis tiek pakankamas normaliam naudojimui (kelios užklausos per sesiją).
const diagnostikaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Per daug užklausų iš šio adreso. Bandykite vėl po 15 minučių.' },
});

// Papildoma apsauga nuo piktnaudžiavimo: jei IP per 15 min langą kelis kartus gauna
// "nesusijęs klausimas" atsakymą (t.y. bando naudoti diagnostiką kaip bendrą chat'ą),
// tas IP tame pačiame lange laikinai griežčiau apribojamas — toliau net nekviečiame Gemini.
const OFFTOPIC_WINDOW_MS = 15 * 60 * 1000;
const OFFTOPIC_THRESHOLD = 3;
const offTopicTracker = new Map(); // ip -> { count, windowStart }

function isIpTemporarilyRestricted(ip) {
  const entry = offTopicTracker.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.windowStart > OFFTOPIC_WINDOW_MS) {
    offTopicTracker.delete(ip);
    return false;
  }
  return entry.count >= OFFTOPIC_THRESHOLD;
}

function recordOffTopicHit(ip) {
  const entry = offTopicTracker.get(ip);
  if (!entry || Date.now() - entry.windowStart > OFFTOPIC_WINDOW_MS) {
    offTopicTracker.set(ip, { count: 1, windowStart: Date.now() });
  } else {
    entry.count += 1;
  }
}

module.exports = { authLimiter, diagnostikaLimiter, isIpTemporarilyRestricted, recordOffTopicHit };
