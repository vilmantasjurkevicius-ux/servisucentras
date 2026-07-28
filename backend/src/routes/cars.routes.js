const express = require('express');
const db = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

// Serviso knyga (Žingsnis 2/7) — TIK registruotiems (ne svečio) klientams, kaip ir
// mano-paskyra.html pati (žr. Žingsnis 1/7 santrauka.md). Svečiai taip pat turi
// clientToken (per POST /auth/guest), tad tikriname JWT "guest" požymį, ne vien rolę.
function requireRegisteredClient(req, res, next) {
  if (req.user.guest) return res.status(403).json({ error: 'Ši funkcija skirta tik registruotiems klientams' });
  next();
}

router.get('/me', authRequired, requireRole('client'), requireRegisteredClient, (req, res) => {
  const cars = db.prepare('SELECT * FROM cars WHERE client_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(cars);
});

router.post('/', authRequired, requireRole('client'), requireRegisteredClient, (req, res) => {
  const { make, model, year, engine, fuelType, plateNumber, vin } = req.body;
  if (!make || !model) return res.status(400).json({ error: 'Trūksta markės arba modelio' });

  const info = db.prepare(`
    INSERT INTO cars (client_id, make, model, year, engine, fuel_type, plate_number, vin)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, make, model, year || null, engine || null, fuelType || null, plateNumber || null, vin || null);

  res.status(201).json(db.prepare('SELECT * FROM cars WHERE id = ?').get(info.lastInsertRowid));
});

router.patch('/:id', authRequired, requireRole('client'), requireRegisteredClient, (req, res) => {
  const car = db.prepare('SELECT * FROM cars WHERE id = ?').get(req.params.id);
  if (!car) return res.status(404).json({ error: 'Automobilis nerastas' });
  if (car.client_id !== req.user.id) return res.status(403).json({ error: 'Šis automobilis jums nepriklauso' });

  const allowed = {
    make: 'make', model: 'model', year: 'year', engine: 'engine',
    fuelType: 'fuel_type', plateNumber: 'plate_number', vin: 'vin',
  };
  const fields = [];
  const params = [];
  for (const [bodyKey, col] of Object.entries(allowed)) {
    if (req.body[bodyKey] !== undefined) {
      fields.push(`${col} = ?`);
      params.push(req.body[bodyKey] || null);
    }
  }
  if (fields.length) {
    params.push(car.id);
    db.prepare(`UPDATE cars SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  }
  res.json(db.prepare('SELECT * FROM cars WHERE id = ?').get(car.id));
});

router.delete('/:id', authRequired, requireRole('client'), requireRegisteredClient, (req, res) => {
  const car = db.prepare('SELECT * FROM cars WHERE id = ?').get(req.params.id);
  if (!car) return res.status(404).json({ error: 'Automobilis nerastas' });
  if (car.client_id !== req.user.id) return res.status(403).json({ error: 'Šis automobilis jums nepriklauso' });

  db.prepare('DELETE FROM cars WHERE id = ?').run(car.id);
  res.json({ ok: true });
});

// Serviso knygos istorija (Žingsnis 5/7) — chronologiškai, naujausi viršuje.
router.get('/:id/service-book', authRequired, requireRole('client'), requireRegisteredClient, (req, res) => {
  const car = db.prepare('SELECT * FROM cars WHERE id = ?').get(req.params.id);
  if (!car) return res.status(404).json({ error: 'Automobilis nerastas' });
  if (car.client_id !== req.user.id) return res.status(403).json({ error: 'Šis automobilis jums nepriklauso' });

  const entries = db.prepare(`
    SELECT sb.*, s.name AS service_name
    FROM service_book sb
    JOIN services s ON s.id = sb.service_id
    WHERE sb.car_id = ?
    ORDER BY sb.service_date DESC
  `).all(car.id);
  res.json(entries);
});

module.exports = router;
