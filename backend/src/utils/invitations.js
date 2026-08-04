// "Pakvietimai" įrankis — admin panelėje leidžia rasti REALIUS autoservisus
// mieste (per Google Places API — pavadinimas/adresas/telefonas/svetainė) ir
// sugeneruoti personalizuotą pakvietimo laišką (per Gemini — TIK teksto
// rašymui, ne faktų paieškai, žr. santrauka.md dėl priežasčių).

const REGISTER_URL = 'https://servisucentras-production.up.railway.app/automeistrai-login.html?type=service&action=register';

// Šie faktai vieninteliai leidžiami Gemini naudoti laiške — apsaugo nuo
// išgalvotų teiginių apie platformą (pvz. "jau 10000 klientų").
const PLATFORM_FACTS = `
- ServisuCentras.lt — internetinė platforma, jungianti automobilių savininkus Lietuvoje su autoservisais/garažiukais.
- Klientai gali be registracijos parašyti savo automobilio bėdą ir gauti kainų pasiūlymus iš kelių servisų.
- Prisijungęs servisas gauna užklausas iš klientų iš viso miesto/regiono, be tarpininkų ir be skambučių centro.
- Servisas gali nurodyti savo specializacijas ir darbo laiką.
- Pirmus 6 mėnesius naudojimasis platforma nemokamas.
- Registracijos nuoroda: ${REGISTER_URL}
`.trim();

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

async function draftInvitationLetter(serviceName, city) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY nenustatytas');
    err.code = 'NO_GEMINI_KEY';
    throw err;
  }

  const prompt = `Tu rašai trumpą, draugišką pakvietimo laišką lietuvių kalba realiam automobilių servisui/garažiukui, kviesdamas jį prisijungti prie ServisuCentras.lt platformos.

FAKTAI apie ServisuCentras.lt (naudok TIK šiuos faktus, NIEKO nepridėk nuo savęs — jokių statistikų, vartotojų skaičių ar kitų teiginių, kurių čia nėra):
${PLATFORM_FACTS}

Parašyk TRUMPĄ (3-4 trumpos pastraipos), draugišką, profesionalų laišką servisui pavadinimu "${serviceName}" (miestas: ${city}). Kreipkis į juos pagal pavadinimą. Nenaudok perdėtų pardavimo frazių. Paskutinė pastraipa — kvietimas užsiregistruoti su nuoroda.`;

  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              subject: { type: 'STRING' },
              paragraphs: { type: 'ARRAY', items: { type: 'STRING' } },
            },
            required: ['subject', 'paragraphs'],
          },
        },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error('Gemini API klaida (pakvietimas):', res.status, errText);
    const err = new Error('Nepavyko sugeneruoti laiško (Gemini)');
    err.code = 'GEMINI_API_ERROR';
    throw err;
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    const err = new Error('Gemini negrąžino turinio');
    err.code = 'GEMINI_EMPTY';
    throw err;
  }

  const parsed = JSON.parse(rawText);
  return {
    subject: parsed.subject,
    paragraphs: parsed.paragraphs || [],
  };
}

module.exports = { searchServicesInCity, draftInvitationLetter, REGISTER_URL };
