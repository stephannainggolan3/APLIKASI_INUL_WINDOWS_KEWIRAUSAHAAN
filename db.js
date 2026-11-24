// Koneksi & inisialisasi database SQLite (modul bawaan node:sqlite)
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_FILE = process.env.DB_FILE || path.join(DATA_DIR, 'boysclub.db');
const db = new DatabaseSync(DB_FILE);

// Migrasi: tabel akun versi lama (hanya Google) -> versi baru (email + password / Google)
const kolomAkun = db.prepare('PRAGMA table_info(akun)').all().map((k) => k.name);
if (kolomAkun.length && !kolomAkun.includes('password_hash')) {
  db.exec(`
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
      dibuat_pada TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      login_terakhir TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      CHECK (password_hash IS NOT NULL OR google_sub IS NOT NULL)
    );
    INSERT INTO akun_baru (id, email, nama, google_sub, foto_url, pelanggan_id, dibuat_pada, login_terakhir)
      SELECT id, lower(email), nama, google_sub, foto_url, pelanggan_id, dibuat_pada, login_terakhir FROM akun;
    DROP TABLE akun;
    ALTER TABLE akun_baru RENAME TO akun;
    COMMIT;
  `);
  console.log('Database: tabel akun diperbarui untuk login email + password.');
}

db.exec('PRAGMA foreign_keys = ON;');
db.exec(fs.readFileSync(path.join(__dirname, 'database', 'schema.sql'), 'utf8'));

// Isi data awal hanya jika tabel layanan masih kosong
const { n } = db.prepare('SELECT COUNT(*) AS n FROM layanan').get();
if (n === 0) {
  db.exec(fs.readFileSync(path.join(__dirname, 'database', 'seed.sql'), 'utf8'));
  console.log('Database baru dibuat & diisi data awal:', DB_FILE);
}

// Menjalankan fn di dalam transaksi; otomatis ROLLBACK bila gagal
function transaction(fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

module.exports = { db, transaction, DB_FILE };
