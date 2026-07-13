const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
  throw new Error(
    'Trūksta JWT_SECRET aplinkos kintamojo. Sukurkite backend/.env failą (žr. .env.example) ir '
    + 'įrašykite JWT_SECRET — sugeneruoti galite komanda: '
    + 'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
  );
}
const JWT_SECRET = process.env.JWT_SECRET;

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Trūksta prisijungimo tokeno' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Negaliojantis arba pasibaigęs tokenas' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Neturite teisių šiam veiksmui' });
    }
    next();
  };
}

module.exports = { signToken, authRequired, requireRole, JWT_SECRET };
