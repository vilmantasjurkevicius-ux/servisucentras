const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const TEST_ADMIN_PASSWORD = 'test-admin-pass-123';

// Paleidžia realų serverį (child procesas) su laikina, izoliuota SQLite DB,
// kad testai niekada nepaliestų backend/data/servisucentras.db (kur yra tikri dev/demo duomenys).
function spawnServer() {
  const port = 4000 + Math.floor(Math.random() * 5000);
  const dbPath = path.join(__dirname, `.tmp-test-${process.pid}-${Date.now()}.db`);

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, '..', 'src', 'server.js')], {
      env: {
        ...process.env,
        PORT: String(port),
        DB_PATH: dbPath,
        JWT_SECRET: 'test-jwt-secret-tik-testams',
        ADMIN_USERNAME: 'admin',
        ADMIN_PASSWORD: TEST_ADMIN_PASSWORD,
        ALLOWED_ORIGINS: 'http://localhost:5500',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        child.kill();
        reject(new Error('Testinis serveris nepasileido per 5s'));
      }
    }, 5000);

    child.stdout.on('data', (buf) => {
      if (settled) return;
      if (buf.toString().includes('veikia')) {
        settled = true;
        clearTimeout(timeout);
        resolve({
          baseUrl: `http://localhost:${port}`,
          adminPassword: TEST_ADMIN_PASSWORD,
          async stop() {
            child.kill();
            await new Promise((r) => child.once('exit', r));
            for (const suffix of ['', '-wal', '-shm']) {
              try { fs.unlinkSync(dbPath + suffix); } catch { /* jau ištrinta arba nesukurta */ }
            }
          },
        });
      }
    });

    child.stderr.on('data', (buf) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        child.kill();
        reject(new Error(`Testinis serveris metė klaidą paleidimo metu: ${buf.toString()}`));
      }
    });
  });
}

module.exports = { spawnServer };
