const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const { spawnServer } = require('./helpers');

let server;
let db;

before(async () => {
  server = await spawnServer();
  db = new DatabaseSync(server.dbPath);
  db.exec('PRAGMA busy_timeout = 3000');
});

after(async () => {
  db.close();
  await server.stop();
});

async function api(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${server.baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* tuščias atsakymas */ }
  return { status: res.status, data };
}

async function setupDoneOrder(label) {
  const svc = await api('POST', '/api/auth/service/register', {
    body: {
      name: `${label} Servisas`, email: `${label}-svc-${Date.now()}-${Math.random()}@test.lt`,
      password: 'slaptas123', city: 'Vilnius', street: 'Testų g.', houseNumber: '1', postalCode: '00000',
    },
  });
  const client = await api('POST', '/api/auth/client/register', {
    body: { firstName: label, lastName: 'Klientas', email: `${label}-klientas-${Date.now()}-${Math.random()}@test.lt`, password: 'slaptas123' },
  });
  // Užsakymas iškart perkeliamas į 'done' TIESIOGIAI per DB — testui nesvarbus visas
  // quote/accept/complete srautas, tik galutinė būsena, reikalinga atsiliepimui palikti.
  const info = db.prepare(`
    INSERT INTO orders (client_id, service_id, category_id, city, description, status, price)
    VALUES (?, ?, 'diagnostika', 'Vilnius', 'Testinis darbas', 'done', 50)
  `).run(client.data.client.id, svc.data.service.id);
  return { serviceId: svc.data.service.id, clientToken: client.data.token, orderId: Number(info.lastInsertRowid) };
}

test('atsiliepimo komentare rasti keiksmažodžiai — 400, atsiliepimas NESUKURIAMAS', async () => {
  const { clientToken, orderId, serviceId } = await setupDoneOrder('keiksmai');
  const rude = await api('POST', `/api/orders/${orderId}/review`, {
    token: clientToken, body: { rating: 1, comment: 'Šitas servisas yra šūdas, niekada nerekomenduosiu.' },
  });
  assert.equal(rude.status, 400);
  assert.match(rude.data.error, /netinkam/i);

  const reviews = await api('GET', `/api/services/${serviceId}/reviews`);
  assert.equal(reviews.data.length, 0, 'keiksmažodžius turintis atsiliepimas neturi būti išsaugotas');

  // Švarus komentaras TAI PAČIAI užklausai turi praeiti be problemų
  const clean = await api('POST', `/api/orders/${orderId}/review`, {
    token: clientToken, body: { rating: 3, comment: 'Vidutiniškai, bet padarė darbą laiku.' },
  });
  assert.equal(clean.status, 201);
});

test('admin gali ištrinti atsiliepimą, serviso reitingas perskaičiuojamas', async () => {
  const adminLogin = await api('POST', '/api/admin/login', { body: { username: 'admin', password: server.adminPassword } });
  const adminToken = adminLogin.data.token;

  const a = await setupDoneOrder('trynimas-a');
  await api('POST', `/api/orders/${a.orderId}/review`, { token: a.clientToken, body: { rating: 5 } });
  const b = await setupDoneOrder('trynimas-b');
  db.prepare('UPDATE orders SET service_id = ? WHERE id = ?').run(a.serviceId, b.orderId);
  await api('POST', `/api/orders/${b.orderId}/review`, { token: b.clientToken, body: { rating: 1, comment: 'Bloga patirtis' } });

  const svcAfterBoth = await api('GET', `/api/services/${a.serviceId}`);
  assert.equal(svcAfterBoth.data.rating, 3, 'vidurkis iš 5 ir 1 turi būti 3');

  const adminReviews = await api('GET', '/api/admin/reviews', { token: adminToken });
  const badReview = adminReviews.data.find((r) => r.comment === 'Bloga patirtis');
  assert.ok(badReview, 'admin turi matyti abu atsiliepimus prieš trinant');

  const del = await api('DELETE', `/api/admin/reviews/${badReview.id}`, { token: adminToken });
  assert.equal(del.status, 200);

  const svcAfterDelete = await api('GET', `/api/services/${a.serviceId}`);
  assert.equal(svcAfterDelete.data.rating, 5, 'po ištrynimo liko tik 5 žvaigždučių atsiliepimas');

  const adminReviewsAfter = await api('GET', '/api/admin/reviews', { token: adminToken });
  assert.equal(adminReviewsAfter.data.some((r) => r.id === badReview.id), false, 'ištrintas atsiliepimas neturi likti sąraše');

  const del404 = await api('DELETE', `/api/admin/reviews/${badReview.id}`, { token: adminToken });
  assert.equal(del404.status, 404, 'pakartotinis to paties atsiliepimo trynimas turi grąžinti 404');
});

test('be admin tokeno DELETE /admin/reviews/:id atmetamas (401)', async () => {
  const { status } = await api('DELETE', '/api/admin/reviews/1');
  assert.equal(status, 401);
});
