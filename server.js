// BoysClub IT - Server API pemesanan jasa IT
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util');
const { OAuth2Client } = require('google-auth-library');
const { db, transaction } = require('./db');

// ------------------------------------------------------- konfigurasi (.env)
const PORT = Number(process.env.PORT) || 3000;
const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim(); // opsional
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
// Kode rahasia yang wajib diisi saat mendaftar (email + password) memakai email admin
const ADMIN_KODE = (process.env.ADMIN_KODE || '').trim();
const SESI_HARI = 30;
const scrypt = promisify(crypto.scrypt);

// Slot jam layanan yang tersedia setiap hari (istirahat 12:00)
const JAM_LAYANAN = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];
const STATUS = ['menunggu', 'dikonfirmasi', 'diproses', 'selesai', 'dibatalkan'];

const googleClient = new OAuth2Client();
const app = express();
// Di hosting (Railway/Render) aplikasi berada di belakang proxy HTTPS:
// agar cookie login bertanda Secure dan IP pengunjung terbaca dengan benar.
if (process.env.TRUST_PROXY || process.env.RAILWAY_ENVIRONMENT || process.env.RENDER) app.set('trust proxy', 1);
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Alamat lama halaman admin -> sekarang menyatu di aplikasi
app.get(['/admin', '/admin.html'], (req, res) => res.redirect('/#admin'));

// ---------------------------------------------------------------- helper
const pad = (n) => String(n).padStart(2, '0');
const ymdLokal = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const jamLokal = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

function tanggalValid(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  return ymdLokal(new Date(`${s}T00:00:00`)) === s; // menolak 2026-02-31 dsb.
}

// Normalisasi nomor HP Indonesia ke format 08xxxxxxxxxx
function normalisasiHp(v) {
  let s = String(v ?? '').replace(/[\s\-().]/g, '');
  if (s.startsWith('+62')) s = '0' + s.slice(3);
  else if (s.startsWith('62')) s = '0' + s.slice(2);
  return /^08\d{7,12}$/.test(s) ? s : null;
}

const teks = (v, max) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '');

function buatKodePesanan() {
  const d = new Date();
  const tgl = `${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  return `BC-${tgl}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const gagal = (res, code, pesan) => res.status(code).json({ error: pesan });

// ------------------------------------------------------------- sesi login
const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');

function bacaCookie(req, nama) {
  for (const bagian of (req.headers.cookie || '').split(';')) {
    const i = bagian.indexOf('=');
    if (i > 0 && bagian.slice(0, i).trim() === nama) return decodeURIComponent(bagian.slice(i + 1).trim());
  }
  return null;
}

function setCookieSesi(req, res, token, maxAgeDetik) {
  res.append('Set-Cookie',
    `bc_sesi=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeDetik}${req.secure ? '; Secure' : ''}`);
}

const isAdminEmail = (email) => ADMIN_EMAILS.includes(String(email).toLowerCase());

function samaPersis(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Membuat sesi login baru + cookie (dipanggil di dalam transaksi)
function buatSesi(req, res, akunId) {
  const token = crypto.randomBytes(32).toString('base64url');
  db.prepare("DELETE FROM sesi WHERE kedaluwarsa <= datetime('now','localtime')").run();
  db.prepare(`INSERT INTO sesi (token_hash, akun_id, kedaluwarsa)
              VALUES (?, ?, datetime('now','localtime','+${SESI_HARI} days'))`).run(hashToken(token), akunId);
  db.prepare("UPDATE akun SET login_terakhir = datetime('now','localtime') WHERE id = ?").run(akunId);
  setCookieSesi(req, res, token, SESI_HARI * 86400);
}

// Password di-hash dengan scrypt + salt acak (password asli tidak pernah disimpan)
async function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(pw, salt, 64);
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}
async function cekPassword(pw, tersimpan) {
  const [alg, salt, hash] = String(tersimpan || '').split('$');
  if (alg !== 'scrypt' || !salt || !hash) return false;
  const key = await scrypt(pw, Buffer.from(salt, 'base64'), 64);
  const exp = Buffer.from(hash, 'base64');
  return exp.length === key.length && crypto.timingSafeEqual(key, exp);
}

// Batasi percobaan password salah: maks 8x per 15 menit per (IP + email)
const percobaanGagal = new Map();
const BATAS_GAGAL = 8, JEDA_MS = 15 * 60 * 1000;
function terblokir(kunci) {
  const r = percobaanGagal.get(kunci);
  return !!r && r.sampai > Date.now() && r.n >= BATAS_GAGAL;
}
function catatGagal(kunci) {
  const now = Date.now();
  let r = percobaanGagal.get(kunci);
  if (!r || r.sampai <= now) r = { n: 0, sampai: now + JEDA_MS };
  r.n++;
  percobaanGagal.set(kunci, r);
}

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;

// Setiap request API: cek cookie sesi -> req.akun
app.use('/api', (req, res, next) => {
  const token = bacaCookie(req, 'bc_sesi');
  if (token) {
    const akun = db.prepare(
      `SELECT a.* FROM sesi s JOIN akun a ON a.id = s.akun_id
        WHERE s.token_hash = ? AND s.kedaluwarsa > datetime('now','localtime')`
    ).get(hashToken(token));
    if (akun) { req.akun = akun; req.isAdmin = isAdminEmail(akun.email); }
  }
  next();
});

const perluMasuk = (req, res, next) => (req.akun ? next() : gagal(res, 401, 'Silakan masuk terlebih dahulu.'));
const perluAdmin = (req, res, next) => {
  if (!req.akun) return gagal(res, 401, 'Silakan masuk terlebih dahulu.');
  if (!req.isAdmin) return gagal(res, 403, 'Akun ini tidak memiliki akses admin.');
  next();
};

function dataAkun(req) {
  const a = req.akun;
  const profil = a.pelanggan_id
    ? db.prepare('SELECT nama_lengkap, no_hp, instansi, alamat FROM pelanggan WHERE id = ?').get(a.pelanggan_id)
    : null;
  return { email: a.email, nama: a.nama, foto: a.foto_url, admin: !!req.isAdmin, profil: profil || null };
}

// Validasi data profil / data pemesan
function validasiProfil(b, { alamatWajib }) {
  const data = {
    nama: teks(b.nama_lengkap, 100),
    hp: normalisasiHp(b.no_hp),
    instansi: teks(b.instansi, 100) || null,
    alamat: teks(b.alamat, 255),
  };
  if (data.nama.length < 3) throw new HttpError(400, 'Nama lengkap minimal 3 huruf.');
  if (!data.hp) throw new HttpError(400, 'Nomor HP/WhatsApp tidak valid (contoh: 081234567890).');
  if (alamatWajib && data.alamat.length < 3) throw new HttpError(400, 'Alamat / lokasi wajib diisi.');
  return data;
}

// Menyimpan data pelanggan milik akun (dipanggil di dalam transaksi).
// Jika nomor HP sudah ada sebagai pelanggan tamu (pesanan lama sebelum ada
// fitur akun), datanya digabungkan ke akun ini agar riwayatnya ikut muncul.
function simpanPelangganAkun(akun, d) {
  const pemilikHp = db.prepare(
    'SELECT p.id, a.id AS akun_id FROM pelanggan p LEFT JOIN akun a ON a.pelanggan_id = p.id WHERE p.no_hp = ?'
  ).get(d.hp);
  if (pemilikHp?.akun_id && pemilikHp.akun_id !== akun.id) {
    throw new HttpError(409, 'Nomor HP ini sudah terdaftar di akun lain.');
  }

  let pid = akun.pelanggan_id;
  if (pid && pemilikHp && pemilikHp.id !== pid) {
    db.prepare('UPDATE pesanan SET pelanggan_id = ? WHERE pelanggan_id = ?').run(pid, pemilikHp.id);
    db.prepare('DELETE FROM pelanggan WHERE id = ?').run(pemilikHp.id);
  } else if (!pid && pemilikHp) {
    pid = pemilikHp.id;
  }

  if (pid) {
    db.prepare(
      `UPDATE pelanggan SET nama_lengkap = ?, no_hp = ?, instansi = ?, alamat = COALESCE(NULLIF(?, ''), alamat),
              diperbarui_pada = datetime('now','localtime') WHERE id = ?`
    ).run(d.nama, d.hp, d.instansi, d.alamat, pid);
  } else {
    pid = Number(db.prepare('INSERT INTO pelanggan (nama_lengkap, no_hp, instansi, alamat) VALUES (?, ?, ?, ?)')
      .run(d.nama, d.hp, d.instansi, d.alamat || null).lastInsertRowid);
  }
  db.prepare('UPDATE akun SET pelanggan_id = ? WHERE id = ?').run(pid, akun.id);
  akun.pelanggan_id = pid;
  return pid;
}

function tanganiError(res, err) {
  if (err instanceof HttpError) return gagal(res, err.status, err.message);
  if (String(err.message).includes('jadwal_tanggal')) {
    return gagal(res, 409, 'Maaf, jadwal tersebut baru saja dipesan orang lain. Silakan pilih jam lain.');
  }
  console.error(err);
  gagal(res, 500, 'Terjadi kesalahan pada server.');
}

// ------------------------------------------------------- API autentikasi
app.get('/api/config', (req, res) => res.json({ googleClientId: GOOGLE_CLIENT_ID || null }));

// Daftar akun baru dengan email + password
app.post('/api/auth/daftar', async (req, res) => {
  const b = req.body || {};
  const nama = teks(b.nama, 100);
  const email = teks(b.email, 254).toLowerCase();
  const password = typeof b.password === 'string' ? b.password : '';
  if (nama.length < 3) return gagal(res, 400, 'Nama minimal 3 huruf.');
  if (!EMAIL_RE.test(email)) return gagal(res, 400, 'Format email tidak valid.');
  if (password.length < 8) return gagal(res, 400, 'Password minimal 8 karakter.');
  if (password.length > 200) return gagal(res, 400, 'Password terlalu panjang.');

  const ada = db.prepare('SELECT password_hash FROM akun WHERE email = ?').get(email);
  if (ada) {
    return gagal(res, 409, ada.password_hash
      ? 'Email ini sudah terdaftar. Silakan masuk.'
      : 'Email ini sudah terdaftar dengan Google. Silakan masuk dengan Google.');
  }

  // Email admin: wajib kode admin agar orang lain tidak bisa mendaftar memakai email admin
  if (isAdminEmail(email)) {
    if (!ADMIN_KODE) return gagal(res, 403, 'Pendaftaran admin belum diatur: isi ADMIN_KODE di file .env.');
    const kunci = `kode|${req.ip}`;
    if (terblokir(kunci)) return gagal(res, 429, 'Terlalu banyak percobaan kode admin. Coba lagi dalam 15 menit.');
    if (!samaPersis(teks(b.kode_admin, 100), ADMIN_KODE)) {
      if (b.kode_admin) catatGagal(kunci);
      return res.status(403).json({ error: 'Email ini terdaftar sebagai admin. Masukkan kode admin yang benar.', perlu_kode_admin: true });
    }
  }

  try {
    const hash = await hashPassword(password);
    const id = transaction(() => {
      const id = Number(db.prepare('INSERT INTO akun (email, nama, password_hash) VALUES (?, ?, ?)')
        .run(email, nama, hash).lastInsertRowid);
      buatSesi(req, res, id);
      return id;
    });
    req.akun = db.prepare('SELECT * FROM akun WHERE id = ?').get(id);
    req.isAdmin = isAdminEmail(email);
    res.status(201).json({ ...dataAkun(req), baru: true });
  } catch (err) {
    if (String(err.message).includes('akun.email')) return gagal(res, 409, 'Email ini sudah terdaftar. Silakan masuk.');
    tanganiError(res, err);
  }
});

// Masuk dengan email + password
app.post('/api/auth/masuk', async (req, res) => {
  const b = req.body || {};
  const email = teks(b.email, 254).toLowerCase();
  const password = typeof b.password === 'string' ? b.password.slice(0, 200) : '';
  if (!email || !password) return gagal(res, 400, 'Email dan password wajib diisi.');

  const kunci = `${req.ip}|${email}`;
  if (terblokir(kunci)) return gagal(res, 429, 'Terlalu banyak percobaan gagal. Coba lagi dalam 15 menit.');

  const akun = db.prepare('SELECT * FROM akun WHERE email = ?').get(email);
  if (akun && !akun.password_hash) {
    return gagal(res, 400, 'Akun ini terdaftar dengan Google. Silakan masuk dengan Google.');
  }
  if (!akun || !(await cekPassword(password, akun.password_hash))) {
    catatGagal(kunci);
    return gagal(res, 401, 'Email atau password salah.');
  }
  percobaanGagal.delete(kunci);
  try {
    transaction(() => buatSesi(req, res, akun.id));
    req.akun = akun;
    req.isAdmin = isAdminEmail(akun.email);
    res.json({ ...dataAkun(req), baru: false });
  } catch (err) { tanganiError(res, err); }
});

// Masuk / daftar dengan Google (opsional, aktif jika GOOGLE_CLIENT_ID diisi).
// Jika email Google sama dengan akun email + password yang sudah ada, keduanya digabung.
app.post('/api/auth/google', async (req, res) => {
  if (!GOOGLE_CLIENT_ID) return gagal(res, 503, 'Login Google belum diatur di server (GOOGLE_CLIENT_ID kosong).');
  const credential = req.body?.credential;
  if (typeof credential !== 'string' || credential.length > 4096) return gagal(res, 400, 'Data login tidak valid.');

  let p;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    p = ticket.getPayload();
  } catch {
    return gagal(res, 401, 'Verifikasi akun Google gagal. Silakan coba lagi.');
  }
  if (!p?.sub || !p.email || !p.email_verified) return gagal(res, 401, 'Email Google belum terverifikasi.');

  const email = p.email.toLowerCase();
  const nama = teks(p.name, 100) || email.split('@')[0];
  const foto = typeof p.picture === 'string' ? p.picture.slice(0, 500) : null;

  try {
    const { id, baru } = transaction(() => {
      const bySub = db.prepare('SELECT id FROM akun WHERE google_sub = ?').get(p.sub);
      if (bySub) {
        db.prepare('UPDATE akun SET foto_url = ? WHERE id = ?').run(foto, bySub.id);
        buatSesi(req, res, bySub.id);
        return { id: bySub.id, baru: false };
      }
      const byEmail = db.prepare('SELECT id, google_sub FROM akun WHERE email = ?').get(email);
      if (byEmail) {
        if (byEmail.google_sub) throw new HttpError(409, 'Email ini sudah terhubung dengan akun Google lain.');
        // Google sudah memverifikasi pemilik email -> hubungkan ke akun email + password yang ada
        db.prepare('UPDATE akun SET google_sub = ?, foto_url = ? WHERE id = ?').run(p.sub, foto, byEmail.id);
        buatSesi(req, res, byEmail.id);
        return { id: byEmail.id, baru: false };
      }
      const id = Number(db.prepare('INSERT INTO akun (google_sub, email, nama, foto_url) VALUES (?, ?, ?, ?)')
        .run(p.sub, email, nama, foto).lastInsertRowid);
      buatSesi(req, res, id);
      return { id, baru: true };
    });
    req.akun = db.prepare('SELECT * FROM akun WHERE id = ?').get(id);
    req.isAdmin = isAdminEmail(email);
    res.json({ ...dataAkun(req), baru });
  } catch (err) { tanganiError(res, err); }
});

app.get('/api/auth/me', (req, res) => res.json(req.akun ? dataAkun(req) : null));

app.post('/api/auth/logout', (req, res) => {
  const token = bacaCookie(req, 'bc_sesi');
  if (token) db.prepare('DELETE FROM sesi WHERE token_hash = ?').run(hashToken(token));
  setCookieSesi(req, res, '', 0);
  res.json({ ok: true });
});

// Lengkapi / ubah profil akun (langkah "daftar" setelah masuk pertama kali)
app.put('/api/akun/profil', perluMasuk, (req, res) => {
  try {
    const d = validasiProfil(req.body || {}, { alamatWajib: false });
    transaction(() => simpanPelangganAkun(req.akun, d));
    res.json(dataAkun(req));
  } catch (err) { tanganiError(res, err); }
});

// Riwayat pesanan milik akun yang sedang masuk
app.get('/api/akun/pesanan', perluMasuk, (req, res) => {
  if (!req.akun.pelanggan_id) return res.json([]);
  res.json(db.prepare(
    `SELECT kode_pesanan, status, jadwal_tanggal, jadwal_jam, lokasi, jumlah_unit, total_harga,
            paket_nama, durasi_bulan, layanan, catatan_admin, dibuat_pada
       FROM v_pesanan_detail WHERE pelanggan_id = ? ORDER BY id DESC`
  ).all(req.akun.pelanggan_id));
});

// ------------------------------------------------------------ API publik
app.get('/api/layanan', (req, res) => {
  res.json(db.prepare('SELECT id, kode, nama, deskripsi, ikon FROM layanan WHERE aktif = 1 ORDER BY id').all());
});

app.get('/api/paket', (req, res) => {
  res.json(db.prepare('SELECT id, nama, durasi_bulan, harga, diskon_persen FROM paket WHERE aktif = 1 ORDER BY durasi_bulan').all());
});

// Jam yang tersedia / sudah terisi pada tanggal tertentu
app.get('/api/jadwal', (req, res) => {
  const { tanggal } = req.query;
  if (!tanggalValid(tanggal)) return gagal(res, 400, 'Format tanggal tidak valid.');
  const terisi = db
    .prepare("SELECT jadwal_jam FROM pesanan WHERE jadwal_tanggal = ? AND status <> 'dibatalkan'")
    .all(tanggal)
    .map((r) => r.jadwal_jam);
  res.json({ tanggal, jam: JAM_LAYANAN, terisi });
});

// Pemesan tanpa akun (tamu): cari pelanggan berdasarkan No. HP atau buat baru.
// Data profil milik akun terdaftar tidak ditimpa oleh pesanan tamu.
function simpanPelangganTamu(d) {
  const ada = db.prepare(
    'SELECT p.id, a.id AS akun_id FROM pelanggan p LEFT JOIN akun a ON a.pelanggan_id = p.id WHERE p.no_hp = ?'
  ).get(d.hp);
  if (ada) {
    if (!ada.akun_id) {
      db.prepare(
        `UPDATE pelanggan SET nama_lengkap = ?, instansi = ?, alamat = ?, diperbarui_pada = datetime('now','localtime')
          WHERE id = ?`
      ).run(d.nama, d.instansi, d.alamat, ada.id);
    }
    return ada.id;
  }
  return Number(db.prepare('INSERT INTO pelanggan (nama_lengkap, no_hp, instansi, alamat) VALUES (?, ?, ?, ?)')
    .run(d.nama, d.hp, d.instansi, d.alamat).lastInsertRowid);
}

// Membuat pesanan baru. Sesuai alur wireframe, pemesan tidak wajib masuk;
// jika sudah masuk, pesanan otomatis tercatat di akunnya.
app.post('/api/pesanan', (req, res) => {
  const b = req.body || {};
  try {
    // Layanan
    const layananIds = Array.isArray(b.layanan_ids)
      ? [...new Set(b.layanan_ids.map(Number))].filter(Number.isInteger)
      : [];
    if (layananIds.length === 0) throw new HttpError(400, 'Pilih minimal satu layanan.');
    const layanan = db
      .prepare(`SELECT id, nama FROM layanan WHERE aktif = 1 AND id IN (${layananIds.map(() => '?').join(',')})`)
      .all(...layananIds);
    if (layanan.length !== layananIds.length) throw new HttpError(400, 'Layanan yang dipilih tidak valid.');

    // Paket & jumlah unit
    const paket = db.prepare('SELECT * FROM paket WHERE id = ? AND aktif = 1').get(Number(b.paket_id));
    if (!paket) throw new HttpError(400, 'Paket tidak valid.');
    const unit = Number(b.jumlah_unit ?? 1);
    if (!Number.isInteger(unit) || unit < 1 || unit > 100) throw new HttpError(400, 'Jumlah unit harus 1 - 100.');

    // Jadwal
    const { tanggal, jam } = b;
    if (!tanggalValid(tanggal)) throw new HttpError(400, 'Tanggal tidak valid.');
    if (!JAM_LAYANAN.includes(jam)) throw new HttpError(400, 'Jam layanan tidak valid.');
    const hariIni = ymdLokal();
    if (tanggal < hariIni || (tanggal === hariIni && jam <= jamLokal())) {
      throw new HttpError(400, 'Jadwal yang dipilih sudah lewat.');
    }

    // Data pemesan (sekaligus memperbarui profil akun)
    const d = validasiProfil(b, { alamatWajib: true });
    const total = paket.harga * unit;

    const hasil = transaction(() => {
      const pelangganId = req.akun ? simpanPelangganAkun(req.akun, d) : simpanPelangganTamu(d);
      const kode = buatKodePesanan();
      const pesananId = Number(
        db.prepare(
          `INSERT INTO pesanan (kode_pesanan, pelanggan_id, paket_id, jumlah_unit, harga_satuan, total_harga,
                                jadwal_tanggal, jadwal_jam, lokasi)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(kode, pelangganId, paket.id, unit, paket.harga, total, tanggal, jam, d.alamat).lastInsertRowid
      );
      const insLayanan = db.prepare('INSERT INTO pesanan_layanan (pesanan_id, layanan_id) VALUES (?, ?)');
      for (const l of layanan) insLayanan.run(pesananId, l.id);
      return db.prepare('SELECT * FROM v_pesanan_detail WHERE id = ?').get(pesananId);
    });
    res.status(201).json(hasil);
  } catch (err) { tanganiError(res, err); }
});

// ------------------------------------------------------------- API admin
app.get('/api/admin/ringkasan', perluAdmin, (req, res) => {
  const perStatus = Object.fromEntries(STATUS.map((s) => [s, 0]));
  for (const r of db.prepare('SELECT status, COUNT(*) AS n FROM pesanan GROUP BY status').all()) perStatus[r.status] = r.n;
  const { pendapatan } = db
    .prepare("SELECT COALESCE(SUM(total_harga), 0) AS pendapatan FROM pesanan WHERE status IN ('dikonfirmasi','diproses','selesai')")
    .get();
  const { pelanggan } = db.prepare('SELECT COUNT(*) AS pelanggan FROM pelanggan').get();
  const { akun } = db.prepare('SELECT COUNT(*) AS akun FROM akun').get();
  res.json({ per_status: perStatus, pendapatan, pelanggan, akun });
});

app.get('/api/admin/pesanan', perluAdmin, (req, res) => {
  const { status } = req.query;
  const rows = STATUS.includes(status)
    ? db.prepare('SELECT * FROM v_pesanan_detail WHERE status = ? ORDER BY jadwal_tanggal, jadwal_jam').all(status)
    : db.prepare('SELECT * FROM v_pesanan_detail ORDER BY id DESC').all();
  res.json(rows);
});

app.patch('/api/admin/pesanan/:id', perluAdmin, (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body || {};
  if (!STATUS.includes(status)) return gagal(res, 400, 'Status tidak valid.');
  const catatan = teks(req.body.catatan_admin, 500) || null;
  try {
    const r = db
      .prepare("UPDATE pesanan SET status = ?, catatan_admin = ?, diperbarui_pada = datetime('now','localtime') WHERE id = ?")
      .run(status, catatan, id);
    if (r.changes === 0) return gagal(res, 404, 'Pesanan tidak ditemukan.');
    res.json(db.prepare('SELECT * FROM v_pesanan_detail WHERE id = ?').get(id));
  } catch (err) {
    if (String(err.message).includes('jadwal_tanggal')) {
      return gagal(res, 409, 'Slot jadwal pesanan ini sudah dipakai pesanan lain, tidak bisa diaktifkan kembali.');
    }
    tanganiError(res, err);
  }
});

// JSON rusak / error lain
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return gagal(res, 400, 'Format data tidak valid.');
  console.error(err);
  gagal(res, 500, 'Terjadi kesalahan pada server.');
});

app.listen(PORT, () => {
  console.log(`BoysClub IT berjalan di http://localhost:${PORT}`);
  console.log(`Login: email + password${GOOGLE_CLIENT_ID ? ' & Google' : ' (tombol Google nonaktif, GOOGLE_CLIENT_ID kosong)'}`);
  console.log(ADMIN_EMAILS.length
    ? `Admin: ${ADMIN_EMAILS.join(', ')}`
    : '[!] ADMIN_EMAILS belum diisi di file .env - belum ada akun admin.');
  if (ADMIN_EMAILS.length && !ADMIN_KODE) {
    console.log('[!] ADMIN_KODE belum diisi di file .env - admin belum bisa mendaftar dengan email + password.');
  }
});
