-- ==============================================================================
-- SKEMA DATABASE: SISTEM ABSENSI & PAYROLL KEDAI (TAICHAN & CHICKEN KA)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL PROFILES (Ekstensi auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'karyawan' CHECK (role IN ('owner', 'karyawan')),
  no_hp TEXT,
  alamat TEXT,
  jabatan TEXT,
  tanggal_mulai DATE DEFAULT CURRENT_DATE,
  gaji_pokok INTEGER DEFAULT 0,
  hari_libur SMALLINT DEFAULT 0 CHECK (hari_libur BETWEEN 0 AND 6), -- 0: Minggu, 1: Senin, ..., 6: Sabtu
  status_aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('asia/jakarta', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('asia/jakarta', NOW())
);

-- 3. TABEL SETTINGS (Pengaturan Kedai & Bisnis)
CREATE TABLE IF NOT EXISTS public.settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  nama_kedai TEXT DEFAULT 'TAICHAN & CHICKEN KA',
  lokasi_lat DOUBLE PRECISION DEFAULT -5.3677554,
  lokasi_lng DOUBLE PRECISION DEFAULT 105.2420188,
  radius_meter INTEGER DEFAULT 10,
  jam_masuk TIME DEFAULT '07:00:00',
  jam_pulang TIME DEFAULT '18:00:00',
  toleransi_telat_menit INTEGER DEFAULT 5,
  potongan_off INTEGER DEFAULT 50000,
  bonus_masuk_libur INTEGER DEFAULT 50000,
  tier1_rate INTEGER DEFAULT 1000,
  tier2_rate INTEGER DEFAULT 2000,
  tier3_flat INTEGER DEFAULT 50000,
  tier1_durasi INTEGER DEFAULT 10,
  tier2_durasi INTEGER DEFAULT 10,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('asia/jakarta', NOW())
);

-- Seed Settings Default
INSERT INTO public.settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- 4. TABEL ATTENDANCE (Absensi Harian)
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL DEFAULT (CURRENT_DATE AT TIME ZONE 'asia/jakarta'),
  jam_checkin TIMESTAMPTZ,
  jam_checkout TIMESTAMPTZ,
  latitude_checkin DOUBLE PRECISION,
  longitude_checkin DOUBLE PRECISION,
  latitude_checkout DOUBLE PRECISION,
  longitude_checkout DOUBLE PRECISION,
  status TEXT NOT NULL CHECK (status IN ('hadir', 'telat', 'libur_mingguan', 'off')),
  menit_telat SMALLINT DEFAULT 0,
  potongan_telat INTEGER DEFAULT 0,
  is_override BOOLEAN DEFAULT false,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('asia/jakarta', NOW()),
  CONSTRAINT unique_employee_date UNIQUE (employee_id, tanggal)
);

-- 5. TABEL BONUS (Tambahan Manual Owner)
CREATE TABLE IF NOT EXISTS public.bonus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  periode_bulan SMALLINT NOT NULL CHECK (periode_bulan BETWEEN 1 AND 12),
  periode_tahun SMALLINT NOT NULL,
  nominal INTEGER NOT NULL CHECK (nominal >= 0),
  keterangan TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('asia/jakarta', NOW())
);

-- 6. TABEL PAYROLL (Rekap Gaji Bulanan)
CREATE TABLE IF NOT EXISTS public.payroll (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  periode_bulan SMALLINT NOT NULL CHECK (periode_bulan BETWEEN 1 AND 12),
  periode_tahun SMALLINT NOT NULL,
  gaji_pokok INTEGER NOT NULL DEFAULT 0,
  total_hari_hadir SMALLINT DEFAULT 0,
  total_hari_telat SMALLINT DEFAULT 0,
  total_hari_off SMALLINT DEFAULT 0,
  total_hari_libur_masuk SMALLINT DEFAULT 0,
  total_potongan_telat INTEGER DEFAULT 0,
  total_potongan_off INTEGER DEFAULT 0,
  total_bonus_libur INTEGER DEFAULT 0,
  total_bonus_manual INTEGER DEFAULT 0,
  adjustment INTEGER DEFAULT 0,
  keterangan_adjustment TEXT,
  total_gaji INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'final')),
  status_pembayaran TEXT DEFAULT 'belum_dibayar' CHECK (status_pembayaran IN ('belum_dibayar', 'sudah_dibayar')),
  tanggal_dibayar DATE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('asia/jakarta', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('asia/jakarta', NOW()),
  CONSTRAINT unique_employee_payroll_period UNIQUE (employee_id, periode_bulan, periode_tahun)
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

-- Helper function: cek apakah user adalah owner
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLICIES: PROFILES
CREATE POLICY "Profiles can be viewed by owner or self"
  ON public.profiles FOR SELECT
  USING (is_owner() OR auth.uid() = id);

CREATE POLICY "Profiles can be updated by owner or self (limited)"
  ON public.profiles FOR UPDATE
  USING (is_owner() OR auth.uid() = id);

CREATE POLICY "Owner can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (is_owner() OR auth.uid() = id);

-- POLICIES: SETTINGS
CREATE POLICY "Anyone logged in can view settings"
  ON public.settings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only owner can update settings"
  ON public.settings FOR UPDATE
  USING (is_owner());

-- POLICIES: ATTENDANCE
CREATE POLICY "Attendance visible by owner or own employee"
  ON public.attendance FOR SELECT
  USING (is_owner() OR employee_id = auth.uid());

CREATE POLICY "Employee or owner can insert attendance"
  ON public.attendance FOR INSERT
  WITH CHECK (is_owner() OR employee_id = auth.uid());

CREATE POLICY "Owner or employee can update attendance"
  ON public.attendance FOR UPDATE
  USING (is_owner() OR employee_id = auth.uid());

-- POLICIES: BONUS
CREATE POLICY "Bonus visible by owner or own employee"
  ON public.bonus FOR SELECT
  USING (is_owner() OR employee_id = auth.uid());

CREATE POLICY "Only owner can modify bonus"
  ON public.bonus FOR ALL
  USING (is_owner());

-- POLICIES: PAYROLL
CREATE POLICY "Payroll visible by owner or own employee"
  ON public.payroll FOR SELECT
  USING (is_owner() OR employee_id = auth.uid());

CREATE POLICY "Only owner can modify payroll"
  ON public.payroll FOR ALL
  USING (is_owner());
