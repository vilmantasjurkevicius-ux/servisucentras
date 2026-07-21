const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawnServer } = require('./helpers');

let server;

before(async () => {
  server = await spawnServer();
});

after(async () => {
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

test('/api/health atsako ok', async () => {
  const { status, data } = await api('GET', '/api/health');
  assert.equal(status, 200);
  assert.equal(data.ok, true);
});

test('be tokeno admin endpoint atmetamas (401)', async () => {
  const { status } = await api('GET', '/api/admin/dashboard');
  assert.equal(status, 401);
});

test('neteisingas admin slaptažodis atmetamas (401)', async () => {
  const { status } = await api('POST', '/api/admin/login', { body: { username: 'admin', password: 'neteisingas' } });
  assert.equal(status, 401);
});

test('klientas negali kviesti serviso-only endpoint (403)', async () => {
  const clientReg = await api('POST', '/api/auth/client/register', {
    body: { firstName: 'Rolių', lastName: 'Testas', email: `roles-${Date.now()}@test.lt`, password: 'slaptas123' },
  });
  assert.equal(clientReg.status, 201);
  const { status } = await api('POST', '/api/orders/1/complete', { token: clientReg.data.token, body: { price: 50 } });
  assert.equal(status, 403);
});

test(
  'pilnas srautas: servisas patvirtinamas -> bot dingsta -> užklausa -> komisinis -> atsiliepimas',
  async () => {
    // --- Admin prisijungia ---
    const adminLogin = await api('POST', '/api/admin/login', { body: { username: 'admin', password: server.adminPassword } });
    assert.equal(adminLogin.status, 200);
    const adminToken = adminLogin.data.token;

    // --- Klientas registruojasi ---
    const clientReg = await api('POST', '/api/auth/client/register', {
      body: { firstName: 'Test', lastName: 'Klientas', email: `klientas-${Date.now()}@test.lt`, password: 'slaptas123', phone: '+37060000001' },
    });
    assert.equal(clientReg.status, 201);
    const clientToken = clientReg.data.token;

    // --- Servisas registruojasi tame pačiame mieste/kategorijoje kaip seed bot'as ---
    const svcReg = await api('POST', '/api/auth/service/register', {
      body: { name: 'Test Servisas Automatinis', email: `servisas-${Date.now()}@test.lt`, password: 'slaptas123', city: 'Vilnius', categoryIds: ['padangos'] },
    });
    assert.equal(svcReg.status, 201);
    assert.equal(svcReg.data.service.status, 'pending');
    const serviceToken = svcReg.data.token;
    const serviceId = svcReg.data.service.id;

    const beforeApprove = await api('GET', '/api/services?city=Vilnius');
    const botBefore = beforeApprove.data.find((s) => s.name === 'Sostinės Padangų Centras');
    assert.ok(botBefore, 'seed bot servisas turėtų egzistuoti Vilniuje');
    assert.equal(botBefore.status, 'active');

    // --- Admin patvirtina servisą — atitinkamas bot turi automatiškai išsijungti ---
    const approve = await api('PATCH', `/api/admin/services/${serviceId}/approve`, { token: adminToken });
    assert.equal(approve.status, 200);
    assert.ok(approve.data.botsDisabled >= 1, 'bent vienas bot servisas turėjo būti automatiškai išjungtas');

    // Viešas sąrašas pagal nutylėjimą rodo tik status=active, tad išjungtas bot'as turi visai dingti iš jo
    const afterApprove = await api('GET', '/api/services?city=Vilnius');
    const botAfter = afterApprove.data.find((s) => s.name === 'Sostinės Padangų Centras');
    assert.equal(botAfter, undefined, 'automatiškai išjungtas bot servisas nebeturi rodytis viešame aktyviame sąraše');

    const adminBots = await api('GET', '/api/admin/bots', { token: adminToken });
    const botStatusRow = adminBots.data.find((b) => b.name === 'Sostinės Padangų Centras');
    assert.equal(botStatusRow.status, 'inactive');

    // --- Klientas sukuria užklausą ---
    const orderCreate = await api('POST', '/api/orders', {
      token: clientToken,
      body: { categoryId: 'padangos', city: 'Vilnius', description: 'Reikia pakeisti padangas' },
    });
    assert.equal(orderCreate.status, 201);
    assert.equal(orderCreate.data.status, 'new');
    const orderId = orderCreate.data.id;

    // --- Servisas pasiūlo kainą ---
    const quote = await api('POST', `/api/orders/${orderId}/quote`, {
      token: serviceToken,
      body: { price: 100, message: 'Galime šiandien' },
    });
    assert.equal(quote.status, 201);
    assert.equal(quote.data.status, 'pending');

    // --- Klientas priima pasiūlymą ---
    const accept = await api('POST', `/api/orders/${orderId}/accept`, { token: clientToken, body: { serviceId } });
    assert.equal(accept.status, 200);
    assert.equal(accept.data.status, 'in_progress');
    assert.equal(accept.data.service_id, serviceId);

    // --- Servisas užbaigia darbą — naujam servisui galioja trial, komisinis turi būti 0 ---
    const complete = await api('POST', `/api/orders/${orderId}/complete`, { token: serviceToken, body: { price: 100 } });
    assert.equal(complete.status, 200);
    assert.equal(complete.data.status, 'done');
    assert.equal(complete.data.commission_amount, 0, 'naujam servisui trial periodu komisinis turi būti 0');

    // --- Klientas palieka atsiliepimą ---
    const review = await api('POST', `/api/orders/${orderId}/review`, { token: clientToken, body: { rating: 5, comment: 'Puikus darbas!' } });
    assert.equal(review.status, 201);
    assert.equal(review.data.rating, 5);

    // --- Antras atsiliepimas tai pačiai užklausai turi būti atmestas ---
    const reviewDup = await api('POST', `/api/orders/${orderId}/review`, { token: clientToken, body: { rating: 4 } });
    assert.equal(reviewDup.status, 409);

    // --- Serviso reitingas turėjo atsinaujinti ---
    const svcAfterReview = await api('GET', `/api/services/${serviceId}`);
    assert.equal(svcAfterReview.data.rating, 5);

    // --- Viešas atsiliepimų sąrašas ---
    const reviewsList = await api('GET', `/api/services/${serviceId}/reviews`);
    assert.equal(reviewsList.status, 200);
    assert.equal(reviewsList.data.length, 1);
    assert.equal(reviewsList.data[0].comment, 'Puikus darbas!');
  }
);

test('daugiavendorinis modelis: pokalbio tekstas matomas visiems, kaina ir laikas — tik savam servisui, klientas mato abu', async () => {
  const clientReg = await api('POST', '/api/auth/client/register', {
    body: { firstName: 'Palyginimo', lastName: 'Klientas', email: `palyginimas-${Date.now()}@test.lt`, password: 'slaptas123' },
  });
  const clientToken = clientReg.data.token;

  const svcAReg = await api('POST', '/api/auth/service/register', {
    body: { name: 'Servisas A', email: `svc-a-${Date.now()}@test.lt`, password: 'slaptas123', city: 'Kaunas', categoryIds: ['stabdziai'] },
  });
  const svcBReg = await api('POST', '/api/auth/service/register', {
    body: { name: 'Servisas B', email: `svc-b-${Date.now()}@test.lt`, password: 'slaptas123', city: 'Kaunas', categoryIds: ['stabdziai'] },
  });
  const tokenA = svcAReg.data.token;
  const tokenB = svcBReg.data.token;
  const idA = svcAReg.data.service.id;
  const idB = svcBReg.data.service.id;

  const orderCreate = await api('POST', '/api/orders', {
    token: clientToken,
    body: { categoryId: 'stabdziai', city: 'Kaunas', description: 'Girgžda stabdžiai' },
  });
  const orderId = orderCreate.data.id;

  await api('POST', `/api/orders/${orderId}/quote`, { token: tokenA, body: { price: 45, message: 'Galime rytoj', availableTime: '2026-07-22T09:00' } });
  await api('POST', `/api/orders/${orderId}/quote`, { token: tokenB, body: { price: 60, message: 'Galime šiandien', availableTime: '2026-07-21T15:00' } });

  const asA = await api('GET', `/api/orders/${orderId}/messages`, { token: tokenA });
  assert.equal(asA.data.length, 2, 'Servisas A turi matyti abiejų žinučių TEKSTĄ');
  const aOwn = asA.data.find((m) => m.sender_id === idA);
  const aRival = asA.data.find((m) => m.sender_id === idB);
  assert.equal(aOwn.price_quote, 45, 'savo kainą servisas A mato');
  assert.equal(aOwn.available_time, '2026-07-22T09:00', 'savo siūlomą laiką servisas A mato');
  assert.equal(aRival.message, 'Galime šiandien', 'konkurento TEKSTAS lieka matomas');
  assert.equal(aRival.price_quote, null, 'konkurento kaina paslėpta');
  assert.equal(aRival.available_time, null, 'konkurento siūlomas laikas paslėptas');

  const asB = await api('GET', `/api/orders/${orderId}/messages`, { token: tokenB });
  assert.equal(asB.data.length, 2, 'Servisas B turi matyti abiejų žinučių TEKSTĄ');
  const bOwn = asB.data.find((m) => m.sender_id === idB);
  const bRival = asB.data.find((m) => m.sender_id === idA);
  assert.equal(bOwn.price_quote, 60);
  assert.equal(bRival.price_quote, null, 'konkurento (A) kaina paslėpta servisui B');

  const asClient = await api('GET', `/api/orders/${orderId}/messages`, { token: clientToken });
  assert.equal(asClient.data.length, 2, 'Klientas turi matyti abu pasiūlymus, kad galėtų palyginti');
  assert.ok(asClient.data.every((m) => m.price_quote != null), 'klientui abi kainos matomos, niekas neredaguota');

  const otherClientReg = await api('POST', '/api/auth/client/register', {
    body: { firstName: 'Kitas', lastName: 'Klientas', email: `kitas-${Date.now()}@test.lt`, password: 'slaptas123' },
  });
  const asOtherClient = await api('GET', `/api/orders/${orderId}/messages`, { token: otherClientReg.data.token });
  assert.equal(asOtherClient.status, 403, 'svetimas klientas neturi matyti šios užklausos žinučių');
});
