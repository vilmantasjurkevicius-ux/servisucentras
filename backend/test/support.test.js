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

test('tuščia žinutė atmetama su 400', async () => {
  const res = await api('POST', '/api/support/messages', { body: { message: '   ' } });
  assert.equal(res.status, 400);
});

test('SVEČIAS (be tokeno) gali parašyti pranešimą su savo vardu/kontaktu', async () => {
  const res = await api('POST', '/api/support/messages', {
    body: { message: 'Sveiki, turiu klausimą apie registraciją', name: 'Jonas Jonaitis', phone: '+37060011122' },
  });
  assert.equal(res.status, 201);

  const adminLogin = await api('POST', '/api/admin/login', { body: { username: 'admin', password: server.adminPassword } });
  const adminToken = adminLogin.data.token;
  const list = await api('GET', '/api/admin/support-messages', { token: adminToken });
  const found = list.data.find((m) => m.message === 'Sveiki, turiu klausimą apie registraciją');
  assert.ok(found);
  assert.equal(found.sender_type, 'guest');
  assert.equal(found.sender_id, null);
  assert.equal(found.sender_name, 'Jonas Jonaitis');
  assert.equal(found.sender_phone, '+37060011122');
  assert.equal(found.status, 'new');
});

test('KLIENTAS prisijungęs — pranešimas automatiškai pažymimas jo vardu/el.paštu', async () => {
  const email = `support-klientas-${Date.now()}@test.lt`;
  const reg = await api('POST', '/api/auth/client/register', {
    body: { firstName: 'Support', lastName: 'Klientas', email, password: 'slaptas123' },
  });
  const clientToken = reg.data.token;

  const res = await api('POST', '/api/support/messages', {
    token: clientToken, body: { message: 'Kliento pranešimas admin\'ui' },
  });
  assert.equal(res.status, 201);

  const adminLogin = await api('POST', '/api/admin/login', { body: { username: 'admin', password: server.adminPassword } });
  const adminToken = adminLogin.data.token;
  const list = await api('GET', '/api/admin/support-messages', { token: adminToken });
  const found = list.data.find((m) => m.message === 'Kliento pranešimas admin\'ui');
  assert.ok(found);
  assert.equal(found.sender_type, 'client');
  assert.equal(found.sender_id, reg.data.client.id);
  assert.equal(found.sender_name, 'Support Klientas');
  assert.equal(found.sender_email, email);
});

test('SERVISAS prisijungęs — pranešimas automatiškai pažymimas jo pavadinimu/el.paštu', async () => {
  const email = `support-servisas-${Date.now()}@test.lt`;
  const reg = await api('POST', '/api/auth/service/register', {
    body: { name: 'Support Servisas', email, password: 'slaptas123', city: 'Vilnius', street: 'Testų g.', houseNumber: '1', postalCode: '00000' },
  });
  const serviceToken = reg.data.token;

  const res = await api('POST', '/api/support/messages', {
    token: serviceToken, body: { message: 'Serviso pranešimas admin\'ui' },
  });
  assert.equal(res.status, 201);

  const adminLogin = await api('POST', '/api/admin/login', { body: { username: 'admin', password: server.adminPassword } });
  const adminToken = adminLogin.data.token;
  const list = await api('GET', '/api/admin/support-messages', { token: adminToken });
  const found = list.data.find((m) => m.message === 'Serviso pranešimas admin\'ui');
  assert.ok(found);
  assert.equal(found.sender_type, 'service');
  assert.equal(found.sender_id, reg.data.service.id);
  assert.equal(found.sender_name, 'Support Servisas');
  assert.equal(found.sender_email, email);
});

test('admin gali filtruoti pagal siuntėjo tipą ir keisti statusą', async () => {
  const adminLogin = await api('POST', '/api/admin/login', { body: { username: 'admin', password: server.adminPassword } });
  const adminToken = adminLogin.data.token;

  await api('POST', '/api/support/messages', { body: { message: 'Filtro testo žinutė', name: 'Filtro Svečias' } });

  const filtered = await api('GET', '/api/admin/support-messages?type=guest', { token: adminToken });
  assert.ok(filtered.data.every((m) => m.sender_type === 'guest'));
  const target = filtered.data.find((m) => m.message === 'Filtro testo žinutė');
  assert.ok(target);

  const updated = await api('PATCH', `/api/admin/support-messages/${target.id}`, { token: adminToken, body: { status: 'resolved' } });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.status, 'resolved');

  const badStatus = await api('PATCH', `/api/admin/support-messages/${target.id}`, { token: adminToken, body: { status: 'not-a-status' } });
  assert.equal(badStatus.status, 400);
});

test('be admin tokeno GET/PATCH support-messages atmetami (401)', async () => {
  const listRes = await api('GET', '/api/admin/support-messages');
  assert.equal(listRes.status, 401);
  const patchRes = await api('PATCH', '/api/admin/support-messages/1', { body: { status: 'resolved' } });
  assert.equal(patchRes.status, 401);
});
