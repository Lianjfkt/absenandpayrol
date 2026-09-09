-- ==============================================================================
-- MIGRASI TAMBAHAN: MODUL IZIN/CUTI (LEAVES) & KASBON (LOANS)
-- ==============================================================================

-- 1. Tambah kolom pendukung ke tabel attendance (Foto Selfie & Akurasi GPS)
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS foto_checkin TEXT,
ADD COLUMN IF NOT EXISTS accuracy_meter DOUBLE PRECISION;

-- 2. Tambah kolom potongan kasbon ke tabel payroll
ALTER TABLE public.payroll 
ADD COLUMN IF NOT EXISTS total_potongan_kasbon INTEGER DEFAULT 0;

-- 3. TABEL LEAVES (Pengajuan Izin / Sakit / Cuti Karyawan)
CREATE TABLE IF NOT EXISTS public.leaves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipe TEXT NOT NULL CHECK (tipe IN ('sakit', 'izin', 'cuti')),
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE NOT NULL,
  alasan TEXT NOT NULL,
  foto_surat TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  catatan_owner TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('asia/jakarta', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('asia/jakarta', NOW())
);

-- 4. TABEL LOANS (Kasbon & Pinjaman Karyawan)
CREATE TABLE IF NOT EXISTS public.loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tanggal_pinjam DATE NOT NULL DEFAULT (CURRENT_DATE AT TIME ZONE 'asia/jakarta'),
  nominal_pinjaman INTEGER NOT NULL CHECK (nominal_pinjaman > 0),
  cicilan_per_bulan INTEGER NOT NULL CHECK (cicilan_per_bulan > 0),
  sisa_pinjaman INTEGER NOT NULL CHECK (sisa_pinjaman >= 0),
  keterangan TEXT,
  status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'lunas')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('asia/jakarta', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('asia/jakarta', NOW())
);

-- ==============================================================================
-- RLS POLICIES FOR NEW TABLES
-- ==============================================================================

ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- POLICIES: LEAVES
CREATE POLICY "Leaves visible by owner or own employee"
  ON public.leaves FOR SELECT
  USING (is_owner() OR employee_id = auth.uid());

CREATE POLICY "Employee can create leave request"
  ON public.leaves FOR INSERT
  WITH CHECK (is_owner() OR employee_id = auth.uid());

CREATE POLICY "Owner or own employee can update leave request"
  ON public.leaves FOR UPDATE
  USING (is_owner() OR employee_id = auth.uid());

-- POLICIES: LOANS
CREATE POLICY "Loans visible by owner or own employee"
  ON public.loans FOR SELECT
  USING (is_owner() OR employee_id = auth.uid());

CREATE POLICY "Only owner can manage loans"
  ON public.loans FOR ALL
  USING (is_owner());
