'use strict';
/* BoysClub IT - aplikasi pemesanan (single page)
   Alur pesan : Beranda -> Pilih Layanan -> Pilih Paket -> Pilih Jadwal -> Data Pemesan -> Konfirmasi -> Selesai
   Akun       : Masuk / daftar dengan Google -> Lengkapi Profil (akun baru) -> Akun (profil & riwayat)
   Admin      : akun Google yang emailnya terdaftar di ADMIN_EMAILS (.env) mendapat tab Admin */

// ------------------------------------------------------------------ ikon
const svg = (p) => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const ICON = {
  back: svg('<path d="M19 12H5M12 19l-7-7 7-7"/>'),
  menu: svg('<path d="M4 6h16M4 12h16M4 18h16"/>'),
  home: svg('<path d="M3 11l9-8 9 8"/><path d="M5 9.5V20h5v-6h4v6h5V9.5"/>'),
  grid: svg('<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/>'),
  laptop: svg('<rect x="4" y="4.5" width="16" height="11" rx="1.5"/><path d="M2 19h20M10 17.5h4"/>'),
  windows: svg('<rect x="3.5" y="3.5" width="7.5" height="7.5" rx=".8"/><rect x="13" y="3.5" width="7.5" height="7.5" rx=".8"/><rect x="3.5" y="13" width="7.5" height="7.5" rx=".8"/><rect x="13" y="13" width="7.5" height="7.5" rx=".8"/>'),
  linux: svg('<path d="M12 2.5c-2.8 0-4 2.4-4 5 0 1.7-.6 2.9-1.6 4.4C5 14 4.5 16 5.2 18c.6 1.6 2.2 2.6 3.8 2.1M12 2.5c2.8 0 4 2.4 4 5 0 1.7.6 2.9 1.6 4.4 1.4 2.1 1.9 4.1 1.2 6.1-.6 1.6-2.2 2.6-3.8 2.1"/><path d="M9 20.5c1.8.6 4.2.6 6 0"/><ellipse cx="12" cy="15" rx="3" ry="4"/><circle cx="10.4" cy="7" r=".6"/><circle cx="13.6" cy="7" r=".6"/><path d="M11 9.3l1 .9 1-.9"/>'),
  office: svg('<path d="M4.5 6.5L14 3l5.5 2v14L14 21l-9.5-3.5z"/><path d="M14 3v18M4.5 6.5l9.5 1.8M4.5 17.5l9.5-1.8"/>'),
  wrench: svg('<path d="M14.7 6.3a4.5 4.5 0 0 0-5.9 5.9L3 18l3 3 5.8-5.8a4.5 4.5 0 0 0 5.9-5.9l-2.6 2.6-2.6-.6-.6-2.6z"/>'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  chevL: svg('<path d="M15 6l-6 6 6 6"/>'),
  chevR: svg('<path d="M9 6l6 6-6 6"/>'),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  person: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/>'),
  phone: svg('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
  building: svg('<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M10 21v-3h4v3"/>'),
  pin: svg('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  wa: svg('<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/><path d="M9 9.5c.3 2 1.6 3.6 3.6 4.4l1.2-1.1 1.7.8c-.2 1-1 1.7-2 1.6A6 6 0 0 1 8 9.8c0-1 .6-1.8 1.6-2l.8 1.7z"/>'),
  shield: svg('<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>'),
  chart: svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  refresh: svg('<path d="M20 11a8 8 0 0 0-14.7-4.3L4 8.5M4 4v4.5h4.5M4 13a8 8 0 0 0 14.7 4.3l1.3-1.8M20 20v-4.5h-4.5"/>'),
  logout: svg('<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11"/>'),
  edit: svg('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
  mail: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>'),
  lock: svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
};

// --------------------------------------------------------------- helper
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const BULAN_PENDEK = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const STATUS = ['menunggu', 'dikonfirmasi', 'diproses', 'selesai', 'dibatalkan'];
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const rupiah = (n) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n);
const jamTampil = (j) => j.replace(':', '.');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tglTampil = (s) => { const [y, m, d] = s.split('-').map(Number); return `${d} ${BULAN_PENDEK[m - 1]} ${y}`; };
const per = (durasi) => (durasi === 1 ? 'bulan' : `${durasi} bulan`);
const waLink = (hp, teks = '') => `https://wa.me/62${hp.replace(/^0/, '')}${teks ? '?text=' + encodeURIComponent(teks) : ''}`;

async function api(url, opts = {}) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = new Error(data.error || 'Terjadi kesalahan, coba lagi.'); e.status = res.status; e.data = data;
    if (res.status === 401 && state.user) sesiBerakhir();
    throw e;
  }
  return data;
}

let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ---------------------------------------------------------------- state
const now = new Date();
const BULAN_INI = new Date(now.getFullYear(), now.getMonth(), 1);
const MAKS_BULAN_KE_DEPAN = 3;
const FORM_KOSONG = () => ({ nama_lengkap: '', no_hp: '', instansi: '', alamat: '' });
const authKosong = (mode = 'masuk') => ({
  mode, form: { nama: '', email: '', password: '', kode_admin: '' }, errors: {}, perluKode: false, loading: false,
});

const state = {
  config: { googleClientId: null },
  user: null,            // { email, nama, foto, admin, profil }
  setelahMasuk: null,    // 'pesan' | 'admin' | null -> tujuan setelah login berhasil
  auth: authKosong(),    // form masuk / daftar
  layanan: [], paket: [],
  pilihan: new Set(), paketId: null, unit: 1,
  bulan: new Date(BULAN_INI), tanggal: null, jam: null, jadwal: null,
  form: FORM_KOSONG(), errors: {},
  hasil: null, sending: false,
  riwayat: null,
  profil: { form: FORM_KOSONG(), errors: {}, daftar: false, saving: false },
  admin: { ringkasan: null, pesanan: null, filter: '', detailId: null, draft: null, saving: false },
};
const paketDipilih = () => state.paket.find((p) => p.id === state.paketId);
const layananDipilih = () => state.layanan.filter((l) => state.pilihan.has(l.id));

function dariProfil() {
  const p = state.user?.profil;
  return p
    ? { nama_lengkap: p.nama_lengkap || '', no_hp: p.no_hp || '', instansi: p.instansi || '', alamat: p.alamat || '' }
    : { ...FORM_KOSONG(), nama_lengkap: state.user?.nama || '' };
}

function resetPesanan() {
  Object.assign(state, {
    pilihan: new Set(), paketId: state.paket[0]?.id ?? null, unit: 1,
    bulan: new Date(BULAN_INI), tanggal: null, jam: null, jadwal: null,
    form: dariProfil(), errors: {}, hasil: null,
  });
}

// ------------------------------------------------------------ navigasi
const $app = document.getElementById('app');
const stack = [];
function render() {
  const s = SCREENS[stack[stack.length - 1]];
  $app.innerHTML = `<section class="screen">${s.view()}</section>`;
  s.mount?.();
}
const go = (name) => { stack.push(name); render(); };
const back = () => { if (stack.length > 1) { stack.pop(); render(); } };
const tab = (name) => {
  if (name === 'admin') return bukaAdmin();
  stack.length = 0; stack.push(name); render();
  if (name === 'akun' && state.user && state.riwayat === null) muatRiwayat();
};
// Dashboard admin dibuka dari tab Akun (bottom nav tetap 3 ikon sesuai wireframe)
function bukaAdmin() {
  if (!state.user?.admin) return tab('akun');
  stack.length = 0; stack.push('akun', 'admin'); render();
  muatAdmin();
}

// ------------------------------------------------------- komponen umum
const topbar = (title, kiri = 'back', kanan = '') => `
  <header class="topbar">
    ${kiri === 'back'
      ? `<button class="icon-btn" data-act="back" aria-label="Kembali">${ICON.back}</button>`
      : `<button class="icon-btn" data-act="menu" aria-label="Menu">${ICON.menu}</button>`}
    <h1>${title}</h1>${kanan || '<span></span>'}
  </header>`;

// Bottom nav sesuai wireframe: 3 ikon (Beranda, Layanan, Akun)
const bottomNav = (aktif) => `<nav class="bottom-nav">${
  [['beranda', 'home', 'Beranda'], ['katalog', 'grid', 'Layanan'], ['akun', 'user', 'Akun']]
    .map(([k, i, t]) => `<button data-tab="${k}" class="${aktif === k ? 'aktif' : ''}" aria-label="${t}" title="${t}">${ICON[i]}</button>`)
    .join('')}</nav>`;

const actions = (label, act, disabled = false) =>
  `<footer class="actions"><button class="btn primary" data-act="${act}" ${disabled ? 'disabled' : ''}>${label}</button></footer>`;

const avatar = (u, cls = '') => u.foto
  ? `<img class="avatar ${cls}" src="${esc(u.foto)}" alt="" referrerpolicy="no-referrer">`
  : `<span class="avatar ${cls}">${esc((u.nama || '?').charAt(0).toUpperCase())}</span>`;

// Field input (icon = null -> kolom polos seperti wireframe Data Pemesan)
const field = (f, e, key, icon, ph, type = 'text', extra = '') => `
  <div class="field ${icon ? '' : 'polos'} ${e[key] ? 'err' : ''}">
    ${icon ? ICON[icon] : ''}
    <input name="${key}" type="${type}" placeholder="${ph}" aria-label="${ph}" value="${esc(f[key])}" ${extra}>
    ${e[key] ? `<p class="msg">${e[key]}</p>` : ''}
  </div>`;

function validasiData(f, alamatWajib) {
  const e = {};
  if (f.nama_lengkap.trim().length < 3) e.nama_lengkap = 'Nama lengkap minimal 3 huruf.';
  const hp = f.no_hp.replace(/[\s\-().]/g, '').replace(/^\+?62/, '0');
  if (!/^08\d{7,12}$/.test(hp)) e.no_hp = 'Nomor tidak valid. Contoh: 081234567890';
  if (alamatWajib && f.alamat.trim().length < 3) e.alamat = 'Alamat / lokasi wajib diisi.';
  return e;
}

// ======================================================================
//  MASUK / DAFTAR dengan email + password
// ======================================================================
function authPanel() {
  const A = state.auth, f = A.form, e = A.errors, daftar = A.mode === 'daftar';
  return `
    <div class="content">
      <div class="auth-head">
        <div class="hero-icon">${ICON.user}</div>
        <h2>${daftar ? 'Buat Akun Baru' : 'Masuk ke BoysClub IT'}</h2>
        <p class="sub">${daftar
          ? 'Daftar gratis untuk memesan layanan dan memantau pesanan Anda.'
          : 'Masuk untuk memesan layanan dan melihat riwayat pesanan.'}</p>
      </div>
      <div class="seg">
        <button data-act="auth-mode" data-mode="masuk" class="${daftar ? '' : 'aktif'}">Masuk</button>
        <button data-act="auth-mode" data-mode="daftar" class="${daftar ? 'aktif' : ''}">Daftar</button>
      </div>
      <form class="form" id="auth-form" novalidate>
        ${daftar ? field(f, e, 'nama', 'person', 'Nama Lengkap', 'text', 'autocomplete="name" maxlength="100"') : ''}
        ${field(f, e, 'email', 'mail', 'Email', 'email', 'autocomplete="email" inputmode="email" maxlength="254"')}
        ${field(f, e, 'password', 'lock', daftar ? 'Password (min. 8 karakter)' : 'Password', 'password',
          `autocomplete="${daftar ? 'new-password' : 'current-password'}" maxlength="200"`)}
        ${daftar && A.perluKode ? field(f, e, 'kode_admin', 'shield', 'Kode Admin (dari tim)', 'text', 'autocomplete="off" maxlength="100"') : ''}
        <button class="btn primary" type="submit" ${A.loading ? 'disabled' : ''}>
          ${A.loading ? 'Memproses…' : daftar ? 'Daftar' : 'Masuk'}
        </button>
      </form>
      <p class="hint center">
        ${daftar
          ? 'Sudah punya akun? <button class="link-btn inline" data-act="auth-mode" data-mode="masuk">Masuk</button>'
          : 'Belum punya akun? <button class="link-btn inline" data-act="auth-mode" data-mode="daftar">Daftar sekarang</button>'}
      </p>
      ${state.config.googleClientId ? '<div class="divider"><span>atau</span></div><div class="gbtn"></div>' : ''}
    </div>`;
}

function mountAuth() {
  const form = $app.querySelector('#auth-form');
  if (!form) return;
  form.addEventListener('input', (e) => { state.auth.form[e.target.name] = e.target.value; });
  form.addEventListener('submit', (e) => { e.preventDefault(); kirimAuth(); });
  pasangTombolGoogle();
}

async function kirimAuth() {
  const A = state.auth, f = A.form, daftar = A.mode === 'daftar', e = {};
  if (A.loading) return;
  if (daftar && f.nama.trim().length < 3) e.nama = 'Nama minimal 3 huruf.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = 'Format email tidak valid.';
  if (daftar && f.password.length < 8) e.password = 'Password minimal 8 karakter.';
  if (!daftar && !f.password) e.password = 'Password wajib diisi.';
  if (daftar && A.perluKode && !f.kode_admin.trim()) e.kode_admin = 'Kode admin wajib diisi.';
  A.errors = e;
  if (Object.keys(e).length) { render(); $app.querySelector('.field.err input')?.focus(); return; }

  A.loading = true; render();
  try {
    const body = daftar
      ? { nama: f.nama, email: f.email, password: f.password, kode_admin: f.kode_admin }
      : { email: f.email, password: f.password };
    const user = await api(daftar ? '/api/auth/daftar' : '/api/auth/masuk', { method: 'POST', body: JSON.stringify(body) });
    state.auth = authKosong();
    setelahLogin(user);
  } catch (err) {
    A.loading = false;
    if (err.data?.perlu_kode_admin) {
      if (A.perluKode && f.kode_admin) A.errors = { kode_admin: 'Kode admin salah.' };
      A.perluKode = true;
    }
    render(); toast(err.message);
    if (A.perluKode) $app.querySelector('[name=kode_admin]')?.focus();
  }
}

function setelahLogin(user) {
  const baru = user.baru; delete user.baru;
  state.user = user; state.riwayat = null;
  toast(baru ? `Akun berhasil dibuat. Selamat datang, ${user.nama}!` : `Selamat datang kembali, ${user.nama}!`);
  lanjutkanSetelahMasuk();
}

// ======================================================================
//  LOGIN GOOGLE (opsional - tampil hanya jika GOOGLE_CLIENT_ID diisi)
// ======================================================================
let gsiSiap = null;
function muatGoogle() {
  if (!gsiSiap) {
    gsiSiap = new Promise((ok, gagal) => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.onload = () => {
        google.accounts.id.initialize({
          client_id: state.config.googleClientId,
          callback: masukDenganGoogle,
          ux_mode: 'popup',
          context: 'signin',
        });
        ok();
      };
      s.onerror = () => { gsiSiap = null; gagal(new Error('Gagal memuat Google. Periksa koneksi internet.')); };
      document.head.appendChild(s);
    });
  }
  return gsiSiap;
}

async function pasangTombolGoogle() {
  const el = $app.querySelector('.gbtn');
  if (!el || !state.config.googleClientId) return;
  el.innerHTML = '<p class="hint">Memuat tombol Google…</p>';
  try {
    await muatGoogle();
    if (!el.isConnected) return;
    el.innerHTML = '';
    google.accounts.id.renderButton(el, {
      theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', locale: 'id',
      width: Math.max(220, Math.min(320, el.clientWidth || 320)),
    });
  } catch (err) {
    el.innerHTML = `<p class="warn">${esc(err.message)}</p>`;
  }
}

// Dipanggil Google setelah pengguna memilih akun
async function masukDenganGoogle(resp) {
  try {
    const user = await api('/api/auth/google', { method: 'POST', body: JSON.stringify({ credential: resp.credential }) });
    state.auth = authKosong();
    setelahLogin(user);
  } catch (err) { toast(err.message); }
}

function lanjutkanSetelahMasuk() {
  if (!state.user.profil) return bukaProfil(true); // akun baru -> lengkapi data dulu
  const tujuan = state.setelahMasuk; state.setelahMasuk = null;
  if (tujuan === 'admin' && state.user.admin) bukaAdmin();
  else tab('akun');
}

function mintaMasuk(tujuan) {
  state.setelahMasuk = tujuan;
  go('masuk');
}

async function keluar() {
  try { await api('/api/auth/logout', { method: 'POST' }); } catch {}
  try { google.accounts.id.disableAutoSelect(); } catch {}
  bersihkanSesi();
  toast('Anda telah keluar.');
  tab('akun');
}

function bersihkanSesi() {
  state.user = null; state.riwayat = null; state.setelahMasuk = null; state.auth = authKosong();
  Object.assign(state.admin, { ringkasan: null, pesanan: null, filter: '', detailId: null, draft: null, saving: false });
}

function sesiBerakhir() {
  bersihkanSesi();
  toast('Sesi berakhir, silakan masuk kembali.');
  tab('akun');
}

// ---- profil (daftar = melengkapi data setelah masuk pertama kali)
function bukaProfil(daftar) {
  state.profil = { form: dariProfil(), errors: {}, daftar, saving: false };
  if (stack[stack.length - 1] === 'masuk') stack.pop();
  go('profil');
}

async function simpanProfil() {
  const P = state.profil;
  if (P.saving) return;
  P.errors = validasiData(P.form, false);
  if (Object.keys(P.errors).length) { render(); $app.querySelector('.field.err input')?.focus(); return; }
  P.saving = true; render();
  try {
    state.user = await api('/api/akun/profil', { method: 'PUT', body: JSON.stringify(P.form) });
    P.saving = false;
    state.riwayat = null; // nomor HP bisa membawa riwayat pesanan lama
    if (P.daftar) { toast('Pendaftaran selesai!'); lanjutkanSetelahMasuk(); }
    else { toast('Profil disimpan.'); back(); if (stack[stack.length - 1] === 'akun') muatRiwayat(); }
  } catch (err) {
    P.saving = false;
    if (err.status !== 401) { render(); toast(err.message); }
  }
}

async function muatRiwayat() {
  state.riwayat = 'loading';
  if (stack[stack.length - 1] === 'akun') render();
  try { state.riwayat = await api('/api/akun/pesanan'); }
  catch (err) { state.riwayat = null; if (err.status !== 401) toast(err.message); return; }
  if (stack[stack.length - 1] === 'akun') render();
}

// ---------------------------------------------------------------- layar
const SCREENS = {
  // 1. BERANDA
  beranda: {
    view: () => `
      ${topbar('BoysClub IT', 'menu')}
      <div class="hero">
        <div class="hero-icon">${ICON.laptop}</div>
        <h2>Layanan IT</h2>
        <p class="sub">Instalasi, Optimasi,<br>&amp; Pemeliharaan</p>
        <button class="btn primary" data-act="mulai">Mulai Pesan</button>
      </div>
      ${bottomNav('beranda')}`,
  },

  // 2. PILIH LAYANAN
  layanan: {
    view: () => `
      ${topbar('Pilih Layanan')}
      <div class="content">
        <ul class="list">
          ${state.layanan.map((l) => `
            <li><label class="opt">
              <input type="checkbox" value="${l.id}" ${state.pilihan.has(l.id) ? 'checked' : ''}>
              <span class="box">${ICON.check}</span>
              <span class="svc-icon">${ICON[l.ikon] || ICON.laptop}</span>
              <span class="opt-text"><b>${esc(l.nama)}</b></span>
            </label></li>`).join('')}
        </ul>
      </div>
      ${actions('Lanjut', 'ke-paket', state.pilihan.size === 0)}`,
    mount() {
      $app.querySelectorAll('input[type=checkbox]').forEach((cb) => cb.addEventListener('change', () => {
        const id = Number(cb.value);
        cb.checked ? state.pilihan.add(id) : state.pilihan.delete(id);
        $app.querySelector('[data-act="ke-paket"]').disabled = state.pilihan.size === 0;
      }));
    },
  },

  // 3. PILIH PAKET
  paket: {
    view: () => `
      ${topbar('Pilih Paket')}
      <div class="content">
        <ul class="list">
          ${state.paket.map((p) => `
            <li><label class="opt">
              <input type="radio" name="paket" value="${p.id}" ${state.paketId === p.id ? 'checked' : ''}>
              <span class="radio"></span>
              <span class="opt-text">
                <b>${esc(p.nama)}</b>
                <span class="harga">${rupiah(p.harga)}${p.durasi_bulan === 1 ? ' / unit' : ''}${p.diskon_persen ? ` (${p.diskon_persen}% off)` : ''}</span>
              </span>
            </label></li>`).join('')}
        </ul>
      </div>
      ${actions('Lanjut', 'ke-jadwal', !state.paketId)}`,
    mount() {
      $app.querySelectorAll('input[name=paket]').forEach((r) => r.addEventListener('change', () => {
        state.paketId = Number(r.value);
        $app.querySelector('[data-act="ke-jadwal"]').disabled = false;
      }));
    },
  },

  // 4. PILIH JADWAL
  jadwal: {
    view() {
      const b = state.bulan, y = b.getFullYear(), m = b.getMonth();
      const offset = (new Date(y, m, 1).getDay() + 6) % 7; // minggu dimulai hari Senin
      const jmlHari = new Date(y, m + 1, 0).getDate();
      const hariIni = ymd(new Date());
      const bisaMundur = b > BULAN_INI;
      const batas = new Date(BULAN_INI); batas.setMonth(batas.getMonth() + MAKS_BULAN_KE_DEPAN);
      const bisaMaju = b < batas;

      let sel = '';
      for (let i = 0; i < offset; i++) sel += '<span class="kosong"></span>';
      for (let d = 1; d <= jmlHari; d++) {
        const t = `${y}-${pad(m + 1)}-${pad(d)}`;
        sel += `<button data-tgl="${t}" class="${t === state.tanggal ? 'dipilih' : ''} ${t === hariIni ? 'hari-ini' : ''}"
                 ${t < hariIni ? 'disabled' : ''} aria-label="${d} ${BULAN[m]} ${y}">${d}</button>`;
      }

      const j = state.jadwal;
      const jamSekarang = `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`;
      const opsiJam = !state.tanggal
        ? '<option value="">Pilih tanggal dulu</option>'
        : !j ? '<option value="">Memuat…</option>'
        : '<option value="">Pilih jam</option>' + j.jam.map((x) => {
            const penuh = j.terisi.includes(x);
            const lewat = state.tanggal === hariIni && x <= jamSekarang;
            const ket = penuh ? ' (penuh)' : lewat ? ' (lewat)' : '';
            return `<option value="${x}" ${penuh || lewat ? 'disabled' : ''} ${state.jam === x ? 'selected' : ''}>${jamTampil(x)}${ket}</option>`;
          }).join('');

      return `
        ${topbar('Jadwal Layanan')}
        <div class="content">
          <div class="cal-head">
            <button class="icon-btn" data-act="bulan-" aria-label="Bulan sebelumnya" ${bisaMundur ? '' : 'disabled'}>${ICON.chevL}</button>
            <h3>${BULAN[m]} ${y}</h3>
            <button class="icon-btn" data-act="bulan+" aria-label="Bulan berikutnya" ${bisaMaju ? '' : 'disabled'}>${ICON.chevR}</button>
          </div>
          <div class="cal">
            ${['S', 'S', 'R', 'K', 'J', 'S', 'M'].map((h, i) => `<span class="dow ${i === 6 ? 'minggu' : ''}">${h}</span>`).join('')}
            ${sel}
          </div>
          <div class="jam-row">
            ${ICON.clock}<label for="jam">Pukul</label>
            <select id="jam" ${state.tanggal && j ? '' : 'disabled'}>${opsiJam}</select>
          </div>
        </div>
        ${actions('Lanjut', 'ke-data', !(state.tanggal && state.jam))}`;
    },
    mount() {
      $app.querySelectorAll('[data-tgl]').forEach((btn) => btn.addEventListener('click', () => pilihTanggal(btn.dataset.tgl)));
      $app.querySelector('#jam').addEventListener('change', (e) => {
        const opt = e.target.selectedOptions[0];
        state.jam = opt && !opt.disabled && opt.value ? opt.value : null;
        render();
      });
    },
  },

  // 5. DATA PEMESAN (terisi otomatis jika pengguna sudah masuk)
  data: {
    view: () => {
      const f = state.form, e = state.errors;
      return `
        ${topbar('Data Pemesan')}
        <div class="content">
          <form class="form" novalidate>
            ${field(f, e, 'nama_lengkap', null, 'Nama Lengkap', 'text', 'autocomplete="name" maxlength="100"')}
            ${field(f, e, 'no_hp', null, 'No. HP / WhatsApp', 'tel', 'autocomplete="tel" inputmode="tel" maxlength="20"')}
            ${field(f, e, 'instansi', null, 'Instansi (opsional)', 'text', 'autocomplete="organization" maxlength="100"')}
            ${field(f, e, 'alamat', null, 'Alamat / Lokasi', 'text', 'autocomplete="street-address" maxlength="255"')}
          </form>
        </div>
        ${actions('Lanjut', 'ke-konfirmasi')}`;
    },
    mount() {
      const form = $app.querySelector('form');
      form.addEventListener('input', (e) => { state.form[e.target.name] = e.target.value; });
      form.addEventListener('submit', (e) => { e.preventDefault(); keKonfirmasi(); });
    },
  },

  // 6. KONFIRMASI PESANAN
  konfirmasi: {
    view: () => {
      const p = paketDipilih();
      const total = p.harga * state.unit;
      return `
        ${topbar('Konfirmasi Pesanan')}
        <div class="content">
          <dl class="summary">
            <dt>Layanan</dt><dd>${layananDipilih().map((l) => esc(l.nama)).join(' + ')}</dd>
            <dt>Paket</dt><dd>${esc(p.nama)}</dd>
            <dt>Jadwal</dt><dd>${tglTampil(state.tanggal)}<small>Pukul ${jamTampil(state.jam)}</small></dd>
            <dt>Lokasi</dt><dd>${esc(state.form.alamat.trim())}</dd>
            <hr>
            <dt>Total</dt><dd class="total">${rupiah(total)} / ${per(p.durasi_bulan)}</dd>
          </dl>
        </div>
        ${actions(state.sending ? 'Mengirim…' : 'Konfirmasi', 'kirim', state.sending)}`;
    },
  },

  // 7. SELESAI
  selesai: {
    view: () => `
      <div class="done">
        <div class="ok">${ICON.check}</div>
        <h2>Pesanan Berhasil!</h2>
        <p>Tim kami akan menghubungi Anda<br>untuk konfirmasi.</p>
        <button class="btn outline" data-act="beranda">Kembali ke Beranda</button>
      </div>`,
  },

  // Tab "Layanan" - katalog layanan & harga
  katalog: {
    view: () => `
      ${topbar('Layanan Kami', 'menu')}
      <div class="content">
        <ul class="list">
          ${state.layanan.map((l) => `
            <li class="opt" style="cursor:default">
              <span class="svc-icon">${ICON[l.ikon] || ICON.laptop}</span>
              <span class="opt-text"><b>${esc(l.nama)}</b><small>${esc(l.deskripsi)}</small></span>
            </li>`).join('')}
        </ul>
        <div class="section-label">Daftar Harga (per unit)</div>
        ${state.paket.map((p) => `
          <div class="card"><div class="card-row">
            <b>${esc(p.nama)}</b>
            <span>${rupiah(p.harga)}${p.diskon_persen ? `<span class="badge-off">${p.diskon_persen}% off</span>` : ''}</span>
          </div></div>`).join('')}
        <div style="margin:20px 0 8px"><button class="btn primary" data-act="mulai">Mulai Pesan</button></div>
      </div>
      ${bottomNav('katalog')}`,
  },

  // MASUK / DAFTAR (muncul saat menekan "Mulai Pesan" sebelum masuk)
  masuk: {
    view: () => `${topbar(state.auth.mode === 'daftar' ? 'Daftar' : 'Masuk')}${authPanel()}`,
    mount: mountAuth,
  },

  // LENGKAPI PROFIL (akun baru) / UBAH PROFIL
  profil: {
    view: () => {
      const P = state.profil, f = P.form, e = P.errors;
      return `
        ${topbar(P.daftar ? 'Lengkapi Data Akun' : 'Ubah Profil')}
        <div class="content">
          <div class="me">
            ${avatar(state.user)}
            <span><b>${esc(state.user.nama)}</b><small>${esc(state.user.email)}</small></span>
          </div>
          ${P.daftar ? '<p class="hint" style="margin:0 0 16px">Satu langkah lagi. Lengkapi data berikut agar tim kami dapat menghubungi Anda.</p>' : ''}
          <form class="form" novalidate>
            ${field(f, e, 'nama_lengkap', 'person', 'Nama Lengkap', 'text', 'autocomplete="name" maxlength="100"')}
            ${field(f, e, 'no_hp', 'phone', 'No. HP / WhatsApp', 'tel', 'autocomplete="tel" inputmode="tel" maxlength="20"')}
            ${field(f, e, 'instansi', 'building', 'Instansi (opsional)', 'text', 'autocomplete="organization" maxlength="100"')}
            ${field(f, e, 'alamat', 'pin', 'Alamat (opsional)', 'text', 'autocomplete="street-address" maxlength="255"')}
          </form>
        </div>
        ${actions(P.saving ? 'Menyimpan…' : P.daftar ? 'Selesaikan Pendaftaran' : 'Simpan', 'simpan-profil', P.saving)}`;
    },
    mount() {
      const form = $app.querySelector('form');
      form.addEventListener('input', (e) => { state.profil.form[e.target.name] = e.target.value; });
      form.addEventListener('submit', (e) => { e.preventDefault(); simpanProfil(); });
    },
  },

  // Tab "Akun" - belum masuk: tombol Google | sudah masuk: profil & riwayat
  akun: {
    view: () => {
      const u = state.user;
      if (!u) return `${topbar('Akun Saya', 'menu')}${authPanel()}${bottomNav('akun')}`;

      const r = state.riwayat;
      let riwayat = '';
      if (r === 'loading' || r === null) riwayat = '<p class="empty">Memuat…</p>';
      else if (r.length === 0) riwayat = '<p class="empty">Belum ada pesanan.</p>';
      else riwayat = r.map((p) => `
        <div class="card">
          <div class="card-row"><b>${esc(p.kode_pesanan)}</b><span class="status ${p.status}">${p.status}</span></div>
          <div class="meta">
            ${esc(p.layanan)}<br>
            ${esc(p.paket_nama)}${p.jumlah_unit > 1 ? ` · ${p.jumlah_unit} unit` : ''} · <b>${rupiah(p.total_harga)}</b><br>
            ${tglTampil(p.jadwal_tanggal)}, pukul ${jamTampil(p.jadwal_jam)} · ${esc(p.lokasi)}
            ${p.catatan_admin ? `<br><i>Catatan: ${esc(p.catatan_admin)}</i>` : ''}
          </div>
        </div>`).join('');

      const pr = u.profil;
      return `
        ${topbar('Akun Saya', 'menu')}
        <div class="content">
          <div class="profile-card">
            <div class="me">
              ${avatar(u)}
              <span><b>${esc(u.nama)}${u.admin ? ' <em class="badge-admin">Admin</em>' : ''}</b><small>${esc(u.email)}</small></span>
            </div>
            ${pr ? `
              <div class="meta">
                ${ICON.phone}<span>${esc(pr.no_hp)}</span>
                ${pr.instansi ? `${ICON.building}<span>${esc(pr.instansi)}</span>` : ''}
                ${pr.alamat ? `${ICON.pin}<span>${esc(pr.alamat)}</span>` : ''}
              </div>` : '<p class="warn">Data akun belum lengkap.</p>'}
            <div class="admin-btns">
              <button class="btn outline small" data-act="ubah-profil">${ICON.edit} ${pr ? 'Ubah Profil' : 'Lengkapi Data'}</button>
              <button class="btn outline small" data-act="keluar">${ICON.logout} Keluar</button>
            </div>
          </div>
          ${u.admin ? `<button class="btn primary" data-act="ke-admin" style="margin-top:12px">${ICON.chart} Buka Dashboard Admin</button>` : ''}
          <div class="section-label">Riwayat Pesanan</div>
          ${riwayat}
        </div>
        ${bottomNav('akun')}`;
    },
    mount: mountAuth,
  },
};

// --------------------------------------------------------------- aksi
// Sesuai Alur Navigasi wireframe: Mulai Pesan langsung ke Pilih Layanan (tanpa harus masuk)
function mulaiPesan() {
  resetPesanan();
  go('layanan');
}

async function pilihTanggal(t) {
  if (state.tanggal !== t) { state.tanggal = t; state.jam = null; }
  state.jadwal = null; render();
  try {
    const data = await api(`/api/jadwal?tanggal=${t}`);
    if (state.tanggal === t) { state.jadwal = data; render(); }
  } catch (err) { toast(err.message); }
}

function keKonfirmasi() {
  state.errors = validasiData(state.form, true);
  if (Object.keys(state.errors).length === 0) go('konfirmasi');
  else { render(); $app.querySelector('.field.err input')?.focus(); }
}

async function kirimPesanan() {
  if (state.sending) return;
  state.sending = true; render();
  try {
    state.hasil = await api('/api/pesanan', {
      method: 'POST',
      body: JSON.stringify({
        layanan_ids: [...state.pilihan], paket_id: state.paketId, jumlah_unit: state.unit,
        tanggal: state.tanggal, jam: state.jam, ...state.form,
      }),
    });
    state.sending = false;
    state.riwayat = null;
    if (state.user) api('/api/auth/me').then((u) => { if (u) state.user = u; }).catch(() => {}); // profil ikut diperbarui
    stack.length = 0; stack.push('selesai'); render();
  } catch (err) {
    state.sending = false;
    if (err.status === 401) return; // sudah ditangani sesiBerakhir()
    if (err.status === 409 && err.message.includes('jadwal')) { // slot keburu diambil orang lain
      toast(err.message);
      while (stack.length && stack[stack.length - 1] !== 'jadwal') stack.pop();
      pilihTanggal(state.tanggal);
    } else { render(); toast(err.message); }
  }
}

function bukaMenu() {
  const u = state.user;
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="drawer-bg" data-close></div>
    <nav class="drawer" aria-label="Menu">
      <div class="brand">BoysClub IT</div>
      ${u ? `<div class="me drawer-me">${avatar(u, 'sm')}<span><b>${esc(u.nama)}</b><small>${esc(u.email)}</small></span></div>` : ''}
      <button data-go="beranda">${ICON.home} Beranda</button>
      <button data-go="katalog">${ICON.grid} Layanan &amp; Harga</button>
      <button data-go="akun">${ICON.user} ${u ? 'Akun & Riwayat Pesanan' : 'Masuk / Daftar'}</button>
      ${u?.admin ? `<button data-go="admin">${ICON.chart} Dashboard Admin</button>` : ''}
      ${u ? `<button data-keluar>${ICON.logout} Keluar</button>` : ''}
    </nav>`;
  document.querySelector('.device').appendChild(wrap);
  wrap.addEventListener('click', (e) => {
    const g = e.target.closest('[data-go]');
    const k = e.target.closest('[data-keluar]');
    if (g) tab(g.dataset.go);
    if (k) keluar();
    if (g || k || e.target.hasAttribute('data-close')) wrap.remove();
  });
}

// ======================================================================
//  MODE ADMIN - dashboard pesanan (akun yang emailnya ada di ADMIN_EMAILS)
// ======================================================================
async function muatAdmin() {
  try {
    const [r, p] = await Promise.all([api('/api/admin/ringkasan'), api('/api/admin/pesanan')]);
    state.admin.ringkasan = r; state.admin.pesanan = p;
    if (stack[stack.length - 1] === 'admin') render();
  } catch (e) {
    if (e.status === 403) { state.user.admin = false; tab('akun'); }
    if (e.status !== 401) toast(e.message);
  }
}

const pesananAktif = () => state.admin.pesanan?.find((x) => x.id === state.admin.detailId);
function draftBerubah() {
  const p = pesananAktif(), d = state.admin.draft;
  return !!p && (d.status !== p.status || d.catatan.trim() !== (p.catatan_admin || ''));
}
function perbaruiTombolSimpan() {
  const b = $app.querySelector('[data-act="admin-simpan"]');
  if (b) b.disabled = !draftBerubah() || state.admin.saving;
}

async function simpanAdmin() {
  const A = state.admin;
  if (A.saving || !draftBerubah()) return;
  A.saving = true; render();
  try {
    const baru = await api(`/api/admin/pesanan/${A.detailId}`, {
      method: 'PATCH', body: JSON.stringify({ status: A.draft.status, catatan_admin: A.draft.catatan }),
    });
    A.pesanan = A.pesanan.map((p) => (p.id === baru.id ? baru : p));
    A.saving = false;
    toast('Pesanan diperbarui.');
    back();
    muatAdmin(); // segarkan angka ringkasan
  } catch (e) {
    A.saving = false;
    if (e.status !== 401) { render(); toast(e.message); }
  }
}

Object.assign(SCREENS, {
  // Tab "Admin" - ringkasan & daftar pesanan
  admin: {
    view() {
      const A = state.admin, r = A.ringkasan, list = A.pesanan;
      const head = topbar('Dashboard Admin', 'back',
        `<button class="icon-btn" data-act="admin-refresh" aria-label="Muat ulang">${ICON.refresh}</button>`);
      if (!r || !list) return `${head}<div class="content"><p class="empty">Memuat…</p></div>`;

      const s = r.per_status;
      const tampil = A.filter ? list.filter((p) => p.status === A.filter) : list;
      return `
        ${head}
        <div class="content">
          <div class="stats">
            <div class="stat"><span>Menunggu</span><b>${s.menunggu}</b></div>
            <div class="stat"><span>Berjalan</span><b>${s.dikonfirmasi + s.diproses}</b></div>
            <div class="stat"><span>Selesai</span><b>${s.selesai}</b></div>
            <div class="stat"><span>Akun terdaftar</span><b>${r.akun}</b></div>
            <div class="stat wide"><span>Pendapatan (dikonfirmasi s.d. selesai)</span><b>${rupiah(r.pendapatan)}</b></div>
          </div>
          <div class="filters">
            ${['', ...STATUS].map((st) => `
              <button data-act="admin-filter" data-status="${st}" class="${A.filter === st ? 'aktif' : ''}">
                ${st || 'Semua'} <span>${st ? s[st] : list.length}</span>
              </button>`).join('')}
          </div>
          ${tampil.length === 0 ? '<p class="empty">Tidak ada pesanan.</p>' : tampil.map((p) => `
            <button class="card order-item" data-act="admin-open" data-id="${p.id}">
              <div class="card-row"><b>${esc(p.kode_pesanan)}</b><span class="status ${p.status}">${p.status}</span></div>
              <div class="meta">
                <b>${esc(p.nama_lengkap)}</b> · ${esc(p.layanan)}<br>
                ${tglTampil(p.jadwal_tanggal)}, ${jamTampil(p.jadwal_jam)} · ${rupiah(p.total_harga)}
              </div>
            </button>`).join('')}
        </div>`;
    },
  },

  // Detail satu pesanan: info lengkap, WhatsApp, ubah status & catatan
  adminDetail: {
    view() {
      const A = state.admin, p = pesananAktif();
      if (!p) return `${topbar('Detail Pesanan')}<div class="content"><p class="empty">Pesanan tidak ditemukan.</p></div>`;
      const pesanWa = `Halo ${p.nama_lengkap}, kami dari BoysClub IT ingin mengonfirmasi pesanan ${p.kode_pesanan} `
        + `(${p.layanan}) pada ${tglTampil(p.jadwal_tanggal)} pukul ${jamTampil(p.jadwal_jam)} di ${p.lokasi}.`;
      return `
        ${topbar('Detail Pesanan')}
        <div class="content">
          <div class="card-row" style="margin-bottom:18px">
            <b style="font-size:18px">${esc(p.kode_pesanan)}</b><span class="status ${p.status}">${p.status}</span>
          </div>
          <dl class="summary">
            <dt>Pelanggan</dt><dd>${esc(p.nama_lengkap)}${p.instansi ? `<small>${esc(p.instansi)}</small>` : ''}</dd>
            <dt>No. HP</dt><dd>${esc(p.no_hp)}</dd>
            <dt>Layanan</dt><dd>${esc(p.layanan)}</dd>
            <dt>Paket</dt><dd>${esc(p.paket_nama)}${p.jumlah_unit > 1 ? ` × ${p.jumlah_unit} unit` : ''}</dd>
            <dt>Jadwal</dt><dd>${tglTampil(p.jadwal_tanggal)}<small>Pukul ${jamTampil(p.jadwal_jam)}</small></dd>
            <dt>Lokasi</dt><dd>${esc(p.lokasi)}</dd>
            <dt>Dipesan</dt><dd>${esc(p.dibuat_pada)}</dd>
            <hr>
            <dt>Total</dt><dd class="total">${rupiah(p.total_harga)} / ${per(p.durasi_bulan)}</dd>
          </dl>
          <a class="btn wa" href="${waLink(p.no_hp, pesanWa)}" target="_blank" rel="noopener">${ICON.wa} Hubungi via WhatsApp</a>
          <div class="section-label">Ubah Status</div>
          <div class="status-pick">
            ${STATUS.map((st) => `<button data-act="admin-status" data-status="${st}" class="${A.draft.status === st ? 'aktif' : ''}">${st}</button>`).join('')}
          </div>
          <div class="section-label">Catatan Admin</div>
          <textarea class="note" id="catatan" rows="3" maxlength="500" placeholder="mis. teknisi yang bertugas, perangkat yang perlu dibawa">${esc(A.draft.catatan)}</textarea>
        </div>
        ${actions(A.saving ? 'Menyimpan…' : 'Simpan Perubahan', 'admin-simpan', !draftBerubah() || A.saving)}`;
    },
    mount() {
      $app.querySelector('#catatan')?.addEventListener('input', (e) => {
        state.admin.draft.catatan = e.target.value;
        perbaruiTombolSimpan();
      });
    },
  },
});

// Satu event listener untuk semua tombol (event delegation)
$app.addEventListener('click', (e) => {
  const t = e.target.closest('[data-act], [data-tab]');
  if (!t || t.disabled) return;
  if (t.dataset.tab) return tab(t.dataset.tab);
  switch (t.dataset.act) {
    case 'back': return back();
    case 'menu': return bukaMenu();
    case 'mulai': return mulaiPesan();
    case 'ke-paket': return state.pilihan.size ? go('paket') : toast('Pilih minimal satu layanan.');
    case 'unit-': state.unit = Math.max(1, state.unit - 1); return render();
    case 'unit+': state.unit = Math.min(100, state.unit + 1); return render();
    case 'ke-jadwal': return go('jadwal');
    case 'bulan-': state.bulan.setMonth(state.bulan.getMonth() - 1); return render();
    case 'bulan+': state.bulan.setMonth(state.bulan.getMonth() + 1); return render();
    case 'ke-data': return go('data');
    case 'ke-konfirmasi': return keKonfirmasi();
    case 'kirim': return kirimPesanan();
    case 'beranda': resetPesanan(); return tab('beranda');
    // --- akun
    case 'auth-mode':
      if (state.auth.mode !== t.dataset.mode) { state.auth.mode = t.dataset.mode; state.auth.errors = {}; render(); }
      return;
    case 'ubah-profil': return bukaProfil(!state.user.profil);
    case 'simpan-profil': return simpanProfil();
    case 'keluar': return keluar();
    // --- admin
    case 'ke-admin': return bukaAdmin();
    case 'admin-refresh': state.admin.pesanan = null; render(); return muatAdmin();
    case 'admin-filter': state.admin.filter = t.dataset.status; return render();
    case 'admin-open': {
      const p = state.admin.pesanan.find((x) => x.id === Number(t.dataset.id));
      state.admin.detailId = p.id;
      state.admin.draft = { status: p.status, catatan: p.catatan_admin || '' };
      return go('adminDetail');
    }
    case 'admin-status': // ubah di tempat tanpa render ulang agar posisi scroll tidak lompat
      state.admin.draft.status = t.dataset.status;
      $app.querySelectorAll('[data-act="admin-status"]').forEach((b) => b.classList.toggle('aktif', b === t));
      return perbaruiTombolSimpan();
    case 'admin-simpan': return simpanAdmin();
  }
});

// ---------------------------------------------------------------- start
(async function init() {
  $app.innerHTML = '<div class="loading">Memuat…</div>';
  try {
    [state.config, state.layanan, state.paket, state.user] = await Promise.all([
      api('/api/config'), api('/api/layanan'), api('/api/paket'), api('/api/auth/me'),
    ]);
    resetPesanan();
    if (location.hash === '#admin') {
      if (state.user?.admin) bukaAdmin();
      else if (state.user) { tab('akun'); toast('Akun ini tidak memiliki akses admin.'); }
      else { stack.push('beranda'); mintaMasuk('admin'); }
    } else tab('beranda');
  } catch {
    const lewatFile = location.protocol === 'file:';
    $app.innerHTML = `
      <div class="done">
        <h2>Aplikasi belum terhubung</h2>
        <p>${lewatFile
          ? 'File ini dibuka langsung dari folder, sehingga tidak bisa terhubung ke server.'
          : 'Server aplikasi tidak berjalan atau sudah ditutup.'}</p>
        <p style="font-size:14px">Klik dua kali <b>Jalankan Aplikasi.bat</b> di folder proyek, biarkan jendelanya tetap terbuka,
        lalu buka <b>http://localhost:3000</b>.</p>
        ${lewatFile ? '' : '<button class="btn primary" onclick="location.reload()">Coba Lagi</button>'}
      </div>`;
  }
})();
