import { createClient } from '@/lib/supabase/server'
import { getDbClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { generatePayrollPeriodAction, updatePaymentStatusAction, getLivePayrollList } from '@/actions/payroll'
import { formatRupiah } from '@/lib/constants'
import { getPayrollPeriod } from '@/lib/utils/payroll'
import { PayrollPeriodFilter } from '@/components/payroll/PayrollPeriodFilter'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PayrollPage({ searchParams }) {
  const params = await searchParams
  const now = new Date()
  const wibNow = new Date(now.getTime() + 7 * 60 * 60 * 1000)
  const currentMonth = parseInt(params?.bulan || (wibNow.getUTCMonth() + 1).toString(), 10)
  const currentYear = parseInt(params?.tahun || wibNow.getUTCFullYear().toString(), 10)

  const supabase = await createClient()

  // Guard: hanya owner yang boleh akses halaman ini
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: ownerProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (ownerProfile?.role !== 'owner') redirect('/dashboard')

  const db = getDbClient(supabase)

  // Hitung live payroll secara otomatis & real-time dari data absensi, kasbon, dan bonus terkini
  const { payrollList } = await getLivePayrollList(db, currentMonth, currentYear)

  const totalPayrollSemua = payrollList?.reduce((acc, p) => acc + p.total_gaji, 0) || 0

  const generateActionWithPeriod = generatePayrollPeriodAction.bind(null, currentMonth, currentYear)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0 }}>
            Penggajian (Payroll)
          </h1>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Periode: Bulan {currentMonth}, Tahun {currentYear}
          </p>
        </div>

        <form action={generateActionWithPeriod}>
          <Button variant="primary" type="submit">
            ⚡ Hitung / Generate Ulang Payroll
          </Button>
        </form>
      </div>

      {/* Kontrol Navigasi & Filter Periode */}
      <PayrollPeriodFilter currentMonth={currentMonth} currentYear={currentYear} />

      {/* Ringkasan Total */}
      <Card variant="accent-soft" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1.25rem 1.5rem' }}>
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', fontWeight: 600 }}>Total Pengeluaran Gaji Bulan Ini:</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent)', marginTop: '0.2rem' }}>
            {formatRupiah(totalPayrollSemua)}
          </div>
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--ink)', fontWeight: 600 }}>
          Total Karyawan Terhitung: <strong>{payrollList?.length || 0} Orang</strong>
        </div>
      </Card>

      {/* Tabel / Card List Payroll */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {payrollList?.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <p style={{ color: 'var(--ink-muted)', margin: 0 }}>
              Belum ada kalkulasi payroll untuk periode Bulan {currentMonth}/{currentYear}.
            </p>
            <form action={generateActionWithPeriod} style={{ marginTop: '1rem' }}>
              <Button variant="primary" size="sm" type="submit">
                Generate Payroll Sekarang
              </Button>
            </form>
          </Card>
        ) : (
          payrollList?.map((item) => {
            const togglePaymentAction = updatePaymentStatusAction.bind(
              null,
              item.id,
              item.status_pembayaran === 'sudah_dibayar' ? 'belum_dibayar' : 'sudah_dibayar',
              null,
              {
                employeeId: item.employee_id || item.profiles?.id,
                periodeBulan: item.periode_bulan || currentMonth,
                periodeTahun: item.periode_tahun || currentYear,
              }
            )
            const pStart = item.periode_start
            const pEnd = item.periode_end
            const fmtRange = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'

            return (
              <Card key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>{item.profiles?.nama}</h3>
                    <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', marginTop: '0.15rem' }}>
                      {item.profiles?.jabatan || 'Staf Operasional'} •{' '}
                      <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                        Periode: {fmtRange(pStart)} – {fmtRange(pEnd)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Badge variant={item.status_pembayaran === 'sudah_dibayar' ? 'success' : 'warning'}>
                      {item.status_pembayaran === 'sudah_dibayar' ? 'Sudah Dibayar' : 'Belum Dibayar'}
                    </Badge>
                  </div>
                </div>

                {/* Rincian Komponen Gaji */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '0.75rem',
                    background: 'var(--bg-surface-muted)',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-input)',
                    fontSize: '0.85rem',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <div style={{ color: 'var(--ink-muted)', fontSize: '0.75rem', fontWeight: 600 }}>Gaji Pokok</div>
                    <div style={{ fontWeight: 700, color: 'var(--ink)', marginTop: '0.2rem' }}>{formatRupiah(item.gaji_pokok)}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--ink-muted)', fontSize: '0.75rem', fontWeight: 600 }}>Potongan Telat</div>
                    <div style={{ fontWeight: 700, color: item.total_potongan_telat > 0 ? 'var(--danger)' : 'inherit', marginTop: '0.2rem' }}>
                      -{formatRupiah(item.total_potongan_telat)}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--ink-muted)', fontSize: '0.75rem', fontWeight: 600 }}>Potongan Off</div>
                    <div style={{ fontWeight: 700, color: item.total_potongan_off > 0 ? 'var(--danger)' : 'inherit', marginTop: '0.2rem' }}>
                      -{formatRupiah(item.total_potongan_off)}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--ink-muted)', fontSize: '0.75rem', fontWeight: 600 }}>Bonus Libur</div>
                    <div style={{ fontWeight: 700, color: item.total_bonus_libur > 0 ? 'var(--success)' : 'inherit', marginTop: '0.2rem' }}>
                      +{formatRupiah(item.total_bonus_libur)}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--ink-muted)', fontSize: '0.75rem', fontWeight: 600 }}>Bonus Manual</div>
                    <div style={{ fontWeight: 700, color: item.total_bonus_manual > 0 ? 'var(--success)' : 'inherit', marginTop: '0.2rem' }}>
                      +{formatRupiah(item.total_bonus_manual)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--ink-muted)' }}>Total Diterima: </span>
                    <strong style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)' }}>
                      {formatRupiah(item.total_gaji)}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <form action={togglePaymentAction}>
                      <Button variant="outline" size="sm" type="submit">
                        {item.status_pembayaran === 'sudah_dibayar' ? 'Tandai Belum' : 'Tandai Lunas'}
                      </Button>
                    </form>
                    <Link href={`/payroll/${item.id}`}>
                      <Button variant="secondary" size="sm">
                        Rincian & Slip
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
