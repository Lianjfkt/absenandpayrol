-- ==============================================================================
-- MIGRASI TAMBAHAN: JAM KERJA HARI MINGGU (JAM 8 PAGI)
-- ==============================================================================

-- 1. Tambah kolom jam kerja khusus hari Minggu ke tabel settings
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS jam_masuk_minggu TIME DEFAULT '08:00:00',
ADD COLUMN IF NOT EXISTS jam_pulang_minggu TIME DEFAULT '18:00:00';

-- 2. Inisialisasi nilai default jika kolom belum terisi
UPDATE public.settings
SET jam_masuk_minggu = COALESCE(jam_masuk_minggu, '08:00:00'),
    jam_pulang_minggu = COALESCE(jam_pulang_minggu, '18:00:00')
WHERE id = 1;
