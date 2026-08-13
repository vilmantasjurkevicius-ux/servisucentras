// "Pakvietimai" įrankis — admin panelėje leidžia rasti REALIUS autoservisus
// mieste (per Google Places API — pavadinimas/adresas/telefonas/svetainė) ir
// paruošia standartinį pakvietimo laišką prisijungti prie platformos.

const REGISTER_URL = 'https://servisucentras-production.up.railway.app/automeistrai-login.html?type=service&action=register';

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
      maxResultCount: 10, // ribojame, nes kiekvienam naujam rezultatui reikės atskiro Gemini kvietimo (žr. admin.routes.js — Gemini nemokamas planas leidžia tik 5/min)
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

module.exports = { searchServicesInCity, buildInvitationLetter, REGISTER_URL };
