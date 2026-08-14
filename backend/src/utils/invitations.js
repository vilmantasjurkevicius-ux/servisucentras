// "Pakvietimai" įrankis — admin panelėje leidžia rasti REALIUS autoservisus
// mieste (per Google Places API — pavadinimas/adresas/telefonas/svetainė) ir
// paruošia standartinį pakvietimo laišką prisijungti prie platformos.

const REGISTER_URL = 'https://www.servisucentras.lt/automeistrai-login.html?type=service&action=register';

function buildInvitationLetter(serviceName) {
  return {
    subject: 'Kvietimas prisijungti prie ServisuCentras.lt',
    paragraphs: [
      `Sveiki, ${serviceName} komanda,`,
      'Kviečiame Jūsų servisą prisijungti prie ServisuCentras.lt – naujos Lietuvos platformos, padedančios automobilių savininkams greitai rasti tinkamą servisą.',
      'Klientai platformoje gali aprašyti automobilio gedimą ar reikalingą paslaugą, o tinkami servisai gauna galimybę pateikti savo pasiūlymus.',
      'Šiuo metu ServisuCentras.lt aktyviai reklamuojama, todėl siekiame pritraukti pirmuosius klientus ir servisus visoje Lietuvoje. Prisijungę būsite matomi platformoje ir galėsite gauti užklausas iš savo miesto bei aplinkinių rajonų.',
      'Prisijungę galėsite:',
      '• gauti klientų užklausas;',
      '• nurodyti savo specializacijas ir teikiamas paslaugas;',
      '• patys pasirinkti, kurias užklausas priimti.',
      'Prisijungimas ir platformos išbandymas šiuo metu nemokamas.',
      `Registracija: ${REGISTER_URL}`,
      'Jeigu turite klausimų – mielai atsakysime.',
      'Pagarbiai,',
      'ServisuCentras.lt komanda',
    ],
  };
}

async function searchServicesInCity(city) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    const err = new Error('GOOGLE_PLACES_API_KEY nenustatytas');
    err.code = 'NO_PLACES_KEY';
    throw err;
  }

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.internationalPhoneNumber,places.websiteUri',
    },
    body: JSON.stringify({
      textQuery: `autoservisas ${city}`,
      languageCode: 'lt',
      maxResultCount: 10,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Places API klaida:', res.status, errText);
    const err = new Error('Nepavyko atlikti paieškos (Places API)');
    err.code = 'PLACES_API_ERROR';
    throw err;
  }

  const data = await res.json();
  return (data.places || []).map((p) => ({
    placeId: p.id,
    name: p.displayName?.text || 'Be pavadinimo',
    address: p.formattedAddress || null,
    phone: p.internationalPhoneNumber || null,
    website: p.websiteUri || null,
  }));
}

// Google Places negrąžina el. pašto (tokio lauko jo duomenų modelyje nėra), tad
// bandome patys rasti jį serviso svetainės HTML'e — pirmiausia ieškome mailto:
// nuorodos (patikimiausias signalas), jei nėra — bendro el. pašto formato teksto.
// Ne visos svetainės turi el. paštą matomoje vietoje, tad tai tik geriausios
// pastangos: nepavykus liks tuščia, adminas gali įrašyti ranka.
const EMAIL_LOOKALIKE_FILE_EXT = /\.(png|jpe?g|gif|svg|webp|ico|css|js)$/i;

// Google Places kartais grąžina "website" lauke NE paties serviso svetainę, o
// verslo katalogo/registro/socialinio tinklo profilį (kai servisas neturi
// savo svetainės). Iš tokių puslapių scrap'inti PAVOJINGA — gautume KATALOGO,
// ne serviso, el. paštą (realiai nutiko: rekvizitai.vz.lt grąžino CreditInfo
// kontaktinį adresą vietoj serviso). Tokiems domenams paieška praleidžiama.
const NON_OWNED_WEBSITE_HOSTS = new Set([
  'rekvizitai.vz.lt', 'rekvizitai.lt', 'imones.lt', 'info.lt',
  'manoreitingas.lt', 'facebook.com', 'instagram.com',
]);

function isLikelyOwnedWebsite(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return !NON_OWNED_WEBSITE_HOSTS.has(host);
  } catch {
    return false;
  }
}

function extractEmailFromHtml(html) {
  const mailtoMatch = html.match(/href=["']mailto:([^"'?]+)["']/i);
  if (mailtoMatch) return mailtoMatch[1].trim();

  const matches = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
  return matches.find((m) => !EMAIL_LOOKALIKE_FILE_EXT.test(m)) || null;
}

async function findEmailOnWebsite(url) {
  if (!isLikelyOwnedWebsite(url)) return null;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ServisuCentrasBot/1.0)' },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    return extractEmailFromHtml(await res.text());
  } catch (err) {
    return null;
  }
}

module.exports = {
  searchServicesInCity,
  buildInvitationLetter,
  findEmailOnWebsite,
  extractEmailFromHtml,
  isLikelyOwnedWebsite,
  REGISTER_URL,
};
