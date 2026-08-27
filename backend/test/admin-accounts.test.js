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

async function adminToken() {
  const login = await api('POST', '/api/admin/login', { body: { username: 'admin', password: server.adminPassword } });
  return login.data.token;
}

test('admin gali rankiniu būdu sukurti klientą — grąžinamas laikinas slaptažodis, kuriuo galima prisijungti', async () => {
  const token = await adminToken();
  const email = `admin-created-klientas-${Date.now()}@test.lt`;
  const res = await api('POST', '/api/admin/clients', { token, body: { firstName: 'Rankinis', lastName: 'Klientas', email, phone: '+37060011122' } });
  assert.equal(res.status, 201);
  assert.equal(res.data.client.email, email);
  assert.equal(res.data.client.status, 'active');
  assert.ok(res.data.tempPassword && res.data.tempPassword.length === 10);
  assert.equal(res.data.client.password_hash, undefined, 'password_hash niekada negrąžinamas atsakyme');

  const login = await api('POST', '/api/auth/client/login', { body: { email, password: res.data.tempPassword } });
  assert.equal(login.status, 200, 'sugeneruotu laikinu slaptažodžiu turi pavykti prisijungti');
});

test('admin negali sukurti kliento be el. pašto arba su jau užimtu el. paštu', async () => {
  const token = await adminToken();
  const noEmail = await api('POST', '/api/admin/clients', { token, body: { firstName: 'Be Pašto' } });
  assert.equal(noEmail.status, 400);

  const email = `admin-created-dubl-${Date.now()}@test.lt`;
  await api('POST', '/api/admin/clients', { token, body: { email } });
  const dup = await api('POST', '/api/admin/clients', { token, body: { email } });
  assert.equal(dup.status, 409);
});

test('be admin tokeno POST /admin/clients atmetamas (401)', async () => {
  const res = await api('POST', '/api/admin/clients', { body: { email: 'x@test.lt' } });
  assert.equal(res.status, 401);
});

test('admin gali rankiniu būdu sukurti servisą — iškart aktyvus, grąžinamas laikinas slaptažodis', async () => {
  const token = await adminToken();
  const email = `admin-created-servisas-${Date.now()}@test.lt`;
  const res = await api('POST', '/api/admin/services', {
    token,
    body: { name: 'Rankinis Servisas', email, city: 'Vilnius', street: 'Gedimino pr.', houseNumber: '1', postalCode: 'LT-01103' },
  });
  assert.equal(res.status, 201);
  assert.equal(res.data.service.email, email);
  assert.equal(res.data.service.status, 'active');
  assert.equal(res.data.service.is_bot, 0);
  assert.ok(res.data.tempPassword && res.data.tempPassword.length === 10);

  const login = await api('POST', '/api/auth/service/login', { body: { email, password: res.data.tempPassword } });
  assert.equal(login.status, 200);
});

test('admin gali sukurti KAIMO (municipality, be city) servisą', async () => {
  const token = await adminToken();
  const email = `admin-created-kaimas-${Date.now()}@test.lt`;
  const res = await api('POST', '/api/admin/services', {
    token,
    body: { name: 'Kaimo Servisas', email, municipality: 'Ukmergės r.', street: 'Sodų g.', houseNumber: '5', postalCode: 'LT-20000' },
  });
  assert.equal(res.status, 201);
  assert.equal(res.data.service.municipality, 'Ukmergės r.');
});

test('admin negali sukurti serviso be adreso arba be miesto/savivaldybės', async () => {
  const token = await adminToken();
  const email = `admin-created-badaddr-${Date.now()}@test.lt`;

  const noAddress = await api('POST', '/api/admin/services', { token, body: { name: 'X', email, city: 'Vilnius' } });
  assert.equal(noAddress.status, 400);

  const noCityNoMuni = await api('POST', '/api/admin/services', { token, body: { name: 'X', email, street: 'A g.', houseNumber: '1', postalCode: 'LT-00000' } });
  assert.equal(noCityNoMuni.status, 400);
});

test('be admin tokeno POST /admin/services atmetamas (401)', async () => {
  const res = await api('POST', '/api/admin/services', { body: { name: 'X', email: 'x@test.lt' } });
  assert.equal(res.status, 401);
});
