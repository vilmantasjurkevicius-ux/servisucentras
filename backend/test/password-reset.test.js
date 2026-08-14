const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const { spawnServer } = require('./helpers');
const { hashToken, generateResetToken } = require('../src/utils/passwordReset');

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

function insertResetToken({ role, accountId, rawToken, expiresInMinutes, usedAt = null }) {
  db.prepare(`
    INSERT INTO password_reset_tokens (role, account_id, token_hash, expires_at, used_at)
    VALUES (?, ?, ?, datetime('now', ?), ?)
  `).run(role, accountId, hashToken(rawToken), `${expiresInMinutes} minutes`, usedAt);
}

test('hashToken: deterministinis, generateResetToken: unikalus', () => {
  const t1 = generateResetToken();
  const t2 = generateResetToken();
  assert.notEqual(t1, t2);
  assert.equal(hashToken(t1), hashToken(t1));
  assert.notEqual(hashToken(t1), hashToken(t2));
});

test('forgot-password: nežinomas el. paštas grąžina tą pačią bendrą žinutę (be "enumeration")', async () => {
  const { status, data } = await api('POST', '/api/auth/forgot-password', { body: { role: 'client', email: 'nera-tokio@nera.lt' } });
  assert.equal(status, 200);
  assert.match(data.message, /Jei toks el\. paštas registruotas/);
});

test('forgot-password: žinomam servisui sukuria token įrašą DB', async () => {
  const email = `reset-test-${Date.now()}@example.com`;
  const reg = await api('POST', '/api/auth/service/register', { body: { name: 'Reset Testas', email, password: 'senasSlaptas1', city: 'Vilnius' } });
  assert.equal(reg.status, 201);
  const serviceId = reg.data.service.id;

  const { status, data } = await api('POST', '/api/auth/forgot-password', { body: { role: 'service', email } });
  assert.equal(status, 200);
  assert.match(data.message, /Jei toks el\. paštas registruotas/);

  const row = db.prepare('SELECT * FROM password_reset_tokens WHERE role = ? AND account_id = ? ORDER BY id DESC LIMIT 1').get('service', serviceId);
  assert.ok(row, 'tikėtasi naujo password_reset_tokens įrašo');
  assert.equal(row.used_at, null);
});

test('reset-password: galiojantis tokenas pakeičia slaptažodį, senas nebeveikia, naujas veikia', async () => {
  const email = `reset-flow-${Date.now()}@example.com`;
  const reg = await api('POST', '/api/auth/service/register', { body: { name: 'Reset Flow', email, password: 'senasSlaptas1', city: 'Kaunas' } });
  const serviceId = reg.data.service.id;

  const rawToken = generateResetToken();
  insertResetToken({ role: 'service', accountId: serviceId, rawToken, expiresInMinutes: 60 });

  const reset = await api('POST', '/api/auth/reset-password', { body: { token: rawToken, newPassword: 'naujasSlaptas2' } });
  assert.equal(reset.status, 200);

  const oldLogin = await api('POST', '/api/auth/service/login', { body: { email, password: 'senasSlaptas1' } });
  assert.equal(oldLogin.status, 401);

  const newLogin = await api('POST', '/api/auth/service/login', { body: { email, password: 'naujasSlaptas2' } });
  assert.equal(newLogin.status, 200);
});

test('reset-password: tokeną galima panaudoti tik vieną kartą', async () => {
  const email = `reset-once-${Date.now()}@example.com`;
  const reg = await api('POST', '/api/auth/client/register', { body: { email, password: 'pirmasSlaptas1' } });
  const clientId = reg.data.client.id;

  const rawToken = generateResetToken();
  insertResetToken({ role: 'client', accountId: clientId, rawToken, expiresInMinutes: 60 });

  const first = await api('POST', '/api/auth/reset-password', { body: { token: rawToken, newPassword: 'antrasSlaptas2' } });
  assert.equal(first.status, 200);

  const second = await api('POST', '/api/auth/reset-password', { body: { token: rawToken, newPassword: 'trecsiasSlaptas3' } });
  assert.equal(second.status, 400);
});

test('reset-password: pasibaigęs tokenas atmetamas', async () => {
  const email = `reset-expired-${Date.now()}@example.com`;
  const reg = await api('POST', '/api/auth/client/register', { body: { email, password: 'pirmasSlaptas1' } });
  const clientId = reg.data.client.id;

  const rawToken = generateResetToken();
  insertResetToken({ role: 'client', accountId: clientId, rawToken, expiresInMinutes: -5 });

  const { status } = await api('POST', '/api/auth/reset-password', { body: { token: rawToken, newPassword: 'naujasSlaptas2' } });
  assert.equal(status, 400);
});

test('reset-password: neegzistuojantis tokenas atmetamas', async () => {
  const { status } = await api('POST', '/api/auth/reset-password', { body: { token: 'visiskai-negaliojantis-tokenas', newPassword: 'naujasSlaptas2' } });
  assert.equal(status, 400);
});

test('reset-password: per trumpas naujas slaptažodis atmetamas', async () => {
  const { status } = await api('POST', '/api/auth/reset-password', { body: { token: 'betkoks', newPassword: 'trumpas' } });
  assert.equal(status, 400);
});

test('change-password (client): neteisingas dabartinis slaptažodis atmetamas su 400, ne 401', async () => {
  // 401 čia BŪTŲ KLAIDA — frontend'o bendras apiRequest() bet kokį 401 supranta kaip
  // "sesija baigėsi" ir IŠKART atjungia vartotoją (žr. mano-paskyra.html/automeistrai-
  // dashboard.html redirectToLogin()), taigi vartotojas niekada nepamatytų šios klaidos
  // žinutės — tik būtų tyliai išmestas atgal į prisijungimo langą. Realus bug'as,
  // rastas vartotojo gyvai: "keičiu slaptažodį, jis neišsaugo, lieka senas".
  const email = `chpw-client-${Date.now()}@example.com`;
  const reg = await api('POST', '/api/auth/client/register', { body: { email, password: 'pirmasSlaptas1' } });
  const { status } = await api('PATCH', '/api/clients/me/password', {
    token: reg.data.token,
    body: { currentPassword: 'neteisingas', newPassword: 'naujasSlaptas2' },
  });
  assert.equal(status, 400);
});

test('change-password (service): neteisingas dabartinis slaptažodis atmetamas su 400, ne 401', async () => {
  const email = `chpw-service-wrong-${Date.now()}@example.com`;
  const reg = await api('POST', '/api/auth/service/register', { body: { name: 'Wrong PW Servisas', email, password: 'pirmasSlaptas1', city: 'Šiauliai' } });
  const { status } = await api('PATCH', '/api/services/me/password', {
    token: reg.data.token,
    body: { currentPassword: 'neteisingas', newPassword: 'naujasSlaptas2' },
  });
  assert.equal(status, 400);
});

test('change-password (client): teisingas srautas pakeičia slaptažodį', async () => {
  const email = `chpw-client-ok-${Date.now()}@example.com`;
  const reg = await api('POST', '/api/auth/client/register', { body: { email, password: 'pirmasSlaptas1' } });
  const { status } = await api('PATCH', '/api/clients/me/password', {
    token: reg.data.token,
    body: { currentPassword: 'pirmasSlaptas1', newPassword: 'naujasSlaptas2' },
  });
  assert.equal(status, 200);

  const oldLogin = await api('POST', '/api/auth/client/login', { body: { email, password: 'pirmasSlaptas1' } });
  assert.equal(oldLogin.status, 401);
  const newLogin = await api('POST', '/api/auth/client/login', { body: { email, password: 'naujasSlaptas2' } });
  assert.equal(newLogin.status, 200);
});

test('change-password (service): teisingas srautas pakeičia slaptažodį', async () => {
  const email = `chpw-service-ok-${Date.now()}@example.com`;
  const reg = await api('POST', '/api/auth/service/register', { body: { name: 'Change PW Servisas', email, password: 'pirmasSlaptas1', city: 'Klaipėda' } });
  const { status } = await api('PATCH', '/api/services/me/password', {
    token: reg.data.token,
    body: { currentPassword: 'pirmasSlaptas1', newPassword: 'naujasSlaptas2' },
  });
  assert.equal(status, 200);

  const newLogin = await api('POST', '/api/auth/service/login', { body: { email, password: 'naujasSlaptas2' } });
  assert.equal(newLogin.status, 200);
});

test('change-password: be tokeno atmetama (401)', async () => {
  const { status } = await api('PATCH', '/api/clients/me/password', { body: { currentPassword: 'x', newPassword: 'naujasSlaptas2' } });
  assert.equal(status, 401);
});
