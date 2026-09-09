import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatRupiah } from '@/lib/constants'

export default async function SlipGajiKaryawanPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Ambil data payroll milik karyawan yang sedang login
  const { data: slipList } = await supabase
    .from('payroll')
    .select('*')
    .eq('employee_id', user.id)
    .order('periode_tahun', { ascending: false })
    .order('periode_bulan', { ascending: false })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '700px', margin: '0 auto' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Slip Gaji Saya</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Rincian penghasilan dan rekap potongan bulanan Anda secara transparan.
        </p>
      </div>

      {slipList?.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Belum ada slip gaji yang digenerate oleh Owner.</p>
        </Card>
      ) : (
        slipList?.map((slip) => (
          <Card key={slip.id} variant="glass" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  Bulan {slip.periode_bulan} / {slip.periode_tahun}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Kedai Taichan & Chicken KA</div>
              </div>
              <Badge variant={slip.status_pembayaran === 'sudah_dibayar' ? 'success' : 'warning'}>
                {slip.status_pembayaran === 'sudah_dibayar' ? 'LUNAS / DIBAYARKAN' : 'DRAFT / BELUM DIBAYAR'}
              </Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Gaji Pokok</span>
                <span style={{ fontWeight: 600 }}>{formatRupiah(slip.gaji_pokok)}</span>
              </div>

              {slip.total_potongan_telat > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Potongan Keterlambatan ({slip.total_hari_telat} hari)
                  </span>
                  <span style={{ color: 'var(--danger)' }}>-{formatRupiah(slip.total_potongan_telat)}</span>
                </div>
              )}

              {slip.total_potongan_off > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Potongan Off / Alpa ({slip.total_hari_off} hari)
                  </span>
                  <span style={{ color: 'var(--danger)' }}>-{formatRupiah(slip.total_potongan_off)}</span>
                </div>
              )}

              {slip.total_bonus_libur > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Bonus Masuk Hari Libur ({slip.total_hari_libur_masuk} hari)
                  </span>
                  <span style={{ color: 'var(--success)' }}>+{formatRupiah(slip.total_bonus_libur)}</span>
                </div>
              )}

              {slip.total_bonus_manual > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Bonus Kinerja / Insentif</span>
                  <span style={{ color: 'var(--success)' }}>+{formatRupiah(slip.total_bonus_manual)}</span>
                </div>
              )}

              {slip.adjustment !== 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Penyesuaian ({slip.keterangan_adjustment || '-'})</span>
                  <span style={{ color: slip.adjustment > 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {slip.adjustment > 0 ? `+${formatRupiah(slip.adjustment)}` : formatRupiah(slip.adjustment)}
                  </span>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border)',
                  paddingTop: '0.75rem',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                }}
              >
                <span>Total Gaji Bersih</span>
                <span style={{ color: 'var(--primary-light)' }}>{formatRupiah(slip.total_gaji)}</span>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}
