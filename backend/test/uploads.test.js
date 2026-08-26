const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const sharp = require('sharp');
const { spawnServer } = require('./helpers');

let server;
const uploadedFilenames = []; // valome patys, nes UPLOADS_DIR yra bendras test/ aplanke visiems bandymams

before(async () => {
  server = await spawnServer();
});

after(async () => {
  await server.stop();
  const uploadsDir = path.join(__dirname, 'uploads', 'services');
  uploadedFilenames.forEach((name) => {
    try { fs.unlinkSync(path.join(uploadsDir, name)); } catch { /* jau ištrinta */ }
  });
  try { fs.rmdirSync(uploadsDir); fs.rmdirSync(path.join(__dirname, 'uploads')); } catch { /* neturi būti tuščias arba jau pašalintas */ }
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

async function uploadPhoto(token, buffer, filename, contentType) {
  const form = new FormData();
  form.append('photo', new Blob([buffer], { type: contentType }), filename);
  const res = await fetch(`${server.baseUrl}/api/services/me/photo`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
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

test('be tokeno POST /services/me/photo atmetamas (401)', async () => {
  const { status } = await api('POST', '/api/services/me/photo');
  assert.equal(status, 401);
});

test('JPG nuotrauka sumažinama iki maks. 800x800 ir saugoma kaip .jpg', async () => {
  const svc = await registerService('Foto Servisas JPG');
  const bigJpeg = await sharp({ create: { width: 1600, height: 1200, channels: 3, background: { r: 200, g: 30, b: 30 } } })
    .jpeg().toBuffer();

  const res = await uploadPhoto(svc.token, bigJpeg, 'didele.jpg', 'image/jpeg');
  assert.equal(res.status, 200);
  assert.match(res.data.photo_path, /^service-\d+-\d+\.jpg$/);
  uploadedFilenames.push(res.data.photo_path);

  const fileRes = await fetch(`${server.baseUrl}/uploads/services/${res.data.photo_path}`);
  assert.equal(fileRes.status, 200);
  const savedBuffer = Buffer.from(await fileRes.arrayBuffer());
  const meta = await sharp(savedBuffer).metadata();
  assert.ok(meta.width <= 800 && meta.height <= 800, `nuotrauka turi būti sumažinta iki <=800x800, gauta ${meta.width}x${meta.height}`);
  assert.equal(meta.format, 'jpeg');

  const me = await api('GET', '/api/services/me', { token: svc.token });
  assert.equal(me.data.photo_path, res.data.photo_path, 'GET /services/me turi rodyti tą pačią nuotraukos nuorodą');
});

test('PNG su permatomumu išsaugoma kaip .png (skaidrumas nepraranamas)', async () => {
  const svc = await registerService('Foto Servisas PNG');
  const transparentPng = await sharp({ create: { width: 500, height: 500, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .png().toBuffer();

  const res = await uploadPhoto(svc.token, transparentPng, 'logo.png', 'image/png');
  assert.equal(res.status, 200);
  assert.match(res.data.photo_path, /\.png$/, 'PNG su alpha kanalu turi likti .png, ne konvertuotas į .jpg');
  uploadedFilenames.push(res.data.photo_path);

  const fileRes = await fetch(`${server.baseUrl}/uploads/services/${res.data.photo_path}`);
  const savedBuffer = Buffer.from(await fileRes.arrayBuffer());
  const meta = await sharp(savedBuffer).metadata();
  assert.equal(meta.format, 'png');
  assert.ok(meta.hasAlpha, 'skaidrumas turi būti išsaugotas');
});

test('nauja nuotrauka PAKEIČIA seną — sena ištrinama iš disko, nekaupiama', async () => {
  const svc = await registerService('Foto Servisas Keitimas');
  const first = await sharp({ create: { width: 900, height: 900, channels: 3, background: { r: 10, g: 10, b: 10 } } }).jpeg().toBuffer();
  const second = await sharp({ create: { width: 900, height: 900, channels: 3, background: { r: 250, g: 250, b: 250 } } }).jpeg().toBuffer();

  const res1 = await uploadPhoto(svc.token, first, 'pirma.jpg', 'image/jpeg');
  const firstFilename = res1.data.photo_path;
  const uploadsDir = path.join(__dirname, 'uploads', 'services');
  assert.ok(fs.existsSync(path.join(uploadsDir, firstFilename)), 'pirmas failas turi egzistuoti iškart po įkėlimo');

  const res2 = await uploadPhoto(svc.token, second, 'antra.jpg', 'image/jpeg');
  const secondFilename = res2.data.photo_path;
  uploadedFilenames.push(secondFilename);

  assert.notEqual(firstFilename, secondFilename);
  assert.equal(fs.existsSync(path.join(uploadsDir, firstFilename)), false, 'sena nuotrauka turi būti ištrinta iš disko po pakeitimo');
  assert.ok(fs.existsSync(path.join(uploadsDir, secondFilename)), 'nauja nuotrauka turi egzistuoti');

  const me = await api('GET', '/api/services/me', { token: svc.token });
  assert.equal(me.data.photo_path, secondFilename);
});

test('netinkamas failo tipas (ne JPG/PNG) atmetamas su 400', async () => {
  const svc = await registerService('Foto Servisas Blogas Tipas');
  const res = await uploadPhoto(svc.token, Buffer.from('ne tikra nuotrauka'), 'failas.gif', 'image/gif');
  assert.equal(res.status, 400);
});

test('per didelis failas (>5MB) atmetamas su 400', async () => {
  const svc = await registerService('Foto Servisas Per Didelis');
  const hugeBuffer = Buffer.alloc(6 * 1024 * 1024, 1);
  const res = await uploadPhoto(svc.token, hugeBuffer, 'didelis.jpg', 'image/jpeg');
  assert.equal(res.status, 400);
});

test('viešame sąraše (GET /services) matomas photo_path', async () => {
  const svc = await registerService('Foto Servisas Viesas');
  const photo = await sharp({ create: { width: 400, height: 400, channels: 3, background: { r: 5, g: 5, b: 5 } } }).jpeg().toBuffer();
  const uploadRes = await uploadPhoto(svc.token, photo, 'v.jpg', 'image/jpeg');
  uploadedFilenames.push(uploadRes.data.photo_path);

  const list = await api('GET', '/api/services?city=Vilnius');
  const found = list.data.find((s) => s.id === svc.id);
  assert.ok(found);
  assert.equal(found.photo_path, uploadRes.data.photo_path);
});
