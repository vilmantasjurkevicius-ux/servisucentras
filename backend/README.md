# ServisuCentras.lt — Backend

Node.js + Express + SQLite (built-in `node:sqlite`, jokio native kompiliavimo nereikia).

## Paleidimas

```
cd backend
npm install
copy .env.example .env      (Windows) arba cp .env.example .env
```

Prieš paleidžiant **užpildykite `.env`** (žr. komentarus faile):
- `JWT_SECRET` — PRIVALOMA, serveris atsisakys pasileisti be jo. Sugeneruokite:
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `ADMIN_PASSWORD` — PRIVALOMA tik pirmam DB sukūrimui (seed). Jei DB jau egzistuoja, šis laukas
  nebeturi įtakos — slaptažodį keiskite per `PATCH /api/admin/settings` arba admin panelės Nustatymus.
- `ALLOWED_ORIGINS` — kableliais atskirtas sąrašas domenų, kuriems leidžiama kviesti API iš naršyklės (CORS).

```
npm run dev                 (arba npm start)
```

Serveris pasileidžia ant `http://localhost:3000`. DB failas sukuriamas automatiškai:
`backend/data/servisucentras.db` (su seed duomenimis — 12 kategorijų, admin paskyra, 20 bot servisų 7 miestuose).

Reikalavimas: **Node.js 22.5+** (dėl `node:sqlite`).

## Saugumas

- **`.env` niekada netalpinamas į Git** (žr. `.gitignore`) — jame realūs slaptažodžiai/raktai. `.env.example` turi tik placeholder'ius.
- **JWT_SECRET** be numatytosios (fallback) reikšmės — jei `.env` trūksta arba lauke tuščia, `src/middleware/auth.js` iškart meta klaidą paleidimo metu (fail-fast), kad niekada tyliai nebūtų naudojamas silpnas raktas.
- **CORS** apribotas iki `ALLOWED_ORIGINS` sąrašo (`src/server.js`) — kitiems domenams naršyklės užklausos atmetamos (403).
- **Rate limiting** (`express-rate-limit`, žr. `src/middleware/rateLimit.js`) — 10 bandymų / 15 min iš vieno IP taikoma `service/client login+register` ir `admin/login` endpointams, apsaugant nuo brute-force.
- Pakeitus `JWT_SECRET`, VISI anksčiau išduoti tokenai (admin/service/client) iškart nustoja galioti — vartotojai tiesiog turės prisijungti iš naujo.

## API apžvalga

Visi endpointai po `/api`. Auth — `Authorization: Bearer <token>` (JWT, gaunamas po login/register).

### Auth (`/api/auth`)
- `POST /service/register` — serviso registracija (statusas `pending`, laukia admin patvirtinimo)
- `POST /service/login`
- `POST /client/register`
- `POST /client/login`
- `POST /guest` — svečio režimas be slaptažodžio

### Servisai (`/api/services`)
- `GET /?city=&category=&status=` — viešas sąrašas
- `GET /:id` — vieno serviso info + `trialEndsAt`
- `GET /me`, `PATCH /me` — (auth: service) savo profilio valdymas

### Klientai (`/api/clients`)
- `GET /me`, `PATCH /me` — (auth: client)
- `GET /me/orders` — savo užklausų istorija

### Kategorijos (`/api/categories`)
- `GET /` — 12 kategorijų sąrašas

### Užklausos (`/api/orders`)
- `POST /` — (auth: client) sukurti užklausą (priima ir nebūtiną `carInfo` — automobilio modelis/metai iš svečio formos)
- `GET /` — (auth: service) naujos + priskirtos užklausos
- `GET /:id` — (auth) vienos užklausos info
- `POST /:id/quote` — (auth: service) pasiūlyti kainą (chat žinutė)
- `POST /:id/accept` — (auth: client) priimti serviso pasiūlymą
- `GET /:id/messages`, `POST /:id/messages` — chat
- `POST /:id/complete` — (auth: service) užbaigti darbą → **čia skaičiuojamas komisinis**
- `POST /:id/review` — (auth: client) palikti atsiliepimą užbaigtai užklausai (1-5 rating + komentaras, vienas per užklausą) → atnaujina serviso vidutinį reitingą
- `POST /:id/cancel` — (auth) atšaukti

### Atsiliepimai (`/api/services/:id/reviews`)
- `GET /:id/reviews` — viešas serviso atsiliepimų sąrašas (rating, comment, kliento vardas)

### Admin (`/api/admin`) — reikalauja admin JWT (išskyrus `/login`)
- `POST /login`
- `GET /dashboard`
- `GET /clients`, `PATCH /clients/:id/ban`, `PATCH /clients/:id/unban`
- `GET /services`, `PATCH /services/:id/approve`, `PATCH /services/:id/ban`, `PATCH /services/:id/unban`
- `GET /orders`
- `GET /settings`, `PATCH /settings` — **God Mode**: `commissionMasterEnabled`, `commissionPercent`, `trialMonths`, `platformName`, `adminPassword`, `collectionMode` ('manual'|'stripe'), `bankReceiver`, `bankIban`
- `GET /bots`, `PATCH /bots/:id/toggle`, `POST /bots/toggle-all`, `POST /bots/replace` — sėklinių (bot) servisų valdymas (20 servisų, 7 miestai)
- `GET /invoices?period=YYYY-MM` — servisų sąskaitos (numatyta: einamasis mėnuo), agreguoja iš `orders.commission_amount`
- `PATCH /invoices/:id/pay` — pažymi sąskaitą apmokėta, įrašo `paid_at`
- `POST /invoices/generate-messages` — sugeneruoja teksto pranešimą kiekvienam neapmokėtam servisui (kopijavimui, be el. pašto siuntimo)

## Komisinio logika (`src/utils/commission.js`)

Kiekvieno serviso trial pabaiga = `registered_at + trial_months mėnesių`. Užbaigiant užklausą (`/orders/:id/complete`):
- jei `commission_master_enabled = false` → komisinis `0` (God Mode išjungtas visiems)
- jei servisas dar trial periode → komisinis `0`
- kitu atveju → `price * commission_percent / 100`

## Testai

`npm test` (`node --test`, jokių papildomų paketų nereikia) — paleidžia realų serverį vaikiniame procese su izoliuota laikina SQLite DB (`DB_PATH` env kintamasis), tad niekada nepaliečia `data/servisucentras.db`. Padengia: sveikatos patikrą, auth/rolių apsaugą, pilną verslo srautą (registracija → patvirtinimas → bot auto-išjungimas → užklausa → komisinis → atsiliepimas su vidurkio perskaičiavimu ir dublikato atmetimu).

## Kas dar NEpadaryta (žr. servisucentras-santrauka.md)
- Stripe Connect (automatinis komisinio nuskaitymas) — `collection_mode` laukas ir UI jau paruošti, bet realios integracijos dar nėra. Kol kas tik rankinis surinkimas (`/admin/invoices`).
- El. pašto / SMS notifikacijos.
- `bots/replace` endpointas paruoštas, bet niekas jo dar automatiškai neiškviečia — reikės iškviesti serviso registracijos patvirtinimo metu, kai pirmas tikras servisas užsiregistruoja mieste+kategorijoje.
- Slaptažodžio atstatymo (forgot password) funkcija — nuorodos yra frontend'e, bet realaus veikimo dar nėra.
- HTTPS/hostingas/domenas — šis backend'as kol kas paruoštas tik lokaliam/uždaram testavimui, ne viešam paleidimui.
