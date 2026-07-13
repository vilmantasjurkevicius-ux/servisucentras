const rateLimit = require('express-rate-limit');

// Apsauga nuo brute-force bandymų prisijungti/registruotis — 10 bandymų per 15 min iš vieno IP.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Per daug bandymų iš šio adreso. Bandykite vėl po 15 minučių.' },
});

module.exports = { authLimiter };
