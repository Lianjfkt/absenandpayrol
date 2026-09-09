import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { addBonusAction, deleteBonusAction } from '@/actions/bonus'
import { updateAdjustmentAction } from '@/actions/payroll'
import { formatRupiah, formatTanggal } from '@/lib/constants'

export default async function DetailPayrollPage({ params }) {
  const { id } = await params
  const supabase = await createClient()

  // Ambil record payroll
  const { data: payroll } = await supabase
    .from('payroll')
    .select('*, profiles(*)')
    .eq('id', id)
    .single()

  if (!payroll) notFound()

  // Ambil rincian bonus manual
  const { data: bonusList } = await supabase
    .from('bonus')
    .select('*')
    .eq('employee_id', payroll.employee_id)
    .eq('periode_bulan', payroll.periode_bulan)
    .eq('periode_tahun', payroll.periode_tahun)

  async function handleSaveAdjustment(formData) {
    'use server'
    const adj = formData.get('adjustment')
    const ket = formData.get('keterangan_adjustment')
    await updateAdjustmentAction(id, adj, ket)
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <Link href="/payroll" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          ← Kembali ke Rekap Payroll
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.5rem' }}>
          Slip Gaji & Penyesuaian
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {payroll.profiles?.nama} — Periode: Bulan {payroll.periode_bulan}/{payroll.periode_tahun}
        </p>
      </div>

      {/* Slip Gaji Card */}
      <Card variant="glass" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Kedai Taichan & Chicken KA</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Slip Pembayaran Gaji Karyawan</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Badge variant={payroll.status_pembayaran === 'sudah_dibayar' ? 'success' : 'warning'}>
              {payroll.status_pembayaran === 'sudah_dibayar' ? 'LUNAS / SUDAH DIBAYAR' : 'BELUM DIBAYAR'}
            </Badge>
          </div>
        </div>

        {/* Tabel Komponen */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Gaji Pokok Bulanan</span>
            <span style={{ fontWeight: 600 }}>{formatRupiah(payroll.gaji_pokok)}</span>
          </div>

          <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontWeight: 600, color: 'var(--danger)', fontSize: '0.85rem' }}>POTONGAN:</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '1rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>
                Potongan Telat ({payroll.total_hari_telat} hari)
              </span>
              <span style={{ color: 'var(--danger)' }}>-{formatRupiah(payroll.total_potongan_telat)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '1rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>
                Potongan Off / Alpa ({payroll.total_hari_off} hari)
              </span>
              <span style={{ color: 'var(--danger)' }}>-{formatRupiah(payroll.total_potongan_off)}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontWeight: 600, color: 'var(--success)', fontSize: '0.85rem' }}>BONUS & INSENTIF:</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '1rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>
                Bonus Masuk Hari Libur ({payroll.total_hari_libur_masuk} hari)
              </span>
              <span style={{ color: 'var(--success)' }}>+{formatRupiah(payroll.total_bonus_libur)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '1rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Bonus Manual Tambahan</span>
              <span style={{ color: 'var(--success)' }}>+{formatRupiah(payroll.total_bonus_manual)}</span>
            </div>
          </div>

          {payroll.adjustment !== 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border)', paddingTop: '0.75rem' }}>
              <span>Penyesuaian (Adjustment: {payroll.keterangan_adjustment || '-'})</span>
              <span style={{ fontWeight: 600, color: payroll.adjustment > 0 ? 'var(--success)' : 'var(--danger)' }}>
                {payroll.adjustment > 0 ? `+${formatRupiah(payroll.adjustment)}` : formatRupiah(payroll.adjustment)}
              </span>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '2px solid var(--border)',
              paddingTop: '1rem',
              fontSize: '1.25rem',
              fontWeight: 800,
            }}
          >
            <span>TOTAL GAJI BERSIH</span>
            <span style={{ color: 'var(--primary-light)' }}>{formatRupiah(payroll.total_gaji)}</span>
          </div>
        </div>
      </Card>

      {/* Form Tambah Bonus Manual */}
      <Card variant="default">
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>+ Tambah Bonus Manual</h3>
        <form action={addBonusAction} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input type="hidden" name="employee_id" value={payroll.employee_id} />
          <input type="hidden" name="periode_bulan" value={payroll.periode_bulan} />
          <input type="hidden" name="periode_tahun" value={payroll.periode_tahun} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '0.5rem', alignItems: 'flex-end' }}>
            <Input label="Nominal (Rp)" name="nominal" type="number" placeholder="50000" required />
            <Input label="Keterangan" name="keterangan" placeholder="cth: Bonus Target Ramai / THR" required />
            <Button variant="primary" type="submit">Tambah</Button>
          </div>
        </form>

        {bonusList && bonusList.length > 0 && (
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Daftar Bonus Manual:</div>
            {bonusList.map((b) => (
              <div
                key={b.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--bg-main)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.875rem',
                }}
              >
                <div>
                  <strong>{formatRupiah(b.nominal)}</strong> — <span>{b.keterangan}</span>
                </div>
                <form action={deleteBonusAction.bind(null, b.id)}>
                  <Button variant="ghost" size="sm" type="submit" style={{ color: 'var(--danger)' }}>
                    Hapus
                  </Button>
                </form>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Form Penyesuaian (Adjustment) */}
      <Card variant="default">
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Penyesuaian Manual (Adjustment)</h3>
        <form action={handleSaveAdjustment} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '0.5rem', alignItems: 'flex-end' }}>
            <Input
              label="Nominal (+ / - Rp)"
              name="adjustment"
              type="number"
              defaultValue={payroll.adjustment || 0}
            />
            <Input
              label="Keterangan Adjustment"
              name="keterangan_adjustment"
              defaultValue={payroll.keterangan_adjustment || ''}
              placeholder="cth: Kasbon / Penggantian Transport"
            />
            <Button variant="secondary" type="submit">Simpan</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
