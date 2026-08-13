const { test } = require('node:test');
const assert = require('node:assert/strict');
const { extractEmailFromHtml, isLikelyOwnedWebsite } = require('../src/utils/invitations');

test('extractEmailFromHtml: pirmenybė mailto: nuorodai', () => {
  const html = '<p>info@kitas.lt</p><a href="mailto:kontaktai@servisas.lt">Rašyk mums</a>';
  assert.equal(extractEmailFromHtml(html), 'kontaktai@servisas.lt');
});

test('extractEmailFromHtml: randa el. paštą paprastame tekste, jei nėra mailto:', () => {
  const html = '<footer>Kontaktai: info@servisas.lt, tel. +370 600 00000</footer>';
  assert.equal(extractEmailFromHtml(html), 'info@servisas.lt');
});

test('extractEmailFromHtml: atmeta @2x.png stiliaus paveikslėlių pavadinimus', () => {
  const html = '<img src="logo@2x.png"><img src="hero@3x.jpg">Tikras el. paštas: pagalba@servisas.lt';
  assert.equal(extractEmailFromHtml(html), 'pagalba@servisas.lt');
});

test('extractEmailFromHtml: grąžina null, kai nieko nerasta', () => {
  const html = '<html><body>Jokio el. pašto čia nėra.</body></html>';
  assert.equal(extractEmailFromHtml(html), null);
});

test('isLikelyOwnedWebsite: atmeta žinomus verslo katalogų/socialinių tinklų domenus', () => {
  assert.equal(isLikelyOwnedWebsite('https://rekvizitai.vz.lt/imone/savas_servisas/'), false);
  assert.equal(isLikelyOwnedWebsite('https://www.facebook.com/kesto-autoservisas'), false);
  assert.equal(isLikelyOwnedWebsite('https://info.lt/?page=imone&id=123'), false);
});

test('isLikelyOwnedWebsite: leidžia paprastą serviso svetainę', () => {
  assert.equal(isLikelyOwnedWebsite('https://damiva.lt/'), true);
  assert.equal(isLikelyOwnedWebsite('https://www.gintoautoservisas.lt/'), true);
});
