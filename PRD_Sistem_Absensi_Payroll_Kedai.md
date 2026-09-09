# PRD — Sistem Absensi & Payroll Karyawan Kedai

**Versi:** 1.0 (Draft)
**Tanggal:** 9 September 2026
**Pemilik Produk:** Owner Kedai (Taichan & Chicken KA)

---

## 1. Ringkasan Eksekutif

Web app internal untuk mengelola karyawan kedai secara end-to-end: data karyawan, absensi berbasis lokasi (GPS), dan perhitungan gaji otomatis (gaji pokok + bonus − potongan). Sistem memisahkan akses menjadi dua peran — **Owner** (kontrol penuh) dan **Karyawan** (akses terbatas untuk absen & melihat data pribadi) — sehingga owner bisa merekap absensi dan gaji tanpa hitung manual tiap akhir bulan.

## 2. Latar Belakang & Tujuan

Saat ini pencatatan absensi dan perhitungan gaji dilakukan manual, rawan human error, sulit direkap, dan tidak transparan bagi karyawan. Sistem ini bertujuan untuk:

- Mendigitalkan absensi dengan validasi lokasi (GPS), bukan sekadar tombol tanpa kontrol.
- Mengotomatisasi perhitungan gaji termasuk potongan telat & off, serta bonus.
- Memberi transparansi ke karyawan atas riwayat absensi dan rincian gajinya sendiri.
- Mempercepat proses rekap bulanan untuk owner (absensi & payroll dalam satu tempat).

## 3. Target Pengguna & Peran

| Peran | Deskripsi | Akses |
|---|---|---|
| **Owner** | Pemilik kedai, pengelola penuh sistem | Kelola karyawan, absensi, gaji, pengaturan, laporan/rekap |
| **Karyawan** | Staf operasional kedai | Check-in/out, lihat riwayat absensi & slip gaji pribadi |

*Skala saat ini: 2 karyawan aktif — di tahap MVP, tampilan/manajemen data karyawan tidak perlu dirancang untuk skala besar.*

## 4. Ruang Lingkup

**In-scope (MVP):**
- Web app responsive (utamanya dioptimalkan untuk diakses dari HP)
- Modul: Autentikasi, Manajemen Karyawan, Absensi (GPS), Payroll, Rekap & Laporan, Pengaturan

**Out-of-scope (kandidat fase berikutnya):**
- Aplikasi native Android/iOS
- Integrasi pembayaran otomatis (transfer gaji langsung dari sistem)
- Multi-shift / jadwal kerja fleksibel (saat ini 1 shift tetap untuk semua)
- Modul izin/cuti dengan approval — *lihat poin terbuka di Bagian 11*

## 5. Kebutuhan Fungsional

### 5.1 Autentikasi & Hak Akses
- Login via email/username + password.
- Role-based access control: `owner`, `karyawan`.
- Akun karyawan dibuat oleh owner (tidak ada self-registration publik).

### 5.2 Manajemen Karyawan *(Owner only)*
- CRUD data karyawan: nama, no. HP, alamat, tanggal mulai kerja, jabatan/posisi, status aktif/nonaktif.
- Set gaji pokok per karyawan (bisa berbeda tiap orang).
- Nonaktifkan (bukan hapus) karyawan yang resign — riwayat data tetap tersimpan untuk histori.

### 5.3 Absensi — GPS Geofencing
- Karyawan check-in & check-out lewat tombol di app; sistem merekam koordinat GPS saat itu.
- Sistem membandingkan lokasi karyawan dengan titik koordinat kedai; radius toleransi lokasi **10 meter** (lihat catatan teknis di Bagian 7).
- Toleransi waktu keterlambatan: **5 menit** dari jam masuk — check-in dalam 5 menit pertama masih dihitung **Hadir**.
- Jam kerja standar: **07:00 – 18:00**, dapat diubah owner kapan saja lewat Pengaturan.
- Status absensi dihitung otomatis per hari:
  - **Hadir** — check-in dalam batas toleransi 5 menit
  - **Telat** — check-in lewat dari 5 menit setelah jam masuk (skema potongan bertingkat, lihat Bagian 6)
  - **Libur Mingguan** — hari libur terjadwal karyawan, tidak dihitung sebagai absen
  - **Off/Alpa** — tidak check-in pada hari kerja yang bukan hari liburnya
- Karyawan dapat melihat riwayat absensi pribadi (tampilan kalender atau list).

#### Hari Libur Mingguan
- Setiap karyawan punya 1 hari libur tetap per minggu, **dipilih sendiri oleh karyawan** (default: Minggu).
- Tidak masuk kerja pada hari liburnya sendiri → tidak kena potongan (ini haknya).
- Tidak masuk kerja pada hari kerja biasa (bukan hari liburnya) → kena potongan Rp50.000 (dianggap off tak terjadwal).
- Tetap masuk kerja pada hari liburnya sendiri → mendapat bonus Rp50.000 untuk hari itu.

### 5.4 Payroll / Gaji
- Formula dasar: **Total Gaji = Gaji Pokok + Total Bonus − Total Potongan**
- Potongan otomatis berdasarkan data absensi:
  - Potongan **Telat** — nominal/metode mengikuti pengaturan (lihat Bagian 6)
  - Potongan **Off/Absen tanpa keterangan** — Rp50.000/hari (default, dapat diubah owner)
- Bonus: input manual oleh owner per karyawan per periode (nominal + keterangan, misal bonus kinerja/THR).
- Owner dapat melakukan adjustment manual sebelum payroll difinalisasi (untuk kasus khusus).
- Sistem generate rincian slip gaji per karyawan per periode (bulanan).
- Status pembayaran dicatat per karyawan per periode: **Belum Dibayar / Sudah Dibayar**, beserta tanggal dibayar.

### 5.5 Rekap & Laporan *(Owner only)*
- Rekap absensi bulanan — per karyawan dan keseluruhan (jumlah hadir, telat, off).
- Rekap gaji bulanan — total payroll kedai + breakdown per karyawan.
- Filter berdasarkan periode (bulan/tahun) dan/atau karyawan tertentu.
- Export ke Excel dan/atau PDF.

### 5.6 Pengaturan *(Owner only)*
- Titik koordinat kedai & radius geofencing (default: **10 meter**).
- Jam kerja standar (default **07:00–18:00**), dapat diubah owner kapan saja.
- Toleransi telat (default: **5 menit**).
- Skema potongan telat bertingkat — nominal per tier dapat diubah owner (lihat Bagian 6).
- Nominal potongan off tak terjadwal (default **Rp50.000**, dapat diubah).
- Nominal bonus masuk di hari libur mingguan (default **Rp50.000**, dapat diubah).
- Hari libur mingguan default (default: **Minggu**), karyawan dapat memilih hari lain.

## 6. Aturan Bisnis (Business Rules)

### Potongan Keterlambatan (Bertingkat)

| Durasi telat (dihitung setelah toleransi 5 menit) | Potongan |
|---|---|
| 0–5 menit dari jam masuk | Tidak ada potongan (toleransi) |
| 10 menit pertama setelah toleransi | Rp1.000 / menit |
| 10 menit berikutnya setelah itu | Rp2.000 / menit |
| Lebih dari itu (>20 menit setelah toleransi) | Flat Rp50.000 untuk hari itu |

**Contoh perhitungan:**
- Telat 8 menit → 5 menit gratis + 3 menit × Rp1.000 = **Rp3.000**
- Telat 20 menit → 5 menit gratis + 10 menit × Rp1.000 (Rp10.000) + 5 menit × Rp2.000 (Rp10.000) = **Rp20.000**
- Telat 35 menit → melewati tier kedua → flat **Rp50.000**

*(Catatan: ini interpretasi saya atas aturan yang kamu sebutkan — 10 menit pertama & 10 menit kedua dihitung setelah toleransi 5 menit habis. Kalau maksudnya dihitung langsung dari jam masuk tanpa memisah toleransi, tinggal kabari, tinggal sesuaikan angkanya.)*

### Hari Libur Mingguan

| Kondisi | Konsekuensi |
|---|---|
| Tidak masuk pada hari libur mingguan sendiri | Tidak ada potongan |
| Tidak masuk pada hari kerja biasa (off tak terjadwal) | Potongan Rp50.000/hari |
| Tetap masuk kerja pada hari libur mingguan sendiri | Bonus Rp50.000/hari |

### Bonus Lain
Di luar bonus hari libur di atas, bonus tambahan diinput manual oleh owner (nominal + keterangan) per periode payroll.

## 7. Kebutuhan Non-Fungsional

- **Platform:** Web app, mobile-responsive (karyawan mayoritas akses dari HP).
- **Keamanan:** Password ter-enkripsi, koneksi HTTPS, akses dibatasi sesuai role (RBAC).
- **Ketersediaan data:** Data absensi & payroll disimpan minimal 1 tahun untuk audit/histori.
- **Performa:** Proses check-in/out selesai dalam hitungan detik, tidak ada lag berarti.
- **Akurasi lokasi:** Sistem perlu menangani GPS yang kurang akurat (indoor) — beri toleransi radius yang wajar agar tidak menyulitkan karyawan absen sah.
- **Catatan risiko radius 10 meter:** akurasi GPS smartphone standar biasanya 5–15 meter di area terbuka, dan bisa lebih buruk di dalam ruangan/tertutup atap. Radius 10 meter cukup ketat — ada kemungkinan absen tertolak meski karyawan sudah di lokasi kedai. Disarankan uji coba langsung di lokasi sebelum go-live, dan sediakan opsi override manual oleh owner untuk kasus false-reject.

## 8. Alur Pengguna (High-level)

**Karyawan — Absen Harian:**
Buka app → tombol Check-in → sistem ambil lokasi GPS → validasi radius → status tercatat (Hadir/Telat) → di akhir shift, tombol Check-out.

**Owner — Tutup Buku Bulanan:**
Buka modul Payroll → pilih periode → sistem tampilkan kalkulasi otomatis (gaji pokok − potongan + bonus) per karyawan → owner review/adjust bila perlu → finalisasi → export rekap.

## 9. Model Data (High-level)

- **Users** — id, nama, email, password_hash, role, status
- **Employees** — id, user_id, no_hp, alamat, tanggal_mulai, jabatan, gaji_pokok, hari_libur (default: Minggu), status_aktif
- **Attendance** — id, employee_id, tanggal, jam_checkin, jam_checkout, lokasi(lat,long), status (hadir/telat/libur_mingguan/off)
- **Payroll** — id, employee_id, periode, gaji_pokok, total_potongan, total_bonus, total_gaji, status (draft/final), status_pembayaran (belum/sudah), tanggal_dibayar
- **Bonus** — id, employee_id, periode, nominal, keterangan
- **Settings** — lokasi_kedai, radius_geofence, jam_masuk, jam_pulang, toleransi_telat_menit, nominal_potongan_off, aturan_potongan_telat

## 10. Tech Stack

**Dikonfirmasi: Next.js (hosting di Vercel) + Supabase** (Postgres, Auth bawaan, Row Level Security untuk pisahkan akses owner/karyawan). Cocok untuk dikembangkan dengan alur vibe coding + Antigravity seperti proyek-proyek sebelumnya.

Catatan plan/billing (lihat pembahasan lebih lengkap di chat):
- **Supabase Free tier** cukup untuk skala 2 karyawan — commercial use diizinkan di free tier.
- **Vercel Hobby (gratis)** secara resmi hanya untuk penggunaan personal/non-komersial; untuk tool operasional bisnis, opsi yang sesuai ketentuan adalah **Vercel Pro (~$20/bulan)**.

## 11. Ringkasan Keputusan yang Sudah Dikonfirmasi

| Item | Keputusan |
|---|---|
| Toleransi telat | 5 menit |
| Skema potongan telat | Bertingkat — lihat Bagian 6 |
| Jam kerja | 07:00–18:00 (dapat diubah owner kapan saja) |
| Radius geofencing | 10 meter |
| Bonus | Input manual owner + bonus otomatis Rp50.000 untuk masuk di hari libur mingguan |
| Hari libur mingguan | Dipilih karyawan sendiri, default Minggu |
| Modul izin/cuti dengan approval | Tidak diperlukan untuk MVP |
| Skala karyawan saat ini | 2 orang |
| Status pembayaran gaji | Perlu dicatat di sistem (Belum/Sudah Dibayar) |
| Notifikasi (WhatsApp/push) | Tidak diperlukan — di luar scope |

Satu hal yang masih berupa interpretasi saya (bukan pertanyaan baru, cuma perlu dikonfirmasi): perhitungan tier "10 menit pertama/kedua" pada potongan telat saya asumsikan dihitung **setelah** toleransi 5 menit habis — lihat catatan di Bagian 6.

## 12. Metrik Keberhasilan

- Waktu rekap payroll bulanan turun signifikan dibanding proses manual.
- Selisih/dispute data absensi berkurang karena tercatat otomatis by system, bukan manual.
- 100% karyawan aktif menggunakan app untuk absensi harian dalam bulan pertama peluncuran.

## 13. Roadmap Pengembangan

| Fase | Cakupan |
|---|---|
| **Fase 1 (MVP)** | Auth, Manajemen Karyawan, Absensi GPS (dengan hari libur mingguan), Payroll (potongan telat bertingkat + off + bonus hari libur), status pembayaran gaji, rekap sederhana |
| **Fase 2** | Export laporan (Excel/PDF), modul bonus manual lebih detail |
| **Fase 3** | Modul izin/cuti dengan approval, dukungan multi-shift |

---
*Dokumen ini adalah draft awal. Bagian 11 (Asumsi & Pertanyaan Terbuka) perlu dikonfirmasi terlebih dahulu agar spesifikasi fitur payroll & absensi bisa difinalisasi.*
