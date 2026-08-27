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

  // Ankstesnis SVEČIO testas jau parašė iš to paties (testinio) IP prieš mažiau nei 30s —
  // pastumiame jo laiką atgal, kad naujoji svečio žinutė neužkliūtų už min. tarpo apsaugos.
  db.prepare("UPDATE admin_support_messages SET created_at = datetime('now', '-1 hour') WHERE sender_type = 'guest'").run();

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

async function registerFreshClient(label) {
  const email = `support-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.lt`;
  const reg = await api('POST', '/api/auth/client/register', {
    body: { firstName: label, lastName: 'Testas', email, password: 'slaptas123' },
  });
  return { token: reg.data.token, id: reg.data.client.id };
}

test('apsauga: viršijus 5 žinučių/val. limitą tam pačiam vartotojui, 6-a žinutė atmetama (429)', async () => {
  const client = await registerFreshClient('ratelimit');
  for (let i = 0; i < 5; i++) {
    db.prepare("INSERT INTO admin_support_messages (sender_type, sender_id, message) VALUES ('client', ?, ?)").run(client.id, `Užpildymo žinutė ${i}`);
  }
  const res = await api('POST', '/api/support/messages', { token: client.token, body: { message: 'Šešta žinutė' } });
  assert.equal(res.status, 429);
  assert.match(res.data.error, /Per daug/);
});

test('apsauga: mažiau nei 30s tarp dviejų žinučių iš to paties vartotojo atmetama (429)', async () => {
  const client = await registerFreshClient('mingap');
  const first = await api('POST', '/api/support/messages', { token: client.token, body: { message: 'Pirma žinutė' } });
  assert.equal(first.status, 201);
  const second = await api('POST', '/api/support/messages', { token: client.token, body: { message: 'Antra žinutė, iš karto po pirmos' } });
  assert.equal(second.status, 429);
  assert.match(second.data.error, /Palaukite/);
});

test('apsauga: pasikartojanti (identiška) žinutė atmetama, bet skirtinga praeina', async () => {
  const client = await registerFreshClient('duplikatas');
  db.prepare(`
    INSERT INTO admin_support_messages (sender_type, sender_id, message, created_at)
    VALUES ('client', ?, 'Pasikartojanti žinutė', datetime('now', '-5 minutes'))
  `).run(client.id);

  const repeated = await api('POST', '/api/support/messages', { token: client.token, body: { message: 'Pasikartojanti žinutė' } });
  assert.equal(repeated.status, 429);
  assert.match(repeated.data.error, /jau buvo išsiųsta/);

  const different = await api('POST', '/api/support/messages', { token: client.token, body: { message: 'Visiškai kita žinutė' } });
  assert.equal(different.status, 201);
});

test('apsauga: tas pats IP su 2+ KITAIS registruotais vartotojais pažymi žinutę flagged=1', async () => {
  db.prepare('DELETE FROM admin_support_messages').run();

  const clientA = await registerFreshClient('flagA');
  const resA = await api('POST', '/api/support/messages', { token: clientA.token, body: { message: 'Flag testas A' } });
  assert.equal(resA.status, 201);

  const clientB = await registerFreshClient('flagB');
  const resB = await api('POST', '/api/support/messages', { token: clientB.token, body: { message: 'Flag testas B' } });
  assert.equal(resB.status, 201);

  const clientC = await registerFreshClient('flagC');
  const resC = await api('POST', '/api/support/messages', { token: clientC.token, body: { message: 'Flag testas C' } });
  assert.equal(resC.status, 201);

  const adminLogin = await api('POST', '/api/admin/login', { body: { username: 'admin', password: server.adminPassword } });
  const adminToken = adminLogin.data.token;
  const list = await api('GET', '/api/admin/support-messages', { token: adminToken });

  const msgA = list.data.find((m) => m.message === 'Flag testas A');
  const msgC = list.data.find((m) => m.message === 'Flag testas C');
  assert.equal(msgA.flagged, 0, 'pirma žinutė iš IP — dar nėra kitų paskyrų, neturi būti flagged');
  assert.equal(msgC.flagged, 1, 'trečia žinutė iš to paties IP, jau 2 KITOS paskyros rašė — turi būti flagged');
});

test('admin gali blokuoti konkretų vartotojo ID — jo žinutės atmetamos (403), atblokavus vėl priimamos', async () => {
  const client = await registerFreshClient('blockuser');
  const before = await api('POST', '/api/support/messages', { token: client.token, body: { message: 'Prieš blokavimą' } });
  assert.equal(before.status, 201);

  const adminLogin = await api('POST', '/api/admin/login', { body: { username: 'admin', password: server.adminPassword } });
  const adminToken = adminLogin.data.token;
  const blocked = await api('POST', '/api/admin/blocked-senders', { token: adminToken, body: { type: 'client', value: client.id, reason: 'testas' } });
  assert.equal(blocked.status, 201);

  const during = await api('POST', '/api/support/messages', { token: client.token, body: { message: 'Po blokavimo' } });
  assert.equal(during.status, 403);
  assert.match(during.data.error, /negalite siųsti/);

  await api('DELETE', `/api/admin/blocked-senders/${blocked.data.id}`, { token: adminToken });
  const after = await api('POST', '/api/support/messages', { token: client.token, body: { message: 'Po atblokavimo, praėjus 30s+' } });
  // Vis dar per anksti (30s riba) — bet tai jau KITOKS atmetimas (429, ne 403), įrodantis, kad blokas pašalintas.
  assert.notEqual(after.status, 403);
});

test('admin gali blokuoti IP adresą — blokuoja VISUS siuntėjus nuo to IP, net naują paskyrą', async () => {
  const client1 = await registerFreshClient('blockip1');
  const res1 = await api('POST', '/api/support/messages', { token: client1.token, body: { message: 'Prieš IP blokavimą' } });
  assert.equal(res1.status, 201);

  const adminLogin = await api('POST', '/api/admin/login', { body: { username: 'admin', password: server.adminPassword } });
  const adminToken = adminLogin.data.token;
  const list = await api('GET', '/api/admin/support-messages', { token: adminToken });
  const row = list.data.find((m) => m.message === 'Prieš IP blokavimą');
  const ip = row.sender_ip;
  assert.ok(ip, 'sender_ip turi būti įrašytas');

  const blocked = await api('POST', '/api/admin/blocked-senders', { token: adminToken, body: { type: 'ip', value: ip } });
  assert.equal(blocked.status, 201);

  const client2 = await registerFreshClient('blockip2');
  const res2 = await api('POST', '/api/support/messages', { token: client2.token, body: { message: 'Nauja paskyra, tas pats IP' } });
  assert.equal(res2.status, 403, 'nauja paskyra nuo UŽBLOKUOTO IP taip pat turi būti atmesta');

  await api('DELETE', `/api/admin/blocked-senders/${blocked.data.id}`, { token: adminToken });
  const res3 = await api('POST', '/api/support/messages', { token: client2.token, body: { message: 'Po IP atblokavimo' } });
  assert.notEqual(res3.status, 403);
});

test('GET /api/admin/blocked-senders reikalauja admin tokeno ir grąžina sąrašą', async () => {
  const noAuth = await api('GET', '/api/admin/blocked-senders');
  assert.equal(noAuth.status, 401);

  const adminLogin = await api('POST', '/api/admin/login', { body: { username: 'admin', password: server.adminPassword } });
  const adminToken = adminLogin.data.token;
  const list = await api('GET', '/api/admin/blocked-senders', { token: adminToken });
  assert.equal(list.status, 200);
  assert.ok(Array.isArray(list.data));
});
