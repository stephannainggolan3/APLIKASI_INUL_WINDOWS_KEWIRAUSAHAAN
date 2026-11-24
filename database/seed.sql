-- Data awal (dijalankan otomatis sekali saat database masih kosong)

INSERT INTO layanan (kode, nama, deskripsi, ikon) VALUES
    ('WIN', 'Instalasi Windows',  'Instal ulang Windows 10/11 lengkap dengan driver & aplikasi dasar', 'windows'),
    ('LNX', 'Instalasi Linux',    'Ubuntu, Linux Mint, atau distro lain sesuai kebutuhan',           'linux'),
    ('OFC', 'Optimasi Office',    'Instalasi & optimasi Microsoft Office',                             'office'),
    ('MTC', 'Pemeliharaan Rutin', 'Pembersihan, update sistem, & cek kesehatan perangkat',            'wrench');

INSERT INTO paket (nama, durasi_bulan, harga, diskon_persen) VALUES
    ('Bulanan', 1,  50000,  0),
    ('3 Bulan', 3, 135000, 10),
    ('6 Bulan', 6, 240000, 20);
