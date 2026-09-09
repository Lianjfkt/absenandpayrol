import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatRupiah } from '@/lib/constants'
import { SlipActions } from '@/components/payroll/SlipActions'

export default async function SlipGajiKaryawanPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('nama')
    .eq('id', user.id)
    .single()

  // Ambil data payroll milik karyawan yang sedang login
  const { data: slipList } = await supabase
    .from('payroll')
    .select('*')
    .eq('employee_id', user.id)
    .order('periode_tahun', { ascending: false })
    .order('periode_bulan', { ascending: false })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '720px', margin: '0 auto' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0 }}>
          Slip Gaji Saya
        </h1>
        <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Rincian pendapatan bersih dan transparansi potongan bulanan Anda.
        </p>
      </div>

      {slipList?.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <p style={{ color: 'var(--ink-muted)', margin: 0 }}>Belum ada slip gaji yang digenerate oleh Owner.</p>
        </Card>
      ) : (
        slipList?.map((slip) => (
          <Card key={slip.id} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                  Periode Bulan {slip.periode_bulan} / {slip.periode_tahun}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>Kedai Taichan & Chicken KA</div>
              </div>
              <Badge variant={slip.status_pembayaran === 'sudah_dibayar' ? 'success' : 'warning'} size="md">
                {slip.status_pembayaran === 'sudah_dibayar' ? 'LUNAS / DIBAYAR' : 'DRAFT / PROSES'}
              </Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink)' }}>
                <span style={{ color: 'var(--ink-muted)' }}>Gaji Pokok</span>
                <span style={{ fontWeight: 700 }}>{formatRupiah(slip.gaji_pokok)}</span>
              </div>

              {slip.total_potongan_telat > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--ink-muted)' }}>
                    Potongan Keterlambatan ({slip.total_hari_telat} hari)
                  </span>
                  <span style={{ color: '#B91C1C', fontWeight: 600 }}>-{formatRupiah(slip.total_potongan_telat)}</span>
                </div>
              )}

              {slip.total_potongan_off > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--ink-muted)' }}>
                    Potongan Off / Alpa ({slip.total_hari_off} hari)
                  </span>
                  <span style={{ color: '#B91C1C', fontWeight: 600 }}>-{formatRupiah(slip.total_potongan_off)}</span>
                </div>
              )}

              {slip.total_potongan_kasbon > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--ink-muted)' }}>
                    Potongan Kasbon / Cicilan Pinjaman
                  </span>
                  <span style={{ color: '#B91C1C', fontWeight: 600 }}>-{formatRupiah(slip.total_potongan_kasbon)}</span>
                </div>
              )}

              {slip.total_bonus_libur > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--ink-muted)' }}>
                    Bonus Masuk Hari Libur ({slip.total_hari_libur_masuk} hari)
                  </span>
                  <span style={{ color: '#15803D', fontWeight: 600 }}>+{formatRupiah(slip.total_bonus_libur)}</span>
                </div>
              )}

              {slip.total_bonus_manual > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--ink-muted)' }}>Bonus Kinerja / Insentif</span>
                  <span style={{ color: '#15803D', fontWeight: 600 }}>+{formatRupiah(slip.total_bonus_manual)}</span>
                </div>
              )}

              {slip.adjustment !== 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--ink-muted)' }}>Penyesuaian ({slip.keterangan_adjustment || '-'})</span>
                  <span style={{ color: slip.adjustment > 0 ? '#15803D' : '#B91C1C', fontWeight: 600 }}>
                    {slip.adjustment > 0 ? `+${formatRupiah(slip.adjustment)}` : formatRupiah(slip.adjustment)}
                  </span>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  background: 'var(--surface-muted)',
                  borderRadius: 'var(--radius-input)',
                  padding: '1rem 1.25rem',
                  marginTop: '0.5rem',
                  border: '1px solid var(--border)',
                }}
              >
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)' }}>Total Gaji Bersih</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent)' }}>{formatRupiah(slip.total_gaji)}</span>
              </div>
            </div>

            {/* Aksi Cetak & WA Share */}
            <SlipActions slip={slip} namaKaryawan={profile?.nama || 'Karyawan'} />
          </Card>
        ))
      )}
    </div>
  )
}
