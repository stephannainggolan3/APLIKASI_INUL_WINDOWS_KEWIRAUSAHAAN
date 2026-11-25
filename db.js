// Lapisan database BoysClub IT
// - Online  : Turso (SQLite di cloud) jika TURSO_DATABASE_URL diisi -> dipakai saat deploy (Netlify)
// - Lokal   : file data/boysclub.db (modul bawaan node:sqlite)      -> dipakai di laptop
// Keduanya memakai struktur tabel yang sama dari database/schema.sql.
//
// Semua fungsi bersifat async:
//   db.all(sql, ...args)  -> array baris
//   db.get(sql, ...args)  -> satu baris / undefined
//   db.run(sql, ...args)  -> { changes, lastInsertRowid }
//   db.transaction(async (t) => { await t.run(...); ... })  -> otomatis COMMIT / ROLLBACK
const fs = require('fs');
const path = require('path');

const TURSO_URL = (process.env.TURSO_DATABASE_URL || '').trim();
const TURSO_TOKEN = (process.env.TURSO_AUTH_TOKEN || '').trim();

// Baca file .sql (lokasinya berbeda saat berjalan di Netlify Functions)
function bacaSql(nama) {
  const kandidat = [
    path.join(__dirname, 'database', nama),
    path.join(process.cwd(), 'database', nama),
    process.env.LAMBDA_TASK_ROOT && path.join(process.env.LAMBDA_TASK_ROOT, 'database', nama),
  ].filter(Boolean);
  for (const p of kandidat) if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
  throw new Error(`File database/${nama} tidak ditemukan`);
}

// ---------------------------------------------------------------- Turso
function driverTurso() {
  const { createClient } = require('@libsql/client/web');
  const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN || undefined });
  const keObjek = (rs) => rs.rows.map((r) => Object.fromEntries(rs.columns.map((c, i) => [c, r[i]])));
  const pelaksana = (ex) => ({
    all: async (sql, ...args) => keObjek(await ex.execute({ sql, args })),
    get: async (sql, ...args) => keObjek(await ex.execute({ sql, args }))[0],
    run: async (sql, ...args) => {
      const rs = await ex.execute({ sql, args });
      return { changes: rs.rowsAffected, lastInsertRowid: Number(rs.lastInsertRowid ?? 0) };
    },
  });
  return {
    jenis: `Turso (${TURSO_URL})`,
    ...pelaksana(client),
    exec: (sql) => client.executeMultiple(sql),
    async transaction(fn) {
      const tx = await client.transaction('write');
      try {
        const hasil = await fn(pelaksana(tx));
        await tx.commit();
        return hasil;
      } catch (err) {
        try { await tx.rollback(); } catch {}
        throw err;
      } finally {
        tx.close();
      }
    },
  };
}

// ---------------------------------------------------------------- Lokal
function driverLokal() {
  const { DatabaseSync } = require('node:sqlite');
  const file = process.env.DB_FILE || path.join(__dirname, 'data', 'boysclub.db');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const sqlite = new DatabaseSync(file);
  sqlite.exec('PRAGMA foreign_keys = ON;');

  const langsung = {
    all: async (sql, ...args) => sqlite.prepare(sql).all(...args),
    get: async (sql, ...args) => sqlite.prepare(sql).get(...args),
    run: async (sql, ...args) => {
      const r = sqlite.prepare(sql).run(...args);
      return { changes: Number(r.changes), lastInsertRowid: Number(r.lastInsertRowid) };
    },
  };
  // Satu koneksi dipakai bersama: operasi dijalankan bergiliran supaya
  // query dari request lain tidak menyusup ke tengah transaksi yang sedang berjalan.
  let antrian = Promise.resolve();
  const giliran = (fn) => { const p = antrian.then(fn); antrian = p.catch(() => {}); return p; };

  return {
    jenis: `file lokal (${file})`,
    all: (...a) => giliran(() => langsung.all(...a)),
    get: (...a) => giliran(() => langsung.get(...a)),
    run: (...a) => giliran(() => langsung.run(...a)),
    exec: (sql) => giliran(async () => sqlite.exec(sql)),
    transaction: (fn) => giliran(async () => {
      sqlite.exec('BEGIN');
      try {
        const hasil = await fn(langsung);
        sqlite.exec('COMMIT');
        return hasil;
      } catch (err) {
        sqlite.exec('ROLLBACK');
        throw err;
      }
    }),
  };
}

// Di Netlify (serverless) tidak ada penyimpanan file permanen -> Turso wajib diatur
function driverBelumDiatur() {
  const tolak = async () => {
    const err = new Error('Database belum diatur: isi TURSO_DATABASE_URL dan TURSO_AUTH_TOKEN di Environment variables Netlify, lalu deploy ulang.');
    err.status = 503;
    throw err;
  };
  return { jenis: 'belum diatur', all: tolak, get: tolak, run: tolak, exec: tolak, transaction: tolak };
}

const diServerless = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const db = TURSO_URL ? driverTurso() : diServerless ? driverBelumDiatur() : driverLokal();

// Migrasi: tabel akun versi lama (hanya Google) -> versi baru (email + password / Google)
const MIGRASI_AKUN = `
  PRAGMA foreign_keys = OFF;
  BEGIN;
  CREATE TABLE akun_baru (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    nama TEXT NOT NULL,
    password_hash TEXT,
    google_sub TEXT UNIQUE,
    foto_url TEXT,
    pelanggan_id INTEGER UNIQUE REFERENCES pelanggan(id) ON DELETE SET NULL,
    dibuat_pada TEXT NOT NULL DEFAULT (datetime('now', '+7 hours')),
    login_terakhir TEXT NOT NULL DEFAULT (datetime('now', '+7 hours')),
    CHECK (password_hash IS NOT NULL OR google_sub IS NOT NULL)
  );
  INSERT INTO akun_baru (id, email, nama, google_sub, foto_url, pelanggan_id, dibuat_pada, login_terakhir)
    SELECT id, lower(email), nama, google_sub, foto_url, pelanggan_id, dibuat_pada, login_terakhir FROM akun;
  DROP TABLE akun;
  ALTER TABLE akun_baru RENAME TO akun;
  COMMIT;
  PRAGMA foreign_keys = ON;
`;

// Menyiapkan tabel (sekali per proses / per "cold start" di Netlify)
let siap = null;
function init() {
  if (!siap) {
    siap = (async () => {
      const kolomAkun = (await db.all('PRAGMA table_info(akun)')).map((k) => k.name);
      if (kolomAkun.length && !kolomAkun.includes('password_hash')) {
        await db.exec(MIGRASI_AKUN);
        console.log('Database: tabel akun diperbarui untuk login email + password.');
      }
      await db.exec(bacaSql('schema.sql'));
      const { n } = await db.get('SELECT COUNT(*) AS n FROM layanan');
      if (Number(n) === 0) {
        await db.exec(bacaSql('seed.sql'));
        console.log('Database baru dibuat & diisi data awal.');
      }
    })().catch((err) => { siap = null; throw err; });
  }
  return siap;
}

module.exports = { db, init };
