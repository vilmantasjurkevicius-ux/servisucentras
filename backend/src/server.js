const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const servicesRoutes = require('./routes/services.routes');
const clientsRoutes = require('./routes/clients.routes');
const ordersRoutes = require('./routes/orders.routes');
const adminRoutes = require('./routes/admin.routes');
const categoriesRoutes = require('./routes/categories.routes');

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5500,http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const app = express();
app.use(cors({
  origin(origin, callback) {
    // origin nebūna nustatytas ne-naršyklės kvietimams (curl, serveris-serveriui) — juos leidžiame,
    // nes CORS apsauga apskritai skirta tik naršyklės JS apribojimams, ne serverio-lygio autentifikacijai.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS: šis domenas neleidžiamas'));
    }
  },
}));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoriesRoutes);

// Statiniai HTML/CSS/JS failai projekto šaknyje (vienas viešas adresas — ir API, ir frontend'as)
const STATIC_ROOT = path.join(__dirname, '..', '..');
app.use(express.static(STATIC_ROOT));
app.get('/', (req, res) => res.sendFile(path.join(STATIC_ROOT, 'servisucentras-pagrindinis.html')));

app.use((req, res) => res.status(404).json({ error: 'Endpoint nerastas' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (String(err.message).startsWith('CORS:')) {
    return res.status(403).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Serverio klaida' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ServisuCentras backend veikia: http://localhost:${PORT}`));
