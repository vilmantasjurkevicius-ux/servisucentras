# SERVISUCENTRAS.LT — Projekto santrauka

## Koncepcija
Lietuvos autoservisų platforma — "Booksy/Bolt servisams" modelis.
Klientas aprašo bėdą → WhatsApp stiliaus chate mato servisus online → servisai atsako su kainomis → klientas renkasi → rezervuoja.

**Domenas:** servisucentras.lt (užregistruotas)
**Savininko miestas:** Ukmergė (numatytasis miestas puslapyje)

---

## Verslo modelis
- **Nemokamas laikotarpis:** 6 mėnesiai — individualiai kiekvienam servisui, skaičiuojant nuo JO registracijos datos (ne bendra data visai platformai)
- **Po nemokamo laikotarpio:** komisinis = **procentas nuo patvirtinto darbo kainos** (numatyta 2.5%, admin gali keisti), NE fiksuota 1€ suma — didesnis darbas = didesnis komisinis
- **God Mode jungiklis** (Admin → Nustatymai): master perjungimas, ar komisinio surinkimas apskritai aktyvus. Išjungus — visi servisai laikinai nemoka, nepriklausomai nuo jų registracijos datos
- Servisai moka tik kai gauna realų klientą (patvirtintą darbą)
- Vėliau (atskira idėja, nesusijusi su šiuo modeliu): abonementas ~10€/mėn dideliems servisams — kaip alternatyva, dar nesprendžiant

---

## Tech stack
- **Backend:** Node.js + Express — **sukurta 2026-07-08**, žr. `backend/` aplanką
- **Duomenų bazė:** SQLite per built-in `node:sqlite` modulį (Node 22.5+, jokio native kompiliavimo/Python/VS Build Tools nereikia — `better-sqlite3` buvo išbandytas pirmas, bet nesukompiliavo be Python, todėl pakeista)
- **Serveris:** Hetzner VPS (~4-6€/mėn) arba namų PC (Windows 10)
- **Diegimas:** `npm install -g @anthropic-ai/claude-code`
- **Projekto aplankas:** `C:\projektai\servisucentras`

---

## Dizainas — spalvos ir stilius
- **Fonas:** #0E0F10 (juodas)
- **Tekstas:** #F0EDE5 (kreminis)
- **Akcentas:** #F5C400 (geltona — LT vėliava)
- **Žalia:** #3D6B4A (LT vėliava)
- **Raudona:** #8B1A1A (LT vėliava)
- **Šriftai:** Oswald (pavadinimai) + IBM Plex Sans (tekstas) + IBM Plex Mono (detalės)
- **Stilius:** tamsus, modernaus servisucentro jausmas, ne "tech startup"

---

## Sukurti failai

| Failas | Aprašas |
|--------|---------|
| `servisucentras-pagrindinis.html` | Pagrindinis puslapis (naujausias) |
| `servisucentras-diagnostika.html` | Gedimų diagnostikos vedlys (4 žingsniai) |
| `servisucentras-admin.html` | Admin "God Mode" panelė (login: admin/admin123) |
| `automeistrai-dashboard.html` | Serviso dashboard (perpieštas nauju stiliumi) |
| `automeistrai-login.html` | Serviso registracija (reikia perpiešti) |
| `backend/` | Node.js + Express + SQLite backend'as — servisai, klientai, užklausos, admin/God Mode API (žr. `backend/README.md`) |

---

## Pagrindinio puslapio funkcijos

### Hero sekcija
- LT vėliava fone (subtili)
- Pulsuojantis CTA mygtukas "💬 Parašyk bėdą — gauk kainas"
  - Du animuoti žiedai aplink mygtuką
  - Rodyklė šokinėja dešinėn
- Mirksintis žalias taškas: "12 servisų online · ~15 min"
- Nuoroda į diagnostiką

### Miesto paieška
- Ukmergė **pirmas ir numatytasis**
- Greiti mygtukai: Ukmergė, Vilnius, Kaunas, Klaipėda, Šiauliai, Panevėžys, Alytus, Kitas

### Kategorijų lenta (12 kategorijų su SVG ikonais)
Diagnostika · Elektronika · Apšvietimas · Variklis · Važiuoklė · Stabdžiai · Kėbulas · Padangos · Kondicionierius · Stiklai · Plovykla · Raktai/Imob.

### Servisų sąrašas
- Rikiavimas: Pagal atstumą / Įvertinimą / Dirba dabar
- Kortelės: pavadinimas, atstumas, statusas, tipas, reitingas, mygtukas "Užklausti →"

### WhatsApp stiliaus chatas (💬 FAB mygtukas)
- Svečio registracija prieš atidarant (vardas + tel.)
- Online servisų avatariai viršuje
- Klientas rašo bėdą → visi servisai mato
- Servisai atsako su kainų kortelėmis ("Priimti" mygtukas)
- Sėkmės žinutė po patvirtinimo

### Diagnostikos sekcija
- Populiariausi gedimai su kainomis
- Nuoroda į vedlį

### Kaip veikia
- 3 žingsniai: Parašyk → Palygink → Rezervuok

### CTA servisams
- Registracijos kvietimas garažiukams

---

## Diagnostikos vedlys (servisucentras-diagnostika.html)
4 žingsniai:
1. **Zona** — 8 automobilio dalys (Variklis, Stabdžiai, Elektra, Važiuoklė, Padangos, Kondicionierius, Kėbulas, Kita)
2. **Simptomai** — unikalūs kiekvienai zonai, galima pažymėti kelis
3. **Kada** — visada / šaltam / stabdant / greitinant ir t.t.
4. **Rezultatas:**
   - Tikėtinas gedimas
   - Preliminari kaina
   - Skubumas (SKUBU / VIDUTINIS / NESKUBU)
   - Patarimas
   - Alternatyvūs gedimai
   - "Siųsti servisams →" mygtukas

---

## Admin panelė (servisucentras-admin.html)
**Login:** admin / admin123

Sekcijos:
- 📊 **Dashboard** — realaus laiko statistika, savaitės pajamų grafikas
- 🚗 **Klientai** — 247 vartotojai, filtravimas, banų valdymas
- 🔧 **Servisai** — 34 servisai, patvirtinimas naujų, komisiniai
- 📋 **Užklausos** — 312 užklausų su statusais
- 💰 **Pajamos** — komisiniai, mėnesių istorija, pelningiausi servisai
- ⚙️ **Nustatymai** — komisinio dydis, nemokamų mėnesių skaičius

---

## Kas liko padaryti
- [x] Serviso dashboard perpiešimas su nauju ServisuCentras stiliumi — `automeistrai-dashboard.html`
- [ ] Serviso registracijos puslapis su nauju stiliumi
- [ ] Kliento paskyros puslapis
- [x] Realus backend kūrimas (Node.js + Express + SQLite) — žr. `backend/`, sukurta 2026-07-08
- [x] Duomenų bazė (servisai, klientai, užklausos, komisiniai) — SQLite schema `backend/src/schema.sql`
- [x] Esamų `.html` failų sujungimas su backend API (visi 4: pagrindinis, login, admin, dashboard) — sukurta 2026-07-08, žr. žemiau
- [ ] El. pašto notifikacijos servisams ir klientams
- [ ] Mobiliosios versijos šlifavimas
- [ ] Tikrų servisų pridėjimas (pradžia Ukmergė)
- [ ] Deployment (Hetzner VPS arba namų PC) su realiu backend'u
- [x] Serviso kalendorius (savaitės vaizdas su suplanuotais darbais) — `automeistrai-dashboard.html` Kalendorius puslapis, žr. žemiau. **Bet** dashboard'o "Šiandien" laiko juosta viršuje lieka demonstracinė (senas, atskiras UI elementas, nesujungtas su nauju `scheduled_time` lauku).

---

## Apmokestinimo modelio atnaujinimas (2026-07-07)
Pakeista iš flat 1€/užsakymas į procentinį modelį:
- `servisucentras-admin.html` → Nustatymai: pridėtas **God Mode jungiklis** komisinio surinkimui (ON/OFF) + **procento laukelis** (numatyta 2.5%) su gyvu pavyzdžio skaičiavimu (`updateCommissionExample()`), + nemokamo laikotarpio laukelis pakeistas iš 3 į 6 mėn.
- `servisucentras-admin.html` → Servisai lentelė: pridėta "Nemokama iki" skiltis, rodanti kiekvieno serviso individualią trial pabaigos datą; Komisiniai skaičiuojami kaip % nuo darbo kainos, ne 1:1 su užklausų skaičiumi.
- `servisucentras-admin.html` → Užklausos, Pajamos, Dashboard: skaičiai perskaičiuoti, kad atitiktų % modelį (nebe flat 1€/užsakymas).
- `automeistrai-login.html` ir `servisucentras-pagrindinis.html`: tekstai atnaujinti iš "3 mėnesiai" į "6 mėnesiai" (individualiai nuo registracijos).
- **Dar reikia:** realaus backend, kuris: (1) sektų kiekvieno serviso registracijos datą ir automatiškai skaičiuotų 6 mėn. trial pabaigą, (2) tikrintų God Mode jungiklio būseną prieš skaičiuodamas komisinį, (3) realiai apskaičiuotų % nuo kiekvieno patvirtinto darbo. Admin UI paruoštas, bet kol kas tik demonstracinis (nesusietas su realiais duomenimis).

---

## Pataisytos klaidos (2026-07-07 auditas)
- Admin panelės sugadinta nuoroda "Grįžti į puslapį" (vedė į neegzistuojantį `servisucentras-v4.html`) → dabar veda į `servisucentras-pagrindinis.html`.
- Login puslapyje: prisijungimas prie esamos paskyros rodydavo tą patį "užregistruota!" pranešimą kaip nauja registracija → dabar atskiri pranešimai (prisijungimas/registracija, servisas/klientas/svečias).
- Login sėkmės ekranai niekur neveda toliau → dabar servisui veda į `automeistrai-dashboard.html`, klientui/svečiui — į `servisucentras-pagrindinis.html`.
- Serviso dashboard "Atsijungti" mygtukas neveikė → dabar veda atgal į `automeistrai-login.html`.
- Serviso registracijos kategorijų sąrašas neatitiko pagrindinio puslapio (turėjo "Tech. priežiūra", trūko "Raktai/Imob.") → suvienodinta su pagrindinio puslapio 12 kategorijų.
- Pagrindinio puslapio chat demo atsakymuose liko senų (neegzistuojančių) servisų vardai → pakeista į tikrus Ukmergės bot servisų vardus.
- `automeistrai-login.html` ir `automeistrai-dashboard.html` failų `<title>` vis dar rodė "Automeistrai" prekės ženklą → pataisyta į "ServisuCentras".

## Dar žinomos, bet nepataisytos smulkmenos
- `automeistrai-login.html` vis dar naudoja seną spalvų paletę (#191B1D ir t.t.) — reikia perdažyti kaip dashboard.html.
- Admin panelės bendra "34 registruoti servisai" statistika ir Ukmergės 10 bot servisų sąrašas — atskiri duomenų rinkiniai, dar nesuvienyti (backend'e šie duomenys dabar realūs, bet `.html` failai jų dar nenaudoja).
- "12 servisų online" tekstas hero sekcijoje — marketininė vinjetė, neatspindi realaus (kol kas 0 tikrų) servisų skaičiaus.

---

## Backend sukurtas (2026-07-08)
Pagal šioje santraukoje aprašytą planą sukurtas pilnas Node.js + Express + SQLite backend'as `backend/` aplanke. Detali API dokumentacija: `backend/README.md`.

- **DB schema** (`backend/src/schema.sql`): `services`, `clients`, `categories`, `service_categories`, `orders`, `order_messages`, `reviews`, `admin_settings`.
- **Seed duomenys** (`backend/src/db.js`): 12 kategorijų, admin paskyra (`admin`/`admin123` arba pagal `.env`), 10 Ukmergės bot servisų su kategorijomis — sinchronizuota su `servisucentras-admin.html` BOT_SERVICES sąrašu.
- **Auth**: JWT, 3 rolės (admin/service/client), bcrypt slaptažodžiams. Yra ir svečio (guest) registracija be slaptažodžio.
- **Komisinio/trial logika** (`backend/src/utils/commission.js`): kiekvieno serviso individualus trial (registered_at + trial_months), God Mode master jungiklis (`commission_master_enabled`), % komisinis skaičiuojamas tik užbaigus užklausą (`POST /orders/:id/complete`) — tiksliai pagal santraukoje aprašytą modelį.
- **Svarbus tech pakeitimas**: pradžioje bandyta `better-sqlite3`, bet ji reikalauja native kompiliavimo (Python + Visual Studio Build Tools), kurių šioje mašinoje nebuvo — pakeista į Node.js **built-in** `node:sqlite` modulį (reikalauja Node 22.5+), API beveik identiškas, bet nereikia jokių native priklausomybių.
- **Node.js buvo neįdiegtas šioje mašinoje** — įdiegta per `winget install OpenJS.NodeJS.LTS` (v24.18.0) vartotojo sutikimu.
- Pilnas end-to-end srautas rankiniu būdu patikrintas: serviso registracija → admin patvirtinimas → svečio užklausa → serviso kainos pasiūlymas → kliento priėmimas → darbo užbaigimas su teisingu komisinio apskaičiavimu (trial metu — 0€, po trial su God Mode ON — teisingas %, su God Mode OFF — 0€ nepriklausomai nuo trial).
- Rasta ir pataisyta saugumo klaida testavimo metu: admin `/dashboard` ir `/bots` endpointai grąžindavo `password_hash` lauką kartu su serviso duomenimis — pašalinta.
- **Kitas žingsnis**: esami `.html` failai (pagrindinis, admin, login) vis dar naudoja tik demo/hardcoded JS duomenis — reikia juos perjungti į realius `fetch()` kvietimus į šį backend'ą. *(Padaryta — žr. kitą sekciją.)*

---

## Frontend sujungtas su backend'u (2026-07-08)
Visi keturi `.html` failai (pagrindinis, login, admin, o vėliau tą pačią dieną — ir serviso dashboard) perrašyti taip, kad hardcoded demo duomenis (`SVCS_BY_CITY`, `CATS`, `BOT_SERVICES`, `ORDERS`, `showSuccess()` fake atsakymai) pakeistų realūs `fetch()` kvietimai į `backend/` API. Kiekvienas failas rankiniu būdu patikrintas naršyklėje (Chrome per Preview MCP) prieš pereinant prie kito, veikiant tikram backend + statinio failų serveriui (`static-server.js`, žr. `.claude/launch.json`, portas 5500 frontend'ui, 3000 backend'ui).

**`servisucentras-pagrindinis.html`**
- Kategorijų lenta ir miesto/kategorijos servisų sąrašas dabar kraunami iš `GET /api/categories` ir `GET /api/services?city=&category=`. Kategorijų skaičiukai (badge'ai) skaičiuojami iš realaus sąrašo, ne hardcoded.
- Svečio modalas kviečia `POST /api/auth/guest`, tokeną saugo `localStorage` (`sc_client_token`).
- Chat pirmoji žinutė sukuria tikrą užklausą (`POST /api/orders`), tolimesnės žinutės eina į `POST /api/orders/:id/messages`.
- **Žinomas apribojimas:** serviso "atsakymai" chate (kainos pasiūlymai) vis dar suvaidinti (scripted setTimeout animacija) su realiais serviso vardais/ID iš to miesto — tikro backend'o atsakiklio realiu laiku nėra. Bet priėmus pasiūlymą, `POST /orders/:id/accept` realiai įrašomas į DB su tikru service_id.
- "12 servisų online" ir chat ženkliukas dabar rodo realų aktyvių servisų skaičių (anksčiau buvo fiksuotas "12").
- Nav mygtukai "Prisijungti"/"Registruotis" ir "Registruoti servisą" CTA dabar veda į `automeistrai-login.html` su `?type=&tab=` parametrais.

**`automeistrai-login.html`**
- Visos 5 formos (serviso login/registracija 3 žingsniais, kliento login/registracija, svečio) kviečia atitinkamus `/api/auth/*` endpointus.
- Kategorijų varnelės (`cat-checkboxes`) kraunamos iš `GET /api/categories`, ne hardcoded sąrašo.
- Klaidos (pvz. jau užregistruotas el. paštas) rodomos raudoname baneryje viršuje formos.
- Palaikomi URL parametrai `?type=service|client&tab=...` — leidžia kitiems puslapiams nukreipti tiesiai į norimą kortelę/tab'ą.
- Sėkmės ekranas serviso prisijungimui dabar rodo tikrą naujų užklausų skaičių (`GET /api/orders`), o ne fiksuotą "3".

**`servisucentras-admin.html`**
- Admin login → `POST /api/admin/login`, JWT saugomas `localStorage` (`sc_admin_token`) — perkrovus puslapį, jei tokenas galioja, prisijungimo ekranas praleidžiamas.
- Dashboard, Klientai, Servisai, Užklausos, Pajamos — visos lentelės/statistika kraunamos iš `/api/admin/*` endpointų, su realiu filtravimu (tabai) ir paieška.
- Ban/Unban (klientai), Tvirtinti/Ban/Unban (servisai) mygtukai realiai kviečia PATCH endpointus ir iš karto atnaujina lentelę.
- **Bot servisai puslapis** (aiškiai paminėtas užduotyje) — `BOT_SERVICES` hardcoded masyvas pašalintas, dabar `GET /api/admin/bots` + `PATCH /api/admin/bots/:id/toggle` + `POST /api/admin/bots/toggle-all`. Patikrinta, kad išjungus bot'ą per admin, jis iš karto dingsta iš viešo `GET /api/services` sąrašo (nes tas endpointas rodo tik `status='active'`).
- **Nustatymai** — God Mode jungiklis dabar veikia iš karto (`PATCH /api/admin/settings` kviečiamas onchange), likę laukai (procentas, trial mėnesiai, platformos pavadinimas, admin slaptažodis) išsaugomi paspaudus "Išsaugoti nustatymus".
- Savaitės pajamų grafikas ir mėnesių istorija dabar skaičiuojami realiu laiku iš `GET /api/admin/orders` (grupuojant pagal dieną/mėnesį), ne hardcoded skaičiai.
- Rasta ir pataisyta klaida: bot servisų info banelis vis dar teigė, kad "perjungimas veikia tik admin faile, be backend'o" — tai jau nebetiesa, tekstas atnaujintas.
- **Chat žinutės, Atsiliepimai, Komisiniai (detalus)** puslapiai palikti kaip statiniai placeholder'iai — jie neturėjo apsimestinių duomenų lentelių (tik vieną sakinį), o backend šiuo metu neturi bendrų list-visų-review/chat endpointų, tad jų kūrimas paliktas ateičiai.

**`automeistrai-dashboard.html`** (pridėtas prie projekto ir sujungtas 2026-07-08, tą pačią dieną kaip kiti trys)
- Puslapio pradžioje auth guard: jei `localStorage.sc_service_token` nėra arba pasibaigęs, iš karto peradresuoja į `automeistrai-login.html?type=service`.
- Serviso pavadinimas, avataro raidė ir įvertinimas viršuje kraunami iš `GET /api/services/me`.
- Hardcoded `ORDERS` masyvas pašalintas — dabar `GET /api/orders` (auth: service). **Backend'e padarytas mažas, bet būtinas pataisymas** (`backend/src/routes/orders.routes.js`): šis endpointas dabar taip pat grąžina kliento vardą/pavardę/telefoną (reikalinga "Skambinti" mygtukui) ir nebeprarandamas matomumas užklausai po to, kai servisas ją įkainoja (anksčiau `status='pending'` išnykdavo iš sąrašo visiems, įskaitant tą patį servisą, kuris ką tik pasiūlė kainą).
- 3 tabai perdaryti pagal realią būseną (originalo "Naujos/Patvirtintos/Atliktos/Atmestos" → dabar "Naujos/Patvirtintos/Atliktos", **be "Atmestos"**, nes backend neturi sąvokos vienam servisui atmesti bendrą, kelių servisų matomą užklausą — tai priklauso "multi-vendor" chat/pasiūlymų modeliui, ne 1:1 priėmimui):
  - **Naujos** = `service_id === null` (dar niekas nepriėmė) → "✓ Pasiūlyti kainą" (atidaro kainos laukelį kortelėje, siunčia `POST /orders/:id/quote`) + "📞 Skambinti".
  - **Patvirtintos** = `service_id === mano ID && status === 'in_progress'` (klientas pasirinko šį servisą) → "📞 Skambinti" + "✓ Pažymėti atlikta" (kainos laukelis → `POST /orders/:id/complete`, kur realiai paskaičiuojamas komisinis pagal trial/God Mode taisykles).
  - **Atliktos** = `service_id === mano ID && status === 'done'` → rodo galutinę kainą.
- Statistikos eilutė (šiandien/šią savaitę/patvirtinta/reitingas) ir "Savaitės apkrova" grafikas dabar skaičiuojami realiu laiku iš gautų užklausų, ne hardcoded skaičiai.
- Kainos įvedimas realizuotas kaip inline laukelis kortelėje (ne naršyklės `prompt()`), kad veiktų patikimai su automatiniu testavimu ir neblokuotų puslapio.
- Pilnai patikrinta naršyklėje: registracija → login → naujos užklausos matymas → kainos pasiūlymas → kliento priėmimas (per API) → pažymėjimas atlikta su kaina — visi žingsniai realiai išsisaugo DB.
- **Sąmoningai nesujungta** (nėra atitinkamos backend logikos, būtų atskiras darbas): "Šiandien" laiko juosta (kalendorius/rezervacijų laikai — schema neturi vizito laiko lauko), "Savaitės apkrovos" savaitės Nr. (hardcoded "2026 W27"), Atsiliepimai šoninio meniu punktas (neturi puslapio turinio), "Darbo statusas" (DIRBA/UŽDARYTA) mygtukas — tai lokalus UI perjungimas, DB neturi "šiandien laikinai uždaryta" lauko, SMS priminimas / atostogų blokavimas / CSV eksportas / laiko lango pridėjimas — visi lieka demonstraciniai `alert()` pranešimai kaip ir anksčiau. *(Statistika, Paslaugos, Profilis, Darbo laikas nuo šiol TURI realų puslapio turinį — žr. kitą sekciją.)*

**Kas dar žinoma, bet nepadaryta:**
- `replaceBotWithReal()` automatinis susiejimas (kai tikras servisas užsiregistruoja mieste+kategorijoje, automatiškai išjungti atitinkamą bot'ą) — admin gali tai padaryti rankiniu būdu (`/admin/bots/:id/toggle` arba `/admin/bots/replace` endpointas jau yra), bet niekas jo dar automatiškai neiškviečia serviso patvirtinimo metu.
- Visi 4 failai naudoja `const API_BASE = 'http://localhost:3000/api'` — prieš keliant į produkciją, tai reikės padaryti konfigūruojama (env/build-time), o ne hardcoded localhost.

---

## Dashboard šoninio meniu funkcijos (2026-07-08, pagal uzduotis-dashboard-funkcijos.md)
Serviso dashboard'e (`automeistrai-dashboard.html`) keturi šoninio meniu punktai (Profilis, Statistika, Paslaugos, Kalendorius) anksčiau buvo tik `alert()` — dabar padaryti realūs puslapiai su savo turiniu, po vieną patikrinant gyvai naršyklėje.

**Pridėtas puslapių perjungimo mechanizmas** (`switchDashPage()`) — `.dash-page`/`.dash-page.show` klasės, panašiai kaip admin.html `showPage()`.

**1. Profilis** (+ "Darbo laikas" veda į tą patį puslapį, nes darbo valandos yra profilio dalis)
- Redaguojami laukai: pavadinimas, adresas, telefonas, el. paštas, darbo pradžia/pabaiga.
- Backend: `PATCH /api/services/me` papildytas — dabar priima ir `email` (su unikalumo patikra, grąžina 409 jei užimtas). Kategorijų redagavimas iš šio endpoint'o **pašalintas** (perkeltas į Paslaugos, žr. žemiau — buvo rizika, kad du skirtingi endpoint'ai tuo pačiu metu perrašinėtų `service_categories` lentelę nesuderintai).
- **Patikrinta gyvai:** pakeistas pavadinimas/adresas/telefonas → išsaugota → viršuje nav bar pavadinimas atsinaujino iš karto → `GET /api/services/:id` (viešas endpointas) grąžino naujas reikšmes, patvirtinant kad matys ir `servisucentras-pagrindinis.html`.

**2. Statistika**
- Rodo: užklausų skaičius pagal statusą (naujos/siūloma/vykdoma/atlikta), šio mėnesio grynosios pajamos (kaina atėmus komisinį), vidutinis įvertinimas, populiariausios kategorijos, savaitės barų grafikas (tas pats stilius kaip "Savaitės apkrova").
- **Jokio naujo backend endpoint'o nereikėjo** — viskas suskaičiuota naršyklėje iš jau esančio `GET /api/orders` (service-scoped) + `GET /api/services/me`.
- **Patikrinta gyvai:** sukurta ir užbaigta testinė užklausa (150€, 0€ komisinis nes trial) → Statistika parodė "Atlikta (mano): 1", "Šio mėnesio pajamos: 150.00€", "Populiariausios kategorijos: Variklis 1" — visi skaičiai atitiko realius duomenis.

**3. Paslaugos**
- Sąrašas visų 12 kategorijų su varnele (aktyvi/neaktyvi) ir orientacine kaina ("nuo X€") kiekvienai.
- **DB migracija**: `service_categories` lentelė papildyta `price_from REAL` ir `active INTEGER NOT NULL DEFAULT 1` stulpeliais. Kadangi `CREATE TABLE IF NOT EXISTS` nepridėtų stulpelių jau egzistuojančiai lentelei, `backend/src/db.js` dabar turi `migrate()` funkciją su `PRAGMA table_info` patikra + `ALTER TABLE` — saugu paleisti pakartotinai ir su sena, ir su nauja DB.
- Nauji endpoint'ai: `GET /api/services/me/offerings` (visos 12 kategorijų + šio serviso būsena kiekvienai), `PUT /api/services/me/offerings` (perrašo visas iš karto).
- **Svarbu:** `GET /api/services` (viešas sąrašas) kategorijos filtras dabar reikalauja `sc.active = 1` — išjungus kategoriją Paslaugose, servisas iš karto dingsta iš to kategorijos rezultatų `servisucentras-pagrindinis.html` puslapyje, bet kaina/duomenys IŠLIEKA DB (galima vėl įjungti nepametus kainos).
- **Patikrinta gyvai:** įjungta "Kėbulas" (kaina 45€), išjungtas "Variklis" (kaina 50€ išsaugota) → `GET /api/services?category=kebulas` po to grąžino šį servisą, `GET /api/services?category=variklis` — nebegrąžino. Abu patikrinti tiesiogiai per API po UI veiksmo.

**4. Kalendorius** — po pirminio 1-3 patikrinimo vartotojas paprašė tęsti ir su šiuo punktu, tad įgyvendinta ir tą pačią sesiją.
- **DB migracija**: `orders` lentelė papildyta `scheduled_time TEXT` lauku (laisvos formos `YYYY-MM-DDTHH:MM`, be laiko zonos — tai tik vizito laiko etiketė, ne kažkas, nuo ko priklausytų komisinio skaičiavimas). Migracija tame pačiame `migrate()` funkcijoje `db.js`, saugi pakartotiniam paleidimui.
- Naujas endpointas: `PATCH /api/orders/:id/schedule` (tik servisas, tik savo užklausai) — nustato/keičia `scheduled_time`.
- Sprendimas **kada** servisas priskiria laiką: ne kainos pasiūlymo metu (per anksti — klientas dar gali pasirinkti kitą servisą), o po to, kai klientas jau priėmė pasiūlymą (`status='in_progress'`) — "Patvirtintos" tab'e prie kiekvienos užklausos atsirado mygtukas "📅 Priskirti laiką" / "📅 [data laikas]" jei jau priskirta.
- Kalendoriaus puslapyje: "Nesuplanuoti darbai" sąrašas (patvirtinti darbai be laiko) su greitu laiko priskyrimu, ir savaitės tinklelis (Pir–Sek) su navigacija ‹ Ankstesnė / Kitą › tarp savaičių, rodantis kiekvienos dienos suplanuotus darbus (laikas, kategorija, klientas).
- **Rasta ir pataisyta klaida testavimo metu:** savaitės tinklelio dienų datos buvo skaičiuojamos per `date.toISOString().slice(0,10)`, kas konvertuoja į UTC ir Lietuvos (UTC+2/+3) laiko juostoje pastumia datą per parą atgal — dėl to suplanuotas darbas atsirasdavo NE tame stulpelyje (pvz. įvestas 07-10 rodėsi po Šeš 07-11 stulpeliu). Pataisyta pridedant `localDateStr()` pagalbinę funkciją, kuri naudoja lokalias datos dalis (`getFullYear/getMonth/getDate`), o ne UTC konversiją — patikrinta, kad įvestas laikas dabar atsiranda tiksliai po ta data, kuri buvo įvesta.
- **Patikrinta gyvai:** patvirtintas darbas atsirado "Nesuplanuoti darbai" sąraše → priskirtas laikas (2026-07-10 14:00) → darbas persikėlė į teisingą savaitės stulpelį su teisinga data ir laiku → patikrinta navigacija į kitą/ankstesnę savaitę (tuščia kita savaitė rodoma teisingai, grįžus atgal darbas vis dar teisingoje vietoje).

**5. Darbo laikas pagal savaitės dieną** (2026-07-09, papildoma užklausa) — vartotojas paprašė Profilio darbo laiko lauką pakeisti iš vieno bendro laiko (visoms dienoms vienodai) į atskirą laiką kiekvienai savaitės dienai (pvz. Pir 8:00–17:00, Šeš uždaryta ir pan.).
- **DB**: `services` lentelė papildyta `work_hours TEXT` lauku — JSON masyvas iš 7 objektų `{open, start, end}` Pir→Sek tvarka. `NULL` reiškia "naudoti seną `work_start`/`work_end` visoms dienoms" (taip liko visi 10 Ukmergės bot servisų — jų niekas nekeitė, tad jiems galioja senas vienodas laikas). Senieji `work_start`/`work_end` laukai NEpašalinti — liko kaip atsarginis variantas.
- `PATCH /api/services/me` dabar priima `workHours` (masyvas iš 7), saugo kaip JSON string; `GET /services/me`, `/services/:id`, `/services` atsakymuose `work_hours` grąžinamas jau išparsintas (JS masyvas, ne string).
- **Profilio UI**: du laukai "Darbo pradžia/pabaiga" pakeisti į 7 eilutes (Pir..Sek), kiekvienoje — varnelė "dirba šią dieną" + laikas nuo/iki (išjungti, jei diena nepažymėta).
- **`servisucentras-pagrindinis.html`**: `isOpenNow()` atnaujinta — jei servisas turi `work_hours`, tikrina BŪTENT šios savaitės dienos intervalą; jei ne (bot servisai) — naudoja seną vienodą `work_start`/`work_end` logiką kaip anksčiau.
- **Rasta ir pataisyta klaida testavimo metu** (mano pačio, ne produkto): testinį servisą registravau per Bash `curl` su lietuviškais simboliais eilutėje tiesiai terminale — dalis UTF-8 simbolių (pvz. "Ukmergė" → "Ukmerge" be ė, "Garažiukas" → "Gara□iukas") sugadėjo terminalo koduotės, ne backend'o. Dėl to servisas nebuvo randamas paieškoje pagal miestą. Pataisyta: (1) tiesiogiai per DB (name/city/address), (2) per `PATCH /me` su JSON failu (patikimesnis UTF-8 kelias per `curl --data-binary @failas.json`) likusiems laukams. **Pamoka:** testuojant per šį terminalą, jei reikia siųsti lietuviškus simbolius per `curl -d`, saugiau rašyti JSON į failą (per Write įrankį) ir naudoti `--data-binary @failas`, o ne tiesiogiai eilutėje.
- **Patikrinta gyvai:** išsaugotas pilnas 7 dienų grafikas (Pir–Pen skirtingi laikai, Šeš 09–13, Sek uždaryta) → patikrinta per API, kad išliko tiksliai; pakeistas Ketvirtadienio laikas taip, kad apimtų (a) dabartinę valandą ir (b) neapimtų jos → `servisucentras-pagrindinis.html` serviso kortelė teisingai perjungė "DIRBA"/"UŽDARYTA" abiem atvejais, atitinkamai realiam dabartiniam laikui (patikrinta prieš tai `new Date()` naršyklėje).
- **Papildoma pataisa (vartotojo pastebėta):** laiko laukai (`<input type="time">`) naršyklėje rodė AM/PM formatą (pvz. "08:00 AM") vietoj 24 val. formato — tai priklauso nuo naršyklės/OS lokalės, ne nuo puslapio `lang="lt"` atributo (kurį jau turėjome). Pakeista į `<select>` su iš anksto suformatuotomis "08:00" stiliaus parinktimis (kas 30 min, 00:00–23:30) — visada rodo tiksliai 24 val. formatą, nepriklausomai nuo naršyklės nustatymų. Patikrinta, kad išsaugojimas veikia identiškai kaip su senais `<input>` laukais.

**6. Automatinis dashboard atnaujinimas / polling** (2026-07-09, `uzduotis-auto-atnaujinimas.md`) — serviso dashboard'as anksčiau matydavo naujas užklausas tik atsinaujinus puslapį (F5). Dabar `automeistrai-dashboard.html` kas 12 sek. tyliai iš naujo užklausia `GET /api/orders` ir atnaujina duomenis be viso puslapio perkrovimo.
- **Kaip veikia:** `pollOrders()` palygina naujai gautus duomenis su esamu `ordersCache` pagal `id`; jei atsiranda naujas `status='new'` užsakymas, kurio anksčiau nebuvo — paleidžiamas trumpas garso signalas (Web Audio API, be jokio išorinio audio failo), "Naujos" tab'as trumpam paryškinamas geltona spalva, o pati užklausos kortelė gauna 2.6 sek. pulsavimo animaciją.
- **Apsauga nuo duomenų praradimo:** jei servisas tuo metu redaguoja kainos/laiko lauką (t.y. `quotingOrderId` nustatytas), sąrašas per pollinimą NEPERPIEŠIAMAS — kad neišnyktų dar neišsiųsta jo įvedama reikšmė. Statistika/badge'ai atsinaujina bet kuriuo atveju.
- **Matomumo valdymas:** naudojant `document.visibilityState`/`visibilitychange` — pollinimas automatiškai sustoja, kai naršyklės skirtukas neaktyvus (fone), ir vėl prasideda, kai vartotojas grįžta į jį. Tai apsaugo nuo nereikalingo serverio apkrovimo.
- **Testavimo pastaba (šiai mašinai/aplinkai):** automatizuotoje Preview naršyklės sesijoje `document.hidden` visada rodo `true` (skirtukas niekada nelaikomas "matomu" per nuotolinį valdymą), tad pradinis `if(!document.hidden) startPolling()` apsaugos patikrinimas neleidžia pollinimui prasidėti automatiškai testuojant per šį įrankį — reikėjo rankiniu būdu iškviesti `startPolling()` per `preview_eval`, kad patikrinčiau funkcionalumą. Realiam vartotojui įprastoje naršyklėje `document.hidden` bus `false`, ir viskas prasidės savaime.
- **Patikrinta gyvai:** atidaryta dashboard'as, per API (kaip "kitas klientas") sukurta nauja užklausa → po ~13 sek. ji pati atsirado "Naujos" sąraše (be F5), atsinaujino ir "1 naujos" skaičiukas prie tab'o, ir šoninio meniu ženkliukas, suskambėjo garso signalas (`audioCtx.state === 'running'`). Taip pat patikrinta, kad pradėjus redaguoti kainą (kaina "55" įvesta į laukelį) ir palaukus dar vieną pollinimo ciklą — įvestas skaičius NEIŠNYKO, laukelis liko atviras; užbaigus pasiūlymą, užklausos statusas teisingai pasikeitė į `pending`.

---

## Būtini saugumo taisymai (2026-07-09, `uzduotis-saugumo-taisymai.md`)
Prieš rodant sistemą kitiems žmonėms (net uždaram testui su keliais tikrais servisais), sutvarkyti 4 kritiniai saugumo dalykai. **HTTPS/hostingas šiame etape sąmoningai nedaryti — tai tik lokaliam/uždaram testavimui.**

**1. JWT slaptažodis**
- Sugeneruotas tikras atsitiktinis raktas (`crypto.randomBytes(32).toString('hex')`, 64 hex simboliai) → įrašytas į `backend/.env` (šis failas NIEKADA netalpinamas į Git — jau buvo `.gitignore` sąraše nuo anksčiau).
- `backend/src/middleware/auth.js` — pašalinta pavojinga numatytoji reikšmė (`|| 'change-this-secret-in-production'`). Dabar, jei `JWT_SECRET` nerastas aplinkoje, serveris **iškart meta klaidą ir atsisako pasileisti** (fail-fast) — patikrinta gyvai, ištrynus `.env` serveris nepasileido su aiškia klaidos žinute.
- **Rasta ir pataisyta papildoma klaida pakeliui:** paaiškėjo, kad `dotenv.config()` `server.js` faile ieškojo `.env` failo pagal `process.cwd()` (dabartinį darbo katalogą), o ne pagal failo vietą — kadangi serveris paleidžiamas iš projekto šaknies (`.claude/launch.json`), o `.env` yra `backend/` pakatalogyje, dotenv jo NERASDAVO net kai jis egzistavo. Pataisyta: `require('dotenv').config({ path: path.join(__dirname, '..', '.env') })` — dabar visada randamas nepriklausomai nuo paleidimo katalogo.
- **Svarbu:** pakeitus `JWT_SECRET`, VISI anksčiau išduoti prisijungimo tokenai (admin/servisų/klientų, saugomi naršyklės `localStorage`) iškart tampa negaliojantys — visi turės tiesiog prisijungti iš naujo (tai normalu, ne klaida).

**2. Admin slaptažodis**
- Sugeneruotas stiprus atsitiktinis slaptažodis (`crypto.randomBytes(12).toString('base64url')`), įrašytas į `.env` kaip `ADMIN_PASSWORD`.
- Kadangi DB jau buvo sukurta anksčiau (su senu `admin123` hash'u), o seed logika pasileidžia tik VIENĄ kartą (pirmo DB sukūrimo metu), reikėjo papildomai **tiesiogiai atnaujinti jau esantį `admin_password_hash` DB įraše** (vienkartinis skriptas, ištrintas po panaudojimo).
- `backend/src/db.js` — pašalinta silpna numatytoji reikšmė `'admin123'` seed funkcijoje; dabar jei kas nors kurs VISIŠKAI naują DB be `ADMIN_PASSWORD` aplinkos kintamojo, seed procesas mes klaidą, o ne tyliai sukurs silpną slaptažodį.
- **Naują admin slaptažodį galima keisti bet kada** per admin panelės Nustatymus (jau veikianti funkcija, sukurta ankstesnėje sesijoje) — nebūtina keisti per `.env`/skriptą kaskart.

**3. CORS apribojimas**
- `backend/src/server.js` — vietoj atviro `cors()` be apribojimų, dabar tikrina `Origin` antraštę prieš konfigūruojamą sąrašą `ALLOWED_ORIGINS` (kableliais atskirti adresai, `.env` faile).
- Numatyta reikšmė — `http://localhost:5500` (tikrasis statinio frontend serverio adresas šioje dev aplinkoje; pastaba: užduoties tekste kaip pavyzdys buvo paminėtas `http://localhost:3000`, bet tai backend'o PATIES adresas, ne frontend'o — panaudotas teisingas 5500 portas, kad realiai veiktų).
- Ne-naršyklės kvietimai (curl, serveris-serveriui, be `Origin` antraštės) praleidžiami visada — CORS apsauga iš principo veikia tik naršyklės JS lygmenyje, ne kaip bendra prieigos kontrolė.
- Pridėta ir tvarkinga klaidos žinutė: neleidžiamas domenas dabar gauna `403 {"error":"CORS: šis domenas neleidžiamas"}`, o ne bendrą `500 Serverio klaida`.
- **Patikrinta gyvai:** `OPTIONS` užklausa su `Origin: http://localhost:5500` → gauna `Access-Control-Allow-Origin` antraštę (leidžiama); su `Origin: http://evil.example.com` → `403` be jokios CORS antraštės (blokuojama).

**4. Rate limiting**
- Naujas paketas `express-rate-limit`, bendra `authLimiter` konfigūracija `backend/src/middleware/rateLimit.js` — **10 bandymų per 15 min iš vieno IP**.
- Pritaikyta: `POST /auth/service/register`, `/auth/service/login`, `/auth/client/register`, `/auth/client/login`, `/admin/login`. (Svečio registracija `/auth/guest` sąmoningai palikta be limito — ji nepatikrina slaptažodžio, tad brute-force rizikos nekelia.)
- **Patikrinta gyvai:** 12 klaidingų admin login bandymų iš eilės → bandymai #1–10 grąžino `401` (neteisingi duomenys), bandymai #11–12 grąžino `429` (per daug bandymų).

**Po darbo patikrinta gyvai (visi 4 punktai kartu):**
- Admin prisijungimas su SENU slaptažodžiu (`admin123`) → `401` (nebeveikia, kaip ir turi būti).
- Admin prisijungimas su NAUJU slaptažodžiu → `200`, veikia per naršyklę (dashboard užsikrovė su realiais duomenimis).
- Serviso prisijungimas (`testas@servisas.lt` / `testas123`) → nepaveiktas, veikia kaip anksčiau.
- **Vienintelis pastebėjimas:** po `JWT_SECRET` pakeitimo, naršyklėse jau išsaugoti seni tokenai (`localStorage`) nebegalioja — testuojant reikėjo juos išvalyti/iš naujo prisijungti. Realiam vartotojui tai bus tiesiog "reikės prisijungti iš naujo" vienintelį kartą.

**Ką jums reikia žinoti / galbūt padaryti pačiam:**
- Naujas admin slaptažodis pasakytas atsakyme pokalbyje (ne šiame faile — sąmoningai, kad tikras slaptažodis nebūtų įrašytas projekto dokumentacijoje, kuri gali būti dalinamasi ar kada nors patekti į Git). Jis taip pat yra `backend/.env` faile, `ADMIN_PASSWORD` lauke. Norėdami pakeisti į savo — per admin panelės Nustatymus (paprasčiausia) arba tiesiogiai `.env` faile prieš kito DB sukūrimą.
- `backend/.env` failo NIEKAM neduokite, nesiųskite, netalpinkite viešai — jame realus JWT raktas ir admin slaptažodis.
- Jei kada nors inicijuosite Git repo šiam projektui (`git init`), `.env` jau yra `.gitignore` sąraše — bet PATIKRINKITE prieš pirmą `git add .`, kad jis realiai neįtrauktas į commit'ą.
- Niekas nenutrūko — visos anksčiau veikusios funkcijos (serviso dashboard, admin panelė, pagrindinis puslapis) veikia kaip anksčiau, tik su naujais, saugesniais duomenimis.

---

## Rankinis komisinio surinkimo režimas (2026-07-09, `uzduotis-rankinis-komisinis.md`)
Kol Stripe Connect (automatinis nuskaitymas) dar neįdiegtas, pridėtas rankinis komisinio surinkimo darbo eiga — sistema tik SKAIČIUOJA ir RODO, kiek kuris servisas skolingas; admin pats susisiekia ir surenka (pvz. banko pavedimu).

**1. Nustatymai → komisinio surinkimo būdas**
- Prie God Mode jungiklio pridėtas pasirinkimas: **Rankinis** (numatyta, aktyvus) arba **Automatinis (Stripe) — netrukus** (matomas, bet užrakintas — negalima pasirinkti, kol Stripe neįdiegtas).
- Saugoma `admin_settings.collection_mode` ('manual' | 'stripe'). Šiuo metu ši reikšmė TIK informacinė — nei viena esama funkcija dar netikrina jos reikšmės (nes Stripe režimo dar nėra ką aktyvuoti). **Struktūra paruošta**: kai bus diegiamas Stripe, tereikės (a) atrakinti "stripe" radio mygtuką, (b) pridėti realų Stripe Connect integracijos kodą, kuris pasileistų, kai `collection_mode === 'stripe'`, nekeičiant esamos DB schemos ar rankinio režimo logikos.
- Taip pat pridėti **banko rekvizitų** laukai (`bank_receiver`, `bank_iban`) — įvedami vieną kartą Nustatymuose, automatiškai įterpiami į kiekvieną generuojamą pranešimą (nereikia ranka rašyti kiekvieną kartą).

**2. Nauja skiltis "📈 Komisiniai / Sąskaitos"** (perdarytas anksčiau tuščias "Komisiniai" placeholder, ne nauja atskira meniu vieta)
- **Nauja DB lentelė** `service_invoices` (service_id, period 'YYYY-MM', work_total, amount_due, status unpaid/paid, paid_at) — vienas įrašas per servisą per mėnesį, `UNIQUE(service_id, period)`.
- `GET /api/admin/invoices?period=` — agreguoja TIESIOGIAI iš `orders.commission_amount`/`orders.price` (status='done', tas mėnuo), ir „upsert'ina" į `service_invoices`: jei įrašo dar nėra arba jis `unpaid` — sumos atnaujinamos; jei jau `paid` — **NEBELIEČIAMA** (užšaldyta istorinė reikšmė, apsaugota SQL `WHERE status='unpaid'` sąlyga upsert'e).
- **Svarbu:** kadangi `commission_amount` jau savaime yra 0, jei servisas dar trial periode arba God Mode išjungtas (paskaičiuota užsakymo užbaigimo metu), sąskaitų sąrašas AUTOMATIŠKAI rodo tik tuos servisus, kurie realiai turi ką mokėti — nereikėjo iš naujo kartoti trial/God Mode tikrinimo logikos.
- `PATCH /api/admin/invoices/:id/pay` — pažymi `status='paid'`, įrašo `paid_at` (data išlieka istorijai).
- Lentelėje: servisas, **patvirtintų darbų suma** (visų to mėnesio darbų, ne tik apmokestintų), **komisinis** (tik nuo tos dalies, už kurią jis realiai priskaičiuotas), statusas, mygtukas "✓ Pažymėti apmokėta" (dingsta, kai jau apmokėta).

**3. "Generuoti pranešimus visiems"**
- `POST /api/admin/invoices/generate-messages` — kiekvienam **neapmokėtam** servisui sugeneruoja atskirą teksto pranešimą (servisas, laikotarpis, darbų suma, komisinio suma, banko rekvizitai iš Nustatymų arba placeholder `[ĮRAŠYKITE ... Nustatymuose]`, jei dar neįvesti).
- Admin panelėje rodoma kaip sąrašas `<textarea readonly>` laukų su mygtuku "📋 Kopijuoti" (naudoja `navigator.clipboard.writeText()`, su atsarginiu `document.execCommand('copy')` senesnėms naršyklėms) — admin pats nukopijuoja ir siunčia el. paštu/SMS/skambučiu.
- **Jokios el. pašto siuntimo integracijos nėra ir nebuvo prašyta** — tik teksto generavimas kopijavimui, kaip ir specifikuota.
- **Rasta ir pataisyta klaida testavimo metu:** pirminė pranešimo formuluotė teigė "5.00€ (2.5% nuo 245.00€)" — matematiškai neteisinga, nes 245€ yra VISŲ to mėnesio darbų suma, o 5.00€ komisinis paskaičiuotas TIK nuo dalies, kuri buvo užbaigta po trial (245€ apėmė ir senesnį darbą, atliktą dar trial periodu, kurio komisinis=0). Tekstas pataisytas, kad neteigtų klaidingo tiesioginio matematinio ryšio tarp šių dviejų sumų — dabar aiškiai atskiria "darbų suma" ir "priskaičiuotas komisinis" kaip du atskirus faktus.

**Patikrinta gyvai (pilnas srautas):** laikinai nustatytas `trialMonths=0`, sukurta+priimta+užbaigta reali užklausa (200€, 2.5% → 5.00€ komisinis), grąžinta `trialMonths` atgal į 6 → sąskaitų lentelėje atsirado "Testinis Garažas" su teisinga darbų/komisinio suma → sugeneruotas pranešimas (patikrintas tekstas, tada dar kartą po banko rekvizitų įvedimo Nustatymuose — pranešimas atsinaujino su tikrais rekvizitais) → pažymėta apmokėta → statusas pasikeitė į "✓ Apmokėta [data]", veiksmo mygtukas dingo → pakartotinis pranešimų generavimas grąžino 0 pranešimų (apmokėta sąskaita teisingai nebeįtraukiama).

---

## "Bot" (sėklinių) servisų logika
Kad puslapis nebūtų tuščias, įkelta **20 dirbtinių (bot) servisų**, dabar padengiančių **visus 7 miestus** (ne tik Ukmergę): Ukmergė (10), Vilnius (2), Kaunas (2), Klaipėda (2), Šiauliai (2), Panevėžys (1), Alytus (1). Kartu padengia visas 12 kategorijų. Vartotojui jie vizualiai neatskiriami nuo tikrų servisų.

**2026-07-13 pakeitimas:** anksčiau kiti miestai buvo sąmoningai palikti tušti (rodoma "Registruoti servisą →" raginimo būsena) — savininko sprendimu tai pakeista, dabar visi miestai turi bent po 1-2 bot servisus nuo pat pradžių, kad God Mode/platformą būtų galima demonstruoti/testuoti neregistruojant tikrų servisų kiekviename mieste.

- **Realizacija (backend, ne front-end demo):** `backend/src/db.js` → `BOT_SERVICES` masyvas (kiekvienas įrašas turi `name`, `city`, `type`, `cats`). `seed()` funkcija prie paleidimo prideda **tik trūkstamus** bot servisus (pagal vardą) — saugu kviesti pakartotinai jau veikiančioje DB, neištrina ir nepakeičia esamų tikrų servisų/užklausų/sąskaitų.
- **2026-07-13: automatinis pakeitimas įgyvendintas.** Kai admin patvirtina tikrą servisą (`PATCH /api/admin/services/:id/approve`), sistema pati suranda to serviso miestą + kategorijas ir **automatiškai išjungia** (status → `inactive`) visus to paties miesto bot servisus, kurie dengia bent vieną tą pačią kategoriją. Response grąžina `{ ok: true, botsDisabled: N }`. Patikrinta gyvai: užregistruotas ir patvirtintas testinis servisas Vilniuje su kategorija „padangos" → bot „Sostinės Padangų Centras" (Vilnius, padangos) iškart tapo `inactive` ir dingo iš viešo sąrašo; kitas Vilniaus bot „Vilniaus Autoservisas Plius" (kitokios kategorijos) liko nepaliestas.
- Rankinis kelias (`POST /api/admin/bots/replace`) lieka kaip papildoma galimybė, jei admin nori pats susieti konkretų bot'ą su konkrečiu realiu servisu.
- **Neįgyvendinta (sąmoningai):** jei realus servisas vėliau užbanintas, atitinkamas bot'as **neatsigauna** automatiškai — niekas to neprašė, ir nėra patikimo būdo žinoti, kurį tiksliai bot'ą reikėtų grąžinti.

---

## Garso pranešimo išjungimas serviso dashboard'e (2026-07-13)
Anksčiau pridėtas naujos užklausos garsinis signalas (`playNewOrderSound()`, žr. Auto-atnaujinimas skiltį) veikdavo visada, be galimybės išjungti. Pagal savininko prašymą pridėtas **Nustatymai** puslapis serviso dashboard'e (`automeistrai-dashboard.html`) — anksčiau tai buvo tuščias, niekur nevedantis šoninio meniu mygtukas.
- Perjungiklis "Garsinis pranešimas apie naujas užklausas" — įjungta/išjungta būsena saugoma `localStorage` (`sc_sound_notif`), kiekvienam servisui/naršyklei individualiai (ne per DB — tai grynai lokali naršyklės nuostata, ne verslo duomenys).
- `playNewOrderSound()` dabar iš karto grąžina, jei nustatymas išjungtas — net `AudioContext` nesukuriamas.
- Pridėtas "🔊 Bandyti garsą" mygtukas, kad servisas iš karto išgirstų, kaip skamba pranešimas, nesulaukdamas realios naujos užklausos.
- Patikrinta gyvai: išjungus — garsas negroja (patikrinta, kad `AudioContext` net nesukuriamas), nustatymas išlieka po puslapio perkrovimo.

## Svečio formos automobilio laukas (2026-07-13)
Pagal savininko prašymą, svečio formoje ("Prieš rašant servisams") prie Vardo ir Telefono pridėtas naujas neprivalomas laukas **Automobilio modelis ir metai** (pvz. "VW Golf, 2018").
- `orders.car_info TEXT` — nauja stulpelis, saugomas kartu su užklausa (`POST /api/orders` priima `carInfo`).
- Rodoma serviso dashboard'e prie kiekvienos užklausos kortelės (🚗 ikona virš aprašymo).
- Telefono laukas **paliktas** (savininko sprendimu) — servisai vis dar gali paskambinti klientui.
- Patikrinta gyvai: užpildyta forma → užklausa sukurta su `car_info` → iškart matoma serviso "Užklausos" sąraše.

## Atsiliepimai (2026-07-13)
Nauja funkcija — `reviews` lentelė jau buvo schema.sql, dabar realiai naudojama:
- `POST /api/orders/:id/review` — (auth: client) klientas įvertina **tik užbaigtą** (`status='done'`) savo užklausą, 1-5 rating + komentaras. Vienas atsiliepimas per užklausą (antras bandymas → 409). Įrašius, `services.rating` perskaičiuojamas kaip visų to serviso atsiliepimų vidurkis.
- `GET /api/services/:id/reviews` — viešas sąrašas (rating, comment, data, kliento vardas), naudojamas servisui rodyti savo atsiliepimus.
- **Front-end UI dar nepridėtas** — nėra kliento prisijungusio dashboard'o puslapio, kur būtų mygtukas "palikti atsiliepimą" (klientai šiuo metu naudojasi tik svečio chat'u pagrindiniame puslapyje, be atskiro "mano užklausos" puslapio). Backend'as pilnai paruoštas ir patikrintas per API — UI integracija liktų atskiras darbas, jei prireiks.
- Patikrinta gyvai: 2 atsiliepimai tam pačiam servisui (5 ir 3) → vidurkis teisingai perskaičiuotas į 4.0; dublikato bandymas atmestas (409).

## Automatizuoti testai (2026-07-13)
`backend/test/` — `node --test` (Node įtaisytas testų paleidėjas, jokių naujų paketų).
- `test/helpers.js` — paleidžia realų serverį (`src/server.js`) vaikiniame procese su **izoliuota laikina SQLite DB** (per naują `DB_PATH` env kintamąjį `db.js`), tad testai niekada nepaliečia `data/servisucentras.db` su tikrais/demo duomenimis. Po testo failas ištrinamas (kartu su `-wal`/`-shm`).
- `test/api.test.js` — sveikatos patikra, auth/rolių apsaugos atmetimai (401/403), ir pilnas verslo srautas viename teste: serviso registracija → admin patvirtinimas (kartu patikrina bot auto-išjungimą) → kliento užklausa → kaina → priėmimas → užbaigimas (trial → komisinis 0) → atsiliepimas (+ dublikato atmetimas, + vidurkio atnaujinimas).
- Paleidimas: `cd backend && npm test`. Visi 6 testai praeina.
- **Pastaba:** Node testų aptikimo pattern'as automatiškai įtraukia bet kurį `.js` failą tiesiogiai `test/` kataloge kaip atskirą "testą" — `test/helpers.js` todėl irgi pasirodo rezultatuose kaip praeitas testas (be assertion'ų, tiesiog importuojasi be klaidų). Tai kosmetinis, ne funkcinis dalykas.

---

## Railway.app deploy paruošimas (2026-07-13)
Projektas paruoštas paviešinimui Railway.app testavimui (be domeno, Railway suteiktu adresu).

**Architektūrinis pakeitimas — vienas viešas adresas ir API, ir frontend'ui:**
- `backend/src/server.js` dabar pats atiduoda root'e esančius statinius HTML failus (`express.static` + `GET /` → `servisucentras-pagrindinis.html`), ne tik `/api/*`. Anksčiau frontend'ą atiduodavo atskiras `static-server.js` (portas 5500) — jis lieka faile kaip legacy/alternatyvi lokali parinktis, bet nebe pagrindinis kelias.
- Visuose 4 HTML failuose `API_BASE` pakeistas iš absoliutaus `http://localhost:3000/api` į santykinį `/api` — veikia nepriklausomai nuo domeno.
- **Rastas ir pataisytas CORS spąstas per patikrinimą:** kai frontend+backend suvienyti tame pačiame origin'e, naršyklė vis tiek siunčia `Origin` antraštę POST užklausoms — `ALLOWED_ORIGINS` numatytoji reikšmė (buvo tik `:5500`) blokavo pačios sistemos užklausas su 403. Pataisyta — dabar numatyta `http://localhost:5500,http://localhost:3000` (server.js fallback + `.env`/`.env.example`). **Railway'uje `ALLOWED_ORIGINS` BŪTINA nustatyti į tikrą Railway suteiktą adresą**, kitaip pati svetainė negalės kviesti savo API.
- `backend/src/db.js` — prieš atidarant DB, dabar pats susikuria trūkstamą `data/` aplanką (`fs.mkdirSync(..., {recursive:true})`) — apsauga švieziems Git/Railway checkout'ams.
- Naujas root-level `package.json` (plonas shim'as: `postinstall`/`start` nukreipia į `backend/`) — kad Railway/Nixpacks automatiškai atrastų projektą be papildomo "Root Directory" nustatymo Railway panelėje.
- `DB_PATH` env kintamasis (jau buvo pridėtas testams) dabar naudojamas ir produkcijai — Railway Volume rekomenduojamas mount'inti į `/data`, su `DB_PATH=/data/servisucentras.db`, kad SQLite duomenys išliktų tarp deploy'ų (be Volume, Railway failų sistema efemeriniška — DB dingtų po kiekvieno restart'o).
- Root-level `.gitignore` pridėtas (anksčiau buvo tik `backend/.gitignore`) — apima `node_modules/`, `.env*` (išskyrus `.env.example`), `backend/data/*.db*`. Patikrinta per `git status`/`git ls-files`, kad joks realus slaptažodis ar DB failas su testiniais duomenimis nepateko į commit'ą.
- **Git repo inicijuotas** (`git init` + pirmas commit, 32 failai) — **push NEDARYTAS**, paliktas savininkui po peržiūros.
- Pilnas žingsnis-po-žingsnio Railway diegimo sąrašas (GitHub prijungimas, env kintamieji, Volume, viešo adreso radimas) pateiktas pokalbyje su Claude — nekopijuotas čia, kad nesikartotų ir nesentėtų, jei Railway UI pasikeis.

**Patikrinta gyvai prieš commit'ą:** paleidus `backend` vienišai (be atskiro `static-server.js`), `http://localhost:3000/` rodo pagrindinį puslapį, `/servisucentras-admin.html` prisijungimas veikia per santykinį `/api`, automatiniai testai (6/6) praeina.

---

## Rasta ir pataisyta po pirmo Railway deploy (2026-07-13)
Savininkas pastebėjo viešame Railway adrese: (1) sena "AUTOMEISTRAI" markė viršuje `automeistrai-login.html`, (2) kliento registracijos mygtukas nieko nedaro paspaudus.

- **AUTOMEISTRAI logotipas — patvirtinta ir pataisyta.** `automeistrai-login.html:186` navigacijoje vis dar buvo `AUTO<em>MEISTRAI</em>`, nors `<title>`/`<h2>` jau seniau pataisyti į "ServisuCentras". Tai NEBUVO senos failo versijos problema (git istorijoje šis failas turi tik VIENĄ versiją, pirmame commit'e, ir ji jau turėjo šią klaidą) — tiesiog anksčiau pataisant branding'ą navigacijos logotipas buvo praleistas. Pakeista į `SERVISU<em>CENTRAS</em>`, atitinka kitų puslapių stilių.
- **Registracijos mygtukas — LOKALIAI veikia nepriekaištingai** (patikrinta gyvai: `POST /api/auth/client/register` → `201 Created`, rodomas "Paskyra sukurta!" ekranas, jokių console klaidų). Kadangi kodas identiškas tam, kas jau yra GitHub'e, problema tikriausiai yra Railway aplinkos konfigūracijoje, ne pačiame kode.
- **Rastas realus apribojimas (neįgyvendinta sąmoningai, saugumo sumetimais):** anksčiau duotose Railway instrukcijose buvo pasakyta, kad `ALLOWED_ORIGINS` galima laikinai palikti `*`. **Kodas šito NEPALAIKO** — CORS patikra lygina origin'ą su tiksliu sąrašu, `*` kaip pakaitos simbolis neveikia. Bandžiau pridėti wildcard palaikymą, bet tai buvo teisingai atmesta kaip saugumo susilpninimas (anksčiau šioje sesijoje CORS buvo sąmoningai sugriežtintas) — vietoj to, jei `ALLOWED_ORIGINS` Railway'uje nustatytas į `*` arba tuščią, jį reikia pakeisti į TIKSLŲ Railway domeną (žr. Railway deploy sekciją aukščiau, 5 žingsnis).
- **Kas dar reikia patikrinti Railway pusėje** (negaliu patikrinti nuotoliniu būdu): ar `ALLOWED_ORIGINS` nustatytas į tikslų Railway domeną (ne `*`, ne tuščias, ne senas `localhost`); ar `JWT_SECRET`/`ADMIN_PASSWORD` iš viso nustatyti (serveris atsisako pasileisti be jų); Railway "Deployments" skiltyje patikrinti, ar naujausias deploy'as realiai pasisekęs (ne kabantis/klaidingas senesnis build'as).

---

## Dashboard "Šiandien" grafikas — pašalinti fiktyvūs duomenys (2026-07-15)
Savininkas užregistravo naują testinį servisą ir pastebėjo, kad `automeistrai-dashboard.html` dešinėje esantis "Šiandien" laiko grafikas (8:00–17:00) rodė svetimus vizitus (Skoda Octavia, Toyota Corolla, VW Golf x2, Audi A4), kurių tas servisas niekada negavo.

- **Priežastis:** `TIMELINE` masyvas (senas kodas, dar iš prieš-backend etapo) buvo visiškai statinis/hardcoded, atvaizduojamas vieną kartą scenarijaus įkėlimo metu, visiškai nepriklausomai nuo `ordersCache`/API. Liko pamirštas, kol buvo daroma real backend integracija ir Kalendoriaus funkcija.
- **Pataisyta:** naujas `renderTimeline()` filtruoja `ordersCache` pagal `service_id === serviceProfile.id`, statusą (`in_progress`/`done`) ir `scheduled_time` datą = šiandien, sudėlioja į 8–17 val. tinklelį. Pietų pertrauka (12:00) liko fiksuota kaip vizualus elementas (ne kliento duomuo). Realaus vizito langelyje rodomas `car_info` (arba kliento vardas, arba kategorija kaip atsarginis variantas) + kategorijos pavadinimas; valanda, sutampanti su dabartiniu laiku, pažymima "DABAR". Tuščios valandos rodo "Laisva", kaip ir turėtų naujam servisui.
- `renderTimeline()` kviečiamas ir iš `loadOrders()`, ir iš `pollOrders()` — grafikas atsinaujina kartu su likusiu dashboard'u (auto-refresh), ne tik pirmo įkėlimo metu.
- **Patikrinta, kad ta pati problema nepasikartoja kitur:** "Savaitės apkrova" (`renderWeekBars()`) jau anksčiau buvo realiai sujungta su `ordersCache` — pataisymo nereikėjo.
- **Patikrinta gyvai:** naujam testiniam servisui ("Testinis Garažas") grafikas rodė vien "Laisva" (+ pietūs); sukūrus realų užsakymą su `car_info="BMW E46, 2003"` ir suplanavus jį 9:00 val., grafikas teisingai parodė "BMW E46, 2003 / 🔍 Diagnostika" būtent 9:00 langelyje, kitos valandos liko "Laisva". Testiniai duomenys išvalyti po patikrinimo. Automatiniai testai (6/6) toliau praeina.

---

## Nuoroda "Į pagrindinį puslapį" + 24 val. laiko formatas (2026-07-15)

**Nuoroda atgal iš dashboard'o.** `automeistrai-dashboard.html` viršutinėje juostoje visai nebuvo nuorodos atgal į `servisucentras-pagrindinis.html` — servisas, prisijungęs prie savo valdymo skydelio, neturėjo paprasto būdo grįžti. Pridėta aiški `← Pagrindinis` nuoroda kairėje, prieš "SERVISUCENTRAS" logotipą (paprastas `<a href="servisucentras-pagrindinis.html">`, ne JS/istorijos priklausoma). Kadangi tai įprasta naršyklės navigacija (ne atsijungimas), `sc_service_token` lieka `localStorage` — patikrinta gyvai: paspaudus nuorodą pereinama į pagrindinį puslapį, tokenas išlieka, grįžus atgal į dashboard'ą sesija vis dar galioja (neatsijungta).

**`servisucentras-admin.html`** — patikrinta, esama nuoroda `← Grįžti į puslapį` (eil. ~188) jau rodo teisingai į `servisucentras-pagrindinis.html`. Taisyti nereikėjo.

**`automeistrai-login.html`** — rastas ir pataisytas realus trūkumas: mygtukas `← Grįžti` naudojo `window.history.back()`, kuris NEGARANTUOJA grįžimo į mūsų pagrindinį puslapį (jei žmogus atėjo tiesiogiai/be naršyklės istorijos, mygtukas nieko nedarytų arba nuvestų kažkur kitur). Pakeista į tiesioginę nuorodą `location.href='servisucentras-pagrindinis.html'`. Taip pat logotipas (`<a class="logo" href="#">`) anksčiau vedė į tuščią `#` — dabar irgi veda į pagrindinį puslapį, atitinka tą patį "logotipas = namo" principą, kaip ir kituose puslapiuose.

**24 valandų laiko formatas registracijos formoje.** Serviso registracijos 3 žingsnio "Darbo valandos" laukai (`reg-s-work-start`/`reg-s-work-end`) naudojo `<input type="time">`, kuris rodo AM/PM arba 24 val. formatą priklausomai nuo naršyklės/OS lokalės — nepriklausomai nuo `lang="lt"`. Tai ta pati problema, kuri jau buvo anksčiau pataisyta dashboard'o Profilio darbo laiko laukuose (žr. "Darbo laikas" sekciją aukščiau), bet ši konkreti vieta liko nepastebėta. Pataisyta identiškai — pakeista į `<select>` su 48 fiksuotomis "HH:MM" reikšmėmis (kas 30 min, 00:00–23:30), numatyta 08:00/18:00.

**Patikrinta, kad formatas nuoseklus visur kitur:**
- Dashboard'o Profilio darbo laikas (7 dienų eilutės) — jau anksčiau naudojo tą patį `<select>` sprendimą, be pakeitimų.
- Viešas pagrindinis puslapis — servisų kortelėse rodomas tik boolean "DIRBA"/"UŽDARYTA" ženkliukas (`isOpenNow()`), NE raidinis laikas — AM/PM rizikos ten apskritai nėra.
- Admin panelė — darbo laikas apskritai niekur nerodomas.

**Patikrinta gyvai:** pilnas serviso registracijos srautas su pasirinktomis reikšmėmis 07:30/19:30 → DB įrašyta tiksliai `work_start='07:30'`, `work_end='19:30'`, jokio AM/PM iškraipymo. Testinis servisas išvalytas po patikrinimo. Automatiniai testai (6/6) toliau praeina.

---

## Responsive dizainas — dešinė forma dingdavo stačiame telefono rėžime (2026-07-15)

**Kritinė klaida `automeistrai-login.html`.** `.page{display:flex}` su `.left{width:420px;flex-shrink:0}` — kairė pusė turėjo fiksuotą 420px plotį, kuris niekada nesitraukdavo. Siaurame stačiame ekrane (pvz. 375px) vien kairė pusė jau platesnė už visą ekraną, o dešinė (`.right{flex:1}`) tiesiog neturėdavo kur tilpti ir dingdavo po `.page{overflow:hidden}` — jokio `@media` šiam failui apskritai nebuvo. Servisas/klientas negalėjo prisijungti/registruotis per telefoną stačiu būdu.

- **Pataisyta:** pridėtas `@media (max-width:620px)` — `.page` pereina į vertikalų (`column`) išdėstymą, `.left` tampa pilno pločio, `overflow` atlaisvintas, kad visas puslapis galėtų slinktis. Riba parinkta **žemiau** įprastų telefonų gulsčio režimo pločių (667px+), kad ta (savininko patvirtinta kaip jau veikianti) pusėgreta liktų nepakitusi — keičiasi tik stačias/siauras rėžimas.
- **Patikrinta gyvai keliais pločiais:** 375px, 390px, 414px (portretas) → sukraunama vertikaliai, forma pilnai pasiekiama slenkant, mygtukai/laukai veikia (patikrinta realiai perjungiant skirtuką ir renkant lauką). 667px, 900px (gulsčias/platus) → abi pusės lieka greta, nepakitę.

**Ta pati problemos klasė rasta ir `servisucentras-pagrindinis.html` — bet kitokia forma.** `<nav>` (logotipas + "Kaip veikia/Servisai/Diagnostika/Admin" nuorodos + "Prisijungti/Registruotis" mygtukai) neturėjo jokio siaurėjimo/susitraukimo mechanizmo — jų bendras plotis (~750px) neišsitenka į 375px ekraną. Tai sukeldavo **horizontalų viso puslapio persipildymą**, o pačiame testavimo įrankyje net priversdavo visą layout'ą apskaičiuoti pagal ~725px pločio "efektyvų" viewport'ą vietoj tikrojo įrenginio pločio (t.y. realiuose telefonuose šis elgesys galėtų sukelti arba nepageidaujamą horizontalų slinkimą, arba sumažintą/nutolusį viso puslapio vaizdą — abu blogai).
- **Pataisyta:** `@media (max-width:640px)` paslepia antrinę navigaciją (`.nav-links` — visos jos nuorodos vis tiek pasiekiamos kitaip: "Kaip veikia"/"Servisai" tik slenka į tame pačiame puslapyje esančias sekcijas, "Diagnostika" turi atskirą, gerai matomą CTA mygtuką puslapyje), sutraukia logotipo tekstą ir mygtukų dydį, kad "Prisijungti"/"Registruotis" liktų visada matomi ir nesukeltų persipildymo.
- **Patikrinta gyvai:** 375px → `window.innerWidth`/`document.documentElement.scrollWidth` sutampa (375=375, jokio persipildymo), "Prisijungti"/"Registruotis" matomi ir pasiekiami. 700px → antrinė navigacija vėl rodoma, joks persipildymas neatsiranda.
- **Papildomai rasta ir pataisyta po savininko paklausimo, ar tekstas tikrai tilps:** 375px lygyje viskas tilpo, BET **320px** (senesni/mažesni telefonai, pvz. pirmos kartos iPhone SE) vis dar turėjo ~26px persipildymą — sutraukto varianto neužteko. Pridėtas antras, siauresnis `@media (max-width:380px)`, paslepiantis grynai dekoratyvinę logotipo ikoną (tekstas "SERVISUCENTRAS" pats identifikuoja prekės ženklą, ikona nebūtina). Patikrinta gyvai per visą realų diapazoną — 320/360/375/414/430px — visur `nav.scrollWidth === nav.clientWidth` (jokio persipildymo) IR joks tekstas neapkarpytas (`scrollWidth === clientWidth` kiekvienam elementui atskirai patikrinta: logotipo pavadinimui, abiem mygtukams).

**Rasta, bet NEpataisyta (mažesnio prioriteto, savininko sprendimui):** `automeistrai-dashboard.html` ir `servisucentras-admin.html` abu turi fiksuoto pločio šoninį meniu (`.sidenav{width:220px}` / `.sidebar{width:200px}`, abu `flex-shrink:0`) + `.main{flex:1;overflow:auto}`. Siaurame telefono ekrane (375px) pagrindinis turinys **nedingsta** (skirtingai nuo login.html atvejo) — lieka matomas, bet suspaustas iki ~155–175px pločio, kas realiam duomenų lentelių/kortelių naudojimui būtų labai nepatogu. Kadangi šios dvi vietos yra darbui skirti (serviso/admin) įrankiai, dažniausiai naudojami nuo kompiuterio, o užduotis aiškiai įvardijo kritine problema tik registracijos/prisijungimo formą — šio suspaudimo netaisiau be atskiro patvirtinimo, kad neišplėsčiau užduoties apimties be reikalo.

---

## Svečio duomenų keitimas + automobilio info nebe "įšaldyta" (2026-07-15)

Du susiję pakeitimai svečio chat'e (`servisucentras-pagrindinis.html`), abu pačiame svečio formos overlay'uje (`#guest-overlay`), kuris dabar turi **3 režimus** (`guestOverlayMode`: `'new' | 'car' | 'edit'`), valdomus per `showGuestOverlay(mode)`:

**1. Galimybė pakeisti vardą/telefoną.** Anksčiau, jei svečias suklysdavo (pvz. įvesdavo blogą telefono numerį), vienintelis būdas pataisyti būtų buvęs rankiniu būdu valyti naršyklės `localStorage` — nerealu tikram vartotojui. Dabar chat antraštėje, kai svečias jau žinomas, rodoma "● Sveiki, [Vardas]! **✎ Pakeisti duomenis**" (nuoroda, `chatSubHtml()` funkcija). Paspaudus — atsidaro ta pati forma su vardu/telefonu iš anksto užpildytu (automobilio laukas paslėptas, nes tai atskira sąvoka — žr. žemiau), leidžianti pataisyti ir išsaugoti.
- **Techniškai:** naudojamas jau egzistavęs `PATCH /api/clients/me` endpoint'as (veikė bet kuriam `role:'client'`, taigi ir svečio tokenui, be jokio backend pakeitimo) — atnaujina TĄ PATĮ kliento įrašą DB (ne kuria naują), tad `client_id` išlieka tas pats. `localStorage` (`sc_client_name`, naujas `sc_client_phone`) atnaujinamas iškart.
- **Senos užklausos:** kadangi klientų vardas/telefonas rodomi per `JOIN` (ne užšaldyti užklausos sukūrimo metu), pataisius duomenis, VISOS to kliento užklausos (senos ir naujos) admin/serviso peržiūroje iš karto rodys PATAISYTĄ kontaktą — tai tyčia, nes servisui/adminui visada naudingiau matyti dabartinį, teisingą telefono numerį susisiekimui, o ne istoriškai užšaldytą klaidą.

**2. Automobilio info nebe "įšaldyta" kaip vardas/telefonas.** Anksčiau `car_info` buvo saugomas `localStorage` lygiai taip pat, kaip vardas/telefonas — bet tai neteisinga prielaida: vardas/telefonas yra kliento TAPATYBĖ (logiška prisiminti), o automobilis — KONKREČIOS UŽKLAUSOS duomuo (klientas gali turėti kelis automobilius arba klausti apie skirtingą kiekvieną kartą).
- **Pataisyta logika:** `guestCarInfo` nebe skaitomas/rašomas į `localStorage` — tai grynai atminties (in-memory) kintamasis, kuris nulinamas kiekvieną kartą, kai puslapis įkeliamas iš naujo (t.y. kiekvienam "naujam pokalbiui" šia prasme).
- Kai GRĮŽTANTIS svečias (vardas+telefonas jau žinomi iš `localStorage`) atidaro chat'ą ir **dar neturi aktyvios užklausos** šiame puslapio įkėlime (`currentOrderId === null`) → rodomas TIK trumpas automobilio klausimas ("Apie kurį automobilį klausiate šįkart?"), NE visa forma iš naujo — vardo/telefono laukai paslėpti, virš jų tik "Sveiki, [Vardas]! Ne jūs? Pakeisti duomenis" eilutė (paspaudus "Ne jūs?" — perjungia į pilną redagavimo formą).
- Kai svečias JAU turi aktyvią, dar neuždarytą užklausą (`currentOrderId` nustatytas) — automobilio VĖL neklausiama, laikoma, kad tai tas pats pokalbis apie tą patį automobilį.
- Automobilio info langelis neprivalomas — uždarius (✕) be pildymo, vis tiek pereinama į chat'ą su tuščiu `guestCarInfo`, kaip ir anksčiau.
- Tai natūraliai sprendžia "kelių automobilių" atvejį be jokios papildomos sudėtingos sistemos — klientas tiesiog kaskart parašo, apie kurį automobilį klausia.

**Patikrinta gyvai, pilnas srautas:**
1. Naujas svečias, vardas "Test Vartotojas", **sąmoningai neteisingas** telefonas `+37060000001`, automobilis "Opel Astra, 2010" → užklausa #14 sukurta, DB patvirtinta: klaidingas telefonas + teisingas automobilis.
2. Paspausta "✎ Pakeisti duomenis" → forma rodo vardą + KLAIDINGĄ telefoną (automobilio laukas paslėptas) → pakeista į teisingą `+37069998877`, išsaugota → DB patvirtinta: kliento telefonas atnaujintas, o užklausos #14 `car_info` liko NEPALIESTAS ("Opel Astra, 2010").
3. Puslapis perkrautas (imituoja naują apsilankymą) → `guestName`/`guestPhone` teisingai atsistatė iš `localStorage` (su PATAISYTU telefonu), bet `guestCarInfo` tuščias, `currentOrderId` — `null`.
4. Atidarius chat'ą — rodomas TIK automobilio klausimas (ne visa forma), su "Sveiki, Test Vartotojas!" sveikinimu. Įvestas NAUJAS automobilis "Škoda Fabia, 2015" → išsiųsta žinutė → sukurta NAUJA užklausa #15.
5. DB patvirtinta: užklausa #14 (sena) → `car_info = "Opel Astra, 2010"` (nepakitęs); užklausa #15 (nauja) → `car_info = "Škoda Fabia, 2015"` — abi teisingos, nepriklausomos.
6. Tęsiant TĄ PATĮ, jau aktyvų pokalbį (be puslapio perkrovimo) — automobilio nebeklausiama pakartotinai, chat atsidaro iškart.
7. Automobilio klausimo praleidimas (✕) irgi patikrintas — vis tiek leidžia tęsti chat'ą.

Testiniai duomenys (klientas, 2 užklausos) išvalyti po patikrinimo. Automatiniai testai (6/6) toliau praeina.

---

## Telefono lauke iš anksto "+370 " (2026-07-20)
Visi 4 telefono numerio laukai (svečio chat pagrindiniame puslapyje, serviso/kliento registracija, svečio forma login puslapyje) dabar iš anksto turi `+370 ` prefiksą — vartotojui nebereikia jo rašyti kaskart, tik tęsti nuo likusių skaitmenų. Kursorius fokusavimo metu automatiškai atsistato teksto gale (`onfocus="this.setSelectionRange(this.value.length,this.value.length)"`). `automeistrai-login.html` — statinis `value="+370 "` ant `<input>`. `servisucentras-pagrindinis.html` (svečio overlay) — nustatoma dinamiškai `showGuestOverlay('new')` funkcijoje (ne 'edit'/'car' režimuose, kur laukas arba paslėptas, arba užpildomas realia jau žinoma reikšme). Patikrinta gyvai: registracija su „+370 61234567" → DB įrašyta tiksliai ta reikšmė.

---

## Bot servisai negali siūlyti kainos + servisai nemato vieni kitų pasiūlymų (2026-07-20)

**Dalis 1 — bot servisai chat'e atsako, bet be kainos.** `servisucentras-pagrindinis.html`'s `simulateReplies()` (suvaidinti "gyvi" atsakymai chat'e po kliento žinutės, žr. Auto-atnaujinimas/bot logikos sekcijas aukščiau) anksčiau VISIEMS kandidatams — tiek tikriems servisams, tiek bot'ams — rodydavo tą patį scenarijų su kainos pasiūlymu (`offer-card` + `€` + "✓ Priimti" mygtukas). Kadangi bot'ai — tik placeholder'iai, kol neužsiregistruos tikras servisas (neturi paskyros, negali realiai atlikti darbo — žr. "Bot" servisų logikos sekciją), jiems neteisinga rodyti realų, "priimamą" kainos pasiūlymą.
- **Pataisyta:** `candidates.forEach` dabar tikrina `svc.is_bot`. Jei bot'as — rodomas TIK bendras, informatyvus tekstas (pvz. "Dėl tikslios kainos ir laisvo laiko geriausia paskambinti mums tiesiogiai"), BE `offer-card`/kainos/"Priimti" mygtuko. Jei tikras servisas (`is_bot=0`) — elgesys nepakitęs, kaina ir toliau siūloma kaip anksčiau.
- Tai taip pat netiesiogiai išsprendžia latentinę problemą: anksčiau klientas TEORIŠKAI galėjo "priimti" bot'o pasiūlymą (`POST /orders/:id/accept` su bot'o ID) — užklausa būtų amžinai kabėjusi, nes bot'as fiziškai negali prisijungti ir ją užbaigti. Dabar bot'ams apskritai nerodomas joks priimamas pasiūlymas.
- **Patikrinta gyvai:** Ukmergė + kategorija „diagnostika" turi 1 tikrą servisą ("Testinis Garažas") + 2 bot'us ("Motorsport UKM", "Ukmergės Autoservisas"). Sukurta užklausa, sulaukta visų 3 simuliuotų atsakymų: tikras servisas → turi `offer-card` su kaina; abu bot'ai → tik tekstinis atsakymas, `offer-card` nėra.

**Dalis 2 — servisai nemato vieni kitų pasiūlytos kainos (daugiavendorinis modelis).** Architektūra: viena užklausa (`orders`) gali gauti kainos pasiūlymus iš KELIŲ skirtingų servisų — kiekvienas pasiūlymas įrašomas kaip atskira eilutė `order_messages` lentelėje (`sender_type='service', sender_id=<id>, price_quote=X`), visi susieti su tuo pačiu `order_id`. **Rasta ir pataisyta reali privatumo spraga:** `GET /api/orders/:id/messages` anksčiau grąžindavo VISAS tos užklausos žinutes VISIEMS — joks nuosavybės/rolės filtras nebuvo taikomas. Tai reiškė, kad bet kuris servisas (ar net klientas, kuriam ta užklausa nepriklauso) galėtų per API pamatyti VISŲ kitų servisų pasiūlytas kainas tai pačiai užklausai — realus konkurencinio privatumo pažeidimas daugiavendoriniame modelyje (dabartinė dashboard sąsaja šio endpoint'o dar nenaudoja, bet pati API buvo pažeidžiama).
- **Pataisyta** (`backend/src/routes/orders.routes.js`, `GET /:id/messages`):
  - Pridėtas nuosavybės patikrinimas klientams: jei `req.user.role === 'client'` ir `order.client_id !== req.user.id` → `403`.
  - Servisams žinutės filtruojamos: matoma tik `sender_type !== 'service'` (t.y. kliento žinutės, bendros visiems besidomintiems servisams) ARBA `sender_id === req.user.id` (savo pačių žinutės/pasiūlymai). Kito serviso pasiūlymas — niekada nerodomas.
  - Klientas (užklausos savininkas) mato VISKĄ — visus pasiūlymus, kad galėtų palyginti kainas ir pasirinkti.
- **Patikrinta gyvai:** du skirtingi tikri servisai (id 11 ir 12) pasiūlė 45€ ir 60€ tai pačiai užklausai → servisas 11 per API matė TIK savo 45€ (nematė 60€), servisas 12 matė TIK savo 60€ (nematė 45€), klientas matė ABU (45€ ir 60€), o kitas (svetimas) klientas gavo 403.
- **Pridėtas automatinis regresijos testas** (`backend/test/api.test.js`, "daugiavendorinis modelis: servisai nemato vieni kitų kainos, klientas mato abu") — registruoja 2 servisus tame pačiame mieste/kategorijoje, abu pasiūlo skirtingą kainą tai pačiai užklausai, patvirtina izoliaciją. Automatiniai testai dabar 7/7.
- **Neliesta (nebuvo prašyta, paminėta informacijai):** `POST /api/orders/:id/messages` (žinutės siuntimas) irgi neturi nuosavybės patikrinimo — bet kuris galiojantis tokenas gali PARAŠYTI į bet kurios užklausos giją. Tai atskira, mažesnio prioriteto problema nei kainos MATOMUMAS, kurio konkrečiai buvo paprašyta — nefiksuota, kad neišplėsčiau užduoties apimties be atskiro patvirtinimo.

> **Pastaba (2026-07-21):** aukščiau aprašytas "servisas visiškai nemato kito serviso žinutės" elgesys buvo PATIKSLINTAS — žr. „GALUTINIS chat matomumo sprendimas" žemiau. Nuo šiol TEKSTAS lieka matomas visiems, tik KAINA/LAIKAS redaguojami.

---

## Pilnas mobiliojo ekrano patikrinimas — visi failai (2026-07-21)

Patikrinta kiekvienam failui atskirai per 320/360/390/414/430/900/1280px pločius (Browser pane + `resize_window` + DOM introspekcija, ne tik screenshot'ai — nustatyta, kad screenshot įrankis šioje sesijoje buvo nepatikimas/strigdavo, tad struktūriniai patikrinimai — `scrollWidth`, `getComputedStyle`, elementų sąrašai — buvo pagrindinis būdas).

**`servisucentras-pagrindinis.html` — rasta ir pataisyta:** viršutiniame meniu 4 nuorodos ("Kaip veikia", "Servisai", "🔍 Diagnostika", "⚙️ Admin") telefone buvo VISIŠKAI nepasiekiamos, be jokio atsarginio varianto (tarp jų — verslui kritinė Admin nuoroda). Pridėtas hamburger mygtukas (`☰`, `.nav-hamburger`) + išsiskleidžiantis `.mobile-menu` su visomis 4 nuorodomis, atitinkantis esamą stilių. Patikrinta 375/390px — meniu atsidaro, visos nuorodos veikia, užsidaro po paspaudimo ant slinkties nuorodos; 900px — hamburger paslėptas, įprastas meniu rodomas kaip anksčiau. Kategorijų lenta/servisų sąrašas/chat langas/svečio forma — jau anksčiau (ankstesnės užduoties metu) sutvarkyti, papildomai patikrinta, kad krautųsi vertikaliai be horizontalaus slinkimo.
- Rasta CSS klaida savo paties darbe proceso metu ir iškart ištaisyta: bazinė `.nav-hamburger{display:none}` taisyklė buvo įrašyta PO `@media` bloko, kuris ją turėjo parodyti — dėl vienodo specifiškumo laimėdavo vėlesnė (bazinė) taisyklė nepriklausomai nuo ekrano pločio. Sutvarkyta perkeliant bazines taisykles PRIEŠ `@media` bloką. **Šis modelis (bazinė taisyklė PRIEŠ media query) sąmoningai pritaikytas visur toliau, kad klaida nepasikartotų.**
- Papildomai ištirta (bet NEKEISTA, nes kodas teisingas): `.chat-panel` transform/slide-in animacija — `getComputedStyle().transform` testavimo metu rodė neteisingą reikšmę net pridėjus `.show` klasę. Išsamiu tyrimu (izoliuotas kontrolinis testas su nesusijusiu elementu, identiška `transform`+klasės-perjungimo schema) įrodyta, kad tai **testavimo įrankio ribotumas**, ne reali puslapio klaida — CSS pati savaime teisinga (patikrinta per `document.styleSheets`, yra tik viena `.chat-panel.show` taisyklė). Ateityje šito nebereikia tirti iš naujo kaip "klaidos".

**`automeistrai-login.html` — patikrinta pakartotinai, nieko papildomai keisti nereikėjo:** ankstesnės užduoties fix'ai (dviejų kolonų forma stačiam telefonui, `.logo-icon{display:none}` po 380px) toliau veikia teisingai 360/414px — registracijos 3-čio žingsnio laukų eilutė (darbo valandų select'ai) ir kategorijų varnelių tinklelis tilpsta be horizontalaus slinkimo.

**`automeistrai-dashboard.html` — rasta ir pataisyta:** viršutinis meniu (`.nav-back-link` + `.nav-logo` + `.nav-service-name` + `.nav-right`) sudėjus užimdavo ~598px pločio 390px ekrane — realus horizontalus persipildymas, dėl kurio net `window.innerWidth` klaidingai persiduodavo. Šoninis meniu (`sidenav`, fiksuoto 220px pločio) papildomai spausdavo turinį iki ~170px pločio. Pataisyta: hamburger mygtukas + stumdomas (off-canvas) šoninis meniu su fonu (`sidenav-backdrop`), viršutinio meniu elementai sutrumpinti/sutraukti mažuose ekranuose (pvz. "← Pagrindinis" → "←"). Patikrinta 390px: `topnavOverflows:false`, `mainW:390` (buvo ~170px), meniu atsidaro/užsidaro teisingai, puslapio perjungimas (`switchDashPage`) automatiškai uždaro meniu; 1280px — desktop nepakitęs (hamburger paslėptas, sidenav 220px kaip anksčiau). Statistika/Paslaugos puslapiai — be persipildymo; Kalendoriaus dienos tinklelis (431px) lieka platesnis už `.main` (390px), bet `.main{overflow:auto}` jau suteikia SAVO, apribotą horizontalų slinkimą (puslapio lygyje `docScrollW` lieka 390px) — tai priimtina, ne "apkarpytas/nepasiekiamas" turinys.

**`servisucentras-admin.html` — rasta ir pataisyta (tas pats modelis kaip dashboard.html):** viršutinė juosta (`topbar`: logotipas + GOD MODE ženkliukas + nuoroda atgal + laikrodis + ikonos) ir fiksuoto 200px pločio šoninis meniu (`sidebar`) kartu netilpdavo 390px ekrane. Pridėtas hamburger mygtukas + stumdomas šoninis meniu su fonu, GOD MODE ženkliukas/nuoroda atgal/laikrodis paslėpti mažuose ekranuose vietos taupymui. Patikrinta pilnai: 390px → `topbarOverflows:false`, `mainW:390`, meniu atsidaro (11 punktų: Dashboard/Klientai/Servisai/Užklausos/Chat žinutės/Atsiliepimai/Pajamos/Komisiniai/Bot servisai/Nustatymai/Atsijungti), paspaudus punktą (`showPage`) puslapis persijungia IR meniu automatiškai užsidaro; 1280px → hamburger paslėptas, sidebar 200px kaip anksčiau, GOD MODE ženkliukas matomas. Visos lentelės (Klientai/Servisai/Užklausos/Bot servisai) turi apgaubiantį konteinerį su savo, apribotu horizontaliu slinkimu (`docScrollW` puslapio lygyje visada 390px) — priimtina. **Papildomai rasta ir pataisyta:** Dashboard puslapio statistikos eilutė (`.stats-row`, 5 fiksuotos kolonos) 390px ekrane užimdavo 463px, verčiant visą puslapį slinktis į šoną. Pataisyta — mažuose ekranuose (≤640px) `grid-template-columns` pakeista į 2 kolonas (buvo padaryta ta pati source-order klaida kaip ir pagrindiniame puslapyje pirmame bandyme — iškart pastebėta ir ištaisyta, taisyklė perkelta po baziniu `.stats-row` apibrėžimu). Patikrinta: 390px → 2 kolonos, `dashScrollW:390`, be persipildymo; 1280px → 5 kolonos kaip anksčiau, nepakitę.

**`servisucentras-diagnostika.html` — failo NĖRA projekte.** Kitų puslapių `<a href="servisucentras-diagnostika.html">` nuorodos (nav meniu, mobile meniu) rodo į neegzistuojantį failą — tai jau egzistavusi "negyva" nuoroda, ne šios užduoties sukurta problema. Niekas nebuvo tikrinama/taisoma šiam failui, nes jo tiesiog nėra — reikėtų arba sukurti šį puslapį, arba pašalinti nuorodas, jei diagnostikos funkcija apskritai neplanuojama.

**Bendra pastaba ateičiai:** visur, kur pridedama nauja mobili-only CSS taisyklė tam pačiam selektoriui kaip jau esanti bazinė taisyklė, bazinė taisyklė PRIVALO būti anksčiau faile nei `@media` perrašymas — priešingu atveju laimi vėlesnė (nepriklausomai nuo media query), nes specifiškumas vienodas. Ši klaida šioje užduotyje pasikartojo 2 kartus (pagrindinis.html nav, admin.html stats-row) ir abu kartus buvo iškart pastebėta testavimo metu ir ištaisyta.

---

## GALUTINIS chat matomumo sprendimas + serviso siūlomas laikas + realus kliento chat'as (2026-07-21)

**GALUTINĖ taisyklė (pakeičia 2026-07-20 aprašytą elgesį aukščiau):**
- **TEKSTAS matomas VISIEMS** — klientas ir visi tinkami servisai mato tą pačią pokalbio tekstinę dalį (kliento žinutes, servisų bendrus komentarus/klausimus).
- **KAINA ir SIŪLOMAS LAIKAS lieka PRIVATŪS** — kiekvienas servisas mato TIK savo paties kainą/laiką. Klientas mato VISŲ servisų kainas/laikus (gali palyginti). Servisai TARPUSAVYJE kainų/laikų nemato.
- **Pataisyta** (`backend/src/routes/orders.routes.js`, `GET /:id/messages`): vietoj to, kad VISIŠKAI išfiltruotų kito serviso žinutę (senas elgesys), dabar žinutė PALIEKAMA (tekstas matomas), bet `price_quote`/`available_time` redaguojami į `null`, jei žinutės siuntėjas — kitas servisas, ne užklausą peržiūrintis.

**Naujas laukas: serviso siūlomas laikas (`available_time`).** Servisas gali pasiūlyti ne tik kainą, bet ir laiką, kada gali priimti automobilį — analogiškai kainai, tas pačias privatumo taisykles (privatu tarp serviso ir kliento).
- DB: `order_messages.available_time TEXT` (nauja migracija, add-only).
- `POST /orders/:id/quote` priima papildomą `availableTime` lauką (nebūtinas).
- Dashboard'e ("Pasiūlyti kainą") šalia kainos lauko atsirado `datetime-local` laukas.

**Ištaisyta reali "Pasiūlyti kainą" mygtuko klaida.** Vartotojas pranešė, kad mygtukas serviso pusėje "neveikia". Ištirta gyvai (prisijungus kaip realus servisas, stebint console/network) — pats mygtukas ir API veikė teisingai (`201 Created`), bet:
- Paspaudus "Siųsti" su tuščiu kainos lauku, vienintelis atsakas buvo raudonas rėmelis aplink lauką — JOKIO teksto/pranešimo apie klaidą. Vartotojui tai atrodo kaip "niekas nevyksta".
- Paspaudus Enter kainos lauke (natūralus instinktas vietoj mažo mygtuko paspaudimo) — NIEKAS nevykdavo, nes laukas neturėjo jokio `keydown`/Enter apdorojimo.
- **Pataisyta** (`automeistrai-dashboard.html`): pridėtas matomas klaidos tekstas ("Įveskite kainą (didesnę už 0)") po lauku vietoj vien rėmelio spalvos keitimo; pridėtas Enter klavišo apdorojimas kainos ir laiko laukams (`onkeydown`).

**Dashboard: pilnas pokalbio vaizdas "Užklausos" skiltyje (NE Profilis).** Ant kiekvienos užklausos kortelės atsirado "💬 Pokalbis" mygtukas — paspaudus, kortelė išsiskleidžia ir parodo VISĄ pokalbio giją (kliento žinutės + visų servisų tekstiniai atsakymai, pagal privatumo taisyklę — savo kaina/laikas matomi paryškinti, kito serviso kaina/laikas niekada nerodomi). Sąmoningai NEDĖTA į Profilis skiltį, kaip aiškiai paprašyta — integruota tiesiai į Užklausos sąrašą. Pokalbis automatiškai atsinaujina kartu su likusiu poll'inimu (12s ciklas), kad neliktų įstrigęs "Kraunama..." būsenoje.

**Didžiausias radinys: kliento chat'as (`servisucentras-pagrindinis.html`) iki šiol NIEKADA nerodė realios serviso kainos.** Tiriant "rodyti laiką šalia kainos" užduotį paaiškėjo, kad `simulateReplies()` VISIEMS servisams (ne tik bot'ams) generuodavo pilnai SUVAIDINTĄ kainą (`Math.floor(20+Math.random()*30)` ir pan.) ir hardcoded laiką ("Rytoj 10:00") — visiškai nesusijusius su tuo, ką realus servisas iš tikrųjų įvesdavo dashboard'e per "Pasiūlyti kainą". Klientas per visą platformos gyvavimą matydavo tik atsitiktinę suvaidintą kainą chat'e, niekada tikrąją. Paklausus vartotojo, patvirtinta: **pilnai sujungti su realiais duomenimis.**
- **Pataisyta:** `simulateReplies()` dabar veikia TIK bot servisams (suvaidintas bendras atsakymas be kainos, kaip ir anksčiau — bot'ai negali realiai priimti darbo).
- Realiems servisams pridėta `startOrderPolling()`/`pollOrderMessages()` — kas 4s tikrina `GET /orders/:id/messages`, naujas serviso žinutes su `price_quote` paverčia į TIKRĄ `offer-card` (reali kaina, realus laikas arba "susitarsime telefonu" jei laikas nenurodytas), žinutes be kainos — į paprastą teksto burbulą. Naudoja `renderedMessageIds` Set, kad tos pačios žinutės nepersirodytų kas ciklą.
- "✓ Priimti" ant realaus pasiūlymo iškviečia TĄ PATĮ `POST /orders/:id/accept`, kaip ir anksčiau (nekeista).
- Pridėtas `escapeHtml()` naujam žinutės teksto atvaizdavimui (apsauga nuo XSS realiu servisų/klientų įvedamu tekstu) — pastebėta, kad likusi chat'o dalis (pvz. `sendMsg()`) šio neturi (sena, neliesta), bet naujam kodui pritaikyta iš karto.

**Patikrinta gyvai, pilnas srautas su 2 servisais:**
1. Sukurta nauja užklausa Kaune, kategorija "stabdžiai".
2. Servisas A (dashboard) pasiūlė 88€ + laiką "2026-07-21T18:00" + žinutę "Galime priimti jau šiandien".
3. Servisas B (dashboard) pasiūlė 65€, be laiko, be žinutės.
4. Kliento chat'e (per ~4s poll'inimą) atsirado ABU realūs pasiūlymai: "88€ · 📍 Bug Servisas A · 🕐 21 liep 18:00" ir "65€ · 📍 Bug Servisas B · 🕐 susitarsime telefonu".
5. Servisas A dashboard'e (per "💬 Pokalbis") matė SAVO 3 kainas + kliento tekstą + Serviso B TEKSTĄ ("Galime priimti šiandien 16 val"), bet NE Serviso B kainą/laiką (redaguota į null).
6. Klientas paspaudė "Priimti" ant Serviso B pasiūlymo → `POST /orders/:id/accept` → DB patvirtinta: `service_id=26, status='in_progress'`.
7. Automatiniai backend testai atnaujinti šiam GALUTINIAM elgesiui (7/7 praeina).

---

## DB patvarumas — WAL režimas prarasdavo neseniausius duomenis (2026-07-21)

Po aukščiau aprašyto funkcionalumo, vartotojas paprašė patikrinti, ar viskas veikia. Perpatikrinant gyvai paaiškėjo, kad VISI tos pačios sesijos metu sukurti testiniai duomenys (klientas, 2 servisai, 2 užklausos su realiais pasiūlymais) API požiūriu dingo — seniai (dar liepos pradžioje) sukurta sėklinė duomenų bazė liko nepaliesta.

**Priežastis:** `backend/src/db.js` naudojo `PRAGMA journal_mode = WAL` — šiame režime neseniausi įrašai laikomi atskirame `.db-wal` faile ir susilieja į pagrindinį `.db` failą tik per checkpoint'ą. Jei procesas/aplinka persikrauna anksčiau nei checkpoint įvyksta, tie įrašai dingsta, nors patys failai (WAL, SHM) fiziškai išlieka diske. Tai **greičiausiai ta pati priežastis**, dėl kurios anksčiau (2026-07-13 užduotyje) buvo pastebėta, kad production Railway aplinkoje matėsi 0 klientų/0 užklausų — atviras, tuomet neatsakytas klausimas.

**Pataisyta:** `db.js` perjungtas į `PRAGMA journal_mode = DELETE` — kiekvienas commit'as iškart įrašomas į patį `.db` failą, nėra atskiro neužfiksuoto failo, kurį galima prarasti. Mažo srauto projektui (viena maža vietos rinkos platforma) papildoma I/O kaina nereikšminga, patvarumas svarbesnis.

**Patikrinta gyvai — regresijos testas pačiam radiniui:**
1. Perjungus režimą ir perkrovus serverį, `.db-wal`/`.db-shm` failai išnyko, visi anksčiau "pamesti" duomenys (klientai/servisai) atsirado atgal pagrindiniame `.db` faile (WAL automatiškai susiliejo perjungimo metu).
2. Serveris perkrautas DAR KARTĄ (tikras regresijos testas) — duomenys IŠLIKO (anksčiau šiuo momentu jie būtų dingę).
3. Automatiniai testai (7/7) praeina nepakitę.

**Rekomendacija Railway/production aplinkai:** verta patikrinti, ar tas pats `journal_mode` pakeitimas išsprendžia ir ten pastebėtą 0 klientų/0 užklausų reiškinį — kitą kartą deploy'inant šis fix'as jau bus įtrauktas automatiškai (žr. `backend/src/db.js`).

---

## Užklausos pokalbio vaizdo perdizainas pagal patvirtintą maketą (2026-07-22)

Ankstesnės užduoties metu (a952543) "Užklausos" skiltyje atsirado veikiantis, bet vizualiai neišbaigtas pokalbio vaizdas ("💬 Pokalbis" mygtukas išskleidžia giją). Vartotojas paruošė ir patvirtino maketą (`dashboard-chat-maketas.html`), kaip tas vaizdas turėtų atrodyti — ši užduotis tai įgyvendino. **Backend privatumo logika nekeista** (kaip buvo, taip ir liko: tekstas visiems, kaina/laikas — tik savam servisui + klientui), tik pridėta/pagerinta vaizdinė dalis.

**Žinučių burbulai perstilinti pagal maketą** (naudojant esamas dashboard'o CSS kintamąsias — spalvos jau iš anksto sutapo su maketu, keitimų nereikėjo):
- **Kliento žinutė** — pilkas burbulas kairėje (nepakito).
- **Savo (mine) žinutė** — žalias burbulas (`var(--green-dim)`) dešinėje; jei prie žinutės yra kaina/laikas, jie rodomi kaip paryškinta eilutė burbulo apačioje: "💰 Jūsų pasiūlymas: 45€ · Laikas: 21 liep 15:00".
- **Kito serviso žinutė** — pritemdytas burbulas (`var(--bg2)`, `opacity:0.75`) kairėje, su REALIU serviso pavadinimu antraštėje (ne anonimizuota "Kitas servisas") ir "🔒 Kaina/laikas privatu (matys tik klientas)" vietoj kainos/laiko.

**Backend papildymas (tik atvaizdavimui, ne privatumo pakeitimas):** `GET /orders/:id/messages` dabar grąžina ir `sender_name` (kliento vardą arba serviso pavadinimą) — reikalinga, kad būtų galima rodyti REALŲ konkuruojančio serviso pavadinimą maketo pavyzdyje. Tai neatskleidžia nieko naujo — servisų pavadinimai jau vieši per `GET /api/services`.

**Du atskiri įvesties laukai chat'o apačioje (nauja):**
- **Kainos/laiko dėžutė** (geltona, `var(--yellow-dim)`) — kainos ir laiko laukai + "Atnaujinti pasiūlymą" mygtukas. Rodoma TIK jei užklausa dar `new`/`pending` (t.y. tikrai galima siūlyti/atnaujinti kainą) — kai užklausa jau `in_progress`/`done`, dėžutė automatiškai pasislepia, liko tik teksto laukas.
- **Teksto žinutės laukas** — paprastas `input` + "Siųsti →" mygtukas, siunčia į jau egzistavusį `POST /orders/:id/messages` (anksčiau šis endpoint'as neturėjo jokios UI sąsajos dashboard'e servisui, nors pats endpoint'as jau veikė).

**Rastas ir ištaisytas realus bug'as testuojant:** `renderOrders()` visada perkuria VISĄ užklausų sąrašo HTML iš naujo (taigi ir atviro pokalbio įvesties laukus) — poll'inimo ciklas (`pollOrders()`, kas 12s) šitaip ištrindavo vartotojo įvedamą tekstą/kainą VIDURYJE rašymo, net su anksčiau pridėtu apsauginiu patikrinimu `loadChatThread()` viduje (tas patikrinimas pasirodė esąs nepakankamas, nes DOM jau būdavo sunaikintas PRIEŠ jį pasiekiant). Ištaisyta pridedant patikrinimą tiesiai `pollOrders()` lygyje: jei `document.activeElement` yra kažkur `.ochat` viduje, `renderOrders()` apskritai nekviečiamas tą ciklą. Patikrinta gyvai — simuliuotas poll'inimo ciklas VIDURYJE rašymo teksto lauke nebeištrina įvesto teksto.

**Patikrinta gyvai su 2 servisais (Motorsport UKM + Broliai Vaitkūnai) tai pačiai užklausai:**
1. Abu servisai pasiūlė skirtingą kainą/laiką → kiekvienas savo dashboard'e mato SAVO pasiūlymą žaliame burbulyje su kaina/laiku, KITO serviso REALIU pavadinimu pažymėtą pritemdytą burbulą su "🔒 privatu" vietoj kainos.
2. Servisas A per naują teksto lauką išsiuntė žinutę klientui be kainos → iškart pasirodė gijoje kaip paprastas burbulas be pasiūlymo eilutės.
3. Servisas A per naują kainos dėžutę atnaujino pasiūlymą (40€ → naujas laikas) → nauja žinutė su nauju pasiūlymu atsirado gijoje; Servisas B TOLIAU nematė šios atnaujintos kainos (liko "🔒 privatu").
4. Klientas priėmė Serviso A pasiūlymą (`POST /orders/:id/accept`) → užklausa tapo `in_progress` → kainos dėžutė automatiškai dingo iš pokalbio, liko tik teksto laukas.
5. Patikrinta 390px pločiu — jokio horizontalaus persipildymo.
6. Automatiniai testai (7/7) praeina nepakitę.

---

## Kaip tęsti naujame pokalbyje
Nukopijuok šią santrauką ir rašyk:

> "Tęsiu ServisuCentras.lt projektą. [įklijuok santrauką]. Šiandien noriu [ką nori daryti]."

Taip pat galima įkelti HTML failus tiesiogiai — tada Claude matys tikrą kodą.
