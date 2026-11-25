# BoysClub IT — Aplikasi Pemesanan Jasa Instal Ulang Windows

Aplikasi web untuk memesan jasa IT BoysClub (instalasi Windows/Linux, optimasi Office, pemeliharaan rutin).
Tampilannya mobile-first dan mengikuti wireframe 7 layar.

## Cara Menjalankan

Syarat: **Node.js versi 22.13 atau lebih baru** (cek dengan `node -v`).

**Cara termudah:** klik dua kali **`Jalankan Aplikasi.bat`**. Browser akan terbuka otomatis.
Jendela hitam yang muncul adalah servernya. **Jangan ditutup** selama aplikasi dipakai.

> ⚠️ Jangan membuka `public/index.html` langsung dengan klik dua kali. Aplikasi harus dibuka lewat
> **http://localhost:3000** supaya bisa terhubung ke server dan database.

Cara manual lewat terminal:

```bash
npm install
npm start
```

Lalu buka http://localhost:3000. Pelanggan dan admin memakai **satu aplikasi yang sama**.

Database dibuat otomatis di `data/boysclub.db` saat server pertama kali jalan.
Tidak perlu install MySQL atau XAMPP.

## Masuk & Daftar Akun

Pengguna **daftar dan masuk dengan email + password**. Ini langsung bisa dipakai tanpa pengaturan tambahan dan gratis.

- **Daftar**: buka tab **Akun** (ikon orang di bottom nav), pilih **Daftar**, lalu isi nama, email, dan password (minimal 8 karakter).
- **Lengkapi Data Akun**: setelah mendaftar, isi No. HP/WhatsApp (wajib), instansi, dan alamat.
- **Masuk**: pilih **Masuk**, lalu isi email dan password. Login bertahan 30 hari di perangkat yang sama.
- **Pesan layanan tidak wajib masuk.** Sesuai Alur Navigasi wireframe, **Mulai Pesan** langsung ke Pilih Layanan.
  Kalau sudah masuk, form Data Pemesan terisi otomatis dan pesanan tercatat di riwayat akun.
- Tab **Akun** menampilkan profil, tombol **Ubah Profil** / **Keluar**, dan **riwayat pesanan** beserta statusnya.
- Pelanggan yang dulu memesan tanpa akun: setelah mendaftar dengan nomor HP yang sama, pesanan lamanya ikut muncul di riwayat.

Keamanan:
- Password disimpan sebagai hash **scrypt** dengan salt acak. Password asli tidak pernah disimpan.
- Setelah 8 kali salah password, login untuk email tersebut dikunci selama 15 menit.

### Admin
Email yang tercantum di `ADMIN_EMAILS` (file `.env`) otomatis menjadi admin.
Supaya orang lain tidak bisa mendaftar memakai email admin, mendaftar dengan email admin **wajib memasukkan `ADMIN_KODE`**.
Kolom kode admin muncul otomatis saat dibutuhkan. Kode ini hanya untuk anggota tim, jangan dibagikan ke pelanggan.

Cara admin mendaftar pertama kali:
1. Buka tab **Akun**, lalu pilih **Daftar**.
2. Isi nama, email admin, dan password, lalu klik **Daftar**.
3. Kolom **Kode Admin** muncul. Isi dengan nilai `ADMIN_KODE` dari file `.env`, lalu klik **Daftar** lagi.
4. Tombol **Buka Dashboard Admin** muncul di tab **Akun**.

Untuk menambah admin, tambahkan emailnya di `ADMIN_EMAILS` (pisahkan dengan koma), lalu jalankan ulang server.

Fitur admin:
- **Dashboard Admin** (dibuka dari tab Akun atau menu ☰): ringkasan pesanan, pendapatan, jumlah akun, dan filter status.
- **Detail Pesanan**: menghubungi pelanggan via WhatsApp (pesan sudah terisi), mengubah status, dan menulis catatan.
  Catatan admin juga tampil di riwayat pesanan pelanggan.

### (Opsional) Tombol "Lanjutkan dengan Google"
Kalau `GOOGLE_CLIENT_ID` diisi di `.env`, tombol Google otomatis muncul di bawah form masuk/daftar.
Kalau dikosongkan, tombolnya disembunyikan. Akun Google dengan email yang sama dengan akun email + password otomatis digabung.

Cara mendapatkan Client ID (gratis):
1. Buka https://console.cloud.google.com, lalu buat project baru.
2. Buka **APIs & Services → OAuth consent screen**, lalu isi nama aplikasi dengan tipe **External**.
   Tambahkan email yang boleh login di **Test users**.
3. Buka **Credentials → Create Credentials → OAuth client ID** dan pilih tipe **Web application**.
   Isi **Authorized JavaScript origins** dengan `http://localhost:3000` dan `http://localhost`.
4. Salin Client ID ke `GOOGLE_CLIENT_ID` di `.env`, lalu jalankan ulang server.

## Deploy Online (Netlify + Turso, gratis)

Aplikasi bisa berjalan di dua tempat dengan kode yang sama:

| | Tampilan & server | Database |
|---|---|---|
| **Laptop** (`npm start` / `Jalankan Aplikasi.bat`) | Express di `server.js` | File `data/boysclub.db` |
| **Online** | Netlify (folder `public/` + Netlify Function `netlify/functions/api.js`) | **Turso** (SQLite online) |

Database online dipilih otomatis jika `TURSO_DATABASE_URL` diisi. Struktur tabelnya tetap dari `database/schema.sql`
dan dibuat otomatis saat aplikasi pertama kali diakses.

### 1. Buat database di Turso
1. Buka https://app.turso.tech, lalu **Continue with GitHub**.
2. Buat database baru (misalnya `boysclub`) dan pilih lokasi terdekat (misalnya Singapore/Asia).
3. Salin **Database URL** (bentuknya `libsql://boysclub-xxxx.turso.io`).
4. Klik **Create Token**, lalu salin tokennya.

### 2. Hubungkan GitHub ke Netlify
1. Buka https://app.netlify.com, lalu **Continue with GitHub**.
2. Pilih **Add new project → Import an existing project → GitHub**, lalu pilih repository aplikasi ini.
3. Pengaturan build otomatis terbaca dari `netlify.toml`, jadi tidak perlu diubah.
4. Sebelum deploy, isi **Environment variables**:

   | Key | Value |
   |---|---|
   | `TURSO_DATABASE_URL` | URL dari Turso |
   | `TURSO_AUTH_TOKEN` | Token dari Turso |
   | `ADMIN_EMAILS` | Email admin (pisahkan dengan koma) |
   | `ADMIN_KODE` | Kode admin rahasia (buat baru, jangan sama dengan yang di laptop) |

5. Klik **Deploy**. Situs tersedia di `https://nama-situs.netlify.app`.

Setiap `git push` ke GitHub akan otomatis di-deploy ulang oleh Netlify.
Kalau muncul pesan "Database belum diatur", berarti `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` belum diisi.
Setelah mengisinya, buka **Deploys → Trigger deploy**.

Catatan: semua waktu memakai WIB. Pembatas percobaan password di Netlify berlaku per instance server, jadi sedikit lebih longgar dibanding di laptop.

## Alur Aplikasi (sesuai wireframe)

| No | Layar | File / fungsi |
|----|-------|---------------|
| 1 | Beranda | `SCREENS.beranda` |
| 2 | Pilih Layanan (checkbox, boleh lebih dari satu) | `SCREENS.layanan` |
| 3 | Pilih Paket (Bulanan / 3 Bulan / 6 Bulan) | `SCREENS.paket` |
| 4 | Jadwal Layanan (kalender + jam) | `SCREENS.jadwal` |
| 5 | Data Pemesan | `SCREENS.data` |
| 6 | Konfirmasi Pesanan | `SCREENS.konfirmasi` |
| 7 | Pesanan Berhasil | `SCREENS.selesai` |

Layar tambahan: `SCREENS.masuk` (masuk / daftar), `SCREENS.profil` (lengkapi/ubah data akun),
`SCREENS.akun` (profil & riwayat), `SCREENS.admin` dan `SCREENS.adminDetail` (khusus admin).

Bottom nav sesuai wireframe (3 ikon): **Beranda**, **Layanan** (katalog & daftar harga), **Akun** (masuk/daftar, profil, riwayat, dan dashboard admin).

Screenshot setiap layar ada di folder [`dokumentasi/tampilan/`](dokumentasi/tampilan/).

## Struktur Folder

```
├── .env                 # Konfigurasi: ADMIN_EMAILS, ADMIN_KODE, GOOGLE_CLIENT_ID (jangan dibagikan)
├── .env.example         # Contoh isi .env
├── server.js            # Server Express + REST API + login (password & Google)
├── netlify.toml         # Pengaturan deploy Netlify
├── netlify/functions/api.js  # Menjalankan server.js sebagai Netlify Function
├── db.js                # Koneksi database: file lokal (node:sqlite) atau Turso (online)
├── database/
│   ├── schema.sql       # Struktur tabel, index, view
│   └── seed.sql         # Data awal layanan & paket
├── public/
│   ├── index.html       # Aplikasi (pelanggan + admin)
│   ├── app.js           # Logika 7 layar pemesanan + akun + mode admin
│   └── style.css
└── data/boysclub.db     # File database (dibuat otomatis)
```

## Database

```
 layanan ──< pesanan_layanan >── pesanan >── pelanggan ──── akun ──< sesi
                                    │                    (1 : 1)
                                    └──> paket
```

| Tabel | Isi |
|-------|-----|
| `layanan` | Jenis jasa: Instalasi Windows, Linux, Optimasi Office, Pemeliharaan Rutin |
| `paket` | Paket harga: Bulanan Rp 50.000, 3 Bulan Rp 135.000 (10% off), 6 Bulan Rp 240.000 (20% off) |
| `pelanggan` | Nama, no. HP (unik), instansi, alamat |
| `akun` | Akun login: email (unik), nama, hash password dan/atau ID Google, terhubung ke satu `pelanggan` |
| `sesi` | Sesi login (cookie), berlaku 30 hari. Yang disimpan hanya hash token. |
| `pesanan` | Kode pesanan, jadwal, lokasi, jumlah unit, harga, total, status |
| `pesanan_layanan` | Penghubung many-to-many, karena satu pesanan bisa berisi beberapa layanan |
| `v_pesanan_detail` (view) | Gabungan semua tabel untuk laporan |

Aturan yang dijaga oleh database:
- **Satu slot jadwal (tanggal + jam) hanya untuk satu pesanan aktif.** Ini dijaga oleh unique index `ux_pesanan_slot_aktif`. Pesanan yang dibatalkan membebaskan slotnya.
- `harga_satuan` disalin ke pesanan, jadi perubahan harga paket tidak mengubah riwayat transaksi.
- Status pesanan: `menunggu` → `dikonfirmasi` → `diproses` → `selesai` (atau `dibatalkan`).
- Satu nomor HP hanya bisa dipakai satu akun.
- Hak admin tidak disimpan di database. Hak admin dibaca dari `ADMIN_EMAILS` setiap kali ada request.

Untuk mengubah harga atau layanan, edit `database/seed.sql`, hapus `data/boysclub.db`, lalu jalankan ulang server.
Cara lain: ubah langsung di file database dengan [DB Browser for SQLite](https://sqlitebrowser.org/).

## API

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/config` | Client ID Google untuk frontend |
| POST | `/api/auth/daftar` | Daftar dengan nama, email, password (+ `kode_admin` untuk email admin) |
| POST | `/api/auth/masuk` | Masuk dengan email + password |
| POST | `/api/auth/google` | Masuk / daftar dengan token Google (opsional) |
| GET | `/api/auth/me` | Data akun yang sedang masuk (`null` jika belum) |
| POST | `/api/auth/logout` | Keluar |
| PUT | `/api/akun/profil` | Lengkapi / ubah profil *(wajib masuk)* |
| GET | `/api/akun/pesanan` | Riwayat pesanan akun *(wajib masuk)* |
| GET | `/api/layanan` | Daftar layanan aktif |
| GET | `/api/paket` | Daftar paket aktif |
| GET | `/api/jadwal?tanggal=YYYY-MM-DD` | Jam tersedia & jam yang sudah terisi |
| POST | `/api/pesanan` | Buat pesanan baru (boleh tanpa masuk) |
| GET | `/api/admin/ringkasan` | Statistik *(khusus admin)* |
| GET | `/api/admin/pesanan?status=` | Semua pesanan *(khusus admin)* |
| PATCH | `/api/admin/pesanan/:id` | Ubah status / catatan *(khusus admin)* |
