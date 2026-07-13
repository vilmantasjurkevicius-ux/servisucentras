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

## Kaip tęsti naujame pokalbyje
Nukopijuok šią santrauką ir rašyk:

> "Tęsiu ServisuCentras.lt projektą. [įklijuok santrauką]. Šiandien noriu [ką nori daryti]."

Taip pat galima įkelti HTML failus tiesiogiai — tada Claude matys tikrą kodą.
