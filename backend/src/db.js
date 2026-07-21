const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'servisucentras.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Užtikrina, kad DB failo aplankas egzistuoja (pvz. švieža Railway/Git kopija be tuščio data/ aplanko)
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
// WAL laikydavo neseniausius įrašus atskirame -wal faile, kuris susilieja į pagrindinį
// .db failą tik per checkpoint'ą — jei procesas/aplinka persikrauna anksčiau nei tai
// įvyksta, tie įrašai dingsta (taip prarandami testiniai duomenys šioje sesijoje, greičiausiai
// ta pati priežastis dėl ko production rodė 0 klientų). DELETE režimu kiekvienas commit'as
// iškart įrašomas į patį .db failą — nėra atskiro neužfiksuoto failo, kurį galima prarasti.
// Šiam mažo srauto projektui papildoma I/O kaina nereikšminga, patvarumas svarbesnis.
db.exec('PRAGMA journal_mode = DELETE');
db.exec('PRAGMA foreign_keys = ON');

db.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));

// Migracijos esamoms DB — CREATE TABLE IF NOT EXISTS nepridės naujų stulpelių
// jau egzistuojančiai lentelei, tad tikriname ir pridedame ranka.
function migrate() {
  const svcCatCols = db.prepare("PRAGMA table_info(service_categories)").all().map((c) => c.name);
  if (!svcCatCols.includes('price_from')) db.exec('ALTER TABLE service_categories ADD COLUMN price_from REAL');
  if (!svcCatCols.includes('active')) db.exec('ALTER TABLE service_categories ADD COLUMN active INTEGER NOT NULL DEFAULT 1');

  const orderCols = db.prepare("PRAGMA table_info(orders)").all().map((c) => c.name);
  if (!orderCols.includes('scheduled_time')) db.exec('ALTER TABLE orders ADD COLUMN scheduled_time TEXT');
  if (!orderCols.includes('car_info')) db.exec('ALTER TABLE orders ADD COLUMN car_info TEXT');

  const msgCols = db.prepare("PRAGMA table_info(order_messages)").all().map((c) => c.name);
  if (!msgCols.includes('available_time')) db.exec('ALTER TABLE order_messages ADD COLUMN available_time TEXT');

  const serviceCols = db.prepare("PRAGMA table_info(services)").all().map((c) => c.name);
  if (!serviceCols.includes('work_hours')) db.exec('ALTER TABLE services ADD COLUMN work_hours TEXT');

  const settingsCols = db.prepare("PRAGMA table_info(admin_settings)").all().map((c) => c.name);
  if (!settingsCols.includes('collection_mode')) db.exec("ALTER TABLE admin_settings ADD COLUMN collection_mode TEXT NOT NULL DEFAULT 'manual'");
  if (!settingsCols.includes('bank_receiver')) db.exec('ALTER TABLE admin_settings ADD COLUMN bank_receiver TEXT');
  if (!settingsCols.includes('bank_iban')) db.exec('ALTER TABLE admin_settings ADD COLUMN bank_iban TEXT');
  // service_invoices — visai nauja lentelė, CREATE TABLE IF NOT EXISTS aukščiau (schema.sql) jau ją sukuria.
}
migrate();

const CATEGORIES = [
  { id: 'diagnostika', label: '🔍 Diagnostika' },
  { id: 'elektronika', label: '⚡ Elektronika' },
  { id: 'apsvietimas', label: '💡 Apšvietimas' },
  { id: 'variklis', label: '🔩 Variklis' },
  { id: 'vaziuokle', label: '⚙️ Važiuoklė' },
  { id: 'stabdziai', label: '🔴 Stabdžiai' },
  { id: 'kebulas', label: '🚗 Kėbulas' },
  { id: 'padangos', label: '🔘 Padangos' },
  { id: 'kondicionierius', label: '❄️ Kondicion.' },
  { id: 'stiklai', label: '🪟 Stiklai' },
  { id: 'plovykla', label: '🚿 Plovykla' },
  { id: 'raktai', label: '🔑 Raktai/Imob.' },
];

// Sėkliniai (bot) servisai — žr. servisucentras-santrauka.md
const BOT_SERVICES = [
  { name: 'Ukmergės Autoservisas', city: 'Ukmergė', type: 'Oficialus', cats: ['diagnostika', 'elektronika', 'variklis'] },
  { name: 'Motorsport UKM', city: 'Ukmergė', type: 'Garažiukas', cats: ['diagnostika', 'variklis'] },
  { name: 'Šalčius Auto', city: 'Ukmergė', type: 'Garažiukas', cats: ['elektronika', 'kondicionierius'] },
  { name: 'Šviesos Servisas', city: 'Ukmergė', type: 'Garažiukas', cats: ['elektronika', 'apsvietimas'] },
  { name: 'Broliai Vaitkūnai', city: 'Ukmergė', type: 'Vidutinis', cats: ['vaziuokle', 'stabdziai'] },
  { name: 'Vairo Centras Ukmergė', city: 'Ukmergė', type: 'Vidutinis', cats: ['vaziuokle', 'stabdziai'] },
  { name: 'AutoStilius Ukmergė', city: 'Ukmergė', type: 'Vidutinis', cats: ['kebulas', 'stiklai'] },
  { name: 'Padangų Centras Ukmergė', city: 'Ukmergė', type: 'Oficialus', cats: ['padangos'] },
  { name: 'Greita Plovykla', city: 'Ukmergė', type: 'Vidutinis', cats: ['plovykla'] },
  { name: 'Raktų Meistras J.K.', city: 'Ukmergė', type: 'Garažiukas', cats: ['raktai'] },
  // Kiti miestai
  { name: 'Vilniaus Autoservisas Plius', city: 'Vilnius', type: 'Oficialus', cats: ['diagnostika', 'elektronika', 'variklis'] },
  { name: 'Sostinės Padangų Centras', city: 'Vilnius', type: 'Vidutinis', cats: ['padangos'] },
  { name: 'Kauno Meistrai', city: 'Kaunas', type: 'Garažiukas', cats: ['stabdziai', 'vaziuokle'] },
  { name: 'Technikos Centras Kaunas', city: 'Kaunas', type: 'Didelis', cats: ['kondicionierius', 'elektronika'] },
  { name: 'Uostamiesčio Servisas', city: 'Klaipėda', type: 'Vidutinis', cats: ['kebulas', 'stiklai'] },
  { name: 'Pajūrio Automeistrai', city: 'Klaipėda', type: 'Garažiukas', cats: ['plovykla'] },
  { name: 'Šiaulių Autoja', city: 'Šiauliai', type: 'Vidutinis', cats: ['diagnostika', 'variklis'] },
  { name: 'Saulės Servisas', city: 'Šiauliai', type: 'Garažiukas', cats: ['apsvietimas', 'elektronika'] },
  { name: 'Panevėžio Techninis Centras', city: 'Panevėžys', type: 'Oficialus', cats: ['raktai', 'diagnostika'] },
  { name: 'Dzūkijos Autoservisas', city: 'Alytus', type: 'Vidutinis', cats: ['stabdziai', 'padangos'] },
];

function seed() {
  const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (id, label, sort_order) VALUES (?, ?, ?)');
  CATEGORIES.forEach((c, i) => insertCategory.run(c.id, c.label, i));

  const settingsRow = db.prepare('SELECT id FROM admin_settings WHERE id = 1').get();
  if (!settingsRow) {
    if (!process.env.ADMIN_PASSWORD) {
      throw new Error(
        'Trūksta ADMIN_PASSWORD aplinkos kintamojo — reikalingas pirmam DB sukūrimui. '
        + 'Įrašykite jį į backend/.env (žr. .env.example).'
      );
    }
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD;
    db.prepare(`
      INSERT INTO admin_settings (id, platform_name, commission_master_enabled, commission_percent, trial_months, admin_username, admin_password_hash)
      VALUES (1, 'ServisuCentras.lt', 1, 2.5, 6, ?, ?)
    `).run(adminUser, bcrypt.hashSync(adminPass, 10));
  }

  // Prideda tik trūkstamus bot servisus (pagal vardą) — nekeičia ir netrina jau esančių
  // servisų/užklausų/sąskaitų, tad saugu kviesti pakartotinai jau veikiančioje DB.
  const existingBotNames = new Set(
    db.prepare('SELECT name FROM services WHERE is_bot = 1').all().map((r) => r.name)
  );
  const missingBots = BOT_SERVICES.filter((b) => !existingBotNames.has(b.name));
  if (missingBots.length > 0) {
    const insertService = db.prepare(`
      INSERT INTO services (name, city, service_type, status, is_bot, rating, registered_at)
      VALUES (?, ?, ?, 'active', 1, ?, datetime('now'))
    `);
    const insertServiceCategory = db.prepare('INSERT INTO service_categories (service_id, category_id) VALUES (?, ?)');
    db.exec('BEGIN');
    try {
      missingBots.forEach((b) => {
        const rating = +(4.4 + Math.random() * 0.5).toFixed(1);
        const info = insertService.run(b.name, b.city, b.type, rating);
        b.cats.forEach((catId) => insertServiceCategory.run(info.lastInsertRowid, catId));
      });
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }
}

seed();

module.exports = db;
