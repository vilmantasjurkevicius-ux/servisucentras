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

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  service_id INTEGER REFERENCES services(id),
  category_id TEXT REFERENCES categories(id),
  city TEXT,
  description TEXT,
  price REAL,
  car_info TEXT, -- automobilio markė/modelis/metai, laisvas tekstas iš kliento formos
  commission_amount REAL,
  status TEXT NOT NULL DEFAULT 'new', -- new | pending | in_progress | done | cancelled
  scheduled_time TEXT, -- suplanuoto vizito data/laikas (ISO), nustato servisas po priėmimo
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

CREATE INDEX IF NOT EXISTS idx_services_city ON services(city);
CREATE INDEX IF NOT EXISTS idx_invoices_service ON service_invoices(service_id);
CREATE INDEX IF NOT EXISTS idx_orders_client ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_service ON orders(service_id);
CREATE INDEX IF NOT EXISTS idx_order_messages_order ON order_messages(order_id);
