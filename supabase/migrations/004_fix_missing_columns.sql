-- ==============================================================================
-- MIGRASI FIX: KOLOM-KOLOM YANG HILANG DARI SCHEMA AWAL
-- ==============================================================================

-- 1. Tabel attendance: tambah kolom foto check-in dan akurasi GPS
ALTER TABLE public.attendance
ADD COLUMN IF NOT EXISTS foto_checkin TEXT,
ADD COLUMN IF NOT EXISTS accuracy_meter DOUBLE PRECISION;

-- 2. Tabel payroll: tambah kolom potongan kasbon
ALTER TABLE public.payroll
ADD COLUMN IF NOT EXISTS total_potongan_kasbon INTEGER DEFAULT 0;

-- 3. Tabel settings: tambah kolom durasi tier telat (jika belum ada)
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS tier1_durasi INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS tier2_durasi INTEGER DEFAULT 10;

-- 4. Inisialisasi nilai default pada baris settings yang sudah ada
UPDATE public.settings
SET
  tier1_durasi = COALESCE(tier1_durasi, 10),
  tier2_durasi = COALESCE(tier2_durasi, 10)
WHERE id = 1;
