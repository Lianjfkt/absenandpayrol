import { createClient } from '@/lib/supabase/server'
import { getDbClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { addBonusAction, deleteBonusAction } from '@/actions/bonus'
import { updateAdjustmentAction, syncSingleEmployeePayroll, updatePaymentStatusAction } from '@/actions/payroll'
import { SlipActions } from '@/components/payroll/SlipActions'
import { formatRupiah, formatTanggal } from '@/lib/constants'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DetailPayrollPage({ params }) {
  const { id } = await params
  const supabase = await createClient()
  const db = getDbClient(supabase)

  // Ambil record payroll awal
  let { data: initialPayroll } = await db
    .from('payroll')
    .select('*, profiles(*)')
    .eq('id', id)
    .maybeSingle()

  if (!initialPayroll) notFound()

  if (initialPayroll.status_pembayaran !== 'sudah_dibayar') {
    await syncSingleEmployeePayroll(
      db,
      initialPayroll.employee_id,
      initialPayroll.periode_bulan,
      initialPayroll.periode_tahun,
      id
    )
  }

  const { data: payroll } = await db
    .from('payroll')
    .select('*, profiles(*)')
    .eq('id', id)
    .single()

  if (!payroll) notFound()

  // Ambil rincian bonus manual
  const { data: bonusList } = await db
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

  const togglePaymentAction = updatePaymentStatusAction.bind(
    null,
    payroll.id,
    payroll.status_pembayaran === 'sudah_dibayar' ? 'belum_dibayar' : 'sudah_dibayar',
    null,
    {
      employeeId: payroll.employee_id,
      periodeBulan: payroll.periode_bulan,
      periodeTahun: payroll.periode_tahun,
    }
  )

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      <div>
        <Link href="/payroll" style={{ color: 'var(--ink-muted)', fontSize: '0.875rem', fontWeight: 600 }}>
          ← Kembali ke Rekap Payroll
        </Link>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em', marginTop: '0.5rem' }}>
          Slip Gaji & Penyesuaian
        </h1>
        <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          {payroll.profiles?.nama} — Periode: Bulan {payroll.periode_bulan}/{payroll.periode_tahun}
        </p>
      </div>

      {/* Slip Gaji Card */}
      <Card variant="default" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>Kedai Taichan & Chicken KA</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>Slip Pembayaran Gaji Karyawan</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <Badge variant={payroll.status_pembayaran === 'sudah_dibayar' ? 'success' : 'warning'} size="md">
              {payroll.status_pembayaran === 'sudah_dibayar' ? 'LUNAS / SUDAH DIBAYAR' : 'BELUM DIBAYAR'}
            </Badge>
            <form action={togglePaymentAction}>
              <Button variant="outline" size="sm" type="submit">
                {payroll.status_pembayaran === 'sudah_dibayar' ? 'Tandai Belum' : '✓ Tandai Lunas'}
              </Button>
            </form>
          </div>
        </div>

        {/* Info Profil Singkat */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem', background: 'var(--bg-surface-muted)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-input)', fontSize: '0.85rem', border: '1px solid var(--border)' }}>
          <div>
            <span style={{ color: 'var(--ink-muted)' }}>Tgl Bergabung: </span>
            <strong>{payroll.profiles?.tanggal_mulai ? formatTanggal(payroll.profiles.tanggal_mulai) : '-'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--ink-muted)' }}>Jadwal Gajian: </span>
            <strong style={{ color: 'var(--accent)' }}>
              Setiap tgl {payroll.profiles?.tanggal_mulai ? new Date(payroll.profiles.tanggal_mulai).getDate() : 1}
            </strong>
          </div>
        </div>

        {/* Tabel Komponen */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.925rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--ink-muted)' }}>Gaji Pokok Bulanan</span>
            <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{formatRupiah(payroll.gaji_pokok)}</span>
          </div>

          <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '0.8rem', letterSpacing: '0.05em' }}>POTONGAN:</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '0.75rem' }}>
              <span style={{ color: 'var(--ink-muted)' }}>
                Potongan Telat ({payroll.total_hari_telat} hari)
              </span>
              <span style={{ color: 'var(--danger)', fontWeight: 600 }}>-{formatRupiah(payroll.total_potongan_telat)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '0.75rem' }}>
              <span style={{ color: 'var(--ink-muted)' }}>
                Potongan Off / Alpa ({payroll.total_hari_off} hari)
              </span>
              <span style={{ color: 'var(--danger)', fontWeight: 600 }}>-{formatRupiah(payroll.total_potongan_off)}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: '0.8rem', letterSpacing: '0.05em' }}>BONUS & INSENTIF:</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '0.75rem' }}>
              <span style={{ color: 'var(--ink-muted)' }}>
                Bonus Masuk Hari Libur ({payroll.total_hari_libur_masuk} hari)
              </span>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>+{formatRupiah(payroll.total_bonus_libur)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '0.75rem' }}>
              <span style={{ color: 'var(--ink-muted)' }}>Bonus Manual Tambahan</span>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>+{formatRupiah(payroll.total_bonus_manual)}</span>
            </div>
          </div>

          {payroll.adjustment !== 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border)', paddingTop: '0.75rem' }}>
              <span style={{ color: 'var(--ink-muted)' }}>Penyesuaian ({payroll.keterangan_adjustment || '-'})</span>
              <span style={{ fontWeight: 700, color: payroll.adjustment > 0 ? 'var(--success)' : 'var(--danger)' }}>
                {payroll.adjustment > 0 ? `+${formatRupiah(payroll.adjustment)}` : formatRupiah(payroll.adjustment)}
              </span>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '2px solid var(--border)',
              paddingTop: '1rem',
              fontSize: '1.2rem',
              fontWeight: 800,
            }}
          >
            <span style={{ color: 'var(--ink)' }}>TOTAL GAJI BERSIH</span>
            <span style={{ color: 'var(--accent)', fontSize: '1.35rem' }}>{formatRupiah(payroll.total_gaji)}</span>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <SlipActions
              slip={payroll}
              namaKaryawan={payroll.profiles?.nama || 'Karyawan'}
              isOwner={true}
              employee={payroll.profiles || {}}
            />
          </div>
        </div>
      </Card>


      {/* Form Tambah Bonus Manual */}
      <Card variant="default">
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.85rem' }}>+ Tambah Bonus Manual</h3>
        <form action={addBonusAction} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <input type="hidden" name="employee_id" value={payroll.employee_id} />
          <input type="hidden" name="periode_bulan" value={payroll.periode_bulan} />
          <input type="hidden" name="periode_tahun" value={payroll.periode_tahun} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', alignItems: 'flex-end' }}>
            <Input label="Nominal (Rp)" name="nominal" type="number" placeholder="50000" required />
            <Input label="Keterangan" name="keterangan" placeholder="cth: Bonus Target Ramai" required />
            <Button variant="primary" type="submit" style={{ height: '44px' }}>Tambah</Button>
          </div>
        </form>

        {bonusList && bonusList.length > 0 && (
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', fontWeight: 600 }}>Daftar Bonus Manual:</div>
            {bonusList.map((b) => (
              <div
                key={b.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--bg-surface-muted)',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  border: '1px solid var(--border)',
                }}
              >
                <div>
                  <strong style={{ color: 'var(--ink)' }}>{formatRupiah(b.nominal)}</strong> — <span style={{ color: 'var(--ink-muted)' }}>{b.keterangan}</span>
                </div>
                <form action={deleteBonusAction.bind(null, b.id)}>
                  <Button variant="ghost" size="sm" type="submit" style={{ color: 'var(--danger)', padding: '0.25rem 0.5rem' }}>
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
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.85rem' }}>Penyesuaian Manual (Adjustment)</h3>
        <form action={handleSaveAdjustment} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', alignItems: 'flex-end' }}>
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
              placeholder="cth: Kasbon / Reimburse"
            />
            <Button variant="secondary" type="submit" style={{ height: '44px' }}>Simpan</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
