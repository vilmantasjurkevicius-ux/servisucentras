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

async function registerService(name, city) {
  const reg = await api('POST', '/api/auth/service/register', {
    body: {
      name, email: `${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}-${Math.random()}@test.lt`, password: 'slaptas123', city,
      street: 'Testų g.', houseNumber: '1', postalCode: '00000',
    },
  });
  return { token: reg.data.token, id: reg.data.service.id };
}

test('servisas negali rašyti sau ir be otherServiceId (400)', async () => {
  const a = await registerService('Servisas Solo', 'Vilnius');
  const noId = await api('POST', '/api/service-chat/start', { token: a.token, body: {} });
  assert.equal(noId.status, 400);
  const self = await api('POST', '/api/service-chat/start', { token: a.token, body: { otherServiceId: a.id } });
  assert.equal(self.status, 400);
});

test('klientas negali kviesti service-chat endpoint (403)', async () => {
  const clientReg = await api('POST', '/api/auth/client/register', {
    body: { firstName: 'S2S', lastName: 'Klientas', email: `s2s-klientas-${Date.now()}@test.lt`, password: 'slaptas123' },
  });
  const { status } = await api('GET', '/api/service-chat/conversations', { token: clientReg.data.token });
  assert.equal(status, 403);
});

test('du servisai susirašinėja privačiai — trečias servisas NEMATO pokalbio', async () => {
  const a = await registerService('Servisas Alfa S2S', 'Kaunas');
  const b = await registerService('Servisas Beta S2S', 'Kaunas');
  const c = await registerService('Servisas Gama S2S', 'Kaunas');

  // A pradeda pokalbį su B
  const start = await api('POST', '/api/service-chat/start', { token: a.token, body: { otherServiceId: b.id } });
  assert.equal(start.status, 200);
  const conversationId = start.data.id;

  // B pradeda "tą patį" pokalbį (atvirkščia kryptimi) — turi grąžinti TĄ PATĮ conversationId, ne sukurti antrą
  const startReverse = await api('POST', '/api/service-chat/start', { token: b.token, body: { otherServiceId: a.id } });
  assert.equal(startReverse.status, 200);
  assert.equal(startReverse.data.id, conversationId, 'ta pati servisų pora turi dalintis VIENU pokalbiu, nepriklausomai kas pradėjo');

  // A rašo žinutę
  const msg1 = await api('POST', `/api/service-chat/${conversationId}/messages`, { token: a.token, body: { message: 'Sveiki, ar galite padėti su viena užklausa?' } });
  assert.equal(msg1.status, 201);
  assert.equal(msg1.data.length, 1);
  assert.equal(msg1.data[0].message, 'Sveiki, ar galite padėti su viena užklausa?');
  assert.equal(msg1.data[0].sender_service_id, a.id);

  // B mato žinutę ir atsako
  const asB = await api('GET', `/api/service-chat/${conversationId}/messages`, { token: b.token });
  assert.equal(asB.status, 200);
  assert.equal(asB.data.length, 1);
  const msg2 = await api('POST', `/api/service-chat/${conversationId}/messages`, { token: b.token, body: { message: 'Taip, žinoma!' } });
  assert.equal(msg2.status, 201);
  assert.equal(msg2.data.length, 2);

  // A mato abi žinutes
  const asA = await api('GET', `/api/service-chat/${conversationId}/messages`, { token: a.token });
  assert.equal(asA.data.length, 2);

  // TREČIAS servisas (C, nedalyvis) NEGALI matyti nei žinučių, nei siųsti į šį pokalbį
  const asC = await api('GET', `/api/service-chat/${conversationId}/messages`, { token: c.token });
  assert.equal(asC.status, 403, 'nedalyvaujantis servisas neturi matyti šio pokalbio žinučių');
  const sendAsC = await api('POST', `/api/service-chat/${conversationId}/messages`, { token: c.token, body: { message: 'bandau įsibrauti' } });
  assert.equal(sendAsC.status, 403, 'nedalyvaujantis servisas neturi galėti rašyti į šį pokalbį');

  // A pokalbių sąraše mato B su paskutine žinute
  const convListA = await api('GET', '/api/service-chat/conversations', { token: a.token });
  assert.equal(convListA.status, 200);
  const convForA = convListA.data.find((row) => row.id === conversationId);
  assert.ok(convForA, 'A turi matyti šį pokalbį savo sąraše');
  assert.equal(convForA.other_service_id, b.id);
  assert.equal(convForA.other_service_name, 'Servisas Beta S2S');
  assert.equal(convForA.last_message, 'Taip, žinoma!');
  assert.equal(convForA.last_sender_service_id, b.id);

  // C pokalbių sąraše šio pokalbio VISAI nėra (ne tik kad negali matyti turinio)
  const convListC = await api('GET', '/api/service-chat/conversations', { token: c.token });
  assert.equal(convListC.data.find((row) => row.id === conversationId), undefined, 'nedalyvaujančiam servisui šis pokalbis neturi rodytis nei sąraše');

  // Paieška randa kitus servisus pagal pavadinimą, bet ne save
  const search = await api('GET', '/api/service-chat/search?q=S2S', { token: a.token });
  assert.equal(search.status, 200);
  assert.ok(search.data.some((s) => s.id === b.id));
  assert.ok(search.data.some((s) => s.id === c.id));
  assert.equal(search.data.some((s) => s.id === a.id), false, 'paieška neturi rodyti paties savęs');
});

test('paieška: city filtruoja tikslaus miesto servisus, derinasi su q', async () => {
  const vilniusA = await registerService('Vilniečių Servisas Rytas', 'Vilnius');
  const vilniusB = await registerService('Vilniečių Servisas Vakaras', 'Vilnius');
  const kaunas = await registerService('Kauniečių Servisas', 'Kaunas');

  const onlyCity = await api('GET', '/api/service-chat/search?city=Vilnius', { token: vilniusA.token });
  assert.equal(onlyCity.status, 200);
  assert.ok(onlyCity.data.some((s) => s.id === vilniusB.id), 'kito Vilniaus serviso turi būti sąraše');
  assert.equal(onlyCity.data.some((s) => s.id === kaunas.id), false, 'Kauno servisas neturi rodytis filtruojant pagal Vilnių');
  assert.equal(onlyCity.data.some((s) => s.id === vilniusA.id), false, 'paieška neturi rodyti paties savęs');

  const cityAndQ = await api('GET', '/api/service-chat/search?city=Vilnius&q=Vakaras', { token: vilniusA.token });
  assert.equal(cityAndQ.data.length, 1);
  assert.equal(cityAndQ.data[0].id, vilniusB.id, 'city+q kartu turi susiaurinti iki tikslaus atitikmens');

  const noFilters = await api('GET', '/api/service-chat/search', { token: vilniusA.token });
  assert.deepEqual(noFilters.data, [], 'be jokio filtro (nei q, nei city) grąžinama tuščia — ne visas servisų sąrašas');
});

test('admin mato pokalbio EGZISTAVIMĄ, bet NE turinį', async () => {
  const a = await registerService('Servisas Admin Test A', 'Šiauliai');
  const b = await registerService('Servisas Admin Test B', 'Šiauliai');
  const start = await api('POST', '/api/service-chat/start', { token: a.token, body: { otherServiceId: b.id } });
  const conversationId = start.data.id;
  await api('POST', `/api/service-chat/${conversationId}/messages`, { token: a.token, body: { message: 'Slaptas turinys, admin NETURI matyti' } });

  const adminLogin = await api('POST', '/api/admin/login', { body: { username: 'admin', password: server.adminPassword } });
  const adminToken = adminLogin.data.token;

  const asAdmin = await api('GET', '/api/admin/service-conversations', { token: adminToken });
  assert.equal(asAdmin.status, 200);
  const row = asAdmin.data.find((r) => r.id === conversationId);
  assert.ok(row, 'admin turi matyti, kad pokalbis egzistuoja');
  assert.equal(row.message_count, 1);
  assert.ok(row.service_a_name && row.service_b_name, 'admin mato KURIE servisai kalbėjosi');
  assert.equal(row.message, undefined, 'admin atsakyme NETURI būti žinutės teksto lauko');
  assert.equal(JSON.stringify(row).includes('Slaptas turinys'), false, 'pokalbio TURINYS neturi pasirodyti admin atsakyme jokia forma');
});
