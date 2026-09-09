import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { formatRupiah } from '@/lib/constants'
import { RekapExportControls } from '@/components/rekap/RekapExportControls'

export default async function RekapLaporanPage({ searchParams }) {
  const params = await searchParams
  const now = new Date()
  const currentMonth = parseInt(params?.bulan || (now.getMonth() + 1).toString(), 10)
  const currentYear = parseInt(params?.tahun || now.getFullYear().toString(), 10)

  const supabase = await createClient()

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Rekap & Laporan Bulanan</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
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
      <div className="grid grid-cols-1 grid-cols-3" style={{ gap: '1rem' }}>
        <Card>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Gaji Bersih (Net)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-light)', marginTop: '0.25rem' }}>
            {formatRupiah(totalPengeluaran)}
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Potongan (Telat/Off/Kasbon)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)', marginTop: '0.25rem' }}>
            -{formatRupiah(totalPotongan)}
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Bonus & Insentif</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.25rem' }}>
            +{formatRupiah(totalBonus)}
          </div>
        </Card>
      </div>

      {/* Tabel Rincian Rekap per Karyawan */}
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem' }}>Rincian per Staf</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {payrolls?.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Belum ada data rekap untuk periode ini. Silakan generate payroll terlebih dahulu di menu Payroll.
            </Card>
          ) : (
            payrolls?.map((p) => (
              <Card key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{p.profiles?.nama}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.profiles?.jabatan}</div>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-light)' }}>
                    {formatRupiah(p.total_gaji)}
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '0.5rem',
                    background: 'var(--bg-main)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                  }}
                >
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Hadir</div>
                    <div style={{ fontWeight: 600, color: 'var(--success)' }}>{p.total_hari_hadir} Hari</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Telat</div>
                    <div style={{ fontWeight: 600, color: 'var(--warning)' }}>{p.total_hari_telat} Hari</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Off/Alpa</div>
                    <div style={{ fontWeight: 600, color: 'var(--danger)' }}>{p.total_hari_off} Hari</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Masuk Libur</div>
                    <div style={{ fontWeight: 600, color: 'var(--info)' }}>{p.total_hari_libur_masuk} Hari</div>
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
