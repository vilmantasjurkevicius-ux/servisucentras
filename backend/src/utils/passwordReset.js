const crypto = require('crypto');

const RESET_TOKEN_TTL_MINUTES = 60;

function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Saugome tik SHA-256 tokeno maišą duomenų bazėje — jei DB nutekėtų, įrašai
// nenaudingi be originalaus tokeno, kuris egzistuoja tik el. laiške ir trumpai
// kliento pusėje.
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = { generateResetToken, hashToken, RESET_TOKEN_TTL_MINUTES };
