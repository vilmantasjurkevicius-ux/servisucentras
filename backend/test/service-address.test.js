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

test('registracija: trūkstant gatvės/namo nr./pašto kodo — 400', async () => {
  const { status, data } = await api('POST', '/api/auth/service/register', {
    body: { name: 'Be Adreso', email: `be-adreso-${Date.now()}@test.lt`, password: 'slaptas123', city: 'Vilnius' },
  });
  assert.equal(status, 400);
  assert.match(data.error, /adreso/i);
});

test('registracija: nei miesto, nei savivaldybės — 400', async () => {
  const { status, data } = await api('POST', '/api/auth/service/register', {
    body: {
      name: 'Be Miesto', email: `be-miesto-${Date.now()}@test.lt`, password: 'slaptas123',
      street: 'Testų g.', houseNumber: '1', postalCode: '00000',
    },
  });
  assert.equal(status, 400);
  assert.match(data.error, /miestą|savivaldybę/i);
});

test('kaimo servisas (tik municipality, be city) registruojasi ir yra randamas paieškoje pagal savivaldybės pavadinimą', async () => {
  const email = `kaimo-servisas-${Date.now()}@test.lt`;
  const reg = await api('POST', '/api/auth/service/register', {
    body: {
      name: 'Kaimo Servisas Dainava', email, password: 'slaptas123',
      street: 'Algirdų g.', houseNumber: '3', settlement: 'Dainava', municipality: 'Ukmergė', postalCode: '20001',
    },
  });
  assert.equal(reg.status, 201);
  assert.equal(reg.data.service.city, '', 'city turi likti tuščias, kai nurodyta tik municipality');
  assert.equal(reg.data.service.municipality, 'Ukmergė');
  assert.equal(reg.data.service.settlement, 'Dainava');

  // Klientas ieško "Ukmergė" — kaimo servisas TURI atsirasti, nors jo city='' (tik municipality='Ukmergė')
  const search = await api('GET', '/api/services?city=Ukmerg%C4%97');
  const found = search.data.find((s) => s.name === 'Kaimo Servisas Dainava');
  assert.ok(found, 'kaimo servisas su municipality="Ukmergė" turi rastis ieškant miesto "Ukmergė"');
});

test('miesto servisas IR kaimo (municipality) servisas abu atsiranda ieškant to paties miesto pavadinimo', async () => {
  const cityEmail = `miesto-servisas-${Date.now()}@test.lt`;
  const ruralEmail = `rajono-servisas-${Date.now()}@test.lt`;

  await api('POST', '/api/auth/service/register', {
    body: { name: 'Miesto Servisas Utena', email: cityEmail, password: 'slaptas123', street: 'Testų g.', houseNumber: '1', postalCode: '28001', city: 'Utena' },
  });
  await api('POST', '/api/auth/service/register', {
    body: { name: 'Rajono Servisas Utena', email: ruralEmail, password: 'slaptas123', street: 'Kaimo g.', houseNumber: '5', settlement: 'Užpaliai', postalCode: '28002', municipality: 'Utena' },
  });

  const search = await api('GET', '/api/services?city=Utena');
  assert.ok(search.data.some((s) => s.name === 'Miesto Servisas Utena'), 'miesto (city="Utena") servisas turi rastis');
  assert.ok(search.data.some((s) => s.name === 'Rajono Servisas Utena'), 'rajono (municipality="Utena") servisas TAIP PAT turi rastis');
});

test('servisas gali pasikeisti struktūrizuotą adresą per PATCH /services/me', async () => {
  const email = `patch-adresas-${Date.now()}@test.lt`;
  const reg = await api('POST', '/api/auth/service/register', {
    body: { name: 'Patch Adreso Testas', email, password: 'slaptas123', street: 'Sena g.', houseNumber: '1', postalCode: '00000', city: 'Vilnius' },
  });
  const token = reg.data.token;

  const patch = await api('PATCH', '/api/services/me', {
    token,
    body: { street: 'Nauja g.', houseNumber: '9', settlement: 'Dainava', municipality: 'Ukmergė', postalCode: '20003', city: '' },
  });
  assert.equal(patch.status, 200);
  assert.equal(patch.data.street, 'Nauja g.');
  assert.equal(patch.data.municipality, 'Ukmergė');
  assert.equal(patch.data.city, '');

  const search = await api('GET', '/api/services?city=Ukmerg%C4%97');
  assert.ok(search.data.some((s) => s.name === 'Patch Adreso Testas'), 'po pakeitimo servisas turi rastis pagal naują savivaldybę');
});

test('kaimo (municipality) servisas TAIP PAT gauna broadcast užklausą, ne tik miesto (city) servisas', async () => {
  const cityEmail = `miesto-gauna-${Date.now()}@test.lt`;
  const ruralEmail = `rajonas-gauna-${Date.now()}@test.lt`;

  const cityReg = await api('POST', '/api/auth/service/register', {
    body: { name: 'Gaunantis Miesto Servisas', email: cityEmail, password: 'slaptas123', street: 'Testų g.', houseNumber: '1', postalCode: '20001', city: 'Ukmergė' },
  });
  const ruralReg = await api('POST', '/api/auth/service/register', {
    body: { name: 'Gaunantis Rajono Servisas', email: ruralEmail, password: 'slaptas123', street: 'Kaimo g.', houseNumber: '2', settlement: 'Dainava', postalCode: '20002', municipality: 'Ukmergė' },
  });

  const clientReg = await api('POST', '/api/auth/client/register', {
    body: { firstName: 'Broadcast', lastName: 'Klientas', email: `broadcast-klientas-${Date.now()}@test.lt`, password: 'slaptas123' },
  });
  const order = await api('POST', '/api/orders', {
    token: clientReg.data.token,
    body: { city: 'Ukmergė', description: 'Broadcast testas — turi pasiekti IR miesto, IR rajono servisą' },
  });
  assert.equal(order.status, 201);

  const cityOrders = await api('GET', '/api/orders', { token: cityReg.data.token });
  assert.ok(cityOrders.data.some((o) => o.id === order.data.id), 'miesto (city="Ukmergė") servisas turi matyti broadcast užklausą');

  const ruralOrders = await api('GET', '/api/orders', { token: ruralReg.data.token });
  assert.ok(ruralOrders.data.some((o) => o.id === order.data.id), 'rajono (municipality="Ukmergė") servisas TAIP PAT turi matyti tą pačią broadcast užklausą');
});
