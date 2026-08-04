-- ServisuCentras.lt — DB schema

CREATE TABLE IF NOT EXISTS admin_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  platform_name TEXT NOT NULL DEFAULT 'ServisuCentras.lt',
  commission_master_enabled INTEGER NOT NULL DEFAULT 1, -- God Mode master jungiklis
  commission_percent REAL NOT NULL DEFAULT 2.5,
  trial_months INTEGER NOT NULL DEFAULT 6,
  collection_mode TEXT NOT NULL DEFAULT 'manual', -- manual | stripe (stripe dar neįgyvendintas)
  bank_receiver TEXT, -- rankinio surinkimo pranešimuose naudojami rekvizitai
  bank_iban TEXT,
  contact_fee REAL NOT NULL DEFAULT 2.0, -- fiksuotas mokestis servisui už kliento kontakto atskleidimą (pakeičia % komisinį modelį, žr. santrauka.md)
  admin_username TEXT NOT NULL DEFAULT 'admin',
  admin_password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  owner_first_name TEXT,
  owner_last_name TEXT,
  email TEXT UNIQUE,
  password_hash TEXT,
  phone TEXT,
  city TEXT NOT NULL,
  address TEXT,
  service_type TEXT,          -- 'Garažiukas' | 'Vidutinis' | 'Didelis' | 'Oficialus'
  mechanic_count TEXT,
  description TEXT,
  work_start TEXT NOT NULL DEFAULT '08:00', -- senas laukas, naudojamas kaip atsarginis kol servisas neįsivedė work_hours
  work_end TEXT NOT NULL DEFAULT '18:00',
  work_hours TEXT, -- JSON masyvas [{open,start,end}] x7, Pir..Sek tvarka; NULL = naudoti work_start/work_end visoms dienoms
  temp_closed INTEGER NOT NULL DEFAULT 0, -- "Laikinai nedirbu" rankinis perjungimas (be konkrečios grįžimo datos)
  vacation_until TEXT, -- atostogų pabaigos data (YYYY-MM-DD); jei >= šiandien, servisas rodomas kaip atostogaujantis viešoje paieškoje
  rating REAL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | active | inactive | banned
  is_bot INTEGER NOT NULL DEFAULT 0,
  registered_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS service_categories (
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id),
  price_from REAL,
  active INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (service_id, category_id)
);

CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT,
  last_name TEXT,
  email TEXT UNIQUE,
  password_hash TEXT,
  phone TEXT,
  is_guest INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', -- active | banned
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Kliento automobilių knyga (Serviso knyga, Žingsnis 2/7). VIN — PRIVATUS laukas,
-- niekada neatskleidžiamas jokiam kitam vartotojui/servisui, grąžinamas TIK pačiam
-- klientui per jo autentifikuotą GET /api/cars/me (žr. cars.routes.js).
CREATE TABLE IF NOT EXISTS cars (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  engine TEXT,
  fuel_type TEXT,
  plate_number TEXT,
  vin TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  service_id INTEGER REFERENCES services(id),
  category_id TEXT REFERENCES categories(id),
  city TEXT,
  description TEXT,
  price REAL,
  car_info TEXT, -- automobilio markė/modelis/metai — arba laisvas tekstas (svečias), arba užrašas, IŠVESTAS iš pasirinkto car_id kūrimo metu (registruotas klientas, žr. Serviso knyga Žingsnis 3/7)
  car_id INTEGER REFERENCES cars(id), -- registruoto kliento pasirinktas konkretus automobilis (Serviso knyga, Žingsnis 3/7) — NULL svečiams/laisvo teksto atveju
  commission_amount REAL,
  status TEXT NOT NULL DEFAULT 'new', -- new | pending | in_progress | done | cancelled | declined (servisas atsisakė po priėmimo, žr. order_declines)
  scheduled_time TEXT, -- suplanuoto vizito data/laikas (ISO), nustato servisas po priėmimo
  order_type TEXT NOT NULL DEFAULT 'broadcast', -- broadcast (transliuojama visiems) | direct (klientas pasirinko konkretų servisą+laiką)
  client_accepted_at TEXT, -- laiko žyma, kada servisas paspaudė "Priimti klientą" — GATING laukas kontaktų atskleidimui (ne pati suma, kad trial/God-Mode-off 0€ atvejis nebūtų supainiotas su "dar nepriimta")
  contact_fee_amount REAL, -- faktiškai nuskaičiuota suma "Priimti klientą" metu (gali būti 0, jei trial/God Mode išjungtas)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS order_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL, -- client | service
  sender_id INTEGER,
  message TEXT,
  price_quote REAL,
  available_time TEXT, -- serviso siūlomas laikas, kada gali priimti automobilį (kaip ir kaina, privatu tarp serviso ir kliento)
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id INTEGER NOT NULL REFERENCES services(id),
  client_id INTEGER REFERENCES clients(id),
  order_id INTEGER REFERENCES orders(id),
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Serviso atsisakymo PO priėmimo istorija (mokestis NEGRĄŽINAMAS — žr. santrauka.md).
-- Saugoma ATSKIRAI nuo orders, nes ta pati orders eilutė gali būti priimta/atsisakyta
-- kelis kartus (kiekvieną kartą kito serviso) — be šios lentelės PIRMO serviso mokesčio
-- įrašas dingtų, kai orders.contact_fee_amount perrašomas SEKANČIO serviso priėmimo metu.
CREATE TABLE IF NOT EXISTS order_declines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES services(id),
  fee_amount REAL NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  declined_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Serviso knyga (Žingsnis 5/7) — struktūrizuotas automobilio serviso įrašas, AUTOMATIŠKAI
-- sukuriamas POST /orders/:id/complete metu, kai užklausa turi car_id IR servisas pateikia
-- privalomą work_description ("Pažymėti atlikta" paaiškinimo laukas). Užklausos be car_id
-- (svečio laisvas tekstas) įrašo negauna — nėra prie ko jį susieti kliento automobilių knygoje.
CREATE TABLE IF NOT EXISTS service_book (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  service_id INTEGER NOT NULL REFERENCES services(id),
  category_id TEXT REFERENCES categories(id),
  work_description TEXT NOT NULL,
  parts_replaced TEXT,
  mileage INTEGER,
  price REAL,
  warranty_until TEXT,
  next_service_date TEXT, -- rezervuota ateities priminimų funkcijai (dar NEĮGYVENDINTA — žr. santrauka.md "Ateities plėtra"); niekur nepildoma šiuo metu
  service_date TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS service_invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id INTEGER NOT NULL REFERENCES services(id),
  period TEXT NOT NULL, -- 'YYYY-MM'
  work_total REAL NOT NULL DEFAULT 0, -- patvirtintų darbų suma tą laikotarpį
  amount_due REAL NOT NULL DEFAULT 0, -- komisinio suma tą laikotarpį
  status TEXT NOT NULL DEFAULT 'unpaid', -- unpaid | paid
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(service_id, period)
);

-- Admin "Pakvietimai" įrankis — realūs servisai, surasti per Google Places API,
-- su Gemini sugeneruotu laiško juodraščiu. Niekas nesiunčiama automatiškai —
-- admin peržiūri, pats įrašo el. paštą ir spaudžia "Siųsti" kiekvienam atskirai.
-- place_id (Google) UNIQUE — apsaugo nuo pakartotinio to paties serviso įrašymo,
-- jei admin ieško to paties miesto kelis kartus.
CREATE TABLE IF NOT EXISTS service_invitations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  place_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  website TEXT,
  email TEXT,
  city TEXT NOT NULL,
  letter_text TEXT,
  sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_services_city ON services(city);
CREATE INDEX IF NOT EXISTS idx_invoices_service ON service_invoices(service_id);
CREATE INDEX IF NOT EXISTS idx_orders_client ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_service ON orders(service_id);
CREATE INDEX IF NOT EXISTS idx_order_messages_order ON order_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_order_declines_order ON order_declines(order_id);
CREATE INDEX IF NOT EXISTS idx_order_declines_service ON order_declines(service_id);
CREATE INDEX IF NOT EXISTS idx_cars_client ON cars(client_id);
CREATE INDEX IF NOT EXISTS idx_service_book_car ON service_book(car_id);
