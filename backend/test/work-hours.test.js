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

async function registerService(name) {
  const reg = await api('POST', '/api/auth/service/register', {
    body: {
      name, email: `${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}-${Math.random()}@test.lt`,
      password: 'slaptas123', city: 'Vilnius', street: 'Testų g.', houseNumber: '1', postalCode: '00000',
    },
  });
  return { token: reg.data.token, id: reg.data.service.id };
}

test('pietų pertrauka: PATCH /services/me išsaugo lunch_start/lunch_end', async () => {
  const svc = await registerService('Pietus Servisas Saugoja');
  const patch = await api('PATCH', '/api/services/me', {
    token: svc.token,
    body: { lunchStart: '12:00', lunchEnd: '13:00' },
  });
  assert.equal(patch.status, 200);
  assert.equal(patch.data.lunch_start, '12:00');
  assert.equal(patch.data.lunch_end, '13:00');

  const me = await api('GET', '/api/services/me', { token: svc.token });
  assert.equal(me.data.lunch_start, '12:00');
  assert.equal(me.data.lunch_end, '13:00');
});

test('pietų pertrauka: GET /services/:id/availability NEPASIŪLO 12:00 sloto, kai lunch 12:00–13:00', async () => {
  const svc = await registerService('Pietus Servisas Availability');
  await api('PATCH', '/api/services/me', {
    token: svc.token,
    body: { lunchStart: '12:00', lunchEnd: '13:00' },
  });

  const avail = await api('GET', `/api/services/${svc.id}/availability?days=2`);
  assert.equal(avail.status, 200);
  const tomorrow = avail.data.days[1]; // rytojaus visos valandos garantuotai ateityje
  const times = tomorrow.slots.map((s) => s.time.split('T')[1]);
  assert.ok(times.includes('11:00'), '11:00 turi būti siūlomas (prieš pietus)');
  assert.equal(times.includes('12:00'), false, '12:00 (pietų metas) NETURI būti siūlomas');
  assert.ok(times.includes('13:00'), '13:00 turi būti siūlomas (po pietų)');
});

test('pietų pertrauka: išjungus (lunchStart/lunchEnd = null) 12:00 slotas vėl atsiranda', async () => {
  const svc = await registerService('Pietus Servisas Isjungimas');
  await api('PATCH', '/api/services/me', {
    token: svc.token,
    body: { lunchStart: '12:00', lunchEnd: '13:00' },
  });
  const before = await api('GET', `/api/services/${svc.id}/availability?days=2`);
  const beforeTimes = before.data.days[1].slots.map((s) => s.time.split('T')[1]);
  assert.equal(beforeTimes.includes('12:00'), false);

  await api('PATCH', '/api/services/me', {
    token: svc.token,
    body: { lunchStart: null, lunchEnd: null },
  });
  const after = await api('GET', `/api/services/${svc.id}/availability?days=2`);
  const afterTimes = after.data.days[1].slots.map((s) => s.time.split('T')[1]);
  assert.ok(afterTimes.includes('12:00'), 'išjungus pietų pertrauką, 12:00 slotas turi vėl atsirasti');
});
