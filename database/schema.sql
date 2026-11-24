-- =====================================================================
--  BoysClub IT - Skema Database Jasa Instal Ulang (Inul) Windows
--  Engine : SQLite (bawaan Node.js >= 22, modul node:sqlite)
-- =====================================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------
-- 1. LAYANAN  : daftar jasa yang bisa dipilih (layar "Pilih Layanan")
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS layanan (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    kode        TEXT    NOT NULL UNIQUE,          -- mis. WIN, LNX
    nama        TEXT    NOT NULL,
    deskripsi   TEXT,
    ikon        TEXT    NOT NULL,                 -- kunci ikon di frontend
    aktif       INTEGER NOT NULL DEFAULT 1 CHECK (aktif IN (0, 1))
);

-- ---------------------------------------------------------------------
-- 2. PAKET    : pilihan langganan & harga (layar "Pilih Paket")
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS paket (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    nama           TEXT    NOT NULL,
    durasi_bulan   INTEGER NOT NULL CHECK (durasi_bulan > 0),
    harga          INTEGER NOT NULL CHECK (harga >= 0),     -- rupiah per unit
    diskon_persen  INTEGER NOT NULL DEFAULT 0 CHECK (diskon_persen BETWEEN 0 AND 100),
    aktif          INTEGER NOT NULL DEFAULT 1 CHECK (aktif IN (0, 1))
);

-- ---------------------------------------------------------------------
-- 3. PELANGGAN : data pemesan (layar "Data Pemesan")
--    No. HP unik -> pelanggan yang sama memesan lagi tidak terduplikasi
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pelanggan (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_lengkap     TEXT NOT NULL,
    no_hp            TEXT NOT NULL UNIQUE,
    instansi         TEXT,
    alamat           TEXT,
    dibuat_pada      TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    diperbarui_pada  TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- ---------------------------------------------------------------------
-- 3a. AKUN : akun login (masuk / daftar)
--     Bisa dengan email + password (password_hash) dan/atau Google
--     (google_sub = ID unik pengguna dari Google). Minimal salah satu.
--     Satu akun terhubung ke satu data pelanggan.
--     Hak admin ditentukan dari daftar ADMIN_EMAILS di file .env
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS akun (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    email           TEXT    NOT NULL UNIQUE,      -- selalu huruf kecil
    nama            TEXT    NOT NULL,
    password_hash   TEXT,                         -- format scrypt$salt$hash
    google_sub      TEXT    UNIQUE,
    foto_url        TEXT,
    pelanggan_id    INTEGER UNIQUE REFERENCES pelanggan(id) ON DELETE SET NULL,
    dibuat_pada     TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    login_terakhir  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    CHECK (password_hash IS NOT NULL OR google_sub IS NOT NULL)
);

-- ---------------------------------------------------------------------
-- 3b. SESI : sesi login (disimpan di cookie). Yang disimpan hanya
--     hash SHA-256 dari token, bukan token aslinya.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sesi (
    token_hash   TEXT    PRIMARY KEY,
    akun_id      INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
    dibuat_pada  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    kedaluwarsa  TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_sesi_akun ON sesi (akun_id);

-- ---------------------------------------------------------------------
-- 4. PESANAN : transaksi pemesanan (layar "Jadwal" + "Konfirmasi")
--    harga_satuan disimpan sebagai salinan, sehingga perubahan harga
--    paket di kemudian hari tidak mengubah riwayat transaksi.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pesanan (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    kode_pesanan     TEXT    NOT NULL UNIQUE,
    pelanggan_id     INTEGER NOT NULL REFERENCES pelanggan(id),
    paket_id         INTEGER NOT NULL REFERENCES paket(id),
    jumlah_unit      INTEGER NOT NULL DEFAULT 1 CHECK (jumlah_unit BETWEEN 1 AND 100),
    harga_satuan     INTEGER NOT NULL,
    total_harga      INTEGER NOT NULL,
    jadwal_tanggal   TEXT    NOT NULL,            -- format YYYY-MM-DD
    jadwal_jam       TEXT    NOT NULL,            -- format HH:MM
    lokasi           TEXT    NOT NULL,
    status           TEXT    NOT NULL DEFAULT 'menunggu'
                     CHECK (status IN ('menunggu', 'dikonfirmasi', 'diproses', 'selesai', 'dibatalkan')),
    catatan_admin    TEXT,
    dibuat_pada      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    diperbarui_pada  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- ---------------------------------------------------------------------
-- 5. PESANAN_LAYANAN : relasi many-to-many
--    (satu pesanan bisa berisi beberapa layanan / checkbox)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pesanan_layanan (
    pesanan_id  INTEGER NOT NULL REFERENCES pesanan(id) ON DELETE CASCADE,
    layanan_id  INTEGER NOT NULL REFERENCES layanan(id),
    PRIMARY KEY (pesanan_id, layanan_id)
);

-- ---------------------------------------------------------------------
-- INDEX
-- Satu slot jadwal (tanggal + jam) hanya boleh dipakai satu pesanan
-- yang masih aktif. Pesanan yang dibatalkan membebaskan slotnya lagi.
-- ---------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS ux_pesanan_slot_aktif
    ON pesanan (jadwal_tanggal, jadwal_jam)
    WHERE status <> 'dibatalkan';

CREATE INDEX IF NOT EXISTS ix_pesanan_pelanggan ON pesanan (pelanggan_id);
CREATE INDEX IF NOT EXISTS ix_pesanan_status    ON pesanan (status);

-- ---------------------------------------------------------------------
-- VIEW : detail pesanan lengkap (untuk riwayat & dashboard admin)
-- ---------------------------------------------------------------------
CREATE VIEW IF NOT EXISTS v_pesanan_detail AS
SELECT
    p.id,
    p.kode_pesanan,
    p.status,
    p.jadwal_tanggal,
    p.jadwal_jam,
    p.lokasi,
    p.jumlah_unit,
    p.harga_satuan,
    p.total_harga,
    p.catatan_admin,
    p.dibuat_pada,
    pl.id            AS pelanggan_id,
    pl.nama_lengkap,
    pl.no_hp,
    pl.instansi,
    pk.nama          AS paket_nama,
    pk.durasi_bulan,
    (SELECT GROUP_CONCAT(l.nama, ', ')
       FROM pesanan_layanan pls
       JOIN layanan l ON l.id = pls.layanan_id
      WHERE pls.pesanan_id = p.id) AS layanan
FROM pesanan p
JOIN pelanggan pl ON pl.id = p.pelanggan_id
JOIN paket     pk ON pk.id = p.paket_id;
