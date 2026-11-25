-- ==============================================================================
-- MIGRASI 005: TABEL LEDGER CICILAN KASBON & TEMPLATE WHATSAPP SETTINGS
-- ==============================================================================

-- 1. Tabel loan_repayments (Audit Ledger Pembayaran / Angsuran Kasbon)
CREATE TABLE IF NOT EXISTS public.loan_repayments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  payroll_id UUID REFERENCES public.payroll(id) ON DELETE SET NULL,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nominal_potongan INTEGER NOT NULL CHECK (nominal_potongan > 0),
  tanggal_bayar DATE NOT NULL DEFAULT (CURRENT_DATE AT TIME ZONE 'asia/jakarta'),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('asia/jakarta', NOW())
);

-- RLS untuk loan_repayments
ALTER TABLE public.loan_repayments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Loan repayments visible by owner or own employee"
  ON public.loan_repayments FOR SELECT
  USING (is_owner() OR employee_id = auth.uid());

CREATE POLICY "Only owner can manage loan repayments"
  ON public.loan_repayments FOR ALL
  USING (is_owner());

-- 2. Tambah kolom custom template pesan WhatsApp ke tabel settings
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS whatsapp_template TEXT;

