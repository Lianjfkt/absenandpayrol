import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { formatRupiah } from '@/lib/constants'
import { RekapExportControls } from '@/components/rekap/RekapExportControls'

export default async function RekapLaporanPage({ searchParams }) {
  const params = await searchParams
  const now = new Date()
  const currentMonth = parseInt(params?.bulan || (now.getMonth() + 1).toString(), 10)
  const currentYear = parseInt(params?.tahun || now.getFullYear().toString(), 10)

  const supabase = await createClient()

  // Guard: hanya owner yang boleh akses halaman ini
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: ownerProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (ownerProfile?.role !== 'owner') redirect('/dashboard')

  // Ambil data payroll yang telah digenerate pada periode
  const { data: payrolls } = await supabase
    .from('payroll')
    .select('*, profiles:employee_id(nama, jabatan)')
    .eq('periode_bulan', currentMonth)
    .eq('periode_tahun', currentYear)

  const totalPengeluaran = payrolls?.reduce((acc, p) => acc + p.total_gaji, 0) || 0
  const totalPotongan = payrolls?.reduce((acc, p) => acc + (p.total_potongan_telat + p.total_potongan_off + (p.total_potongan_kasbon || 0)), 0) || 0
  const totalBonus = payrolls?.reduce((acc, p) => acc + (p.total_bonus_libur + p.total_bonus_manual), 0) || 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0 }}>
          Rekap & Laporan Bulanan
        </h1>
        <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Ringkasan absensi dan total anggaran gaji untuk Periode Bulan {currentMonth}/{currentYear}.
        </p>
      </div>

      {/* Kontrol Export & Filter Periode */}
      <RekapExportControls
        payrolls={payrolls || []}
        currentMonth={currentMonth}
        currentYear={currentYear}
      />

      {/* Ringkasan Finansial */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <Card variant="accent-soft">
          <div style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', fontWeight: 600 }}>Total Gaji Bersih (Net)</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent)', marginTop: '0.25rem' }}>
            {formatRupiah(totalPengeluaran)}
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', fontWeight: 600 }}>Total Potongan (Telat/Off/Kasbon)</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--danger)', marginTop: '0.25rem' }}>
            -{formatRupiah(totalPotongan)}
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', fontWeight: 600 }}>Total Bonus & Insentif</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)', marginTop: '0.25rem' }}>
            +{formatRupiah(totalBonus)}
          </div>
        </Card>
      </div>

      {/* Tabel Rincian Rekap per Karyawan */}
      <div>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.85rem' }}>Rincian per Staf</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {payrolls?.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--ink-muted)' }}>
              Belum ada data rekap untuk periode ini. Silakan generate payroll terlebih dahulu di menu Payroll.
            </Card>
          ) : (
            payrolls?.map((p) => (
              <Card key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>{p.profiles?.nama}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '0.15rem' }}>{p.profiles?.jabatan || 'Staf Kedai'}</div>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)' }}>
                    {formatRupiah(p.total_gaji)}
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(75px, 1fr))',
                    gap: '0.5rem',
                    background: 'var(--bg-surface-muted)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-input)',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <div style={{ color: 'var(--ink-muted)', fontSize: '0.72rem', fontWeight: 600 }}>Hadir</div>
                    <div style={{ fontWeight: 700, color: 'var(--success)', marginTop: '0.15rem' }}>{p.total_hari_hadir} hr</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--ink-muted)', fontSize: '0.72rem', fontWeight: 600 }}>Telat</div>
                    <div style={{ fontWeight: 700, color: 'var(--warning)', marginTop: '0.15rem' }}>{p.total_hari_telat} hr</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--ink-muted)', fontSize: '0.72rem', fontWeight: 600 }}>Off/Alpa</div>
                    <div style={{ fontWeight: 700, color: 'var(--danger)', marginTop: '0.15rem' }}>{p.total_hari_off} hr</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--ink-muted)', fontSize: '0.72rem', fontWeight: 600 }}>Masuk Libur</div>
                    <div style={{ fontWeight: 700, color: 'var(--info)', marginTop: '0.15rem' }}>{p.total_hari_libur_masuk} hr</div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
