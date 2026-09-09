# Design System Reference — Absensi & Payroll Kedai

**Sumber referensi:** Screenshot UI aplikasi "AI Interior Design" (3 layar: Home, Design Flow, Discovery)
**Target:** Diterapkan ke aplikasi Absensi & Payroll Kedai (Owner + Karyawan)
**Catatan:** Yang diambil dari referensi adalah *bahasa visualnya* (warna, tipografi, bentuk komponen) — bukan fitur/kontennya. Konten & layar di dokumen ini sudah disesuaikan ke konteks absensi/payroll.

---

## 1. Mood & Prinsip

Estetika referensi: **konsumer app yang hangat, lembut, dan premium** — bukan dashboard korporat yang dingin, bukan juga neubrutalism yang tegas. Ciri utamanya:

- Background hangat off-white/greige (bukan putih polos, bukan gelap)
- Kartu putih dengan sudut sangat membulat, shadow lembut
- Satu warna aksen oranye yang dipakai konsisten untuk semua elemen "aktif" (tombol utama, progress bar, badge terpilih)
- Tipografi tebal, membulat, ramah — headline besar tapi tidak berteriak
- Navigasi bawah melayang (floating pill) dengan satu tombol utama yang menonjol di tengah
- Banyak whitespace, tidak padat

Prinsip saat diterapkan ke absensi/payroll: **data (kehadiran, gaji, potongan) ditampilkan seperti "progress" yang enak dilihat**, bukan tabel kaku — meniru cara referensi menampilkan progress renovasi ruangan.

## 2. Warna

| Token | Hex (estimasi) | Pemakaian |
|---|---|---|
| `background` | `#F0EDE7` | Latar belakang layar |
| `surface` | `#FFFFFF` | Kartu, nav bar |
| `surface-muted` | `#F5F2EC` | Input field, area sekunder |
| `accent` | `#F97316` | Tombol utama, progress fill, harga/nominal penting, badge aktif |
| `accent-soft` | `#FDE8D2` | Background badge/tint (mis. badge persentase) |
| `ink` | `#171717` | Judul, teks utama |
| `ink-muted` | `#8B8B93` | Subteks, caption, label sekunder |
| `border` | `#E8E4DB` | Garis tipis, outline tombol sekunder |
| `selected-dark` | `#171717` | Pill filter terpilih (bg hitam, teks putih) |

> Ini estimasi visual dari gambar, bukan color-pick presisi. Kalau butuh exact match, ambil sample warna langsung dari file referensi sebelum difinalkan ke Tailwind config.

## 3. Tipografi

- **Font:** `Plus Jakarta Sans` (tersedia di Google Fonts, mudah dipasang via `next/font/google`). Alternatif yang lebih dekat ke referensi: `General Sans` (Fontshare, gratis) — pakai ini kalau ingin rounded-nya lebih terasa.
- Satu family untuk semua teks (heading & body), dibedakan lewat weight, bukan font berbeda.

| Role | Size / Line-height | Weight |
|---|---|---|
| Display (headline sapaan) | 28px / 1.15 | 700 |
| H2 (judul layar/section) | 20px / 1.2 | 700 |
| Label section | 15px / 1.3 | 600 |
| Body | 14px / 1.4 | 400–500 |
| Caption / meta | 12px / 1.3 | 400, warna `ink-muted` |
| Nominal / angka penting | 16–18px | 700, warna `accent` atau `ink` |

## 4. Spacing, Radius, Shadow

- Base spacing unit: 4px. Gap umum antar elemen: 12 / 16 / 20 / 24px. Padding horizontal layar: 20–24px.
- Radius:
  - Kartu besar & gambar: `24px`
  - Tombol/pill/badge: fully rounded (`9999px`)
  - Input/textarea: `20px`
- Shadow lembut, jangan tajam:
  - Kartu: `0 8px 24px rgba(20,20,20,0.06)`
  - Nav bar melayang: `0 12px 30px rgba(20,20,20,0.10)`

## 5. Komponen UI

**Tombol Primer (pill)** — bg `accent`, teks putih bold, fully rounded, padding ±14px/24px, ikon opsional di kiri.

**Tombol Sekunder (pill outline)** — bg putih, border 1px `border`, teks `ink`, bentuk sama dengan primer.

**Kartu Progress/Stat** — bg putih, radius 24px, padding 16–20px. Struktur: judul + badge kecil (bg `accent-soft`) di kanan → progress bar tipis (track abu muda, fill `accent`, rounded-full) → baris meta di bawah (label kiri, nominal kanan, nominal pakai warna `accent`/bold).

**Kartu Gambar/Featured** — gambar radius 24px dengan badge overlay (tag pill kecil pojok kiri-atas, ikon bulat putih semi-transparan pojok kanan-atas), di bawah gambar: judul bold + nominal bold di kanan, subjudul abu-abu di bawahnya.

**List item card** — thumbnail kecil radius 16px + judul/subjudul + nominal di kanan, spacing lega tanpa garis pembatas tebal.

**Bottom Navigation** — pill melayang (bg putih, fully rounded, shadow nav), fixed di bawah dengan margin dari tepi layar. 4–5 ikon sejajar, item tengah lebih besar & terisi warna `accent` sebagai aksi utama.

**Search bar** — pill rounded-full, ikon kaca pembesar kiri, ikon filter kanan, bg `surface-muted`.

**Filter pills (kategori)** — baris scroll horizontal, terpilih = bg `selected-dark` teks putih, tidak terpilih = bg putih/outline teks `ink`.

**Badge/status pill** — kecil, fully rounded, bg tint sesuai status (mis. hijau muda untuk "Hadir", oranye muda untuk "Telat", abu untuk "Libur").

## 6. Ikonografi

Ikon garis (line icon), stroke 1.5–2px, ujung membulat, minim detail, ukuran ±20–24px. Cocok pakai library **Lucide** (`lucide-react`) — gaya garisnya sudah sangat dekat dengan referensi.

## 7. Penerapan ke Layar Aplikasi

### Dashboard Karyawan
- Header: foto profil bulat + "Selamat Pagi, [Nama]" + ikon lonceng notifikasi
- Dua tombol pill sejajar: **"Absen Masuk"** (primer, oranye) & **"Riwayat Saya"** (sekunder, outline)
- Kartu progress: **"Kehadiran Bulan Ini"** — badge persentase kehadiran di kanan judul, progress bar oranye, baris bawah "Gaji Berjalan: Rp X / Estimasi Rp Y"
- Section "Riwayat Terbaru" — deret kartu kecil bulat per hari (warna badge beda per status: hadir/telat/libur)
- Bottom nav: Beranda · Riwayat · **[Absen]** (tengah, oranye, menonjol) · Slip Gaji · Profil

### Dashboard Owner
- Header sama (foto + sapaan + notifikasi)
- Baris kartu stat kecil: Total Karyawan, Hadir Hari Ini, Telat Hari Ini
- Kartu progress: **"Ringkasan Kehadiran Bulan Ini"** — mirip pola "Active Project", tapi datanya agregat semua karyawan
- Bottom nav: Beranda · Karyawan · **[Rekap]** (tengah, oranye) · Payroll · Pengaturan

### Layar Absensi (adaptasi dari layar "Design Your Dream")
- Header: tombol back + judul "Absen Sekarang" + subjudul jam & tanggal
- Dua kartu besar sejajar (pola sama seperti referensi): **"Absen Masuk"** dan **"Absen Pulang"**, masing-masing dengan ikon di kotak rounded dan panah kecil pojok kanan-atas
- Di bawahnya, preview lokasi (peta kecil rounded-24) menggantikan bagian "Choose a Style/Color" — status radius (dalam/luar jangkauan) ditampilkan sebagai badge

### Layar Riwayat & Rekap (adaptasi dari layar "Find Your Inspiration")
- Search bar + filter pills: Semua / Hadir / Telat / Libur (untuk karyawan), atau filter per-karyawan (untuk owner)
- Kartu featured: **"Rekap Bulan Ini"** — total hari kerja, total potongan, total bonus, ditampilkan seperti kartu "Contemporary Luxury" (judul + nominal besar di kanan)
- List di bawahnya: entri harian/bulanan bergaya "Popular designs" — thumbnail kalender kecil, tanggal sebagai judul, status sebagai subjudul, nominal potongan/bonus di kanan (gantikan harga $)

## 8. Referensi Tailwind Config

```js
// tailwind.config.js — extend
theme: {
  extend: {
    colors: {
      background: '#F0EDE7',
      surface: '#FFFFFF',
      'surface-muted': '#F5F2EC',
      accent: {
        DEFAULT: '#F97316',
        soft: '#FDE8D2',
      },
      ink: {
        DEFAULT: '#171717',
        muted: '#8B8B93',
      },
      border: '#E8E4DB',
    },
    borderRadius: {
      card: '24px',
      input: '20px',
    },
    boxShadow: {
      soft: '0 8px 24px rgba(20,20,20,0.06)',
      nav: '0 12px 30px rgba(20,20,20,0.10)',
    },
    fontFamily: {
      sans: ['"Plus Jakarta Sans"', 'sans-serif'],
    },
  },
}
```

---

## 9. Prompt Siap Pakai untuk Antigravity

```
Bangun UI aplikasi absensi & payroll kedai dengan bahasa visual berikut:

- Background hangat off-white (#F0EDE7), bukan putih polos.
- Kartu putih (#FFFFFF) dengan radius sangat membulat (24px) dan shadow lembut
  (0 8px 24px rgba(20,20,20,0.06)) — jangan pakai shadow tajam/hitam pekat.
- Satu warna aksen oranye (#F97316) dipakai konsisten untuk: tombol utama,
  progress bar, nominal/angka penting, dan badge status aktif.
- Tombol & pill selalu fully rounded (pill shape), bukan rounded-rectangle biasa.
- Tipografi: Plus Jakarta Sans, headline besar bold (28px), section label
  semi-bold (15px), body 14px, caption abu-abu (#8B8B93) 12px.
- Progress card pattern: judul + badge persentase kecil di kanan → progress bar
  tipis oranye → baris nominal di bawah (label kiri, angka Rupiah kanan, bold oranye).
- Bottom navigation: pill melayang di bawah layar, bg putih, shadow, dengan
  SATU tombol aksi utama di tengah yang lebih besar dan berwarna oranye penuh
  (mis. tombol "Absen").
- Ikon: line icon minimalis (pakai lucide-react), stroke tipis, tanpa fill.
- Spacing lega, padding horizontal layar 20-24px, jangan padat.
- Hindari gaya flat/corporate-dashboard biasa — targetnya terasa seperti
  consumer app premium (gaya aplikasi lifestyle/travel), bukan software HR kaku.

Stack: Next.js + Tailwind CSS, komponen React, gunakan tailwind.config di atas
sebagai token warna/radius/shadow resmi.

Layar yang perlu dibangun mengikuti pattern ini: Dashboard Karyawan, Dashboard
Owner, layar Absensi (2 kartu besar: Absen Masuk/Absen Pulang), dan layar
Riwayat & Rekap (search + filter pills + kartu featured rekap + list riwayat).
```
